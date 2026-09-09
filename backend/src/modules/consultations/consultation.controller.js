import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import * as consultationService from './consultation.service.js';

export const startConsultation = async (req, res, next) => {
  try {
    const consultation = await consultationService.startConsultation(
      req.user.hospitalId,
      req.body
    );
    return successResponse(res, 'Consultation initiated successfully', consultation, 201);
  } catch (error) {
    next(error);
  }
};

export const updateConsultation = async (req, res, next) => {
  try {
    const consultation = await consultationService.updateConsultation(
      req.user.hospitalId,
      req.params.id,
      req.body
    );
    return successResponse(res, 'Consultation notes updated', consultation);
  } catch (error) {
    next(error);
  }
};

export const completeConsultation = async (req, res, next) => {
  try {
    const consultation = await consultationService.completeConsultation(
      req.user.hospitalId,
      req.params.id,
      req.body
    );
    return successResponse(res, 'Consultation finalized and marked completed', consultation);
  } catch (error) {
    next(error);
  }
};

export const listConsultations = async (req, res, next) => {
  try {
    const result = await consultationService.getConsultations(req.user.hospitalId, req.query);
    return successResponse(res, 'Consultations retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getConsultationById = async (req, res, next) => {
  try {
    const consultation = await consultationService.getConsultationById(
      req.user.hospitalId,
      req.params.id
    );
    return successResponse(res, 'Consultation details retrieved', consultation);
  } catch (error) {
    next(error);
  }
};

export const getPatientHistory = async (req, res, next) => {
  try {
    const history = await consultationService.getPatientConsultationHistory(
      req.user.hospitalId,
      req.params.patientId
    );
    return successResponse(res, 'Patient clinical consultation history retrieved', history);
  } catch (error) {
    next(error);
  }
};
