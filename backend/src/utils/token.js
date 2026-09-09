import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Generate a signed JWT token
 */
export const generateToken = (payload, expiresIn = config.jwtExpiresIn) => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};
