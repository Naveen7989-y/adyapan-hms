import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import * as tokenController from './token.controller.js';

const router = Router();

router.use(authenticate);

// Convenience routes for Check-In Desk
router.get(
  '/today-appointments',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'NURSE_ASSISTANT', 'DOCTOR']),
  tokenController.getTodayBooked
);

router.post(
  '/',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'NURSE_ASSISTANT']),
  tokenController.checkInAppointment
);

export default router;
