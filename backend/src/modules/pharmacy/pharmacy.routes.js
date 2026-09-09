import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import * as controller from './pharmacy.controller.js';

const router = Router();

router.use(authenticate);

// 1. Inventory Alerts (Low stock & Expiring batches)
router.get(
  '/alerts',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'),
  controller.getInventoryAlerts
);

// 2. Pending Prescriptions for Dispensing
router.get(
  '/pending-prescriptions',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'),
  controller.getPendingPrescriptions
);

// 3. Prescription Dispense Preview (FEFO Stock Allocation & Pricing)
router.get(
  '/prescriptions/:prescriptionId/preview',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'),
  controller.getPrescriptionDispensePreview
);

// 4. Dispense Prescription & Deduct Stock
router.post(
  '/dispense',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'),
  controller.dispensePrescription
);

// 5. Dispense Logs & Receipt Details
router.get(
  '/dispenses',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST', 'ACCOUNTANT'),
  controller.getDispenses
);

router.get(
  '/dispenses/:id',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST', 'ACCOUNTANT'),
  controller.getDispenseById
);

// 6. Medicine Inventory Catalog
router.get(
  '/medicines',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE_ASSISTANT', 'ACCOUNTANT', 'RECEPTIONIST'),
  controller.getMedicines
);

router.post(
  '/medicines',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'),
  controller.createMedicine
);

router.get(
  '/medicines/:id',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE_ASSISTANT', 'ACCOUNTANT', 'RECEPTIONIST'),
  controller.getMedicineById
);

router.post(
  '/medicines/:id/batches',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'),
  controller.addBatch
);

router.post(
  '/batches/:batchId/adjust',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'),
  controller.adjustStock
);

export default router;
