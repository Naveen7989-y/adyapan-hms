import {
  createDoctorProfile,
  listDoctors,
  getDoctorById,
  updateDoctorProfile,
  updateDoctorStatus,
  configureDoctorSchedules,
} from './doctor.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export const postDoctor = async (req, res, next) => {
  try {
    const doctor = await createDoctorProfile(req.user.hospitalId, req.body);
    return successResponse(res, 'Doctor profile created successfully', doctor, 201);
  } catch (error) {
    next(error);
  }
};

export const getDoctors = async (req, res, next) => {
  try {
    const doctors = await listDoctors(req.user.hospitalId, req.query);
    return successResponse(res, 'Doctors retrieved successfully', doctors, 200);
  } catch (error) {
    next(error);
  }
};

export const getDoctor = async (req, res, next) => {
  try {
    const doctor = await getDoctorById(req.user.hospitalId, req.params.id);
    return successResponse(res, 'Doctor profile retrieved successfully', doctor, 200);
  } catch (error) {
    next(error);
  }
};

export const putDoctor = async (req, res, next) => {
  try {
    const doctor = await updateDoctorProfile(req.user.hospitalId, req.params.id, req.body);
    return successResponse(res, 'Doctor profile updated successfully', doctor, 200);
  } catch (error) {
    next(error);
  }
};

export const patchDoctorStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    // Allow if user is admin OR if user is the doctor himself
    const doctor = await getDoctorById(req.user.hospitalId, req.params.id);
    if (
      req.user.role !== 'SUPER_ADMIN' &&
      req.user.role !== 'HOSPITAL_ADMIN' &&
      req.user.id !== doctor.userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own availability status.',
      });
    }

    const updated = await updateDoctorStatus(req.user.hospitalId, req.params.id, status);
    return successResponse(res, 'Doctor availability status updated successfully', updated, 200);
  } catch (error) {
    next(error);
  }
};

export const setDoctorSchedules = async (req, res, next) => {
  try {
    const { schedules } = req.body;
    const doctor = await getDoctorById(req.user.hospitalId, req.params.id);
    if (
      req.user.role !== 'SUPER_ADMIN' &&
      req.user.role !== 'HOSPITAL_ADMIN' &&
      req.user.id !== doctor.userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only configure your own schedules.',
      });
    }

    const updatedSchedules = await configureDoctorSchedules(req.user.hospitalId, req.params.id, schedules);
    return successResponse(res, 'Doctor weekly schedules configured successfully', updatedSchedules, 200);
  } catch (error) {
    next(error);
  }
};
