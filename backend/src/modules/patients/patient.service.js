import prisma from '../../config/db.js';
import { generateUHID } from '../../utils/uhidGenerator.js';

/**
 * Register a new patient with comprehensive details and duplicate detection
 */
export const registerPatient = async (hospitalId, data) => {
  const {
    fullName,
    phone,
    email,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    emergencyContact,
    medicalHistory,
    confirmDuplicate,
  } = data;

  if (!fullName || !phone || !gender) {
    const error = new Error('Full name, phone number, and gender are required');
    error.statusCode = 400;
    throw error;
  }

  const cleanPhone = phone.trim();

  // Duplicate Check: search for existing patients with matching phone number
  if (!confirmDuplicate) {
    const existingWithPhone = await prisma.patient.findMany({
      where: {
        hospitalId,
        phone: cleanPhone,
      },
      select: {
        id: true,
        uhid: true,
        fullName: true,
        phone: true,
        gender: true,
        dateOfBirth: true,
        createdAt: true,
      },
    });

    if (existingWithPhone.length > 0) {
      const error = new Error('Potential duplicate patient found with this phone number');
      error.statusCode = 409;
      error.duplicateFound = true;
      error.existingPatients = existingWithPhone;
      throw error;
    }
  }

  const uhid = await generateUHID(prisma, hospitalId);

  const patient = await prisma.patient.create({
    data: {
      hospitalId,
      uhid,
      fullName: fullName.trim(),
      phone: cleanPhone,
      email: email ? email.toLowerCase().trim() : null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender.toUpperCase(),
      bloodGroup: bloodGroup || null,
      address: address ? address.trim() : null,
      emergencyContact: emergencyContact ? emergencyContact.trim() : null,
      medicalHistory: medicalHistory ? medicalHistory.trim() : null,
    },
  });

  return patient;
};

/**
 * Fast walk-in registration with minimal required fields
 */
export const quickWalkInRegistration = async (hospitalId, data) => {
  const { fullName, phone, gender, age, reuseExistingIfFound } = data;

  if (!fullName || !phone || !gender) {
    const error = new Error('Full name, phone number, and gender are required for walk-in');
    error.statusCode = 400;
    throw error;
  }

  const cleanPhone = phone.trim();

  // If reuseExistingIfFound is true, reuse existing record if phone matches
  if (reuseExistingIfFound) {
    const existing = await prisma.patient.findFirst({
      where: {
        hospitalId,
        phone: cleanPhone,
      },
    });
    if (existing) {
      return { patient: existing, reused: true };
    }
  }

  let calculatedDob = null;
  if (age && !isNaN(parseInt(age, 10))) {
    const approxYear = new Date().getFullYear() - parseInt(age, 10);
    calculatedDob = new Date(`${approxYear}-01-01`);
  }

  const uhid = await generateUHID(prisma, hospitalId);

  const patient = await prisma.patient.create({
    data: {
      hospitalId,
      uhid,
      fullName: fullName.trim(),
      phone: cleanPhone,
      gender: gender.toUpperCase(),
      dateOfBirth: calculatedDob,
    },
  });

  return { patient, reused: false };
};

/**
 * Search and filter patients
 */
export const searchPatients = async (hospitalId, query = {}) => {
  const { search, limit = 50, page = 1 } = query;
  const take = Math.min(parseInt(limit, 10) || 50, 100);
  const skip = ((parseInt(page, 10) || 1) - 1) * take;

  const whereClause = {
    hospitalId,
    ...(search && {
      OR: [
        { uhid: { contains: search.trim() } },
        { phone: { contains: search.trim() } },
        { fullName: { contains: search.trim() } },
      ],
    }),
  };

  const [total, patients] = await Promise.all([
    prisma.patient.count({ where: whereClause }),
    prisma.patient.findMany({
      where: whereClause,
      select: {
        id: true,
        uhid: true,
        fullName: true,
        phone: true,
        email: true,
        gender: true,
        dateOfBirth: true,
        bloodGroup: true,
        address: true,
        emergencyContact: true,
        medicalHistory: true,
        createdAt: true,
        _count: {
          select: {
            appointments: true,
            consultations: true,
            prescriptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return {
    patients,
    pagination: {
      total,
      page: parseInt(page, 10) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

/**
 * Retrieve patient profile with complete clinical and visit history
 */
export const getPatientDetailsWithHistory = async (hospitalId, patientId) => {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, hospitalId },
    include: {
      appointments: {
        include: {
          doctor: {
            include: {
              user: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
          department: { select: { name: true } },
        },
        orderBy: { appointmentDate: 'desc' },
      },
      tokens: {
        include: {
          doctor: {
            include: {
              user: { select: { name: true } },
            },
          },
          department: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      consultations: {
        include: {
          doctor: {
            include: {
              user: { select: { name: true } },
            },
          },
          prescription: {
            include: {
              items: {
                include: {
                  medicine: { select: { name: true, unit: true } },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      prescriptions: {
        include: {
          doctor: {
            include: {
              user: { select: { name: true } },
            },
          },
          items: {
            include: {
              medicine: { select: { name: true, unit: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      invoices: {
        include: {
          items: true,
          payments: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!patient) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  return patient;
};

/**
 * Update patient profile details
 */
export const updatePatient = async (hospitalId, patientId, updateData) => {
  const {
    fullName,
    phone,
    email,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    emergencyContact,
    medicalHistory,
  } = updateData;

  const existing = await prisma.patient.findFirst({
    where: { id: patientId, hospitalId },
  });

  if (!existing) {
    const error = new Error('Patient not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedPatient = await prisma.patient.update({
    where: { id: patientId },
    data: {
      ...(fullName && { fullName: fullName.trim() }),
      ...(phone && { phone: phone.trim() }),
      ...(email !== undefined && { email: email ? email.toLowerCase().trim() : null }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(gender && { gender: gender.toUpperCase() }),
      ...(bloodGroup !== undefined && { bloodGroup }),
      ...(address !== undefined && { address: address ? address.trim() : null }),
      ...(emergencyContact !== undefined && { emergencyContact: emergencyContact ? emergencyContact.trim() : null }),
      ...(medicalHistory !== undefined && { medicalHistory: medicalHistory ? medicalHistory.trim() : null }),
    },
  });

  return updatedPatient;
};
