import { getHealthStatus } from './health.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export const checkHealth = async (req, res, next) => {
  try {
    const healthData = await getHealthStatus();
    if (healthData.status === 'healthy') {
      return successResponse(res, 'Adyapan HMS API is operational', healthData, 200);
    }
    return errorResponse(res, 'Adyapan HMS API is degraded: database unreachable', [healthData], 503);
  } catch (error) {
    next(error);
  }
};

