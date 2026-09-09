import {
  registerPatient,
  quickWalkInRegistration,
  searchPatients,
  getPatientDetailsWithHistory,
  updatePatient,
} from './patient.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const createPatient = async (req, res, next) => {
  try {
    const patient = await registerPatient(req.user.hospitalId, req.body);
    return successResponse(res, 'Patient registered successfully', patient, 201);
  } catch (error) {
    if (error.duplicateFound) {
      return res.status(409).json({
        success: false,
        message: error.message,
        duplicateFound: true,
        existingPatients: error.existingPatients,
      });
    }
    next(error);
  }
};

export const createWalkInPatient = async (req, res, next) => {
  try {
    const result = await quickWalkInRegistration(req.user.hospitalId, req.body);
    const message = result.reused
      ? 'Existing patient record found and linked'
      : 'Walk-in patient registered successfully';
    return successResponse(res, message, result, 201);
  } catch (error) {
    next(error);
  }
};

export const getPatients = async (req, res, next) => {
  try {
    const result = await searchPatients(req.user.hospitalId, req.query);
    return successResponse(res, 'Patients retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

export const getPatient = async (req, res, next) => {
  try {
    const patient = await getPatientDetailsWithHistory(req.user.hospitalId, req.params.id);
    return successResponse(res, 'Patient profile and history retrieved successfully', patient, 200);
  } catch (error) {
    next(error);
  }
};

export const editPatient = async (req, res, next) => {
  try {
    const updated = await updatePatient(req.user.hospitalId, req.params.id, req.body);
    return successResponse(res, 'Patient profile updated successfully', updated, 200);
  } catch (error) {
    next(error);
  }
};
