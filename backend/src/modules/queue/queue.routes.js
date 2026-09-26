import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { publicLimiter } from '../../middlewares/rateLimiter.js';
import * as queueController from './queue.controller.js';

const router = Router();

// 1. Public Display Feed (Unauthenticated read-only for waiting area TV displays)
router.get('/public-display', publicLimiter, queueController.getPublicDisplay);

// 2. Public Live Token Tracker (Unauthenticated self-service tracking by Token # or UHID)
router.get('/track', publicLimiter, queueController.trackToken);

// Protected routes below
router.use(authenticate);

// 2. Doctor Live Consulting Queue
router.get(
  '/doctor/:doctorId',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT']),
  queueController.getDoctorQueue
);

// 3. Call Next Patient
router.post(
  '/call-next',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT', 'RECEPTIONIST']),
  queueController.callNextPatient
);

// 4. Recall Currently Called Patient
router.post(
  '/recall',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT', 'RECEPTIONIST']),
  queueController.recallPatient
);

// 5. Transfer Patient to Another Doctor
router.post(
  '/transfer',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT', 'RECEPTIONIST']),
  queueController.transferToken
);

export default router;
