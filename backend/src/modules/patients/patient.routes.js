import { Router } from 'express';
import {
  createPatient,
  createWalkInPatient,
  getPatients,
  getPatient,
  editPatient,
} from './patient.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';

const router = Router();

// All patient routes require authentication
router.use(authenticate);

// Search and view patients (accessible by clinical, reception, and administrative staff)
router.get(
  '/',
  authorize(
    'RECEPTIONIST',
    'DOCTOR',
    'NURSE_ASSISTANT',
    'HOSPITAL_ADMIN',
    'SUPER_ADMIN',
    'PHARMACIST',
    'ACCOUNTANT'
  ),
  getPatients
);

router.get(
  '/:id',
  authorize(
    'RECEPTIONIST',
    'DOCTOR',
    'NURSE_ASSISTANT',
    'HOSPITAL_ADMIN',
    'SUPER_ADMIN',
    'PHARMACIST',
    'ACCOUNTANT'
  ),
  getPatient
);

// Registration and edits restricted to reception, nurses, and admins
router.post(
  '/',
  authorize('RECEPTIONIST', 'NURSE_ASSISTANT', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  createPatient
);

router.post(
  '/quick',
  authorize('RECEPTIONIST', 'NURSE_ASSISTANT', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  createWalkInPatient
);

router.put(
  '/:id',
  authorize('RECEPTIONIST', 'NURSE_ASSISTANT', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'),
  editPatient
);

export default router;
