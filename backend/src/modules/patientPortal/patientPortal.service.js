import prisma from '../../config/db.js';
import { getTodayCanonicalDate } from '../appointments/appointment.service.js';
import { triggerAppointmentCancelledNotification } from '../notifications/notification.service.js';

/**
 * Retrieve patient portal dashboard summary metrics
 */
export const getPatientDashboard = async (hospitalId, patientId) => {
  const today = getTodayCanonicalDate();

  const [patient, activeToken, nextAppointment, latestPrescription, counts, unpaidInvoices] = await Promise.all([
    // Patient Profile
    prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        hospital: {
          select: { id: true, name: true, code: true, phone: true, email: true, address: true },
        },
      },
    }),

    // Today's Active OPD Token (if patient is currently in queue)
    prisma.token.findFirst({
      where: {
        patientId,
        hospitalId,
        queueDate: today,
        status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
      },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } },
            department: { select: { name: true, code: true } },
          },
        },
        department: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Next Upcoming Scheduled Appointment
    prisma.appointment.findFirst({
      where: {
        patientId,
        hospitalId,
        appointmentDate: { gte: today },
        status: { in: ['BOOKED', 'CHECKED_IN', 'WAITING'] },
      },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } },
            department: { select: { name: true, code: true } },
          },
        },
        department: { select: { name: true, code: true } },
      },
      orderBy: [{ appointmentDate: 'asc' }, { timeSlot: 'asc' }],
    }),

    // Most Recent Prescription
    prisma.prescription.findFirst({
      where: { patientId, hospitalId },
      include: {
        doctor: {
          include: {
            user: { select: { name: true } },
          },
        },
        items: {
          include: {
            medicine: { select: { name: true, genericName: true, unit: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Aggregated Counts
    prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        _count: {
          select: {
            appointments: true,
            prescriptions: true,
            tokens: true,
            invoices: true,
          },
        },
      },
    }),

    // Pending Unpaid Invoices
    prisma.invoice.findMany({
      where: {
        patientId,
        hospitalId,
        paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
      select: {
        totalAmount: true,
        paidAmount: true,
      },
    }),
  ]);

  if (!patient) {
    const error = new Error('Patient record not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate live queue queue position if patient has an active token today
  let liveQueueInfo = null;
  if (activeToken) {
    const currentCallingToken = await prisma.token.findFirst({
      where: {
        hospitalId,
        doctorId: activeToken.doctorId,
        queueDate: today,
        status: { in: ['CALLED', 'IN_CONSULTATION'] },
      },
      orderBy: { tokenNumber: 'desc' },
      select: { tokenNumber: true, status: true },
    });

    const waitingAhead = await prisma.token.count({
      where: {
        hospitalId,
        doctorId: activeToken.doctorId,
        queueDate: today,
        status: 'WAITING',
        tokenNumber: { lt: activeToken.tokenNumber },
      },
    });

    liveQueueInfo = {
      activeToken,
      currentlyCalling: currentCallingToken?.tokenNumber || null,
      patientsAhead: waitingAhead,
      approxWaitMinutes: Math.max(0, waitingAhead * 10),
    };
  }

  const totalOutstandingBalance = unpaidInvoices.reduce(
    (sum, inv) => sum + Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)),
    0
  );

  return {
    patient,
    liveQueueInfo,
    nextAppointment,
    latestPrescription,
    stats: {
      totalAppointments: counts?._count?.appointments || 0,
      totalPrescriptions: counts?._count?.prescriptions || 0,
      totalVisits: counts?._count?.tokens || 0,
      totalInvoices: counts?._count?.invoices || 0,
      outstandingBalance: totalOutstandingBalance,
    },
  };
};

/**
 * Get all appointments for authenticated patient
 */
export const getPatientAppointments = async (hospitalId, patientId) => {
  const appointments = await prisma.appointment.findMany({
    where: { patientId, hospitalId },
    include: {
      doctor: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          department: { select: { name: true, code: true } },
        },
      },
      department: { select: { name: true, code: true } },
      token: { select: { id: true, tokenNumber: true, status: true } },
    },
    orderBy: { appointmentDate: 'desc' },
  });

  return appointments;
};

/**
 * Patient cancels their own appointment
 */
export const cancelPatientAppointment = async (hospitalId, patientId, appointmentId, reason) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId, hospitalId },
    include: {
      doctor: { include: { user: { select: { name: true } } } },
      patient: true,
      department: true,
    },
  });

  if (!appointment) {
    const error = new Error('Appointment not found');
    error.statusCode = 404;
    throw error;
  }

  if (['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(appointment.status)) {
    const error = new Error(`Cannot cancel appointment with status "${appointment.status}"`);
    error.statusCode = 400;
    throw error;
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: 'CANCELLED',
      cancellationReason: reason || 'Cancelled by patient via Patient Portal',
    },
    include: {
      doctor: { include: { user: { select: { name: true } } } },
      department: true,
      patient: true,
    },
  });

  // Notify clinical staff
  try {
    await triggerAppointmentCancelledNotification(updatedAppointment, prisma);
  } catch (err) {
    console.warn('Failed to dispatch cancellation notification:', err.message);
  }

  return updatedAppointment;
};

/**
 * Get full prescription history for authenticated patient
 */
export const getPatientPrescriptions = async (hospitalId, patientId) => {
  const prescriptions = await prisma.prescription.findMany({
    where: { patientId, hospitalId },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
      consultation: {
        select: {
          symptoms: true,
          diagnosis: true,
          advice: true,
          followUpDate: true,
        },
      },
      items: {
        include: {
          medicine: {
            select: { id: true, name: true, genericName: true, unit: true, manufacturer: true },
          },
        },
      },
      pharmacyDispenses: {
        select: { id: true, status: true, createdAt: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return prescriptions;
};

/**
 * Get token & OPD visit history for authenticated patient
 */
export const getPatientTokens = async (hospitalId, patientId) => {
  const tokens = await prisma.token.findMany({
    where: { patientId, hospitalId },
    include: {
      doctor: {
        include: {
          user: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
      department: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tokens;
};

/**
 * Get billing invoices for authenticated patient
 */
export const getPatientInvoices = async (hospitalId, patientId) => {
  const invoices = await prisma.invoice.findMany({
    where: { patientId, hospitalId },
    include: {
      items: true,
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      appointment: {
        select: {
          appointmentDate: true,
          timeSlot: true,
          doctor: { include: { user: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return invoices;
};
