import { successResponse } from '../../utils/apiResponse.js';
import * as dashboardService from './dashboard.service.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getRoleDashboard(req.user.hospitalId, req.user);
    return successResponse(res, `${req.user.role} dashboard metrics loaded`, data);
  } catch (error) {
    next(error);
  }
};
