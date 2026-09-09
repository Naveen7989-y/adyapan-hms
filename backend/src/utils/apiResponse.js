/**
 * Standard API Success Response Envelope
 */
export const successResponse = (res, message = 'Operation completed successfully', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Standard API Error Response Envelope
 */
export const errorResponse = (res, message = 'An error occurred', errors = [], statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
