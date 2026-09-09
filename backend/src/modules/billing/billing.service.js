import prisma from '../../config/db.js';
import { generateInvoiceNumber } from '../../utils/invoiceNumberGenerator.js';

/**
 * Create a new billing invoice with optional line items and instant payment recording
 */
export const createInvoice = async (hospitalId, userId, data) => {
  const {
    patientId,
    appointmentId,
    consultationFee = 0,
    pharmacyFee = 0,
    otherCharges = 0,
    discount = 0,
    tax = 0,
    items = [],
    payment,
  } = data;

  if (!patientId) {
    const error = new Error('Patient ID is required to generate an invoice');
    error.statusCode = 400;
    throw error;
  }

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, hospitalId },
  });
  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  // Parse fee numeric values
  const cFee = parseFloat(consultationFee) || 0.0;
  const pFee = parseFloat(pharmacyFee) || 0.0;
  const oCharges = parseFloat(otherCharges) || 0.0;
  const disc = parseFloat(discount) || 0.0;
  const taxAmount = parseFloat(tax) || 0.0;

  // Calculate total line items sum if custom items provided
  let itemsSum = 0;
  const validatedItems = [];
  if (items && Array.isArray(items) && items.length > 0) {
    items.forEach((it) => {
      const q = parseInt(it.quantity, 10) || 1;
      const u = parseFloat(it.unitPrice) || 0.0;
      const tot = parseFloat(it.totalPrice) || q * u;
      itemsSum += tot;
      validatedItems.push({
        description: it.description?.trim() || 'Service Item',
        quantity: q,
        unitPrice: u,
        totalPrice: tot,
      });
    });
  } else {
    // Generate standard line items if not explicitly provided
    if (cFee > 0) {
      validatedItems.push({
        description: 'Professional Consultation Fee',
        quantity: 1,
        unitPrice: cFee,
        totalPrice: cFee,
      });
    }
    if (pFee > 0) {
      validatedItems.push({
        description: 'Pharmacy Medication Dispense Charges',
        quantity: 1,
        unitPrice: pFee,
        totalPrice: pFee,
      });
    }
    if (oCharges > 0) {
      validatedItems.push({
        description: 'Clinical Procedures & Nursing Care',
        quantity: 1,
        unitPrice: oCharges,
        totalPrice: oCharges,
      });
    }
    itemsSum = cFee + pFee + oCharges;
  }

  const subtotal = itemsSum > 0 ? itemsSum : cFee + pFee + oCharges;
  const totalAmount = Math.max(0, subtotal - disc + taxAmount);

  // Execute in transaction
  const result = await prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateInvoiceNumber(tx, hospitalId);

    const invoice = await tx.invoice.create({
      data: {
        hospitalId,
        patientId,
        appointmentId: appointmentId || null,
        invoiceNumber,
        consultationFee: cFee,
        pharmacyFee: pFee,
        otherCharges: oCharges,
        discount: disc,
        tax: taxAmount,
        totalAmount,
        paidAmount: 0.0,
        paymentStatus: 'PENDING',
        items: {
          create: validatedItems,
        },
      },
    });

    // If instant payment was provided (e.g. cash on desk)
    if (payment && payment.amount && parseFloat(payment.amount) > 0) {
      const payAmount = Math.min(totalAmount, parseFloat(payment.amount));
      await tx.payment.create({
        data: {
          hospitalId,
          invoiceId: invoice.id,
          amount: payAmount,
          paymentMethod: payment.paymentMethod || 'CASH',
          transactionRef: payment.transactionRef || null,
          status: 'SUCCESS',
          recordedById: userId,
        },
      });

      const newPaid = payAmount;
      const newStatus = newPaid >= totalAmount ? 'PAID' : 'PARTIALLY_PAID';

      const updated = await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaid,
          paymentStatus: newStatus,
        },
        include: {
          hospital: true,
          patient: true,
          appointment: {
            include: {
              doctor: { include: { user: true, department: true } },
            },
          },
          items: true,
          payments: { include: { recordedBy: { select: { id: true, name: true } } } },
        },
      });

      return updated;
    }

    const full = await tx.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        hospital: true,
        patient: true,
        appointment: {
          include: {
            doctor: { include: { user: true, department: true } },
          },
        },
        items: true,
        payments: true,
      },
    });

    return full;
  });

  return result;
};

/**
 * Generate preview of encounter charges for a patient (Doctor fee + Pharmacy dispenses + Prescriptions)
 */
export const getEncounterBillPreview = async (hospitalId, patientId, appointmentId) => {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, hospitalId },
  });

  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  let consultationFee = 0;
  let doctorName = null;
  let doctorId = null;
  let resolvedAppointmentId = appointmentId || null;

  // 1. Resolve Encounter Doctor & Consultation Fee
  if (appointmentId) {
    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, hospitalId },
      include: { doctor: { include: { user: true, department: true } } },
    });
    if (appointment?.doctor) {
      consultationFee = appointment.doctor.consultationFee > 0 ? appointment.doctor.consultationFee : 500.0;
      doctorName = appointment.doctor.user?.name;
      doctorId = appointment.doctor.id;
    }
  }

  // If not resolved from appointmentId, check patient's latest Consultation, Token, or Appointment
  if (!doctorId) {
    const [latestConsultation, latestToken, latestAppt] = await Promise.all([
      prisma.consultation.findFirst({
        where: { hospitalId, patientId },
        orderBy: { createdAt: 'desc' },
        include: { doctor: { include: { user: true, department: true } } },
      }),
      prisma.token.findFirst({
        where: { hospitalId, patientId },
        orderBy: { createdAt: 'desc' },
        include: { doctor: { include: { user: true, department: true } } },
      }),
      prisma.appointment.findFirst({
        where: { hospitalId, patientId },
        orderBy: { appointmentDate: 'desc' },
        include: { doctor: { include: { user: true, department: true } } },
      }),
    ]);

    const candidates = [
      latestConsultation && {
        date: new Date(latestConsultation.createdAt),
        doctor: latestConsultation.doctor,
        appointmentId: latestConsultation.appointmentId,
      },
      latestToken && {
        date: new Date(latestToken.createdAt),
        doctor: latestToken.doctor,
        appointmentId: latestToken.appointmentId,
      },
      latestAppt && {
        date: new Date(latestAppt.appointmentDate),
        doctor: latestAppt.doctor,
        appointmentId: latestAppt.id,
      },
    ].filter(Boolean);

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.date - a.date);
      const chosen = candidates[0];
      if (chosen.doctor) {
        consultationFee = chosen.doctor.consultationFee > 0 ? chosen.doctor.consultationFee : 500.0;
        doctorName = chosen.doctor.user?.name;
        doctorId = chosen.doctor.id;
        resolvedAppointmentId = chosen.appointmentId || resolvedAppointmentId;
      }
    } else {
      // General OPD default consultation fee from active doctor
      const defaultDoc = await prisma.doctor.findFirst({
        where: { hospitalId, status: 'AVAILABLE' },
        include: { user: true, department: true },
      });
      if (defaultDoc) {
        consultationFee = defaultDoc.consultationFee > 0 ? defaultDoc.consultationFee : 500.0;
        doctorName = defaultDoc.user?.name;
        doctorId = defaultDoc.id;
      } else {
        consultationFee = 500.0;
      }
    }
  }

  const suggestedItems = [];

  if (consultationFee > 0) {
    suggestedItems.push({
      description: `Doctor Consultation Fee${doctorName ? ` (${doctorName})` : ''}`,
      quantity: 1,
      unitPrice: consultationFee,
      totalPrice: consultationFee,
    });
  }

  // 2. Resolve Medicines & Pharmacy Charges
  // Look up completed pharmacy dispenses for this patient
  const dispenses = await prisma.pharmacyDispense.findMany({
    where: {
      hospitalId,
      prescription: { patientId },
      status: 'COMPLETED',
    },
    include: {
      prescription: true,
      items: {
        include: {
          medicineBatch: {
            include: {
              medicine: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  let pharmacyFee = 0;
  const processedMedicineIds = new Set();

  if (dispenses.length > 0) {
    dispenses.forEach((d) => {
      d.items.forEach((item) => {
        const medName = item.medicineBatch?.medicine?.name || 'Medication';
        const batchNum = item.medicineBatch?.batchNumber ? ` [Batch: ${item.medicineBatch.batchNumber}]` : '';
        const unitPrice = item.unitPrice || 0;
        const totalPrice = item.totalPrice || item.quantity * unitPrice;
        pharmacyFee += totalPrice;
        if (item.medicineBatch?.medicineId) {
          processedMedicineIds.add(item.medicineBatch.medicineId);
        }

        suggestedItems.push({
          description: `${medName}${batchNum}`,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
        });
      });
    });
  }

  // Also check active/pending prescriptions if not already covered by dispenses
  const activePrescriptions = await prisma.prescription.findMany({
    where: {
      hospitalId,
      patientId,
      status: { in: ['ACTIVE', 'PARTIALLY_DISPENSED'] },
    },
    include: {
      items: {
        include: {
          medicine: {
            include: {
              batches: {
                where: { quantity: { gt: 0 } },
                orderBy: { expiryDate: 'asc' },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  activePrescriptions.forEach((rx) => {
    rx.items.forEach((it) => {
      if (!processedMedicineIds.has(it.medicineId)) {
        const remainingQty = Math.max(1, it.quantityPrescribed - (it.quantityDispensed || 0));
        const unitPrice = it.medicine?.batches?.[0]?.sellingPrice || 15.0;
        const totalPrice = remainingQty * unitPrice;
        pharmacyFee += totalPrice;
        processedMedicineIds.add(it.medicineId);

        suggestedItems.push({
          description: `${it.medicine?.name || 'Prescription Medicine'} ${it.dosage || ''} (${remainingQty} ${it.medicine?.unit || 'units'})`.trim(),
          quantity: remainingQty,
          unitPrice,
          totalPrice,
        });
      }
    });
  });

  return {
    patient,
    doctorId,
    doctorName,
    appointmentId: resolvedAppointmentId,
    consultationFee,
    pharmacyFee,
    suggestedItems,
    estimatedTotal: consultationFee + pharmacyFee,
  };
};

/**
 * Record a payment against an invoice
 */
export const recordPayment = async (hospitalId, invoiceId, userId, data) => {
  const { amount, paymentMethod = 'CASH', transactionRef } = data;

  const paymentValue = parseFloat(amount);
  if (!paymentValue || paymentValue <= 0) {
    const error = new Error('Payment amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, hospitalId },
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  if (invoice.paymentStatus === 'PAID') {
    const error = new Error('This invoice is already fully paid');
    error.statusCode = 400;
    throw error;
  }

  const remainingBalance = invoice.totalAmount - invoice.paidAmount;
  if (paymentValue > remainingBalance + 0.01) {
    const error = new Error(`Payment amount (₹${paymentValue}) exceeds remaining balance (₹${remainingBalance.toFixed(2)})`);
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        hospitalId,
        invoiceId: invoice.id,
        amount: paymentValue,
        paymentMethod: paymentMethod.toUpperCase(),
        transactionRef: transactionRef?.trim() || null,
        status: 'SUCCESS',
        recordedById: userId,
      },
      include: {
        recordedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const newPaidAmount = invoice.paidAmount + paymentValue;
    const isFullyPaid = newPaidAmount >= invoice.totalAmount - 0.01;

    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus: isFullyPaid ? 'PAID' : 'PARTIALLY_PAID',
      },
      include: {
        patient: true,
        items: true,
        payments: {
          include: {
            recordedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      payment,
      invoice: updatedInvoice,
    };
  });

  return result;
};

/**
 * Process a Partial or Full Refund on an Invoice
 */
export const processRefund = async (hospitalId, invoiceId, userId, { amount, reason, paymentMethod = 'CASH' }) => {
  const refundValue = parseFloat(amount);
  if (isNaN(refundValue) || refundValue <= 0) {
    const error = new Error('Refund amount must be greater than zero');
    error.statusCode = 400;
    throw error;
  }

  if (!reason || !reason.trim()) {
    const error = new Error('A reason for the refund is required for audit compliance');
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    // Acquire PostgreSQL transaction-level advisory lock on this invoice
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('invoice-' || ${invoiceId}))`;

    const invoice = await tx.invoice.findFirst({
      where: { id: invoiceId, hospitalId },
    });

    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    const netPaid = invoice.paidAmount - (invoice.refundedAmount || 0);
    if (netPaid <= 0) {
      const error = new Error('This invoice has no refundable balance');
      error.statusCode = 400;
      throw error;
    }

    if (refundValue > netPaid + 0.01) {
      const error = new Error(
        `Refund amount (₹${refundValue.toFixed(2)}) exceeds eligible net paid balance (₹${netPaid.toFixed(2)})`
      );
      error.statusCode = 400;
      throw error;
    }

    // 1. Create refund payment record
    const refundPayment = await tx.payment.create({
      data: {
        hospitalId,
        invoiceId: invoice.id,
        amount: refundValue,
        paymentMethod: (paymentMethod || 'CASH').toUpperCase(),
        status: 'SUCCESS',
        type: 'REFUND',
        refundReason: reason.trim(),
        recordedById: userId,
        refundedById: userId,
      },
      include: {
        recordedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const newRefundedAmount = (invoice.refundedAmount || 0) + refundValue;
    const isFullyRefunded = newRefundedAmount >= invoice.paidAmount - 0.01;

    // 2. Update invoice status
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        refundedAmount: newRefundedAmount,
        paymentStatus: isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
      },
      include: {
        patient: true,
        items: true,
        payments: {
          include: {
            recordedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    // 3. Create audit trail
    await tx.auditLog.create({
      data: {
        hospitalId,
        userId,
        action: 'INVOICE_REFUND',
        entity: 'Invoice',
        entityId: invoice.id,
        metadata: JSON.stringify({
          refundAmount: refundValue,
          reason: reason.trim(),
          paymentMethod,
          previousRefunded: invoice.refundedAmount || 0,
          newRefunded: newRefundedAmount,
          status: updatedInvoice.paymentStatus,
        }),
      },
    });

    return {
      refund: refundPayment,
      invoice: updatedInvoice,
    };
  });

  return result;
};

/**
 * Get list of invoices with filters
 */
export const getInvoices = async (hospitalId, query = {}) => {
  const { patientId, paymentStatus, search, page = 1, limit = 20 } = query;

  const where = { hospitalId };

  if (patientId) where.patientId = patientId;
  if (paymentStatus && paymentStatus !== 'ALL') where.paymentStatus = paymentStatus;

  if (search && search.trim()) {
    const clean = search.trim();
    where.OR = [
      { invoiceNumber: { contains: clean } },
      { patient: { fullName: { contains: clean } } },
      { patient: { uhid: { contains: clean } } },
      { patient: { phone: { contains: clean } } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const [total, invoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: { id: true, fullName: true, uhid: true, phone: true, gender: true },
        },
        appointment: {
          include: {
            doctor: { include: { user: { select: { id: true, name: true } } } },
          },
        },
        items: true,
        payments: {
          select: { id: true, amount: true, paymentMethod: true, createdAt: true },
        },
      },
    }),
  ]);

  return {
    invoices,
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Get full invoice details for receipt printing
 */
export const getInvoiceById = async (hospitalId, id) => {
  const invoice = await prisma.invoice.findFirst({
    where: { id, hospitalId },
    include: {
      hospital: {
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          phone: true,
          email: true,
        },
      },
      patient: true,
      appointment: {
        include: {
          doctor: {
            include: {
              user: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
            },
          },
        },
      },
      items: true,
      payments: {
        include: {
          recordedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!invoice) {
    const error = new Error('Invoice not found');
    error.statusCode = 404;
    throw error;
  }

  return invoice;
};

/**
 * Financial metrics and revenue summary (subtracting refunds from collections)
 */
export const getBillingMetrics = async (hospitalId) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [allInvoices, todayPayments] = await Promise.all([
    prisma.invoice.findMany({
      where: { hospitalId },
      select: {
        totalAmount: true,
        paidAmount: true,
        refundedAmount: true,
        paymentStatus: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        hospitalId,
        createdAt: { gte: startOfDay },
        status: 'SUCCESS',
      },
      select: {
        amount: true,
        paymentMethod: true,
        type: true,
      },
    }),
  ]);

  let totalBilled = 0;
  let totalGrossCollected = 0;
  let totalRefunded = 0;
  let totalPending = 0;
  let paidInvoicesCount = 0;
  let pendingInvoicesCount = 0;
  let refundedInvoicesCount = 0;

  allInvoices.forEach((inv) => {
    totalBilled += inv.totalAmount;
    totalGrossCollected += inv.paidAmount;
    totalRefunded += (inv.refundedAmount || 0);

    if (inv.paymentStatus === 'REFUNDED') {
      refundedInvoicesCount++;
    } else if (inv.paymentStatus === 'PAID') {
      paidInvoicesCount++;
    } else {
      totalPending += Math.max(0, inv.totalAmount - inv.paidAmount);
      pendingInvoicesCount++;
    }
  });

  // Net total collected after subtracting all refunds
  const totalCollected = Math.max(0, totalGrossCollected - totalRefunded);

  let todayGrossCollected = 0;
  let todayRefunds = 0;
  let todayPaymentsCount = 0;
  let todayRefundsCount = 0;
  const collectionsByMethod = { CASH: 0, ONLINE: 0, UPI: 0, CARD: 0 };

  todayPayments.forEach((p) => {
    const isRefund = p.type === 'REFUND';
    const method = p.paymentMethod?.toUpperCase() || 'CASH';
    const delta = isRefund ? -p.amount : p.amount;

    if (isRefund) {
      todayRefunds += p.amount;
      todayRefundsCount++;
    } else {
      todayGrossCollected += p.amount;
      todayPaymentsCount++;
    }

    if (collectionsByMethod[method] !== undefined) {
      collectionsByMethod[method] += delta;
    } else {
      collectionsByMethod.OTHER = (collectionsByMethod.OTHER || 0) + delta;
    }
  });

  // Net today's collection after subtracting today's refunds
  const todayCollection = Math.max(0, todayGrossCollected - todayRefunds);

  return {
    totalBilled,
    totalCollected, // Net after subtracting refunds
    totalGrossCollected,
    totalRefunded,
    totalPending,
    todayCollection, // Net after subtracting today's refunds
    todayGrossCollected,
    todayRefunds,
    paidInvoicesCount,
    pendingInvoicesCount,
    refundedInvoicesCount,
    totalInvoicesCount: allInvoices.length,
    todayPaymentsCount,
    todayRefundsCount,
    collectionsByMethod,
  };
};

