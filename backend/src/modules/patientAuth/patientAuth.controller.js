import * as service from './patientAuth.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const sendOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const result = await service.sendOtpToPatient(phone);
    return successResponse(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, patientId } = req.body;
    const result = await service.verifyOtpAndLogin(phone, otp, patientId);
    return successResponse(res, 'Patient authentication successful', result);
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const profile = await service.getPatientProfile(req.patient.id);
    return successResponse(res, 'Patient session verified', profile);
  } catch (error) {
    next(error);
  }
};
