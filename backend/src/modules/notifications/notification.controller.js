import {
  dispatchNotification,
  listNotifications,
  getNotificationMetrics,
  retryNotification,
} from './notification.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export const postTestNotification = async (req, res, next) => {
  try {
    const result = await dispatchNotification(req.user.hospitalId, req.body);
    return successResponse(res, 'Notification dispatched successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const result = await listNotifications(req.user.hospitalId, req.query);
    return successResponse(res, 'Notifications retrieved successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const metrics = await getNotificationMetrics(req.user.hospitalId);
    return successResponse(res, 'Notification metrics retrieved successfully', metrics, 200);
  } catch (error) {
    next(error);
  }
};

export const postRetry = async (req, res, next) => {
  try {
    const retried = await retryNotification(req.user.hospitalId, req.params.id);
    return successResponse(res, 'Notification retry completed', retried, 200);
  } catch (error) {
    next(error);
  }
};
