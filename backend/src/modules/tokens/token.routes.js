import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import * as tokenController from './token.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// 1. Get queue statistics
router.get('/stats', tokenController.getTokenStats);

// 2. Get today's booked appointments ready for check-in
router.get('/checkin/appointments', tokenController.getTodayBooked);

// 3. Check in an appointment (issues token)
router.post(
  '/checkin',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'NURSE_ASSISTANT']),
  tokenController.checkInAppointment
);

// 4. Issue walk-in token
router.post(
  '/walk-in',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'NURSE_ASSISTANT', 'DOCTOR']),
  tokenController.issueWalkInToken
);

// 5. Query and list tokens (Queue list)
router.get('/', tokenController.listTokens);

// 6. Get single token by ID
router.get('/:id', tokenController.getTokenDetails);

// 7. Update token status (WAITING -> CALLED -> IN_CONSULTATION -> COMPLETED / SKIPPED / CANCELLED)
router.patch(
  '/:id/status',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'NURSE_ASSISTANT', 'DOCTOR']),
  tokenController.updateTokenStatus
);

export default router;
