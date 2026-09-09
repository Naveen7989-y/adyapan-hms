import { successResponse } from '../../utils/apiResponse.js';
import * as reportService from './reports.service.js';

export const getFinancialReport = async (req, res, next) => {
  try {
    const data = await reportService.getFinancialReport(req.user.hospitalId, req.query);
    return successResponse(res, 'Financial revenue report generated', data);
  } catch (error) {
    next(error);
  }
};

export const getDoctorWorkloadReport = async (req, res, next) => {
  try {
    const data = await reportService.getDoctorWorkloadReport(req.user.hospitalId, req.query);
    return successResponse(res, 'Doctor clinical workload report generated', data);
  } catch (error) {
    next(error);
  }
};

export const getQueueAnalyticsReport = async (req, res, next) => {
  try {
    const data = await reportService.getQueueAnalyticsReport(req.user.hospitalId, req.query);
    return successResponse(res, 'Queue and patient flow analytics generated', data);
  } catch (error) {
    next(error);
  }
};

export const getPharmacyReport = async (req, res, next) => {
  try {
    const data = await reportService.getPharmacyReport(req.user.hospitalId, req.query);
    return successResponse(res, 'Pharmacy and medication dispensing report generated', data);
  } catch (error) {
    next(error);
  }
};

export const getPatientDemographicsReport = async (req, res, next) => {
  try {
    const data = await reportService.getPatientDemographicsReport(req.user.hospitalId, req.query);
    return successResponse(res, 'Patient intake and demographic report generated', data);
  } catch (error) {
    next(error);
  }
};
