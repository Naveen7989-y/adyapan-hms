import {
  getAvailableSlots,
  bookAppointment,
  listAppointments,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
} from './appointment.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export const getSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    const slots = await getAvailableSlots(req.user.hospitalId, doctorId, date);
    return successResponse(res, 'Available appointment slots retrieved', slots, 200);
  } catch (error) {
    next(error);
  }
};

export const createAppointment = async (req, res, next) => {
  try {
    const appointment = await bookAppointment(req.user.hospitalId, req.body);
    return successResponse(res, 'Appointment booked successfully', appointment, 201);
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    // If logged in as Doctor, default or constrain to own doctorId
    const query = { ...req.query };
    if (req.user.role === 'DOCTOR' && req.user.doctor?.id) {
      query.doctorId = req.user.doctor.id;
    }

    const result = await listAppointments(req.user.hospitalId, query);
    return successResponse(res, 'Appointments retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

export const putReschedule = async (req, res, next) => {
  try {
    const updated = await rescheduleAppointment(req.user.hospitalId, req.params.id, req.body);
    return successResponse(res, 'Appointment rescheduled successfully', updated, 200);
  } catch (error) {
    next(error);
  }
};

export const putCancel = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const cancelled = await cancelAppointment(req.user.hospitalId, req.params.id, cancellationReason);
    return successResponse(res, 'Appointment cancelled successfully', cancelled, 200);
  } catch (error) {
    next(error);
  }
};

export const patchStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updated = await updateAppointmentStatus(req.user.hospitalId, req.params.id, status);
    return successResponse(res, 'Appointment status updated successfully', updated, 200);
  } catch (error) {
    next(error);
  }
};
