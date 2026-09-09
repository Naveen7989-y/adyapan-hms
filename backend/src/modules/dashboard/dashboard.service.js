import prisma from '../../config/db.js';

/**
 * Helper to get today's start and end boundaries (UTC midnight)
 */
const getTodayDateRange = () => {
  const now = new Date();
  const today = new Date(now.toISOString().split('T')[0]);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  return { today, tomorrow };
};

/**
 * 1. Super Admin & Hospital Admin Overview Metrics
 */
export const getAdminDashboard = async (hospitalId) => {
  const { today, tomorrow } = getTodayDateRange();

  const [
    totalPatients,
    totalDoctors,
    totalDepartments,
    todayAppointments,
    todayTokens,
    todayPayments,
    todayInvoices,
    recentAppointments,
    doctorsList,
  ] = await Promise.all([
    prisma.patient.count({ where: { hospitalId } }),
    prisma.doctor.count({ where: { hospitalId } }),
    prisma.department.count({ where: { hospitalId, isActive: true } }),
    prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: { gte: today, lt: tomorrow },
      },
      select: { id: true, status: true },
    }),
    prisma.token.findMany({
      where: {
        hospitalId,
        queueDate: { gte: today, lt: tomorrow },
      },
      select: { id: true, status: true, tokenType: true },
    }),
    prisma.payment.findMany({
      where: {
        hospitalId,
        createdAt: { gte: today, lt: tomorrow },
        status: 'SUCCESS',
      },
      select: { amount: true, paymentMethod: true, type: true },
    }),
    prisma.invoice.findMany({
      where: {
        hospitalId,
        createdAt: { gte: today, lt: tomorrow },
      },
      select: { totalAmount: true, paidAmount: true, refundedAmount: true, paymentStatus: true },
    }),
    prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: { gte: today, lt: tomorrow },
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: { select: { id: true, fullName: true, uhid: true, phone: true } },
        doctor: { include: { user: { select: { name: true } } } },
        department: { select: { name: true } },
      },
    }),
    prisma.doctor.findMany({
      where: { hospitalId },
      include: {
        user: { select: { name: true, email: true } },
        department: { select: { name: true } },
      },
      take: 6,
    }),
  ]);

  // Status breakdowns
  const appointmentBreakdown = {
    BOOKED: 0,
    CHECKED_IN: 0,
    WAITING: 0,
    IN_CONSULTATION: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  todayAppointments.forEach((a) => {
    if (appointmentBreakdown[a.status] !== undefined) {
      appointmentBreakdown[a.status]++;
    }
  });

  const tokenBreakdown = {
    WAITING: 0,
    CALLED: 0,
    IN_CONSULTATION: 0,
    COMPLETED: 0,
    SKIPPED: 0,
  };
  todayTokens.forEach((t) => {
    if (tokenBreakdown[t.status] !== undefined) {
      tokenBreakdown[t.status]++;
    }
  });

  let todayGrossCollections = 0;
  let todayRefunds = 0;
  todayPayments.forEach((p) => {
    if (p.type === 'REFUND') {
      todayRefunds += p.amount;
    } else {
      todayGrossCollections += p.amount;
    }
  });
  const todayCollections = Math.max(0, todayGrossCollections - todayRefunds);

  let todayBilled = 0;
  todayInvoices.forEach((i) => {
    todayBilled += i.totalAmount;
  });

  return {
    role: 'ADMIN',
    kpis: {
      totalPatients,
      totalDoctors,
      totalDepartments,
      todayAppointmentsCount: todayAppointments.length,
      todayTokensCount: todayTokens.length,
      activeQueueCount: tokenBreakdown.WAITING + tokenBreakdown.CALLED + tokenBreakdown.IN_CONSULTATION,
      todayCollections,
      todayGrossCollections,
      todayRefunds,
      todayBilled,
    },
    appointmentBreakdown,
    tokenBreakdown,
    recentAppointments,
    doctorsList,
  };
};

/**
 * 2. Doctor Clinical Dashboard
 */
export const getDoctorDashboard = async (hospitalId, userId) => {
  const { today, tomorrow } = getTodayDateRange();

  // Find doctor entity linked to current user
  let doctor = await prisma.doctor.findFirst({
    where: { hospitalId, userId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true } },
    },
  });

  // Fallback: If logged in as admin inspecting doctor dashboard, pick first doctor
  if (!doctor) {
    doctor = await prisma.doctor.findFirst({
      where: { hospitalId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
      },
    });
  }

  if (!doctor) {
    return {
      role: 'DOCTOR',
      kpis: {
        assignedAppointmentsCount: 0,
        waitingTokensCount: 0,
        completedTodayCount: 0,
      },
      doctor: null,
      activeToken: null,
      waitingTokens: [],
      todayAppointments: [],
    };
  }

  const [todayAppointments, todayTokens] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        hospitalId,
        doctorId: doctor.id,
        appointmentDate: { gte: today, lt: tomorrow },
      },
      orderBy: { timeSlot: 'asc' },
      include: {
        patient: { select: { id: true, fullName: true, uhid: true, phone: true, gender: true } },
      },
    }),
    prisma.token.findMany({
      where: {
        hospitalId,
        doctorId: doctor.id,
        queueDate: { gte: today, lt: tomorrow },
      },
      orderBy: { tokenNumber: 'asc' },
      include: {
        patient: { select: { id: true, fullName: true, uhid: true, phone: true, gender: true } },
      },
    }),
  ]);

  // Find active patient currently called or in consultation
  const activeToken = todayTokens.find(
    (t) => t.status === 'CALLED' || t.status === 'IN_CONSULTATION'
  ) || null;

  // Filter waiting tokens and sort by triage priority
  const PRIORITY_ORDER = { EMERGENCY: 1, PRIORITY: 2, NORMAL: 3 };
  const waitingTokens = todayTokens
    .filter((t) => t.status === 'WAITING')
    .sort((a, b) => {
      const pDiff = (PRIORITY_ORDER[a.tokenType] || 3) - (PRIORITY_ORDER[b.tokenType] || 3);
      if (pDiff !== 0) return pDiff;
      return a.tokenNumber - b.tokenNumber;
    });

  const completedTodayCount = todayTokens.filter((t) => t.status === 'COMPLETED').length;

  return {
    role: 'DOCTOR',
    doctor: {
      id: doctor.id,
      name: doctor.user?.name,
      specialization: doctor.specialization,
      department: doctor.department?.name,
      consultationFee: doctor.consultationFee,
      status: doctor.status,
    },
    kpis: {
      assignedAppointmentsCount: todayAppointments.length,
      waitingTokensCount: waitingTokens.length,
      completedTodayCount,
      activePatientsCount: activeToken ? 1 : 0,
    },
    activeToken,
    waitingTokens: waitingTokens.slice(0, 8),
    todayAppointments: todayAppointments.slice(0, 8),
  };
};

/**
 * 3. Receptionist Front Desk Dashboard
 */
export const getReceptionistDashboard = async (hospitalId) => {
  const { today, tomorrow } = getTodayDateRange();

  const [
    todayRegistrations,
    todayTokens,
    todayAppointments,
    doctorsWithQueues,
  ] = await Promise.all([
    prisma.patient.count({
      where: {
        hospitalId,
        createdAt: { gte: today, lt: tomorrow },
      },
    }),
    prisma.token.findMany({
      where: {
        hospitalId,
        queueDate: { gte: today, lt: tomorrow },
      },
      include: {
        patient: { select: { id: true, fullName: true, uhid: true, phone: true } },
        doctor: { include: { user: { select: { name: true } } } },
        department: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: { gte: today, lt: tomorrow },
      },
      select: { id: true, status: true },
    }),
    prisma.doctor.findMany({
      where: { hospitalId },
      include: {
        user: { select: { name: true } },
        department: { select: { name: true } },
        tokens: {
          where: { queueDate: { gte: today, lt: tomorrow } },
          select: { id: true, status: true, tokenNumber: true },
        },
      },
    }),
  ]);

  const tokenTypeBreakdown = { NORMAL: 0, PRIORITY: 0, EMERGENCY: 0 };
  todayTokens.forEach((t) => {
    if (tokenTypeBreakdown[t.tokenType] !== undefined) {
      tokenTypeBreakdown[t.tokenType]++;
    }
  });

  const checkedInCount = todayAppointments.filter(
    (a) => a.status !== 'BOOKED' && a.status !== 'CANCELLED'
  ).length;

  const doctorQueues = doctorsWithQueues.map((doc) => {
    const waiting = doc.tokens.filter((t) => t.status === 'WAITING').length;
    const serving = doc.tokens.find((t) => t.status === 'CALLED' || t.status === 'IN_CONSULTATION');
    return {
      doctorId: doc.id,
      doctorName: doc.user?.name,
      department: doc.department?.name,
      specialization: doc.specialization,
      status: doc.status,
      waitingCount: waiting,
      servingTokenNumber: serving ? `T-${String(serving.tokenNumber).padStart(3, '0')}` : 'None',
    };
  });

  const waitingPatients = todayTokens
    .filter((t) => t.status === 'WAITING')
    .map((t) => ({
      ...t,
      formattedToken: `T-${String(t.tokenNumber).padStart(3, '0')}`,
    }));

  return {
    role: 'RECEPTIONIST',
    kpis: {
      todayRegistrations,
      todayTokensIssued: todayTokens.length,
      todayScheduledAppointments: todayAppointments.length,
      checkedInCount,
      todayWaitingCount: waitingPatients.length,
    },
    tokenTypeBreakdown,
    recentArrivals: todayTokens.slice(0, 8),
    waitingPatients,
    doctorQueues,
  };
};

/**
 * 4. Nurse & Triage Station Dashboard
 */
export const getNurseDashboard = async (hospitalId) => {
  const { today, tomorrow } = getTodayDateRange();

  const [todayTokens, doctors] = await Promise.all([
    prisma.token.findMany({
      where: {
        hospitalId,
        queueDate: { gte: today, lt: tomorrow },
      },
      include: {
        patient: { select: { id: true, fullName: true, uhid: true, phone: true, gender: true } },
        doctor: { include: { user: { select: { name: true } } } },
        department: { select: { name: true } },
      },
      orderBy: { tokenNumber: 'asc' },
    }),
    prisma.doctor.findMany({
      where: { hospitalId },
      include: {
        user: { select: { name: true } },
        department: { select: { name: true } },
      },
    }),
  ]);

  const waitingTokens = todayTokens.filter((t) => t.status === 'WAITING');
  const emergencyTokens = waitingTokens.filter((t) => t.tokenType === 'EMERGENCY');
  const priorityTokens = waitingTokens.filter((t) => t.tokenType === 'PRIORITY');
  const inConsultationTokens = todayTokens.filter((t) => t.status === 'IN_CONSULTATION');

  return {
    role: 'NURSE_ASSISTANT',
    kpis: {
      waitingQueueCount: waitingTokens.length,
      emergencyCount: emergencyTokens.length,
      priorityCount: priorityTokens.length,
      inConsultationCount: inConsultationTokens.length,
    },
    emergencyTokens,
    priorityTokens,
    waitingTokens: waitingTokens.slice(0, 10),
    activeDoctors: doctors,
  };
};

/**
 * 5. Pharmacist Operations Dashboard
 */
export const getPharmacistDashboard = async (hospitalId) => {
  const { today, tomorrow } = getTodayDateRange();
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const [
    pendingPrescriptions,
    todayDispenses,
    allMedicines,
    expiringBatches,
  ] = await Promise.all([
    prisma.prescription.findMany({
      where: {
        hospitalId,
        status: { in: ['ACTIVE', 'PARTIALLY_DISPENSED'] },
      },
      include: {
        patient: { select: { id: true, fullName: true, uhid: true, phone: true } },
        doctor: { include: { user: { select: { name: true } } } },
        items: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.pharmacyDispense.findMany({
      where: {
        hospitalId,
        createdAt: { gte: today, lt: tomorrow },
      },
      include: {
        prescription: {
          include: {
            patient: { select: { fullName: true, uhid: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.medicine.findMany({
      where: { hospitalId, status: 'ACTIVE' },
      include: {
        batches: {
          where: { expiryDate: { gt: new Date() }, quantity: { gt: 0 } },
          select: { quantity: true },
        },
      },
    }),
    prisma.medicineBatch.findMany({
      where: {
        hospitalId,
        expiryDate: { lte: in30Days },
        quantity: { gt: 0 },
      },
      include: {
        medicine: { select: { name: true } },
      },
      orderBy: { expiryDate: 'asc' },
    }),
  ]);

  let lowStockCount = 0;
  allMedicines.forEach((m) => {
    const totalQty = m.batches.reduce((sum, b) => sum + b.quantity, 0);
    if (totalQty <= m.minStockAlert) lowStockCount++;
  });

  let todayRevenue = 0;
  todayDispenses.forEach((d) => {
    todayRevenue += d.totalAmount;
  });

  return {
    role: 'PHARMACIST',
    kpis: {
      pendingPrescriptionsCount: pendingPrescriptions.length,
      todayDispensesCount: todayDispenses.length,
      todayDispenseRevenue: todayRevenue,
      lowStockCount,
      expiringBatchesCount: expiringBatches.length,
    },
    pendingPrescriptions: pendingPrescriptions.slice(0, 6),
    recentDispenses: todayDispenses.slice(0, 6),
    expiringBatches: expiringBatches.slice(0, 5),
  };
};

/**
 * 6. Accountant Financial Dashboard
 */
export const getAccountantDashboard = async (hospitalId) => {
  const { today, tomorrow } = getTodayDateRange();

  const [todayPayments, todayInvoices, unpaidInvoices] = await Promise.all([
    prisma.payment.findMany({
      where: {
        hospitalId,
        createdAt: { gte: today, lt: tomorrow },
        status: 'SUCCESS',
      },
      select: { amount: true, paymentMethod: true, type: true },
    }),
    prisma.invoice.findMany({
      where: {
        hospitalId,
        createdAt: { gte: today, lt: tomorrow },
      },
      select: { totalAmount: true, paidAmount: true, refundedAmount: true, paymentStatus: true },
    }),
    prisma.invoice.findMany({
      where: {
        hospitalId,
        paymentStatus: { in: ['PENDING', 'PARTIALLY_PAID'] },
      },
      include: {
        patient: { select: { id: true, fullName: true, uhid: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ]);

  let todayGrossCollections = 0;
  let todayRefunds = 0;
  const collectionsByMethod = { CASH: 0, UPI: 0, CARD: 0, ONLINE: 0 };

  todayPayments.forEach((p) => {
    const isRefund = p.type === 'REFUND';
    const m = p.paymentMethod?.toUpperCase() || 'CASH';
    const delta = isRefund ? -p.amount : p.amount;

    if (isRefund) {
      todayRefunds += p.amount;
    } else {
      todayGrossCollections += p.amount;
    }

    if (collectionsByMethod[m] !== undefined) {
      collectionsByMethod[m] += delta;
    } else {
      collectionsByMethod.OTHER = (collectionsByMethod.OTHER || 0) + delta;
    }
  });

  const todayCollections = Math.max(0, todayGrossCollections - todayRefunds);

  let todayBilled = 0;
  todayInvoices.forEach((inv) => {
    todayBilled += inv.totalAmount;
  });

  let totalPendingDues = 0;
  unpaidInvoices.forEach((inv) => {
    totalPendingDues += Math.max(0, inv.totalAmount - inv.paidAmount);
  });

  return {
    role: 'ACCOUNTANT',
    kpis: {
      todayCollections, // Net of refunds
      todayGrossCollections,
      todayRefunds,
      todayBilled,
      pendingInvoicesCount: unpaidInvoices.length,
      totalPendingDues,
    },
    collectionsByMethod,
    recentUnpaidInvoices: unpaidInvoices,
  };
};

/**
 * Master Dispatcher: Selects role-tailored dashboard metrics
 */
export const getRoleDashboard = async (hospitalId, user) => {
  const role = user?.role || 'GUEST';

  switch (role) {
    case 'SUPER_ADMIN':
    case 'HOSPITAL_ADMIN':
      return await getAdminDashboard(hospitalId);

    case 'DOCTOR':
      return await getDoctorDashboard(hospitalId, user.id);

    case 'RECEPTIONIST':
      return await getReceptionistDashboard(hospitalId);

    case 'NURSE_ASSISTANT':
      return await getNurseDashboard(hospitalId);

    case 'PHARMACIST':
      return await getPharmacistDashboard(hospitalId);

    case 'ACCOUNTANT':
      return await getAccountantDashboard(hospitalId);

    default:
      return await getAdminDashboard(hospitalId);
  }
};
