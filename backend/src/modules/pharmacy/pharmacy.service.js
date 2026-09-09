import prisma from '../../config/db.js';

/**
 * Get medicines catalog with aggregated available stock across non-expired batches
 */
export const getMedicinesWithStock = async (hospitalId, query = {}) => {
  const { search, categoryId, stockStatus, page = 1, limit = 50 } = query;

  const where = { hospitalId };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search && search.trim()) {
    const clean = search.trim();
    where.OR = [
      { name: { contains: clean } },
      { genericName: { contains: clean } },
      { manufacturer: { contains: clean } },
      { category: { name: { contains: clean } } },
    ];
  }

  const now = new Date();
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * take;

  const [total, medicines] = await Promise.all([
    prisma.medicine.count({ where }),
    prisma.medicine.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        category: { select: { id: true, name: true } },
        batches: {
          orderBy: { expiryDate: 'asc' },
          select: {
            id: true,
            batchNumber: true,
            expiryDate: true,
            quantity: true,
            purchasePrice: true,
            sellingPrice: true,
          },
        },
      },
    }),
  ]);

  // Aggregate stock and compute status
  const enriched = medicines.map((med) => {
    let totalStock = 0;
    let validStock = 0;
    let expiredStock = 0;

    med.batches.forEach((b) => {
      totalStock += b.quantity;
      if (new Date(b.expiryDate) > now) {
        validStock += b.quantity;
      } else {
        expiredStock += b.quantity;
      }
    });

    let status = 'IN_STOCK';
    if (validStock === 0) {
      status = 'OUT_OF_STOCK';
    } else if (validStock <= med.minStockAlert) {
      status = 'LOW_STOCK';
    }

    return {
      ...med,
      totalStock,
      availableStock: validStock,
      expiredStock,
      stockStatus: status,
    };
  });

  // Optional stock status filter
  const filtered = stockStatus && stockStatus !== 'ALL'
    ? enriched.filter((m) => m.stockStatus === stockStatus)
    : enriched;

  return {
    medicines: filtered,
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Get medicine detail with all batches
 */
export const getMedicineById = async (hospitalId, id) => {
  const medicine = await prisma.medicine.findFirst({
    where: { id, hospitalId },
    include: {
      category: true,
      batches: {
        orderBy: { expiryDate: 'asc' },
      },
    },
  });

  if (!medicine) {
    const error = new Error('Medicine not found');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  let availableStock = 0;
  medicine.batches.forEach((b) => {
    if (new Date(b.expiryDate) > now) {
      availableStock += b.quantity;
    }
  });

  return {
    ...medicine,
    availableStock,
    stockStatus: availableStock === 0 ? 'OUT_OF_STOCK' : availableStock <= medicine.minStockAlert ? 'LOW_STOCK' : 'IN_STOCK',
  };
};

/**
 * Add a new medicine to the inventory catalog
 */
export const createMedicine = async (hospitalId, data) => {
  const { name, genericName, categoryId, categoryName, manufacturer, unit = 'TABLETS', minStockAlert = 50 } = data;

  if (!name || !name.trim()) {
    const error = new Error('Medicine name is required');
    error.statusCode = 400;
    throw error;
  }

  let finalCategoryId = categoryId;
  if (!finalCategoryId) {
    const cName = categoryName?.trim() || 'General';
    let cat = await prisma.medicineCategory.findFirst({
      where: { hospitalId, name: cName },
    });
    if (!cat) {
      cat = await prisma.medicineCategory.create({
        data: {
          hospitalId,
          name: cName,
          description: 'Auto-created category',
        },
      });
    }
    finalCategoryId = cat.id;
  }

  const medicine = await prisma.medicine.upsert({
    where: {
      hospitalId_name: {
        hospitalId,
        name: name.trim(),
      },
    },
    update: {
      genericName: genericName?.trim() || undefined,
      manufacturer: manufacturer?.trim() || undefined,
      unit: unit || undefined,
      minStockAlert: minStockAlert ? parseInt(minStockAlert, 10) : undefined,
    },
    create: {
      hospitalId,
      categoryId: finalCategoryId,
      name: name.trim(),
      genericName: genericName?.trim() || null,
      manufacturer: manufacturer?.trim() || 'Standard Pharma',
      unit: unit || 'TABLETS',
      minStockAlert: parseInt(minStockAlert, 10) || 50,
      status: 'ACTIVE',
    },
    include: {
      category: true,
      batches: true,
    },
  });

  return medicine;
};

/**
 * Add a new batch to a medicine
 */
export const addMedicineBatch = async (hospitalId, medicineId, data) => {
  const { batchNumber, expiryDate, quantity, purchasePrice, sellingPrice } = data;

  if (!batchNumber || !batchNumber.trim()) {
    const error = new Error('Batch number is required');
    error.statusCode = 400;
    throw error;
  }

  if (!expiryDate) {
    const error = new Error('Expiry date is required');
    error.statusCode = 400;
    throw error;
  }

  const medicine = await prisma.medicine.findFirst({
    where: { id: medicineId, hospitalId },
  });
  if (!medicine) {
    const error = new Error('Medicine not found in this hospital');
    error.statusCode = 404;
    throw error;
  }

  const batch = await prisma.medicineBatch.upsert({
    where: {
      medicineId_batchNumber: {
        medicineId,
        batchNumber: batchNumber.trim(),
      },
    },
    update: {
      quantity: { increment: parseInt(quantity, 10) || 0 },
      expiryDate: new Date(expiryDate),
      purchasePrice: parseFloat(purchasePrice) || 0.0,
      sellingPrice: parseFloat(sellingPrice) || 0.0,
    },
    create: {
      hospitalId,
      medicineId,
      batchNumber: batchNumber.trim(),
      expiryDate: new Date(expiryDate),
      quantity: parseInt(quantity, 10) || 0,
      purchasePrice: parseFloat(purchasePrice) || 0.0,
      sellingPrice: parseFloat(sellingPrice) || 0.0,
    },
    include: {
      medicine: true,
    },
  });

  return batch;
};

/**
 * Adjust batch stock level (inventory audit / wastage)
 */
export const adjustBatchStock = async (hospitalId, batchId, quantityChange, reason = 'Audit adjustment') => {
  const batch = await prisma.medicineBatch.findFirst({
    where: { id: batchId, hospitalId },
  });

  if (!batch) {
    const error = new Error('Batch not found');
    error.statusCode = 404;
    throw error;
  }

  const newQuantity = batch.quantity + parseInt(quantityChange, 10);
  if (newQuantity < 0) {
    const error = new Error('Adjustment would result in negative stock');
    error.statusCode = 400;
    throw error;
  }

  const updated = await prisma.medicineBatch.update({
    where: { id: batchId },
    data: { quantity: newQuantity },
    include: { medicine: true },
  });

  return updated;
};

/**
 * Get active/pending prescriptions ready for pharmacy dispensing
 */
export const getPendingPrescriptions = async (hospitalId, query = {}) => {
  const { search } = query;

  const where = {
    hospitalId,
    status: { in: ['ACTIVE', 'PARTIALLY_DISPENSED'] },
  };

  if (search && search.trim()) {
    const clean = search.trim();
    where.OR = [
      { prescriptionCode: { contains: clean } },
      { patient: { fullName: { contains: clean } } },
      { patient: { uhid: { contains: clean } } },
      { patient: { phone: { contains: clean } } },
    ];
  }

  const prescriptions = await prisma.prescription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      patient: {
        select: { id: true, uhid: true, fullName: true, phone: true, gender: true, age: true },
      },
      doctor: {
        include: {
          user: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      },
      consultation: {
        select: { id: true, diagnosis: true, notes: true, advice: true },
      },
      items: {
        include: {
          medicine: {
            select: { id: true, name: true, genericName: true, unit: true },
          },
        },
      },
    },
  });

  return prescriptions;
};

/**
 * Preview prescription dispensing using FEFO (First Expiring First Out)
 * Computes available batches, suggested allocation, stock adequacy, and price
 */
export const getPrescriptionDispensePreview = async (hospitalId, prescriptionId) => {
  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, hospitalId },
    include: {
      patient: true,
      doctor: {
        include: { user: { select: { id: true, name: true } } },
      },
      consultation: true,
      items: {
        include: {
          medicine: {
            include: {
              batches: {
                where: {
                  quantity: { gt: 0 },
                  expiryDate: { gt: new Date() },
                },
                orderBy: { expiryDate: 'asc' }, // FEFO order
              },
            },
          },
        },
      },
    },
  });

  if (!prescription) {
    const error = new Error('Prescription not found');
    error.statusCode = 404;
    throw error;
  }

  let totalEstimatedAmount = 0;
  let canFullyDispense = true;

  const previewItems = prescription.items.map((item) => {
    const needed = item.quantityPrescribed - item.quantityDispensed;
    const availableBatches = item.medicine?.batches || [];
    let allocated = 0;
    const batchAllocations = [];

    for (const b of availableBatches) {
      if (allocated >= needed) break;
      const takeQty = Math.min(needed - allocated, b.quantity);
      allocated += takeQty;
      const subtotal = takeQty * b.sellingPrice;
      totalEstimatedAmount += subtotal;

      batchAllocations.push({
        batchId: b.id,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate,
        unitPrice: b.sellingPrice,
        allocatedQuantity: takeQty,
        subtotal,
      });
    }

    const isShort = allocated < needed;
    if (isShort) canFullyDispense = false;

    return {
      prescriptionItemId: item.id,
      medicineId: item.medicineId,
      medicineName: item.medicine?.name,
      genericName: item.medicine?.genericName,
      unit: item.medicine?.unit,
      dosage: item.dosage,
      frequency: item.frequency,
      duration: item.duration,
      instructions: item.instructions,
      quantityPrescribed: item.quantityPrescribed,
      quantityAlreadyDispensed: item.quantityDispensed,
      quantityRemaining: needed,
      quantityAllocated: allocated,
      isShort,
      batchAllocations,
    };
  });

  return {
    prescriptionId: prescription.id,
    prescriptionCode: prescription.prescriptionCode,
    patient: prescription.patient,
    doctor: prescription.doctor,
    consultation: prescription.consultation,
    status: prescription.status,
    totalEstimatedAmount,
    canFullyDispense,
    items: previewItems,
  };
};

/**
 * Dispense medications against prescription:
 * - Deducts stock from specified or FEFO batches
 * - Creates PharmacyDispense and PharmacyDispenseItem records
 * - Updates PrescriptionItem.quantityDispensed
 * - Updates Prescription.status (DISPENSED or PARTIALLY_DISPENSED)
 * Executed atomically in prisma.$transaction
 */
export const dispensePrescription = async (hospitalId, pharmacistUserId, data) => {
  const { prescriptionId, customAllocations } = data;

  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, hospitalId },
    include: {
      items: {
        include: {
          medicine: {
            include: {
              batches: {
                where: {
                  quantity: { gt: 0 },
                  expiryDate: { gt: new Date() },
                },
                orderBy: { expiryDate: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!prescription) {
    const error = new Error('Prescription not found');
    error.statusCode = 404;
    throw error;
  }

  if (prescription.status === 'DISPENSED') {
    const error = new Error('Prescription is already fully dispensed');
    error.statusCode = 400;
    throw error;
  }

  // Execute in transaction
  const dispenseRecord = await prisma.$transaction(async (tx) => {
    let totalDispenseAmount = 0;
    const dispenseItemsToCreate = [];
    const itemDispenseUpdates = [];

    for (const pItem of prescription.items) {
      const remainingNeeded = pItem.quantityPrescribed - pItem.quantityDispensed;
      if (remainingNeeded <= 0) continue;

      let allocationsForItem = [];

      // Check if custom allocations were specified for this item
      if (customAllocations && customAllocations[pItem.id]) {
        allocationsForItem = customAllocations[pItem.id];
      } else {
        // Automatic FEFO allocation
        let allocated = 0;
        for (const b of pItem.medicine.batches) {
          if (allocated >= remainingNeeded) break;
          const takeQty = Math.min(remainingNeeded - allocated, b.quantity);
          if (takeQty > 0) {
            allocated += takeQty;
            allocationsForItem.push({
              batchId: b.id,
              quantity: takeQty,
              unitPrice: b.sellingPrice,
            });
          }
        }
      }

      if (allocationsForItem.length === 0) {
        continue; // No stock available to dispense for this item
      }

      let totalDispensedForThisItem = 0;
      for (const alloc of allocationsForItem) {
        // Acquire PostgreSQL transaction-level advisory lock on this specific medicine batch
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('batch-' || ${alloc.batchId}))`;

        const batch = await tx.medicineBatch.findUnique({
          where: { id: alloc.batchId },
        });

        if (!batch || batch.quantity < alloc.quantity) {
          const error = new Error(`Insufficient stock for batch ${batch?.batchNumber || alloc.batchId}`);
          error.statusCode = 400;
          throw error;
        }

        // Deduct batch stock
        await tx.medicineBatch.update({
          where: { id: alloc.batchId },
          data: {
            quantity: { decrement: alloc.quantity },
          },
        });

        const unitPrice = alloc.unitPrice || batch.sellingPrice;
        const subtotal = alloc.quantity * unitPrice;
        totalDispenseAmount += subtotal;
        totalDispensedForThisItem += alloc.quantity;

        dispenseItemsToCreate.push({
          medicineBatchId: alloc.batchId,
          quantity: alloc.quantity,
          unitPrice,
          totalPrice: subtotal,
        });
      }

      itemDispenseUpdates.push({
        id: pItem.id,
        quantityIncrement: totalDispensedForThisItem,
      });
    }

    if (dispenseItemsToCreate.length === 0) {
      const error = new Error('No items or batches available to dispense. Please check stock.');
      error.statusCode = 400;
      throw error;
    }

    // 1. Create PharmacyDispense
    const dispense = await tx.pharmacyDispense.create({
      data: {
        hospitalId,
        prescriptionId: prescription.id,
        pharmacistId: pharmacistUserId,
        totalAmount: totalDispenseAmount,
        status: 'COMPLETED',
        items: {
          create: dispenseItemsToCreate,
        },
      },
      include: {
        items: {
          include: {
            medicineBatch: {
              include: { medicine: true },
            },
          },
        },
        prescription: {
          include: { patient: true, doctor: { include: { user: true } } },
        },
        pharmacist: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 2. Update PrescriptionItem dispensed quantities
    for (const update of itemDispenseUpdates) {
      await tx.prescriptionItem.update({
        where: { id: update.id },
        data: {
          quantityDispensed: { increment: update.quantityIncrement },
        },
      });
    }

    // 3. Determine if prescription is fully or partially dispensed
    const updatedPrescription = await tx.prescription.findUnique({
      where: { id: prescription.id },
      include: { items: true },
    });

    const isFullyDispensed = updatedPrescription.items.every(
      (it) => it.quantityDispensed >= it.quantityPrescribed
    );

    await tx.prescription.update({
      where: { id: prescription.id },
      data: {
        status: isFullyDispensed ? 'DISPENSED' : 'PARTIALLY_DISPENSED',
      },
    });

    return dispense;
  });

  return dispenseRecord;
};

/**
 * Get dispenses list with filtering
 */
export const getDispenses = async (hospitalId, query = {}) => {
  const { prescriptionId, pharmacistId, search, page = 1, limit = 20 } = query;

  const where = { hospitalId };

  if (prescriptionId) where.prescriptionId = prescriptionId;
  if (pharmacistId) where.pharmacistId = pharmacistId;

  if (search && search.trim()) {
    const clean = search.trim();
    where.OR = [
      { prescription: { prescriptionCode: { contains: clean } } },
      { prescription: { patient: { fullName: { contains: clean } } } },
      { prescription: { patient: { uhid: { contains: clean } } } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const [total, dispenses] = await Promise.all([
    prisma.pharmacyDispense.count({ where }),
    prisma.pharmacyDispense.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        pharmacist: { select: { id: true, name: true } },
        prescription: {
          select: {
            id: true,
            prescriptionCode: true,
            patient: { select: { id: true, fullName: true, uhid: true, phone: true } },
            doctor: { include: { user: { select: { id: true, name: true } } } },
          },
        },
        items: {
          include: {
            medicineBatch: {
              include: { medicine: { select: { id: true, name: true, unit: true } } },
            },
          },
        },
      },
    }),
  ]);

  return {
    dispenses,
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Get dispense record by ID (for receipt printing)
 */
export const getDispenseById = async (hospitalId, id) => {
  const dispense = await prisma.pharmacyDispense.findFirst({
    where: { id, hospitalId },
    include: {
      hospital: {
        select: { id: true, name: true, code: true, address: true, phone: true, email: true },
      },
      pharmacist: { select: { id: true, name: true, email: true } },
      prescription: {
        include: {
          patient: true,
          doctor: {
            include: {
              user: { select: { id: true, name: true } },
              department: { select: { id: true, name: true } },
            },
          },
          consultation: true,
        },
      },
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
  });

  if (!dispense) {
    const error = new Error('Dispense record not found');
    error.statusCode = 404;
    throw error;
  }

  return dispense;
};

/**
 * Get inventory alerts (Low stock medicines & Expiring/Expired batches)
 */
export const getInventoryAlerts = async (hospitalId) => {
  const now = new Date();
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

  // 1. Expired batches
  const expiredBatches = await prisma.medicineBatch.findMany({
    where: {
      hospitalId,
      quantity: { gt: 0 },
      expiryDate: { lte: now },
    },
    include: {
      medicine: { select: { id: true, name: true, unit: true } },
    },
    orderBy: { expiryDate: 'asc' },
  });

  // 2. Expiring soon batches (within 30 days)
  const expiringSoonBatches = await prisma.medicineBatch.findMany({
    where: {
      hospitalId,
      quantity: { gt: 0 },
      expiryDate: { gt: now, lte: thirtyDaysLater },
    },
    include: {
      medicine: { select: { id: true, name: true, unit: true } },
    },
    orderBy: { expiryDate: 'asc' },
  });

  // 3. Low stock and out of stock medicines
  const allMedicines = await prisma.medicine.findMany({
    where: { hospitalId, status: 'ACTIVE' },
    include: {
      batches: {
        where: { expiryDate: { gt: now } },
      },
    },
  });

  const lowStockMedicines = [];
  const outOfStockMedicines = [];

  allMedicines.forEach((med) => {
    const validStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
    if (validStock === 0) {
      outOfStockMedicines.push({
        ...med,
        availableStock: 0,
        stockStatus: 'OUT_OF_STOCK',
      });
    } else if (validStock <= med.minStockAlert) {
      lowStockMedicines.push({
        ...med,
        availableStock: validStock,
        stockStatus: 'LOW_STOCK',
      });
    }
  });

  return {
    outOfStockCount: outOfStockMedicines.length,
    lowStockCount: lowStockMedicines.length,
    expiredBatchesCount: expiredBatches.length,
    expiringSoonBatchesCount: expiringSoonBatches.length,
    outOfStockMedicines,
    lowStockMedicines,
    expiredBatches,
    expiringSoonBatches,
  };
};
