import prisma from '../../config/db.js';

/**
 * Helper to parse startDate and endDate into Date objects (UTC midnight boundaries)
 */
const parseDateRange = (startDate, endDate) => {
  let start;
  let end;

  if (startDate) {
    const s = new Date(startDate);
    start = new Date(s.toISOString().split('T')[0]);
  } else {
    // Default to first day of current month
    const now = new Date();
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  if (endDate) {
    const e = new Date(endDate);
    const endMidnight = new Date(e.toISOString().split('T')[0]);
    end = new Date(endMidnight.getTime() + 24 * 60 * 60 * 1000); // end of that day
  } else {
    const now = new Date();
    const todayMidnight = new Date(now.toISOString().split('T')[0]);
    end = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000);
  }

  return { start, end };
};

/**
 * 1. Financial & Revenue Report
 */
export const getFinancialReport = async (hospitalId, query = {}) => {
  const { start, end } = parseDateRange(query.startDate, query.endDate);

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        hospitalId,
        createdAt: { gte: start, lt: end },
      },
      include: {
        patient: { select: { id: true, fullName: true, uhid: true, phone: true } },
        appointment: {
          include: {
            doctor: { include: { user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.findMany({
      where: {
        hospitalId,
        createdAt: { gte: start, lt: end },
        status: 'SUCCESS',
      },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        type: true,
        transactionRef: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  let totalBilled = 0;
  let totalConsultationFees = 0;
  let totalPharmacyFees = 0;
  let totalOtherCharges = 0;
  let totalDiscounts = 0;
  let totalTaxes = 0;

  invoices.forEach((inv) => {
    totalBilled += inv.totalAmount;
    totalConsultationFees += inv.consultationFee;
    totalPharmacyFees += inv.pharmacyFee;
    totalOtherCharges += inv.otherCharges;
    totalDiscounts += inv.discount;
    totalTaxes += inv.tax;
  });

  let totalGrossCollected = 0;
  let totalRefunded = 0;
  let paymentsCount = 0;
  let refundsCount = 0;
  const paymentMethodBreakdown = { CASH: 0, UPI: 0, CARD: 0, ONLINE: 0 };

  payments.forEach((p) => {
    const isRefund = p.type === 'REFUND';
    const m = p.paymentMethod?.toUpperCase() || 'CASH';
    const delta = isRefund ? -p.amount : p.amount;

    if (isRefund) {
      totalRefunded += p.amount;
      refundsCount++;
    } else {
      totalGrossCollected += p.amount;
      paymentsCount++;
    }

    if (paymentMethodBreakdown[m] !== undefined) {
      paymentMethodBreakdown[m] += delta;
    } else {
      paymentMethodBreakdown.OTHER = (paymentMethodBreakdown.OTHER || 0) + delta;
    }
  });

  // Net total collected after subtracting refunds
  const totalCollected = Math.max(0, totalGrossCollected - totalRefunded);
  const totalOutstanding = Math.max(0, totalBilled - totalCollected);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  return {
    dateRange: {
      startDate: start.toISOString().split('T')[0],
      endDate: new Date(end.getTime() - 1).toISOString().split('T')[0],
    },
    summary: {
      totalBilled,
      totalCollected, // Net after subtracting refunds
      totalGrossCollected,
      totalRefunded,
      totalOutstanding,
      collectionRate,
      invoicesCount: invoices.length,
      paymentsCount,
      refundsCount,
      totalConsultationFees,
      totalPharmacyFees,
      totalOtherCharges,
      totalDiscounts,
      totalTaxes,
    },
    paymentMethodBreakdown,
    invoices,
  };
};

/**
 * 2. Doctor & Clinical Workload Report
 */
export const getDoctorWorkloadReport = async (hospitalId, query = {}) => {
  const { start, end } = parseDateRange(query.startDate, query.endDate);

  const [doctors, appointments, tokens, consultations] = await Promise.all([
    prisma.doctor.findMany({
      where: { hospitalId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    }),
    prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: { gte: start, lt: end },
      },
      select: { doctorId: true, status: true },
    }),
    prisma.token.findMany({
      where: {
        hospitalId,
        queueDate: { gte: start, lt: end },
      },
      select: { doctorId: true, status: true, tokenType: true },
    }),
    prisma.consultation.findMany({
      where: {
        hospitalId,
        createdAt: { gte: start, lt: end },
      },
      select: { doctorId: true, status: true },
    }),
  ]);

  const workloadByDoctor = doctors.map((doc) => {
    const docAppts = appointments.filter((a) => a.doctorId === doc.id);
    const docTokens = tokens.filter((t) => t.doctorId === doc.id);
    const docConsults = consultations.filter((c) => c.doctorId === doc.id);

    const completedAppts = docAppts.filter((a) => a.status === 'COMPLETED').length;
    const cancelledAppts = docAppts.filter((a) => a.status === 'CANCELLED').length;
    const completedTokens = docTokens.filter((t) => t.status === 'COMPLETED').length;
    const skippedTokens = docTokens.filter((t) => t.status === 'SKIPPED').length;

    const estimatedRevenue = (doc.consultationFee || 0) * (completedTokens || completedAppts);

    return {
      doctorId: doc.id,
      doctorName: doc.user?.name,
      department: doc.department?.name,
      specialization: doc.specialization,
      consultationFee: doc.consultationFee,
      status: doc.status,
      appointmentsScheduled: docAppts.length,
      appointmentsCompleted: completedAppts,
      appointmentsCancelled: cancelledAppts,
      tokensIssued: docTokens.length,
      tokensCompleted: completedTokens,
      tokensSkipped: skippedTokens,
      consultationsCount: docConsults.length,
      estimatedRevenue,
    };
  });

  return {
    dateRange: {
      startDate: start.toISOString().split('T')[0],
      endDate: new Date(end.getTime() - 1).toISOString().split('T')[0],
    },
    totalDoctors: doctors.length,
    workload: workloadByDoctor,
  };
};

/**
 * 3. Queue & Patient Flow Analytics Report
 */
export const getQueueAnalyticsReport = async (hospitalId, query = {}) => {
  const { start, end } = parseDateRange(query.startDate, query.endDate);

  const tokens = await prisma.token.findMany({
    where: {
      hospitalId,
      queueDate: { gte: start, lt: end },
    },
    include: {
      patient: { select: { fullName: true, uhid: true } },
      doctor: { include: { user: { select: { name: true } } } },
      department: { select: { name: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const triageBreakdown = { NORMAL: 0, PRIORITY: 0, EMERGENCY: 0 };
  const statusBreakdown = {
    WAITING: 0,
    CALLED: 0,
    IN_CONSULTATION: 0,
    COMPLETED: 0,
    SKIPPED: 0,
    CANCELLED: 0,
  };

  // Hour-of-day arrival distribution (0 to 23)
  const hourlyArrivals = {};
  for (let h = 8; h <= 19; h++) {
    const label = `${String(h).padStart(2, '0')}:00`;
    hourlyArrivals[label] = 0;
  }

  let totalWaitTimeMinutes = 0;
  let waitTimeSamples = 0;

  tokens.forEach((t) => {
    // Triage
    if (triageBreakdown[t.tokenType] !== undefined) {
      triageBreakdown[t.tokenType]++;
    }

    // Status
    if (statusBreakdown[t.status] !== undefined) {
      statusBreakdown[t.status]++;
    }

    // Hourly
    const hour = new Date(t.createdAt).getHours();
    const label = `${String(hour).padStart(2, '0')}:00`;
    if (hourlyArrivals[label] !== undefined) {
      hourlyArrivals[label]++;
    }

    // Wait time: from createdAt to calledAt (if available)
    if (t.calledAt) {
      const waitMs = new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime();
      if (waitMs > 0 && waitMs < 24 * 60 * 60 * 1000) {
        totalWaitTimeMinutes += waitMs / (1000 * 60);
        waitTimeSamples++;
      }
    }
  });

  const avgWaitTimeMinutes = waitTimeSamples > 0 ? Math.round(totalWaitTimeMinutes / waitTimeSamples) : 12;
  const completionRate = tokens.length > 0 ? Math.round((statusBreakdown.COMPLETED / tokens.length) * 100) : 0;

  return {
    dateRange: {
      startDate: start.toISOString().split('T')[0],
      endDate: new Date(end.getTime() - 1).toISOString().split('T')[0],
    },
    summary: {
      totalTokensIssued: tokens.length,
      avgWaitTimeMinutes,
      completionRate,
      emergencyCases: triageBreakdown.EMERGENCY,
      skippedTokens: statusBreakdown.SKIPPED,
    },
    triageBreakdown,
    statusBreakdown,
    hourlyArrivals,
  };
};

/**
 * 4. Pharmacy & Medication Dispense Report
 */
export const getPharmacyReport = async (hospitalId, query = {}) => {
  const { start, end } = parseDateRange(query.startDate, query.endDate);

  const [dispenses, dispenseItems, lowStockMedicines] = await Promise.all([
    prisma.pharmacyDispense.findMany({
      where: {
        hospitalId,
        createdAt: { gte: start, lt: end },
      },
      include: {
        prescription: {
          include: {
            patient: { select: { fullName: true, uhid: true } },
            doctor: { include: { user: { select: { name: true } } } },
          },
        },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pharmacyDispenseItem.findMany({
      where: {
        dispense: {
          hospitalId,
          createdAt: { gte: start, lt: end },
        },
      },
      include: {
        medicineBatch: {
          include: {
            medicine: { select: { id: true, name: true, genericName: true, unit: true } },
          },
        },
      },
    }),
    prisma.medicine.findMany({
      where: { hospitalId, status: 'ACTIVE' },
      include: {
        batches: {
          where: { expiryDate: { gt: new Date() } },
          select: { quantity: true },
        },
      },
    }),
  ]);

  let totalPharmacyRevenue = 0;
  let totalUnitsDispensed = 0;

  dispenses.forEach((d) => {
    totalPharmacyRevenue += d.totalAmount;
  });

  // Aggregate by medicine
  const medicineMap = {};
  dispenseItems.forEach((item) => {
    totalUnitsDispensed += item.quantity;
    const medId = item.medicineBatch?.medicine?.id || 'unknown';
    const medName = item.medicineBatch?.medicine?.name || 'Unknown Drug';

    if (!medicineMap[medId]) {
      medicineMap[medId] = {
        medicineId: medId,
        name: medName,
        genericName: item.medicineBatch?.medicine?.genericName,
        unit: item.medicineBatch?.medicine?.unit,
        unitsDispensed: 0,
        totalSales: 0,
      };
    }
    medicineMap[medId].unitsDispensed += item.quantity;
    medicineMap[medId].totalSales += item.totalPrice;
  });

  const topDispensedMedicines = Object.values(medicineMap)
    .sort((a, b) => b.unitsDispensed - a.unitsDispensed)
    .slice(0, 10);

  // Identify low stock
  const lowStockList = [];
  lowStockMedicines.forEach((m) => {
    const currentStock = m.batches.reduce((sum, b) => sum + b.quantity, 0);
    if (currentStock <= m.minStockAlert) {
      lowStockList.push({
        id: m.id,
        name: m.name,
        genericName: m.genericName,
        currentStock,
        minStockAlert: m.minStockAlert,
      });
    }
  });

  return {
    dateRange: {
      startDate: start.toISOString().split('T')[0],
      endDate: new Date(end.getTime() - 1).toISOString().split('T')[0],
    },
    summary: {
      dispensesCount: dispenses.length,
      totalUnitsDispensed,
      totalPharmacyRevenue,
      lowStockMedicinesCount: lowStockList.length,
    },
    topDispensedMedicines,
    lowStockList,
    dispenses,
  };
};

/**
 * 5. Patient Intake & Demographics Report
 */
export const getPatientDemographicsReport = async (hospitalId, query = {}) => {
  const { start, end } = parseDateRange(query.startDate, query.endDate);

  const [newPatients, allPatients, appointmentsByDept] = await Promise.all([
    prisma.patient.findMany({
      where: {
        hospitalId,
        createdAt: { gte: start, lt: end },
      },
      select: { id: true, gender: true, dateOfBirth: true, bloodGroup: true, createdAt: true },
    }),
    prisma.patient.findMany({
      where: { hospitalId },
      select: { id: true, gender: true, dateOfBirth: true, bloodGroup: true },
    }),
    prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: { gte: start, lt: end },
      },
      include: {
        department: { select: { id: true, name: true, code: true } },
      },
    }),
  ]);

  // Gender Breakdown
  const genderBreakdown = { MALE: 0, FEMALE: 0, OTHER: 0 };
  allPatients.forEach((p) => {
    const g = p.gender?.toUpperCase();
    if (genderBreakdown[g] !== undefined) genderBreakdown[g]++;
    else genderBreakdown.OTHER++;
  });

  // Age Groups Breakdown
  const ageGroups = {
    '0-17 (Pediatric)': 0,
    '18-35 (Young Adult)': 0,
    '36-55 (Adult)': 0,
    '56+ (Senior)': 0,
  };

  const now = new Date();
  allPatients.forEach((p) => {
    if (p.dateOfBirth) {
      const birth = new Date(p.dateOfBirth);
      const age = now.getFullYear() - birth.getFullYear();
      if (age < 18) ageGroups['0-17 (Pediatric)']++;
      else if (age <= 35) ageGroups['18-35 (Young Adult)']++;
      else if (age <= 55) ageGroups['36-55 (Adult)']++;
      else ageGroups['56+ (Senior)']++;
    } else {
      ageGroups['36-55 (Adult)']++;
    }
  });

  // Department visits distribution
  const deptVisits = {};
  appointmentsByDept.forEach((a) => {
    const deptName = a.department?.name || 'General';
    deptVisits[deptName] = (deptVisits[deptName] || 0) + 1;
  });

  return {
    dateRange: {
      startDate: start.toISOString().split('T')[0],
      endDate: new Date(end.getTime() - 1).toISOString().split('T')[0],
    },
    summary: {
      totalPatients: allPatients.length,
      newRegistrationsInRange: newPatients.length,
    },
    genderBreakdown,
    ageGroups,
    departmentVisits: deptVisits,
  };
};
