import { Router } from 'express';
import * as controller from './patientAuth.controller.js';
import { authenticatePatient } from '../../middlewares/patientAuth.js';
import { authLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// Public Patient OTP Authentication routes with rate limiter
router.post('/send-otp', authLimiter, controller.sendOtp);
router.post('/verify-otp', authLimiter, controller.verifyOtp);

// Authenticated Patient Session Verification
router.get('/me', authenticatePatient, controller.getMe);

export default router;
