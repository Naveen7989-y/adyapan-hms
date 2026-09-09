import { verifyToken } from '../utils/token.js';
import prisma from '../config/db.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Authentication Middleware:
 * Validates the Bearer JWT token and attaches req.user to the request.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. No Bearer token provided.', [], 401);
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
        return errorResponse(res, 'Session token expired. Please log in again.', [], 401);
      }
      return errorResponse(res, 'Invalid authentication token.', [], 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        hospital: {
          select: { id: true, name: true, code: true, isActive: true },
        },
        doctor: {
          select: { id: true, specialization: true, status: true },
        },
      },
    });

    if (!user) {
      return errorResponse(res, 'User account not found.', [], 401);
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, `Account is ${user.status.toLowerCase()}. Please contact administrator.`, [], 403);
    }

    if (!user.hospital.isActive) {
      return errorResponse(res, 'Hospital account is deactivated.', [], 403);
    }

    // Attach sanitized user to request
    req.user = {
      id: user.id,
      hospitalId: user.hospitalId,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      hospital: user.hospital,
      doctor: user.doctor,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Role-Based Authorization Guard:
 * Ensures the authenticated user has one of the allowed roles.
 */
export const authorize = (...allowedRoles) => {
  const roles = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before authorization.', [], 401);
    }

    // SUPER_ADMIN has global privileges
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Requires one of roles: [${roles.join(', ')}]. Current role: ${req.user.role}`,
        [],
        403
      );
    }

    next();
  };
};
