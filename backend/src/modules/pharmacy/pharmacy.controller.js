import { successResponse } from '../../utils/apiResponse.js';
import * as pharmacyService from './pharmacy.service.js';

export const getMedicines = async (req, res, next) => {
  try {
    const result = await pharmacyService.getMedicinesWithStock(req.user.hospitalId, req.query);
    return successResponse(res, 'Pharmacy medicines inventory retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const getMedicineById = async (req, res, next) => {
  try {
    const medicine = await pharmacyService.getMedicineById(req.user.hospitalId, req.params.id);
    return successResponse(res, 'Medicine details retrieved', medicine);
  } catch (error) {
    next(error);
  }
};

export const createMedicine = async (req, res, next) => {
  try {
    const medicine = await pharmacyService.createMedicine(req.user.hospitalId, req.body);
    return successResponse(res, 'Medicine created successfully in inventory', medicine, 201);
  } catch (error) {
    next(error);
  }
};

export const addBatch = async (req, res, next) => {
  try {
    const batch = await pharmacyService.addMedicineBatch(
      req.user.hospitalId,
      req.params.id,
      req.body
    );
    return successResponse(res, `Batch ${batch.batchNumber} added successfully`, batch, 201);
  } catch (error) {
    next(error);
  }
};

export const adjustStock = async (req, res, next) => {
  try {
    const { quantityChange, reason } = req.body;
    const batch = await pharmacyService.adjustBatchStock(
      req.user.hospitalId,
      req.params.batchId,
      quantityChange,
      reason
    );
    return successResponse(res, 'Batch stock adjusted successfully', batch);
  } catch (error) {
    next(error);
  }
};

export const getPendingPrescriptions = async (req, res, next) => {
  try {
    const prescriptions = await pharmacyService.getPendingPrescriptions(req.user.hospitalId, req.query);
    return successResponse(res, 'Pending prescriptions for dispense retrieved', prescriptions);
  } catch (error) {
    next(error);
  }
};

export const getPrescriptionDispensePreview = async (req, res, next) => {
  try {
    const preview = await pharmacyService.getPrescriptionDispensePreview(
      req.user.hospitalId,
      req.params.prescriptionId
    );
    return successResponse(res, 'Prescription dispense preview generated', preview);
  } catch (error) {
    next(error);
  }
};

export const dispensePrescription = async (req, res, next) => {
  try {
    const dispense = await pharmacyService.dispensePrescription(
      req.user.hospitalId,
      req.user.id,
      req.body
    );
    return successResponse(
      res,
      `Prescription medications dispensed successfully. Total: ₹${dispense.totalAmount.toFixed(2)}`,
      dispense,
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getDispenses = async (req, res, next) => {
  try {
    const result = await pharmacyService.getDispenses(req.user.hospitalId, req.query);
    return successResponse(res, 'Dispense logs retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getDispenseById = async (req, res, next) => {
  try {
    const dispense = await pharmacyService.getDispenseById(req.user.hospitalId, req.params.id);
    return successResponse(res, 'Dispense receipt details retrieved', dispense);
  } catch (error) {
    next(error);
  }
};

export const getInventoryAlerts = async (req, res, next) => {
  try {
    const alerts = await pharmacyService.getInventoryAlerts(req.user.hospitalId);
    return successResponse(res, 'Inventory alerts retrieved successfully', alerts);
  } catch (error) {
    next(error);
  }
};
