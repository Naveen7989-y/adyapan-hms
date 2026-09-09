import prisma from '../../config/db.js';
import {
  triggerAppointmentBookedNotification,
  triggerAppointmentRescheduledNotification,
  triggerAppointmentCancelledNotification,
} from '../notifications/notification.service.js';

const VALID_STATUSES = [
  'BOOKED',
  'CHECKED_IN',
  'WAITING',
  'IN_CONSULTATION',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
];

/**
 * Standardize date string (YYYY-MM-DD) into canonical UTC midnight Date object
 */
export const toCanonicalDate = (dateStr) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
};

/**
 * Helper to convert HH:mm string to minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Helper to convert minutes from midnight to HH:mm string
 */
const minutesToTime = (totalMinutes) => {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Get available time slots for a doctor on a specific date
 */
export const getAvailableSlots = async (hospitalId, doctorId, dateStr) => {
  if (!doctorId || !dateStr) {
    const error = new Error('Doctor ID and Date (YYYY-MM-DD) are required');
    error.statusCode = 400;
    throw error;
  }

  const targetDate = toCanonicalDate(dateStr);
  const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday, 1 = Monday...

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
    include: {
      user: { select: { name: true } },
      department: { select: { id: true, name: true } },
      schedules: {
        where: { dayOfWeek, isActive: true },
      },
    },
  });

  if (!doctor) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  if (doctor.status === 'ON_LEAVE') {
    return {
      doctor: { id: doctor.id, name: doctor.user.name, status: doctor.status },
      date: dateStr,
      isAvailable: false,
      message: 'Physician is currently marked ON LEAVE',
      slots: [],
    };
  }

  if (!doctor.schedules || doctor.schedules.length === 0) {
    return {
      doctor: { id: doctor.id, name: doctor.user.name, status: doctor.status },
      date: dateStr,
      isAvailable: false,
      message: 'No active clinical shift scheduled for this weekday',
      slots: [],
    };
  }

  const schedule = doctor.schedules[0];
  const startMins = timeToMinutes(schedule.startTime);
  const endMins = timeToMinutes(schedule.endTime);
  const slotDuration = schedule.slotDurationMinutes || 15;
  const breakStart = schedule.breakStartTime ? timeToMinutes(schedule.breakStartTime) : null;
  const breakEnd = schedule.breakEndTime ? timeToMinutes(schedule.breakEndTime) : null;

  // Query existing active bookings for this doctor on this canonical date
  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: targetDate,
      status: { notIn: ['CANCELLED'] },
    },
    select: { timeSlot: true },
  });

  const bookedTimeSlots = new Set(bookedAppointments.map((a) => a.timeSlot));
  const capacityReached = bookedAppointments.length >= schedule.maxCapacity;

  // Generate slots
  const slots = [];
  let currentMins = startMins;

  while (currentMins + slotDuration <= endMins) {
    const isBreak =
      breakStart !== null &&
      breakEnd !== null &&
      currentMins >= breakStart &&
      currentMins < breakEnd;

    if (!isBreak) {
      const slotTime = minutesToTime(currentMins);
      const isBooked = bookedTimeSlots.has(slotTime);
      const isAvailable = !isBooked && !capacityReached;

      slots.push({
        timeSlot: slotTime,
        isAvailable,
        isBooked,
      });
    }

    currentMins += slotDuration;
  }

  return {
    doctor: {
      id: doctor.id,
      name: doctor.user.name,
      department: doctor.department.name,
      consultationFee: doctor.consultationFee,
    },
    date: dateStr,
    dayOfWeek,
    shift: {
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDurationMinutes: slotDuration,
      maxCapacity: schedule.maxCapacity,
      currentBookingsCount: bookedAppointments.length,
      capacityReached,
    },
    slots,
  };
};

/**
 * Book an appointment with race-condition prevention and capacity validation
 */
export const bookAppointment = async (hospitalId, data) => {
  const { patientId, doctorId, appointmentDate: dateStr, timeSlot, reason } = data;

  if (!patientId || !doctorId || !dateStr || !timeSlot) {
    const error = new Error('Patient, Doctor, Appointment Date, and Time Slot are required');
    error.statusCode = 400;
    throw error;
  }

  const targetDate = toCanonicalDate(dateStr);
  const dayOfWeek = targetDate.getUTCDay();

  // Validate patient
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, hospitalId },
  });
  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate doctor & schedule
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
    include: {
      schedules: { where: { dayOfWeek, isActive: true } },
    },
  });

  if (!doctor) {
    const error = new Error('Doctor not found');
    error.statusCode = 404;
    throw error;
  }

  if (doctor.status === 'ON_LEAVE') {
    const error = new Error('Doctor is on leave on this date');
    error.statusCode = 400;
    throw error;
  }

  if (!doctor.schedules || doctor.schedules.length === 0) {
    const error = new Error('Doctor has no active schedule on this weekday');
    error.statusCode = 400;
    throw error;
  }

  const schedule = doctor.schedules[0];

  // Execute booking inside atomic transaction to prevent double booking race conditions
  const appointment = await prisma.$transaction(async (tx) => {
    // Acquire PostgreSQL transaction-level advisory lock on specific doctor+date+slot
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${doctorId} || '-' || ${dateStr} || '-' || ${timeSlot}))`;

    // 1. Check double booking conflict on specific slot
    const existingSlotBooking = await tx.appointment.findFirst({
      where: {
        doctorId,
        appointmentDate: targetDate,
        timeSlot,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (existingSlotBooking) {
      const error = new Error(`Time slot ${timeSlot} is already booked for this doctor`);
      error.statusCode = 409;
      throw error;
    }

    // 2. Check total daily capacity limit
    const dailyBookingsCount = await tx.appointment.count({
      where: {
        doctorId,
        appointmentDate: targetDate,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (dailyBookingsCount >= schedule.maxCapacity) {
      const error = new Error(
        `Doctor has reached maximum booking capacity (${schedule.maxCapacity}) for this day`
      );
      error.statusCode = 409;
      throw error;
    }

    // 3. Create appointment
    const newAppointment = await tx.appointment.create({
      data: {
        hospitalId,
        patientId,
        doctorId,
        departmentId: doctor.departmentId,
        appointmentDate: targetDate,
        timeSlot,
        status: 'BOOKED',
        reason: reason ? reason.trim() : null,
      },
      include: {
        patient: {
          select: { id: true, uhid: true, fullName: true, phone: true, gender: true },
        },
        doctor: {
          include: {
            user: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
      },
    });

    return newAppointment;
  });

  // Asynchronously dispatch notification without blocking response
  triggerAppointmentBookedNotification(appointment).catch((err) => {
    console.error('Failed to dispatch appointment booked notification:', err.message);
  });

  return appointment;
};

/**
 * List and filter appointments
 */
export const listAppointments = async (hospitalId, query = {}) => {
  const { date, doctorId, departmentId, status, search, page = 1, limit = 50 } = query;
  const take = Math.min(parseInt(limit, 10) || 50, 100);
  const skip = ((parseInt(page, 10) || 1) - 1) * take;

  const whereClause = {
    hospitalId,
    ...(doctorId && { doctorId }),
    ...(departmentId && { departmentId }),
    ...(status && { status }),
    ...(date && { appointmentDate: toCanonicalDate(date) }),
    ...(search && {
      OR: [
        { patient: { fullName: { contains: search.trim() } } },
        { patient: { uhid: { contains: search.trim() } } },
        { patient: { phone: { contains: search.trim() } } },
      ],
    }),
  };

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where: whereClause }),
    prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: { id: true, uhid: true, fullName: true, phone: true, gender: true },
        },
        doctor: {
          include: {
            user: { select: { name: true } },
            department: { select: { name: true } },
          },
        },
        token: {
          select: { id: true, tokenNumber: true, status: true, tokenType: true },
        },
      },
      orderBy: [{ appointmentDate: 'desc' }, { timeSlot: 'asc' }],
      take,
      skip,
    }),
  ]);

  return {
    appointments,
    pagination: {
      total,
      page: parseInt(page, 10) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Reschedule appointment to a new date and time slot
 */
export const rescheduleAppointment = async (hospitalId, appointmentId, data) => {
  const { appointmentDate: dateStr, timeSlot, newDoctorId } = data;

  if (!dateStr || !timeSlot) {
    const error = new Error('New appointment date and time slot are required');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, hospitalId },
  });

  if (!existing) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (['COMPLETED', 'CANCELLED'].includes(existing.status)) {
    const error = new Error(`Cannot reschedule an appointment that is ${existing.status}`);
    error.statusCode = 400;
    throw error;
  }

  const targetDoctorId = newDoctorId || existing.doctorId;
  const targetDate = toCanonicalDate(dateStr);

  const updated = await prisma.$transaction(async (tx) => {
    // Check if new slot is taken
    const conflict = await tx.appointment.findFirst({
      where: {
        id: { not: appointmentId },
        doctorId: targetDoctorId,
        appointmentDate: targetDate,
        timeSlot,
        status: { notIn: ['CANCELLED'] },
      },
    });

    if (conflict) {
      const error = new Error(`Slot ${timeSlot} on ${dateStr} is already booked`);
      error.statusCode = 409;
      throw error;
    }

    const res = await tx.appointment.update({
      where: { id: appointmentId },
      data: {
        doctorId: targetDoctorId,
        appointmentDate: targetDate,
        timeSlot,
        status: 'BOOKED',
      },
      include: {
        patient: { select: { fullName: true, uhid: true } },
        doctor: { include: { user: { select: { name: true } } } },
      },
    });

    return res;
  });

  // Asynchronously dispatch notification
  triggerAppointmentRescheduledNotification(updated).catch((err) => {
    console.error('Failed to dispatch reschedule notification:', err.message);
  });

  return updated;
};

/**
 * Cancel an appointment with a mandatory or optional reason
 */
export const cancelAppointment = async (hospitalId, appointmentId, cancellationReason) => {
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, hospitalId },
    include: {
      patient: { select: { fullName: true, phone: true, uhid: true } },
      doctor: { include: { user: { select: { name: true } } } },
    },
  });

  if (!existing) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (existing.status === 'COMPLETED') {
    const error = new Error('Cannot cancel a completed appointment');
    error.statusCode = 400;
    throw error;
  }

  const cancelled = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancellationReason: cancellationReason || 'Cancelled by patient/reception',
    },
    include: {
      patient: { select: { fullName: true, phone: true, uhid: true } },
      doctor: { include: { user: { select: { name: true } } } },
    },
  });

  // Asynchronously dispatch cancellation alert
  triggerAppointmentCancelledNotification(cancelled, cancellationReason).catch((err) => {
    console.error('Failed to dispatch cancellation notification:', err.message);
  });

  return cancelled;
};

/**
 * Update appointment status (CHECKED_IN, WAITING, IN_CONSULTATION, COMPLETED, NO_SHOW)
 */
export const updateAppointmentStatus = async (hospitalId, appointmentId, status) => {
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, hospitalId },
  });

  if (!existing) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  return updated;
};
