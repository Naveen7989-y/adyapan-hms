import { successResponse } from '../../utils/apiResponse.js';
import * as prescriptionService from './prescription.service.js';
import { generatePrescriptionPdf } from '../../utils/pdfGenerator.js';

export const searchMedicines = async (req, res, next) => {
  try {
    const medicines = await prescriptionService.searchMedicines(
      req.user.hospitalId,
      req.query.search || req.query.q || ''
    );
    return successResponse(res, 'Medicines retrieved successfully', medicines);
  } catch (error) {
    next(error);
  }
};

export const quickAddMedicine = async (req, res, next) => {
  try {
    const medicine = await prescriptionService.quickAddMedicine(
      req.user.hospitalId,
      req.body
    );
    return successResponse(res, 'Medicine added to catalog successfully', medicine, 201);
  } catch (error) {
    next(error);
  }
};

export const createPrescription = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.createPrescription(
      req.user.hospitalId,
      req.user,
      req.body
    );
    return successResponse(
      res,
      `Prescription ${prescription.prescriptionCode} issued successfully`,
      prescription,
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getPrescriptions = async (req, res, next) => {
  try {
    const result = await prescriptionService.getPrescriptions(
      req.user.hospitalId,
      req.query
    );
    return successResponse(res, 'Prescriptions retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(
      req.user.hospitalId,
      req.params.id
    );
    return successResponse(res, 'Prescription details retrieved successfully', prescription);
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionByConsultation = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.getPrescriptionByConsultation(
      req.user.hospitalId,
      req.params.consultationId
    );
    return successResponse(res, 'Consultation prescription retrieved successfully', prescription);
  } catch (error) {
    next(error);
  }
};

export const getPatientPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await prescriptionService.getPatientPrescriptions(
      req.user.hospitalId,
      req.params.patientId
    );
    return successResponse(res, 'Patient prescriptions retrieved successfully', prescriptions);
  } catch (error) {
    next(error);
  }
};

export const updatePrescription = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.updatePrescription(
      req.user.hospitalId,
      req.params.id,
      req.user,
      req.body
    );
    return successResponse(res, 'Prescription updated successfully', prescription);
  } catch (error) {
    next(error);
  }
};

export const downloadPrescriptionPdf = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(
      req.user.hospitalId,
      req.params.id
    );
    if (!prescription) {
      const err = new Error('Prescription not found');
      err.statusCode = 404;
      throw err;
    }
    generatePrescriptionPdf(prescription, res);
  } catch (error) {
    next(error);
  }
};
