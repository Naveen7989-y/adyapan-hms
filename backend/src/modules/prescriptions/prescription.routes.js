import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { pdfLimiter } from '../../middlewares/rateLimiter.js';
import * as controller from './prescription.controller.js';

const router = Router();

// Require authentication for all prescription endpoints
router.use(authenticate);

// Medicine Catalog Search & Quick-Add
router.get(
  '/medicines',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE_ASSISTANT'),
  controller.searchMedicines
);

router.post(
  '/medicines',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST'),
  controller.quickAddMedicine
);

// Create / Issue Prescription
router.post(
  '/',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'),
  controller.createPrescription
);

// List Prescriptions (with filters)
router.get(
  '/',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE_ASSISTANT', 'RECEPTIONIST'),
  controller.getPrescriptions
);

// Get Prescription by Consultation ID
router.get(
  '/consultation/:consultationId',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE_ASSISTANT'),
  controller.getPrescriptionByConsultation
);

// Patient Prescription History
router.get(
  '/patient/:patientId',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE_ASSISTANT', 'RECEPTIONIST'),
  controller.getPatientPrescriptions
);

// Get Prescription Details by ID (for print view & pharmacy)
router.get(
  '/:id',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE_ASSISTANT', 'RECEPTIONIST'),
  controller.getPrescriptionById
);

// Download Prescription PDF
router.get(
  '/:id/pdf',
  pdfLimiter,
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE_ASSISTANT', 'RECEPTIONIST'),
  controller.downloadPrescriptionPdf
);

// Update Existing Prescription
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'),
  controller.updatePrescription
);

export default router;
