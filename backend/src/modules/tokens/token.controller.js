import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import * as tokenService from './token.service.js';

export const checkInAppointment = async (req, res, next) => {
  try {
    const { appointmentId, tokenType } = req.body;
    const token = await tokenService.checkInAppointment(req.user.hospitalId, {
      appointmentId,
      tokenType,
    });
    return successResponse(res, `Patient checked in successfully. Token: ${token.formattedToken}`, token, 201);
  } catch (error) {
    next(error);
  }
};

export const issueWalkInToken = async (req, res, next) => {
  try {
    const { patientId, doctorId, departmentId, tokenType } = req.body;
    const token = await tokenService.createWalkInToken(req.user.hospitalId, {
      patientId,
      doctorId,
      departmentId,
      tokenType,
    });
    return successResponse(res, `Walk-in token issued successfully: ${token.formattedToken}`, token, 201);
  } catch (error) {
    next(error);
  }
};

export const listTokens = async (req, res, next) => {
  try {
    const tokens = await tokenService.getTokens(req.user.hospitalId, req.query);
    return successResponse(res, 'Tokens retrieved successfully', tokens);
  } catch (error) {
    next(error);
  }
};

export const getTokenDetails = async (req, res, next) => {
  try {
    const token = await tokenService.getTokenById(req.user.hospitalId, req.params.id);
    return successResponse(res, 'Token details retrieved successfully', token);
  } catch (error) {
    next(error);
  }
};

export const updateTokenStatus = async (req, res, next) => {
  try {
    const { status, roomNumber, tokenType } = req.body;
    const token = await tokenService.updateTokenStatus(req.user.hospitalId, req.params.id, {
      status,
      roomNumber,
      tokenType,
    });
    return successResponse(res, `Token updated successfully`, token);
  } catch (error) {
    next(error);
  }
};

export const getTodayBooked = async (req, res, next) => {
  try {
    const appointments = await tokenService.getTodayBookedAppointments(req.user.hospitalId, req.query);
    return successResponse(res, 'Today booked appointments retrieved for check-in', appointments);
  } catch (error) {
    next(error);
  }
};

export const getTokenStats = async (req, res, next) => {
  try {
    const stats = await tokenService.getTokenStats(req.user.hospitalId, req.query.date);
    return successResponse(res, 'Token queue metrics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};
