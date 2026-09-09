import { Router } from 'express';
import {
  getSlots,
  createAppointment,
  getAppointments,
  putReschedule,
  putCancel,
  patchStatus,
} from './appointment.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Discover slots and view appointments (accessible to staff)
router.get('/slots', getSlots);
router.get('/', getAppointments);

// Booking, rescheduling, and cancelling appointments
router.post(
  '/',
  authorize('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'NURSE_ASSISTANT'),
  createAppointment
);

router.put(
  '/:id/reschedule',
  authorize('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'NURSE_ASSISTANT'),
  putReschedule
);

router.put(
  '/:id/cancel',
  authorize('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'NURSE_ASSISTANT', 'DOCTOR'),
  putCancel
);

router.patch(
  '/:id/status',
  authorize('RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT'),
  patchStatus
);

export default router;
