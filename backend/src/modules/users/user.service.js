import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';

const VALID_ROLES = [
  'SUPER_ADMIN',
  'HOSPITAL_ADMIN',
  'RECEPTIONIST',
  'DOCTOR',
  'NURSE_ASSISTANT',
  'PHARMACIST',
  'ACCOUNTANT',
];

export const validatePasswordStrength = (password) => {
  if (!password || password.length < 8) {
    const error = new Error('Password must be at least 8 characters long');
    error.statusCode = 400;
    throw error;
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
    const error = new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    error.statusCode = 400;
    throw error;
  }
};

export const createNewUser = async (hospitalId, data, callerRole) => {
  const { name, email, password, role, phone, specialization, departmentId, consultationFee } = data;

  if (!name || !email || !password || !role) {
    const error = new Error('Name, email, password, and role are required');
    error.statusCode = 400;
    throw error;
  }

  if (!VALID_ROLES.includes(role)) {
    const error = new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // Privilege Escalation Prevention: Only SUPER_ADMIN can create a SUPER_ADMIN user
  if (role === 'SUPER_ADMIN' && callerRole !== 'SUPER_ADMIN') {
    const error = new Error('Only Super Administrators can create or assign the Super Admin role');
    error.statusCode = 403;
    throw error;
  }

  // Enforce password strength policy
  validatePasswordStrength(password);

  const existingUser = await prisma.user.findFirst({
    where: {
      hospitalId,
      email: email.toLowerCase().trim(),
    },
  });

  if (existingUser) {
    const error = new Error('User with this email already exists in the hospital');
    error.statusCode = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await prisma.user.create({
    data: {
      hospitalId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      phone: phone || null,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      hospitalId: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      status: true,
      createdAt: true,
    },
  });

  // If role is DOCTOR, automatically create Doctor clinical profile and 7-day schedule
  if (role === 'DOCTOR') {
    let targetDeptId = departmentId;

    if (!targetDeptId) {
      // Auto-match department from specialization
      const specLower = (specialization || '').toLowerCase();
      let matchedDept = null;

      if (specLower.includes('ortho')) {
        matchedDept = await prisma.department.findFirst({ where: { hospitalId, code: 'ORTH' } });
      } else if (specLower.includes('neuro')) {
        matchedDept = await prisma.department.findFirst({
          where: { hospitalId, OR: [{ code: 'NEU' }, { name: { contains: 'Neurology' } }] },
        });
      } else if (specLower.includes('cardio') || specLower.includes('heart')) {
        matchedDept = await prisma.department.findFirst({ where: { hospitalId, code: 'CARD' } });
      } else if (specLower.includes('pediatric') || specLower.includes('child')) {
        matchedDept = await prisma.department.findFirst({ where: { hospitalId, code: 'PED' } });
      } else if (specLower.includes('dent')) {
        matchedDept = await prisma.department.findFirst({ where: { hospitalId, code: 'DENT' } });
      }

      if (!matchedDept) {
        matchedDept =
          (await prisma.department.findFirst({ where: { hospitalId, code: 'GEN' } })) ||
          (await prisma.department.findFirst({ where: { hospitalId } }));
      }

      targetDeptId = matchedDept?.id;
    }

    if (targetDeptId) {
      const doctor = await prisma.doctor.create({
        data: {
          hospitalId,
          userId: newUser.id,
          departmentId: targetDeptId,
          specialization: (specialization || 'Consultant Physician').trim(),
          consultationFee: parseFloat(consultationFee) || 500.0,
          status: 'AVAILABLE',
        },
      });

      // Automatically configure 7-day schedule (Mon-Sun: 0 to 6, 08:00 - 20:00)
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
    }
  }

  return newUser;
};

export const listUsers = async (hospitalId, query = {}) => {
  const { role, status, search } = query;

  const whereClause = {
    hospitalId,
    ...(role && { role }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
      ],
    }),
  };

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      hospitalId: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      status: true,
      createdAt: true,
      doctor: {
        select: {
          id: true,
          specialization: true,
          status: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
};

export const getUserById = async (hospitalId, userId) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, hospitalId },
    select: {
      id: true,
      hospitalId: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      doctor: {
        select: {
          id: true,
          specialization: true,
          status: true,
          consultationFee: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

export const updateUser = async (hospitalId, userId, updateData, callerRole) => {
  const { name, phone, role } = updateData;

  // Tenant Boundary Check: Ensure target user belongs to this hospital
  const existingUser = await prisma.user.findFirst({
    where: { id: userId, hospitalId },
  });

  if (!existingUser) {
    const error = new Error('User not found in this hospital');
    error.statusCode = 404;
    throw error;
  }

  if (role) {
    if (!VALID_ROLES.includes(role)) {
      const error = new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // Privilege Escalation Prevention: Only SUPER_ADMIN can assign SUPER_ADMIN role
    if (role === 'SUPER_ADMIN' && callerRole !== 'SUPER_ADMIN') {
      const error = new Error('Only Super Administrators can assign the Super Admin role');
      error.statusCode = 403;
      throw error;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name: name.trim() }),
      ...(phone !== undefined && { phone }),
      ...(role && { role }),
    },
    select: {
      id: true,
      hospitalId: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

export const updateUserStatus = async (hospitalId, userId, status) => {
  const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
  if (!VALID_STATUSES.includes(status)) {
    const error = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  // Tenant Boundary Check: Ensure target user belongs to this hospital
  const existingUser = await prisma.user.findFirst({
    where: { id: userId, hospitalId },
  });

  if (!existingUser) {
    const error = new Error('User not found in this hospital');
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status },
    select: {
      id: true,
      hospitalId: true,
      name: true,
      email: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};
