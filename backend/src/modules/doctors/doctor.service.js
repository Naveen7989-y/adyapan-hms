import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../../config/db.js';
import { validatePasswordStrength } from '../users/user.service.js';

const VALID_STATUSES = ['AVAILABLE', 'BUSY', 'ON_LEAVE', 'OFFLINE'];

/**
 * Create a new doctor profile linking an existing User account or creating a new Doctor user
 */
export const createDoctorProfile = async (hospitalId, data) => {
  let {
    userId,
    name,
    email,
    password,
    phone,
    departmentId,
    specialization,
    consultationFee,
    status = 'AVAILABLE',
  } = data;

  if (!departmentId || !specialization) {
    const error = new Error('Department ID and Specialization are required');
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // If userId is NOT provided, create or find the Doctor user
  if (!userId) {
    if (!name || !email) {
      const error = new Error('Either an existing User ID or Doctor Name and Email must be provided');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = email.toLowerCase().trim();
    let existingUser = await prisma.user.findFirst({
      where: { hospitalId, email: cleanEmail },
    });

    if (existingUser) {
      if (existingUser.role !== 'DOCTOR') {
        const error = new Error(`User with email ${cleanEmail} exists but has role ${existingUser.role}. Must be DOCTOR.`);
        error.statusCode = 400;
        throw error;
      }
      userId = existingUser.id;
      if (password) {
        validatePasswordStrength(password);
      }
      const initialPassword = password || (crypto.randomBytes(8).toString('hex') + 'Aa1!');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(initialPassword, salt);
      const newUser = await prisma.user.create({
        data: {
          hospitalId,
          name: name.trim(),
          email: cleanEmail,
          password: hashedPassword,
          role: 'DOCTOR',
          phone: phone || null,
          status: 'ACTIVE',
        },
      });
      userId = newUser.id;
    }
  }

  // Verify user exists, belongs to this hospital, and has role DOCTOR
  const user = await prisma.user.findFirst({
    where: { id: userId, hospitalId },
  });

  if (!user) {
    const error = new Error('User account not found in this hospital');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'DOCTOR') {
    const error = new Error(`User must have role DOCTOR. Current role: ${user.role}`);
    error.statusCode = 400;
    throw error;
  }

  // Check if profile already exists for this user
  const existingProfile = await prisma.doctor.findUnique({
    where: { userId },
  });

  if (existingProfile) {
    const error = new Error('Doctor clinical profile already exists for this user account');
    error.statusCode = 409;
    throw error;
  }

  // Verify department exists and is active
  const dept = await prisma.department.findFirst({
    where: { id: departmentId, hospitalId },
  });

  if (!dept) {
    const error = new Error('Department not found');
    error.statusCode = 404;
    throw error;
  }

  const doctor = await prisma.doctor.create({
    data: {
      hospitalId,
      userId,
      departmentId,
      specialization: specialization.trim(),
      consultationFee: parseFloat(consultationFee) || 0.0,
      status,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      department: { select: { id: true, name: true, code: true } },
    },
  });

  // Automatically seed full 7-day schedule (Mon-Sun: 0 to 6, 08:00 - 20:00) so this doctor is immediately operational
  for (let day = 0; day <= 6; day++) {
    await prisma.doctorSchedule.create({
      data: {
        doctorId: doctor.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '20:00',
        slotDurationMinutes: 15,
        maxCapacity: 40,
        isActive: true,
      },
    });
  }

  return doctor;
};

/**
 * List doctors with department, user account, current availability status, and active schedules
 */
export const listDoctors = async (hospitalId, query = {}) => {
  const { departmentId, status, search } = query;

  const whereClause = {
    hospitalId,
    ...(departmentId && { departmentId }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { specialization: { contains: search.trim() } },
        { user: { name: { contains: search.trim() } } },
      ],
    }),
  };

  const doctors = await prisma.doctor.findMany({
    where: whereClause,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      department: { select: { id: true, name: true, code: true } },
      schedules: {
        where: { isActive: true },
        orderBy: { dayOfWeek: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return doctors;
};

/**
 * Get detailed doctor profile with weekly schedules
 */
export const getDoctorById = async (hospitalId, doctorId) => {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      department: { select: { id: true, name: true, code: true } },
      schedules: {
        orderBy: { dayOfWeek: 'asc' },
      },
      _count: {
        select: {
          appointments: true,
          tokens: true,
          consultations: true,
        },
      },
    },
  });

  if (!doctor) {
    const error = new Error('Doctor profile not found');
    error.statusCode = 404;
    throw error;
  }

  return doctor;
};

/**
 * Update doctor profile details
 */
export const updateDoctorProfile = async (hospitalId, doctorId, data) => {
  const { departmentId, specialization, consultationFee } = data;

  const existing = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
  });

  if (!existing) {
    const error = new Error('Doctor profile not found');
    error.statusCode = 404;
    throw error;
  }

  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, hospitalId },
    });
    if (!dept) {
      const error = new Error('Department not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      ...(departmentId && { departmentId }),
      ...(specialization && { specialization: specialization.trim() }),
      ...(consultationFee !== undefined && { consultationFee: parseFloat(consultationFee) || 0.0 }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      department: { select: { id: true, name: true } },
    },
  });

  return updated;
};

/**
 * Update doctor availability status (AVAILABLE, BUSY, ON_LEAVE, OFFLINE)
 */
export const updateDoctorStatus = async (hospitalId, doctorId, status) => {
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
  });

  if (!existing) {
    const error = new Error('Doctor profile not found');
    error.statusCode = 404;
    throw error;
  }

  const updated = await prisma.doctor.update({
    where: { id: doctorId },
    data: { status },
    include: {
      user: { select: { name: true } },
    },
  });

  return updated;
};

/**
 * Configure/replace doctor weekly schedules dynamically
 * schedulesArray: Array<{ dayOfWeek, startTime, endTime, slotDurationMinutes, maxCapacity, breakStartTime, breakEndTime, isActive }>
 */
export const configureDoctorSchedules = async (hospitalId, doctorId, schedulesArray) => {
  const existing = await prisma.doctor.findFirst({
    where: { id: doctorId, hospitalId },
  });

  if (!existing) {
    const error = new Error('Doctor profile not found');
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(schedulesArray)) {
    const error = new Error('Schedules must be an array of daily configurations');
    error.statusCode = 400;
    throw error;
  }

  // Replace existing schedules inside an atomic transaction
  const result = await prisma.$transaction(async (tx) => {
    await tx.doctorSchedule.deleteMany({
      where: { doctorId },
    });

    const createdSchedules = [];
    for (const s of schedulesArray) {
      const schedule = await tx.doctorSchedule.create({
        data: {
          doctorId,
          dayOfWeek: parseInt(s.dayOfWeek, 10),
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '17:00',
          slotDurationMinutes: parseInt(s.slotDurationMinutes, 10) || 15,
          maxCapacity: parseInt(s.maxCapacity, 10) || 30,
          breakStartTime: s.breakStartTime || null,
          breakEndTime: s.breakEndTime || null,
          isActive: s.isActive !== undefined ? !!s.isActive : true,
        },
      });
      createdSchedules.push(schedule);
    }
    return createdSchedules;
  });

  return result;
};
