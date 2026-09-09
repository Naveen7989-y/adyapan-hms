import { Router } from 'express';
import {
  postTestNotification,
  getNotifications,
  getStats,
  postRetry,
} from './notification.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// View notification logs and metrics (accessible to staff)
router.get('/', getNotifications);
router.get('/stats', getStats);

// Test notification dispatch and retry
router.post(
  '/test',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'),
  postTestNotification
);

router.post(
  '/:id/retry',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'),
  postRetry
);

export default router;
