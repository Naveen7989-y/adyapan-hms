import { errorResponse } from '../utils/apiResponse.js';

export const notFoundHandler = (req, res, next) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, [], 404);
};

export const globalErrorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const statusCode = err.statusCode || 500;

  // In production, sanitize 500 errors to prevent schema/stack disclosure
  const isProd = process.env.NODE_ENV === 'production';
  const message = (isProd && statusCode === 500)
    ? 'An unexpected error occurred. Please contact technical support.'
    : (err.message || 'Internal Server Error');

  const errors = (isProd && statusCode === 500) ? [] : (err.errors || []);

  return errorResponse(res, message, errors, statusCode);
};
