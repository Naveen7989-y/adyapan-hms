import { Router } from 'express';
import {
  postDoctor,
  getDoctors,
  getDoctor,
  putDoctor,
  patchDoctorStatus,
  setDoctorSchedules,
} from './doctor.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

router.use(authenticate);

// Public to staff: view doctors and schedules
router.get('/', getDoctors);
router.get('/:id', getDoctor);

// Admin-only profile management
router.post('/', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), postDoctor);
router.put('/:id', authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN'), putDoctor);

// Availability status and schedule editing (handled with ownership/admin checks in controller)
router.patch('/:id/status', patchDoctorStatus);
router.put('/:id/schedules', setDoctorSchedules);

export default router;
