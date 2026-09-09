import { loginUser, getUserProfile, changeUserPassword } from './auth.service.js';
import { successResponse } from '../../utils/apiResponse.js';
import prisma from '../../config/db.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    return successResponse(res, 'Login successful', result, 200);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const profile = await getUserProfile(req.user.id);
    return successResponse(res, 'User profile retrieved successfully', profile, 200);
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  // Client-side JWT disposal
  return successResponse(res, 'Logged out successfully', {}, 200);
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changeUserPassword(req.user.id, currentPassword, newPassword);
    return successResponse(res, result.message, {}, 200);
  } catch (error) {
    next(error);
  }
};

export const getQuickDoctors = async (req, res, next) => {
  try {
    const { hospitalId } = req.query;
    let targetHospitalId = hospitalId;
    if (!targetHospitalId) {
      const primary = await prisma.hospital.findFirst({ where: { isActive: true }, select: { id: true } });
      targetHospitalId = primary?.id;
    }

    const doctors = await prisma.doctor.findMany({
      where: {
        status: { not: 'OFFLINE' },
        ...(targetHospitalId && { hospitalId: targetHospitalId }),
      },
      include: {
        user: { select: { name: true, email: true } },
        department: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formatted = doctors.map((doc) => {
      const dept = (doc.department?.code || doc.department?.name || '').toUpperCase();
      let room = 'Room 101';
      if (dept.includes('CARD')) room = 'Room 102';
      else if (dept.includes('PED')) room = 'Room 103';
      else if (dept.includes('ORTH')) room = 'Room 104';
      else if (dept.includes('DENT')) room = 'Room 105';
      else if (dept.includes('NEU')) room = 'Room 106';

      return {
        id: doc.id,
        name: doc.user?.name || 'Doctor',
        email: doc.user?.email,
        category: doc.department?.name || 'General Medicine',
        code: doc.department?.code || 'GEN',
        specialization: doc.specialization,
        room,
      };
    });

    return successResponse(res, 'Quick doctors list retrieved successfully', formatted, 200);
  } catch (error) {
    next(error);
  }
};

