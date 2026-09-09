import rateLimit from 'express-rate-limit';

/**
 * Authentication rate limiter - defends against brute force password attacks
 * 5 attempts per 15 minutes per IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // High-level network flood protection; granular 5-attempt lockout enforced per role/account
  skipSuccessfulRequests: true, // Successful logins never consume attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this client, please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * Public queue and TV display rate limiter
 * 180 requests per minute per IP
 */
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests for public queue display, please slow down.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * General API rate limiter
 * 1000 requests per 15 minutes per IP
 */
export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests received from this client, please try again later.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

/**
 * PDF generation rate limiter - protects against CPU / event loop exhaustion DoS
 * 30 PDF generations per 5 minutes per IP
 */
export const pdfLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many PDF generation requests from this client, please try again in a few minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

