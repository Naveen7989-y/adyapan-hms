import { verifyToken } from '../utils/token.js';
import prisma from '../config/db.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Patient Authentication Middleware:
 * Validates the Bearer JWT token with role PATIENT and attaches req.patient to the request.
 */
export const authenticatePatient = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Patient authentication required. Please sign in.', [], 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return errorResponse(res, 'Authentication token missing.', [], 401);
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Your patient session has expired. Please sign in again with OTP.', [], 401);
      }
      return errorResponse(res, 'Invalid patient authentication token.', [], 401);
    }

    if (decoded.role !== 'PATIENT' || !decoded.patientId) {
      return errorResponse(res, 'Access denied: Patient authentication required.', [], 403);
    }

    const patient = await prisma.patient.findUnique({
      where: { id: decoded.patientId },
      include: {
        hospital: {
          select: { id: true, name: true, code: true, isActive: true },
        },
      },
    });

    if (!patient) {
      return errorResponse(res, 'Patient record not found. Please contact hospital reception.', [], 401);
    }

    if (!patient.hospital || !patient.hospital.isActive) {
      return errorResponse(res, 'Associated hospital account is inactive.', [], 403);
    }

    req.patient = patient;
    req.hospitalId = patient.hospitalId;

    next();
  } catch (error) {
    next(error);
  }
};
