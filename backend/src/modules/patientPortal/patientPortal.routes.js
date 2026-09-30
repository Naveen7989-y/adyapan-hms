import { Router } from 'express';
import * as controller from './patientPortal.controller.js';
import { authenticatePatient } from '../../middlewares/patientAuth.js';
import { pdfLimiter } from '../../middlewares/rateLimiter.js';

const router = Router();

// Secure all patient portal endpoints
router.use(authenticatePatient);

// Dashboard Aggregates & Live Queue Status
router.get('/dashboard', controller.getDashboard);

// Appointments
router.get('/appointments', controller.getAppointments);
router.post('/appointments/:id/cancel', controller.cancelAppointment);

// Prescriptions & PDF Download
router.get('/prescriptions', controller.getPrescriptions);
router.get('/prescriptions/:id/pdf', pdfLimiter, controller.downloadPrescriptionPdf);

// Visit Tokens & Queue History
router.get('/tokens', controller.getTokens);

// Invoices & Billing History
router.get('/invoices', controller.getInvoices);

export default router;
