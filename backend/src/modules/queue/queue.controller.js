import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import * as queueService from './queue.service.js';

export const getDoctorQueue = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const queueData = await queueService.getDoctorLiveQueue(req.user.hospitalId, doctorId, date);
    return successResponse(res, 'Doctor live queue retrieved successfully', queueData);
  } catch (error) {
    next(error);
  }
};

export const callNextPatient = async (req, res, next) => {
  try {
    const { doctorId, roomNumber, force } = req.body;
    const result = await queueService.callNextPatient(req.user.hospitalId, {
      doctorId,
      roomNumber,
      force,
    });
    return successResponse(res, `Patient ${result.formattedToken} called to ${result.roomNumber}`, result);
  } catch (error) {
    next(error);
  }
};

export const recallPatient = async (req, res, next) => {
  try {
    const { tokenId, roomNumber } = req.body;
    const result = await queueService.recallPatient(req.user.hospitalId, {
      tokenId,
      roomNumber,
    });
    return successResponse(res, `Patient ${result.formattedToken} re-announced`, result);
  } catch (error) {
    next(error);
  }
};

export const transferToken = async (req, res, next) => {
  try {
    const { tokenId, toDoctorId, reason } = req.body;
    const result = await queueService.transferToken(req.user.hospitalId, {
      tokenId,
      toDoctorId,
      reason,
    });
    return successResponse(res, `Token transferred to ${result.transferredTo}`, result);
  } catch (error) {
    next(error);
  }
};

export const getPublicDisplay = async (req, res, next) => {
  try {
    const { hospitalId, departmentId } = req.query;
    // Allow public display to operate without authentication
    const displayData = await queueService.getPublicDisplayData(
      hospitalId || req.user?.hospitalId,
      { departmentId }
    );
    return successResponse(res, 'Public TV display data retrieved', displayData);
  } catch (error) {
    next(error);
  }
};
