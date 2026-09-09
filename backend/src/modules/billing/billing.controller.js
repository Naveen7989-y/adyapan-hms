import { successResponse } from '../../utils/apiResponse.js';
import * as billingService from './billing.service.js';
import { generateInvoicePdf } from '../../utils/pdfGenerator.js';

export const createInvoice = async (req, res, next) => {
  try {
    const invoice = await billingService.createInvoice(
      req.user.hospitalId,
      req.user.id,
      req.body
    );
    return successResponse(
      res,
      `Invoice ${invoice.invoiceNumber} generated successfully`,
      invoice,
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getInvoices = async (req, res, next) => {
  try {
    const result = await billingService.getInvoices(req.user.hospitalId, req.query);
    return successResponse(res, 'Invoices retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await billingService.getInvoiceById(req.user.hospitalId, req.params.id);
    return successResponse(res, 'Invoice details retrieved', invoice);
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const result = await billingService.recordPayment(
      req.user.hospitalId,
      req.params.id,
      req.user.id,
      req.body
    );
    return successResponse(
      res,
      `Payment of ₹${result.payment.amount.toFixed(2)} recorded successfully`,
      result,
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getEncounterBillPreview = async (req, res, next) => {
  try {
    const { patientId, appointmentId } = req.query;
    const preview = await billingService.getEncounterBillPreview(
      req.user.hospitalId,
      patientId,
      appointmentId
    );
    return successResponse(res, 'Encounter billing preview calculated', preview);
  } catch (error) {
    next(error);
  }
};

export const getBillingMetrics = async (req, res, next) => {
  try {
    const metrics = await billingService.getBillingMetrics(req.user.hospitalId);
    return successResponse(res, 'Billing revenue metrics retrieved', metrics);
  } catch (error) {
    next(error);
  }
};

export const downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoice = await billingService.getInvoiceById(req.user.hospitalId, req.params.id);
    if (!invoice) {
      const err = new Error('Invoice not found');
      err.statusCode = 404;
      throw err;
    }
    generateInvoicePdf(invoice, res);
  } catch (error) {
    next(error);
  }
};

export const processRefund = async (req, res, next) => {
  try {
    const result = await billingService.processRefund(
      req.user.hospitalId,
      req.params.id,
      req.user.id,
      req.body
    );
    return successResponse(
      res,
      `Refund of ₹${result.refund.amount.toFixed(2)} processed successfully`,
      result,
      201
    );
  } catch (error) {
    next(error);
  }
};
