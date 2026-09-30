import * as service from './patientPortal.service.js';
import * as prescriptionService from '../prescriptions/prescription.service.js';
import { generatePrescriptionPdf } from '../../utils/pdfGenerator.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const getDashboard = async (req, res, next) => {
  try {
    const data = await service.getPatientDashboard(req.hospitalId, req.patient.id);
    return successResponse(res, 'Patient dashboard loaded', data);
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await service.getPatientAppointments(req.hospitalId, req.patient.id);
    return successResponse(res, 'Patient appointments retrieved', appointments);
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const updated = await service.cancelPatientAppointment(
      req.hospitalId,
      req.patient.id,
      req.params.id,
      req.body.reason
    );
    return successResponse(res, 'Appointment cancelled successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const getPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await service.getPatientPrescriptions(req.hospitalId, req.patient.id);
    return successResponse(res, 'Patient prescriptions retrieved', prescriptions);
  } catch (error) {
    next(error);
  }
};

export const downloadPrescriptionPdf = async (req, res, next) => {
  try {
    const prescription = await prescriptionService.getPrescriptionById(
      req.hospitalId,
      req.params.id
    );

    if (!prescription) {
      return errorResponse(res, 'Prescription not found', [], 404);
    }

    // Verify ownership: prescription must belong to this patient
    if (prescription.patientId !== req.patient.id) {
      return errorResponse(res, 'Access denied: You can only view your own prescriptions.', [], 403);
    }

    generatePrescriptionPdf(prescription, res);
  } catch (error) {
    next(error);
  }
};

export const getTokens = async (req, res, next) => {
  try {
    const tokens = await service.getPatientTokens(req.hospitalId, req.patient.id);
    return successResponse(res, 'Patient visit tokens retrieved', tokens);
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const invoices = await service.getPatientInvoices(req.hospitalId, req.patient.id);
    return successResponse(res, 'Patient invoices retrieved', invoices);
  } catch (error) {
    next(error);
  }
};
