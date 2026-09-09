import prisma from '../../config/db.js';
import { generatePrescriptionCode } from '../../utils/prescriptionCodeGenerator.js';

/**
 * Calculate quantity from frequency and duration if not provided
 * e.g., "1-0-1" with "5 days" -> (1 + 0 + 1) * 5 = 10
 */
const calculateAutoQuantity = (frequency, duration) => {
  try {
    let dailyDose = 1;
    if (frequency && frequency.includes('-')) {
      const parts = frequency.split('-').map((p) => parseInt(p.trim(), 10) || 0);
      const sum = parts.reduce((a, b) => a + b, 0);
      if (sum > 0) dailyDose = sum;
    } else if (/once/i.test(frequency)) {
      dailyDose = 1;
    } else if (/twice/i.test(frequency)) {
      dailyDose = 2;
    } else if (/thrice/i.test(frequency)) {
      dailyDose = 3;
    }

    let days = 1;
    if (duration) {
      const match = duration.match(/(\d+)/);
      if (match) {
        days = parseInt(match[1], 10) || 1;
        if (/month/i.test(duration)) {
          days = days * 30;
        } else if (/week/i.test(duration)) {
          days = days * 7;
        }
      }
    }

    return Math.max(1, dailyDose * days);
  } catch {
    return 1;
  }
};

/**
 * Search medicine catalog
 */
export const searchMedicines = async (hospitalId, searchQuery = '') => {
  const clean = searchQuery.trim();
  const where = {
    hospitalId,
    status: 'ACTIVE',
  };

  if (clean) {
    where.OR = [
      { name: { contains: clean } },
      { genericName: { contains: clean } },
      { category: { name: { contains: clean } } },
    ];
  }

  const medicines = await prisma.medicine.findMany({
    where,
    include: {
      category: {
        select: { id: true, name: true },
      },
      batches: {
        where: { quantity: { gt: 0 } },
        select: { id: true, batchNumber: true, quantity: true, expiryDate: true, sellingPrice: true },
      },
    },
    take: 50,
    orderBy: { name: 'asc' },
  });

  return medicines;
};

/**
 * Quick-add medicine to catalog
 */
export const quickAddMedicine = async (hospitalId, data) => {
  const { name, genericName, categoryName = 'General', unit = 'TABLETS', manufacturer = 'Standard' } = data;

  if (!name || !name.trim()) {
    const error = new Error('Medicine name is required');
    error.statusCode = 400;
    throw error;
  }

  // Find or create category
  let category = await prisma.medicineCategory.findFirst({
    where: { hospitalId, name: categoryName.trim() },
  });

  if (!category) {
    category = await prisma.medicineCategory.create({
      data: {
        hospitalId,
        name: categoryName.trim(),
        description: 'Auto-created category',
      },
    });
  }

  // Create medicine
  const medicine = await prisma.medicine.upsert({
    where: {
      hospitalId_name: {
        hospitalId,
        name: name.trim(),
      },
    },
    update: {
      genericName: genericName?.trim() || undefined,
      unit: unit || 'TABLETS',
    },
    create: {
      hospitalId,
      categoryId: category.id,
      name: name.trim(),
      genericName: genericName?.trim() || null,
      manufacturer: manufacturer?.trim() || 'Standard',
      unit: unit || 'TABLETS',
      minStockAlert: 20,
      status: 'ACTIVE',
    },
    include: {
      category: true,
    },
  });

  return medicine;
};

/**
 * Author and issue digital prescription
 */
export const createPrescription = async (hospitalId, user, data) => {
  const { consultationId, patientId, doctorId, items, notes } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    const error = new Error('Prescription must contain at least one medication item');
    error.statusCode = 400;
    throw error;
  }

  // Determine Doctor
  let targetDoctorId = doctorId;
  if (!targetDoctorId && user?.role === 'DOCTOR') {
    const docProfile = await prisma.doctor.findUnique({
      where: { userId: user.id },
    });
    if (docProfile) {
      targetDoctorId = docProfile.id;
    }
  }

  // Verify Doctor
  if (!targetDoctorId) {
    const error = new Error('Prescribing doctor ID is required');
    error.statusCode = 400;
    throw error;
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id: targetDoctorId, hospitalId },
    include: { user: true, department: true },
  });
  if (!doctor) {
    const error = new Error('Doctor not found in this hospital');
    error.statusCode = 404;
    throw error;
  }

  // Determine and verify Patient
  let targetPatientId = patientId;
  let linkedConsultationId = consultationId;

  if (linkedConsultationId) {
    const consult = await prisma.consultation.findFirst({
      where: { id: linkedConsultationId, hospitalId },
      include: { prescription: true },
    });
    if (!consult) {
      const error = new Error('Linked consultation not found');
      error.statusCode = 404;
      throw error;
    }
    targetPatientId = consult.patientId;

    // If consultation already has a prescription, update it instead of duplicate error
    if (consult.prescription) {
      return updatePrescription(hospitalId, consult.prescription.id, user, { items, notes });
    }
  } else {
    // If no consultationId was given, verify patient
    if (!targetPatientId) {
      const error = new Error('Patient ID is required');
      error.statusCode = 400;
      throw error;
    }
    const patient = await prisma.patient.findFirst({
      where: { id: targetPatientId, hospitalId },
    });
    if (!patient) {
      const error = new Error('Patient not found');
      error.statusCode = 404;
      throw error;
    }

    // Auto-create a consultation to satisfy relational schema integrity
    const autoConsultation = await prisma.consultation.create({
      data: {
        hospitalId,
        patientId: targetPatientId,
        doctorId: targetDoctorId,
        diagnosis: 'Prescription Consultation',
        status: 'COMPLETED',
        notes: 'Encounter created via Digital Prescription desk',
      },
    });
    linkedConsultationId = autoConsultation.id;
  }

  // Validate items
  const validatedItems = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let medicineId = item.medicineId;

    // If doctor supplied medicine name directly instead of medicineId
    if (!medicineId && item.medicineName) {
      const createdMed = await quickAddMedicine(hospitalId, {
        name: item.medicineName,
        genericName: item.genericName,
        unit: item.unit || 'TABLETS',
      });
      medicineId = createdMed.id;
    }

    if (!medicineId) {
      const error = new Error(`Item ${i + 1}: Valid medicineId or medicineName is required`);
      error.statusCode = 400;
      throw error;
    }

    const medicine = await prisma.medicine.findFirst({
      where: { id: medicineId, hospitalId },
    });
    if (!medicine) {
      const error = new Error(`Item ${i + 1}: Medicine not found in hospital inventory`);
      error.statusCode = 404;
      throw error;
    }

    const dosage = item.dosage?.trim() || 'As directed';
    const frequency = item.frequency?.trim() || '1-0-1';
    const duration = item.duration?.trim() || '5 days';
    const instructions = item.instructions?.trim() || 'After food';
    const qty = parseInt(item.quantityPrescribed, 10) || calculateAutoQuantity(frequency, duration);

    validatedItems.push({
      medicineId,
      dosage,
      frequency,
      duration,
      instructions,
      quantityPrescribed: qty,
      quantityDispensed: 0,
    });
  }

  // Create prescription in transaction
  const result = await prisma.$transaction(async (tx) => {
    const prescriptionCode = await generatePrescriptionCode(tx, hospitalId);

    const created = await tx.prescription.create({
      data: {
        hospitalId,
        consultationId: linkedConsultationId,
        patientId: targetPatientId,
        doctorId: targetDoctorId,
        prescriptionCode,
        notes: notes?.trim() || null,
        status: 'ACTIVE',
        items: {
          create: validatedItems,
        },
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            department: { select: { id: true, name: true, code: true } },
          },
        },
        consultation: {
          select: {
            id: true,
            symptoms: true,
            diagnosis: true,
            notes: true,
            advice: true,
            followUpDate: true,
            status: true,
          },
        },
        items: {
          include: {
            medicine: {
              include: {
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return created;
  });

  return result;
};

/**
 * Get list of prescriptions with filters
 */
export const getPrescriptions = async (hospitalId, query = {}) => {
  const { doctorId, patientId, status, search, page = 1, limit = 20 } = query;

  const where = { hospitalId };

  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  if (status && status !== 'ALL') where.status = status;

  if (search && search.trim()) {
    const cleanSearch = search.trim();
    where.OR = [
      { prescriptionCode: { contains: cleanSearch } },
      { patient: { fullName: { contains: cleanSearch } } },
      { patient: { uhid: { contains: cleanSearch } } },
      { patient: { phone: { contains: cleanSearch } } },
      { consultation: { diagnosis: { contains: cleanSearch } } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * take;

  const [total, prescriptions] = await Promise.all([
    prisma.prescription.count({ where }),
    prisma.prescription.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            uhid: true,
            fullName: true,
            phone: true,
            gender: true,
            dateOfBirth: true,
            bloodGroup: true,
          },
        },
        doctor: {
          include: {
            user: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        },
        consultation: {
          select: {
            id: true,
            diagnosis: true,
            symptoms: true,
            advice: true,
            followUpDate: true,
          },
        },
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                genericName: true,
                unit: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    prescriptions,
    pagination: {
      total,
      page: pageNum,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Get prescription details by ID
 */
export const getPrescriptionById = async (hospitalId, id) => {
  const prescription = await prisma.prescription.findFirst({
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
      doctor: {
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          department: { select: { id: true, name: true, code: true } },
        },
      },
      consultation: true,
      items: {
        include: {
          medicine: {
            include: {
              category: { select: { id: true, name: true } },
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

  return prescription;
};

/**
 * Get prescription for a consultation
 */
export const getPrescriptionByConsultation = async (hospitalId, consultationId) => {
  const prescription = await prisma.prescription.findFirst({
    where: { hospitalId, consultationId },
    include: {
      patient: true,
      doctor: {
        include: {
          user: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      },
      consultation: true,
      items: {
        include: {
          medicine: {
            include: {
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  return prescription;
};

/**
 * Get patient prescription history timeline
 */
export const getPatientPrescriptions = async (hospitalId, patientId) => {
  const prescriptions = await prisma.prescription.findMany({
    where: { hospitalId, patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      doctor: {
        include: {
          user: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
        },
      },
      consultation: {
        select: {
          id: true,
          diagnosis: true,
          followUpDate: true,
        },
      },
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              genericName: true,
              unit: true,
            },
          },
        },
      },
    },
  });

  return prescriptions;
};

/**
 * Update an existing prescription (only if ACTIVE)
 */
export const updatePrescription = async (hospitalId, id, user, data) => {
  const prescription = await prisma.prescription.findFirst({
    where: { id, hospitalId },
    include: { items: true },
  });

  if (!prescription) {
    const error = new Error('Prescription not found');
    error.statusCode = 404;
    throw error;
  }

  if (prescription.status === 'DISPENSED' || prescription.status === 'PARTIALLY_DISPENSED') {
    const error = new Error('Cannot modify a prescription that has already been dispensed by the pharmacy');
    error.statusCode = 400;
    throw error;
  }

  const { items, notes } = data;

  const result = await prisma.$transaction(async (tx) => {
    // If new items are provided, replace existing items
    if (items && Array.isArray(items) && items.length > 0) {
      await tx.prescriptionItem.deleteMany({
        where: { prescriptionId: id },
      });

      const newItems = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let medicineId = item.medicineId;

        if (!medicineId && item.medicineName) {
          const createdMed = await quickAddMedicine(hospitalId, {
            name: item.medicineName,
            genericName: item.genericName,
            unit: item.unit || 'TABLETS',
          });
          medicineId = createdMed.id;
        }

        const frequency = item.frequency?.trim() || '1-0-1';
        const duration = item.duration?.trim() || '5 days';
        const qty = parseInt(item.quantityPrescribed, 10) || calculateAutoQuantity(frequency, duration);

        newItems.push({
          prescriptionId: id,
          medicineId,
          dosage: item.dosage?.trim() || 'As directed',
          frequency,
          duration,
          instructions: item.instructions?.trim() || 'After food',
          quantityPrescribed: qty,
          quantityDispensed: 0,
        });
      }

      await tx.prescriptionItem.createMany({
        data: newItems,
      });
    }

    const updated = await tx.prescription.update({
      where: { id },
      data: {
        notes: notes !== undefined ? notes?.trim() || null : undefined,
      },
      include: {
        patient: true,
        doctor: {
          include: {
            user: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        },
        consultation: true,
        items: {
          include: {
            medicine: {
              include: {
                category: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    return updated;
  });

  return result;
};
