import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import * as consultationController from './consultation.controller.js';

const router = Router();

router.use(authenticate);

// 1. Patient Consultation History Timeline
router.get(
  '/patient/:patientId',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT', 'RECEPTIONIST']),
  consultationController.getPatientHistory
);

// 2. Start Consultation
router.post(
  '/start',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT', 'RECEPTIONIST']),
  consultationController.startConsultation
);

// 3. Complete Consultation
router.post(
  '/:id/complete',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT', 'RECEPTIONIST']),
  consultationController.completeConsultation
);

// 4. Update In-Progress Notes / Vitals
router.put(
  '/:id',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT']),
  consultationController.updateConsultation
);

// 5. Query & Filter Consultations
router.get(
  '/',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT', 'RECEPTIONIST']),
  consultationController.listConsultations
);

// 6. Get Single Consultation Details
router.get(
  '/:id',
  authorize(['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT', 'RECEPTIONIST']),
  consultationController.getConsultationById
);

export default router;
