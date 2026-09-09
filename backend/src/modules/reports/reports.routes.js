import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import * as controller from './reports.controller.js';

const router = Router();

router.use(authenticate);

// 1. Financial & Revenue Report
router.get(
  '/financial',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'),
  controller.getFinancialReport
);

// 2. Doctor & Clinical Workload Report
router.get(
  '/doctor-workload',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'),
  controller.getDoctorWorkloadReport
);

// 3. Queue & Patient Flow Analytics
router.get(
  '/queue-analytics',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'),
  controller.getQueueAnalyticsReport
);

// 4. Pharmacy & Medication Dispense Report
router.get(
  '/pharmacy',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'),
  controller.getPharmacyReport
);

// 5. Patient Intake & Demographics Report
router.get(
  '/patient-demographics',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'),
  controller.getPatientDemographicsReport
);

export default router;
