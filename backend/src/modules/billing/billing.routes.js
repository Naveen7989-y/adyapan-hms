import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { pdfLimiter } from '../../middlewares/rateLimiter.js';
import * as controller from './billing.controller.js';

const router = Router();

router.use(authenticate);

// Financial Metrics & Daily Collections
router.get(
  '/metrics',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'),
  controller.getBillingMetrics
);

// Encounter Billing Preview (Doctor consultation + Pharmacy fee)
router.get(
  '/encounter-preview',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'),
  controller.getEncounterBillPreview
);

// Invoices CRUD & Payments
router.post(
  '/invoices',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'),
  controller.createInvoice
);

router.get(
  '/invoices',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'DOCTOR'),
  controller.getInvoices
);

router.get(
  '/invoices/:id',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'DOCTOR'),
  controller.getInvoiceById
);

// Download Invoice PDF
router.get(
  '/invoices/:id/pdf',
  pdfLimiter,
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST', 'DOCTOR'),
  controller.downloadInvoicePdf
);

router.post(
  '/invoices/:id/payments',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'),
  controller.recordPayment
);

// Process Partial or Full Refund (Restricted to Finance & Administrators)
router.post(
  '/invoices/:id/refunds',
  authorize('SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'),
  controller.processRefund
);

export default router;
