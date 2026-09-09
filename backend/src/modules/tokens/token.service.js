import prisma from '../../config/db.js';
import {
  triggerTokenGeneratedNotification,
  triggerTokenCalledNotification,
} from '../notifications/notification.service.js';
import {
  emitCheckIn,
  emitPriorityUpdate,
  emitConsultationStatus,
} from '../realtime/socket.service.js';

/**
 * Format helper for calendar date portion (midnight)
 */
const getNormalizedDate = (dateString) => {
  if (dateString) {
    const d = new Date(dateString);
    return new Date(d.toISOString().split('T')[0]);
  }
  return new Date(new Date().toISOString().split('T')[0]);
};

/**
 * Calculate active queue position and estimated wait time
 */
const calculateQueueMetrics = async (tx, doctorId, queueDate, tokenType, tokenNumber) => {
  const priorityWeight = {
    EMERGENCY: 1,
    PRIORITY: 2,
    NORMAL: 3,
  };

  const activeTokens = await tx.token.findMany({
    where: {
      doctorId,
      queueDate,
      status: { in: ['WAITING', 'CALLED'] },
    },
    select: {
      id: true,
      tokenNumber: true,
      tokenType: true,
      status: true,
    },
  });

  // Sort by priority, then tokenNumber
  activeTokens.sort((a, b) => {
    const weightA = priorityWeight[a.tokenType] || 3;
    const weightB = priorityWeight[b.tokenType] || 3;
    if (weightA !== weightB) return weightA - weightB;
    return a.tokenNumber - b.tokenNumber;
  });

  const myWeight = priorityWeight[tokenType] || 3;
  const index = activeTokens.findIndex((t) => {
    const w = priorityWeight[t.tokenType] || 3;
    if (w > myWeight) return true;
    if (w === myWeight && t.tokenNumber >= tokenNumber) return true;
    return false;
  });

  const position = index >= 0 ? index + 1 : activeTokens.length + 1;

  // Retrieve doctor's schedule slot duration to estimate wait time
  const dayOfWeek = queueDate.getDay();
  const schedule = await tx.doctorSchedule.findFirst({
    where: { doctorId, dayOfWeek, isActive: true },
    select: { slotDurationMinutes: true },
  });
  const avgMinsPerPatient = schedule?.slotDurationMinutes || 15;
  const estimatedWaitMins = Math.max(0, (position - 1) * avgMinsPerPatient);

  return { position, estimatedWaitMins };
};

/**
 * 1. Check in an existing appointment and generate digital token
 */
export const checkInAppointment = async (hospitalId, { appointmentId, tokenType = 'NORMAL' }) => {
  if (!appointmentId) {
    const err = new Error('Appointment ID is required for check-in');
    err.statusCode = 400;
    throw err;
  }

  const validTypes = ['NORMAL', 'PRIORITY', 'EMERGENCY'];
  if (!validTypes.includes(tokenType)) {
    const err = new Error(`Invalid token type. Allowed: ${validTypes.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // Pre-validate appointment
  const existingAppt = await prisma.appointment.findFirst({
    where: { id: appointmentId, hospitalId },
    include: {
      token: true,
      patient: true,
      doctor: { include: { user: true } },
      department: true,
    },
  });

  if (!existingAppt) {
    const err = new Error('Appointment not found');
    err.statusCode = 404;
    throw err;
  }

  if (existingAppt.token) {
    const err = new Error(`Patient is already checked in with Token #T-${String(existingAppt.token.tokenNumber).padStart(3, '0')}`);
    err.statusCode = 409;
    throw err;
  }

  if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(existingAppt.status)) {
    const err = new Error(`Cannot check in an appointment with status: ${existingAppt.status}`);
    err.statusCode = 400;
    throw err;
  }

  const queueDate = getNormalizedDate();

  // Execute atomic token generation & appointment state transition
  const result = await prisma.$transaction(async (tx) => {
    // Acquire PostgreSQL transaction-level advisory lock on this doctor's daily queue
    const dateKey = queueDate.toISOString().split('T')[0];
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${existingAppt.doctorId} || '-queue-' || ${dateKey}))`;

    // Determine next sequential token number for this doctor on queueDate
    const lastToken = await tx.token.findFirst({
      where: {
        doctorId: existingAppt.doctorId,
        queueDate,
      },
      orderBy: { tokenNumber: 'desc' },
      select: { tokenNumber: true },
    });

    const nextTokenNumber = (lastToken?.tokenNumber || 0) + 1;

    // Create Token record
    const token = await tx.token.create({
      data: {
        hospitalId,
        appointmentId: existingAppt.id,
        patientId: existingAppt.patientId,
        doctorId: existingAppt.doctorId,
        departmentId: existingAppt.departmentId,
        tokenNumber: nextTokenNumber,
        queueDate,
        tokenType,
        status: 'WAITING',
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        appointment: true,
      },
    });

    // Update appointment status to CHECKED_IN
    await tx.appointment.update({
      where: { id: existingAppt.id },
      data: { status: 'CHECKED_IN' },
    });

    const { position, estimatedWaitMins } = await calculateQueueMetrics(
      tx,
      existingAppt.doctorId,
      queueDate,
      tokenType,
      nextTokenNumber
    );

    return { token, position, estimatedWaitMins };
  });

  // Asynchronously dispatch notification
  triggerTokenGeneratedNotification(hospitalId, {
    patient: result.token.patient,
    doctor: result.token.doctor,
    tokenNumber: result.token.tokenNumber,
    tokenType: result.token.tokenType,
    position: result.position,
    estimatedWaitMins: result.estimatedWaitMins,
  }).catch((err) => console.error('Token generation notification error:', err.message));

  // Real-time Socket.IO dispatch
  emitCheckIn(hospitalId, {
    doctorId: result.token.doctorId,
    departmentId: result.token.departmentId,
    token: {
      ...result.token,
      formattedToken: `T-${String(result.token.tokenNumber).padStart(3, '0')}`,
      queuePosition: result.position,
      estimatedWaitMins: result.estimatedWaitMins,
    },
    appointment: existingAppt,
  });

  return {
    ...result.token,
    formattedToken: `T-${String(result.token.tokenNumber).padStart(3, '0')}`,
    queuePosition: result.position,
    estimatedWaitMins: result.estimatedWaitMins,
  };
};

/**
 * 2. Generate Walk-in Digital Token (without prior appointment)
 */
export const createWalkInToken = async (hospitalId, {
  patientId,
  doctorId,
  departmentId,
  tokenType = 'NORMAL',
}) => {
  if (!patientId || !doctorId) {
    const err = new Error('Patient ID and Doctor ID are required');
    err.statusCode = 400;
    throw err;
  }

  const validTypes = ['NORMAL', 'PRIORITY', 'EMERGENCY'];
  if (!validTypes.includes(tokenType)) {
    const err = new Error(`Invalid token type. Allowed: ${validTypes.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  // Pre-validate Patient
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, hospitalId },
  });
  if (!patient) {
    const err = new Error('Patient record not found');
    err.statusCode = 404;
    throw err;
  }

  // Pre-validate Doctor
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
    include: { user: true, department: true },
  });
  if (!doctor) {
    const err = new Error('Doctor not found');
    err.statusCode = 404;
    throw err;
  }

  const resolvedDepartmentId = departmentId || doctor.departmentId;
  const queueDate = getNormalizedDate();

  // Execute atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    // Acquire PostgreSQL transaction-level advisory lock on this doctor's daily queue
    const dateKey = queueDate.toISOString().split('T')[0];
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${doctorId} || '-queue-' || ${dateKey}))`;

    const lastToken = await tx.token.findFirst({
      where: {
        doctorId,
        queueDate,
      },
      orderBy: { tokenNumber: 'desc' },
      select: { tokenNumber: true },
    });

    const nextTokenNumber = (lastToken?.tokenNumber || 0) + 1;

    const token = await tx.token.create({
      data: {
        hospitalId,
        patientId,
        doctorId,
        departmentId: resolvedDepartmentId,
        tokenNumber: nextTokenNumber,
        queueDate,
        tokenType,
        status: 'WAITING',
      },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
    });

    const { position, estimatedWaitMins } = await calculateQueueMetrics(
      tx,
      doctorId,
      queueDate,
      tokenType,
      nextTokenNumber
    );

    return { token, position, estimatedWaitMins };
  });

  // Asynchronously dispatch notification
  triggerTokenGeneratedNotification(hospitalId, {
    patient: result.token.patient,
    doctor: result.token.doctor,
    tokenNumber: result.token.tokenNumber,
    tokenType: result.token.tokenType,
    position: result.position,
    estimatedWaitMins: result.estimatedWaitMins,
  }).catch((err) => console.error('Walk-in token notification error:', err.message));

  // Real-time Socket.IO dispatch
  emitCheckIn(hospitalId, {
    doctorId: result.token.doctorId,
    departmentId: result.token.departmentId,
    token: {
      ...result.token,
      formattedToken: `T-${String(result.token.tokenNumber).padStart(3, '0')}`,
      queuePosition: result.position,
      estimatedWaitMins: result.estimatedWaitMins,
    },
  });

  return {
    ...result.token,
    formattedToken: `T-${String(result.token.tokenNumber).padStart(3, '0')}`,
    queuePosition: result.position,
    estimatedWaitMins: result.estimatedWaitMins,
  };
};

/**
 * 3. List & Filter Tokens
 */
export const getTokens = async (hospitalId, query = {}) => {
  const {
    date,
    doctorId,
    departmentId,
    status,
    tokenType,
    search,
  } = query;

  const where = { hospitalId };

  if (date !== 'all') {
    where.queueDate = getNormalizedDate(date);
  }

  if (doctorId) where.doctorId = doctorId;
  if (departmentId) where.departmentId = departmentId;
  if (status) where.status = status;
  if (tokenType) where.tokenType = tokenType;

  if (search) {
    const trimmed = search.trim();
    const parsedNumber = parseInt(trimmed.replace(/^T-0*/i, ''), 10);

    where.OR = [
      { patient: { fullName: { contains: trimmed, mode: 'insensitive' } } },
      { patient: { phone: { contains: trimmed, mode: 'insensitive' } } },
      { patient: { uhid: { contains: trimmed, mode: 'insensitive' } } },
      ...(isNaN(parsedNumber) ? [] : [{ tokenNumber: parsedNumber }]),
    ];
  }

  const tokens = await prisma.token.findMany({
    where,
    include: {
      patient: true,
      doctor: { include: { user: true } },
      department: true,
      appointment: true,
    },
    orderBy: [
      { queueDate: 'desc' },
      { tokenNumber: 'asc' },
    ],
  });

  return tokens.map((t) => ({
    ...t,
    formattedToken: `T-${String(t.tokenNumber).padStart(3, '0')}`,
  }));
};

/**
 * 4. Get Single Token by ID with Queue Position
 */
export const getTokenById = async (hospitalId, tokenId) => {
  const token = await prisma.token.findFirst({
    where: { id: tokenId, hospitalId },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      department: true,
      appointment: true,
    },
  });

  if (!token) {
    const err = new Error('Token not found');
    err.statusCode = 404;
    throw err;
  }

  const { position, estimatedWaitMins } = await calculateQueueMetrics(
    prisma,
    token.doctorId,
    token.queueDate,
    token.tokenType,
    token.tokenNumber
  );

  return {
    ...token,
    formattedToken: `T-${String(token.tokenNumber).padStart(3, '0')}`,
    queuePosition: position,
    estimatedWaitMins,
  };
};

/**
 * 5. Update Token Status
 */
export const updateTokenStatus = async (hospitalId, tokenId, { status, roomNumber, tokenType }) => {
  const validStatuses = ['WAITING', 'CALLED', 'IN_CONSULTATION', 'COMPLETED', 'SKIPPED', 'CANCELLED'];
  if (status && !validStatuses.includes(status)) {
    const err = new Error(`Invalid status. Allowed: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.token.findFirst({
    where: { id: tokenId, hospitalId },
    include: {
      patient: true,
      doctor: { include: { user: true } },
      appointment: true,
    },
  });

  if (!existing) {
    const err = new Error('Token not found');
    err.statusCode = 404;
    throw err;
  }

  const updateData = {};
  if (status) {
    updateData.status = status;
    if (status === 'CALLED') {
      updateData.calledAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }
  }
  if (tokenType) {
    updateData.tokenType = tokenType;
  }

  const updatedToken = await prisma.$transaction(async (tx) => {
    const token = await tx.token.update({
      where: { id: tokenId },
      data: updateData,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
        appointment: true,
      },
    });

    // Mirror status changes to linked appointment when appropriate
    if (token.appointmentId) {
      if (status === 'IN_CONSULTATION') {
        await tx.appointment.update({
          where: { id: token.appointmentId },
          data: { status: 'IN_CONSULTATION' },
        });
      } else if (status === 'COMPLETED') {
        await tx.appointment.update({
          where: { id: token.appointmentId },
          data: { status: 'COMPLETED' },
        });

        // Also complete any in-progress linked consultation so it does not stay orphaned
        await tx.consultation.updateMany({
          where: {
            OR: [
              { tokenId: token.id },
              ...(token.appointmentId ? [{ appointmentId: token.appointmentId }] : []),
            ],
            status: 'IN_PROGRESS',
          },
          data: {
            status: 'COMPLETED',
            diagnosis: 'Consultation Completed via Calling Desk',
          },
        });
      } else if (status === 'CANCELLED') {
        await tx.appointment.update({
          where: { id: token.appointmentId },
          data: { status: 'CANCELLED' },
        });
      }
    }

    return token;
  });

  // If token is called, trigger SMS/alert notification to patient
  if (status === 'CALLED') {
    triggerTokenCalledNotification(hospitalId, {
      patient: updatedToken.patient,
      doctor: updatedToken.doctor,
      tokenNumber: updatedToken.tokenNumber,
      roomNumber: roomNumber || updatedToken.doctor?.roomNumber || 'Consultation Room',
    }).catch((err) => console.error('Token called notification error:', err.message));
  }

  // Real-time Socket.IO dispatch
  if (tokenType && tokenType !== updatedToken.tokenType) {
    emitPriorityUpdate(hospitalId, { doctorId: updatedToken.doctorId, token: updatedToken });
  } else {
    emitConsultationStatus(hospitalId, {
      doctorId: updatedToken.doctorId,
      status: updatedToken.status,
      token: updatedToken,
    });
  }

  return {
    ...updatedToken,
    formattedToken: `T-${String(updatedToken.tokenNumber).padStart(3, '0')}`,
  };
};

/**
 * 6. Get Booked Appointments for Today (Reception Check-In Desk)
 */
export const getTodayBookedAppointments = async (hospitalId, query = {}) => {
  const { doctorId, search, date } = query;
  const targetDate = getNormalizedDate(date);

  const where = {
    hospitalId,
    OR: [
      { appointmentDate: targetDate },
      { appointmentDate: { lte: targetDate }, status: { in: ['BOOKED', 'CONFIRMED', 'PENDING', 'CHECKED_IN'] } },
    ],
    token: null, // Only appointments that haven't received a token yet
  };

  if (doctorId) where.doctorId = doctorId;

  if (search) {
    const trimmed = search.trim();
    where.patient = {
      OR: [
        { fullName: { contains: trimmed, mode: 'insensitive' } },
        { phone: { contains: trimmed, mode: 'insensitive' } },
        { uhid: { contains: trimmed, mode: 'insensitive' } },
      ],
    };
  }

  return prisma.appointment.findMany({
    where,
    include: {
      patient: true,
      doctor: { include: { user: true } },
      department: true,
    },
    orderBy: { timeSlot: 'asc' },
  });
};

/**
 * 7. Token Queue Statistics Summary
 */
export const getTokenStats = async (hospitalId, date) => {
  const queueDate = getNormalizedDate(date);

  const tokens = await prisma.token.findMany({
    where: {
      hospitalId,
      queueDate,
    },
    select: {
      status: true,
      tokenType: true,
    },
  });

  const total = tokens.length;
  const waiting = tokens.filter((t) => t.status === 'WAITING').length;
  const called = tokens.filter((t) => t.status === 'CALLED').length;
  const inConsultation = tokens.filter((t) => t.status === 'IN_CONSULTATION').length;
  const completed = tokens.filter((t) => t.status === 'COMPLETED').length;
  const skipped = tokens.filter((t) => t.status === 'SKIPPED').length;
  const cancelled = tokens.filter((t) => t.status === 'CANCELLED').length;
  const emergency = tokens.filter((t) => t.tokenType === 'EMERGENCY').length;
  const priority = tokens.filter((t) => t.tokenType === 'PRIORITY').length;

  return {
    date: queueDate.toISOString().split('T')[0],
    total,
    waiting,
    called,
    inConsultation,
    completed,
    skipped,
    cancelled,
    emergency,
    priority,
    activeQueueCount: waiting + called + inConsultation,
  };
};
