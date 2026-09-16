import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Receipt,
  CheckCircle2,
  Clock,
  Building2,
  User,
  ShieldCheck,
  CreditCard,
  Banknote,
  FileDown,
  RotateCcw,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { downloadAuthenticatedFile } from '../../utils/fileDownloader';

export default function InvoiceReceiptModal({
  invoiceId,
  invoiceData,
  onClose,
  onPaymentRecorded,
  onOpenRefund,
}) {
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(invoiceData || null);
  const [loading, setLoading] = useState(!invoiceData);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoiceData) {
      setInvoice(invoiceData);
    }
  }, [invoiceData]);

  useEffect(() => {
    const idToFetch = invoiceId || invoiceData?.id;
    if (idToFetch && (!invoiceData || !invoiceData.hospital)) {
      const fetchInvoice = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/billing/invoices/${idToFetch}`);
          const fullInv = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
          setInvoice(fullInv);
        } catch (err) {
          setError(err.message || 'Failed to load invoice receipt');
        } finally {
          setLoading(false);
        }
      };
      fetchInvoice();
    }
  }, [invoiceId, invoiceData]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloadingPdf(true);
    try {
      await downloadAuthenticatedFile(
        `/billing/invoices/${invoice.id}/pdf`,
        `Invoice-${invoice.invoiceNumber}.pdf`
      );
    } catch (err) {
      alert(`Failed to download PDF: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const hospital = invoice?.hospital;
  const patient = invoice?.patient;
  const doctor = invoice?.appointment?.doctor;
  const items = invoice?.items || [];
  const payments = invoice?.payments || [];
  const balanceDue = Math.max(0, (invoice?.totalAmount || 0) - (invoice?.paidAmount || 0));
  const maxRefundable = Math.max(0, Number(invoice?.paidAmount || 0) - Number(invoice?.refundedAmount || 0));
  const canRefund =
    ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'].includes(user?.role) &&
    maxRefundable > 0 &&
    typeof onOpenRefund === 'function';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-150">
        {/* Modal Top Actions (Hidden during print) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <Receipt className="w-4 h-4 text-brand-400" />
            <span>Hospital Tax Invoice & Patient Receipt</span>
            <span className="bg-slate-800 text-brand-300 font-mono text-[11px] px-2 py-0.5 rounded">
              {invoice?.invoiceNumber || 'INV-RECEIPT'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {canRefund && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRefund(invoice);
                }}
                className="inline-flex items-center px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow transition-all"
                title="Issue Patient Refund"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Issue Refund
              </button>
            )}
            <button
              onClick={handleDownloadPdf}
              disabled={loading || !invoice || downloadingPdf}
              className="inline-flex items-center px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shadow transition-all"
              title="Download Server Generated PDF"
            >
              {downloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
              ) : (
                <FileDown className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
              )}
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={loading || !invoice}
              className="inline-flex items-center px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Receipt Slip */}
        <div className="overflow-y-auto p-6 sm:p-8 flex-1 bg-white">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Generating patient invoice receipt...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-center">
              {error}
            </div>
          ) : invoice ? (
            <div className="invoice-slip border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white shadow-sm space-y-6 relative overflow-hidden">
              {/* Status Watermark Stamps */}
              {invoice.paymentStatus === 'REFUNDED' && (
                <div className="absolute right-8 top-28 border-4 border-rose-600/30 text-rose-600/30 font-black text-4xl px-4 py-1.5 rounded-xl uppercase tracking-widest rotate-[-12deg] select-none pointer-events-none">
                  REFUNDED
                </div>
              )}
              {invoice.paymentStatus === 'PARTIALLY_REFUNDED' && (
                <div className="absolute right-8 top-28 border-4 border-purple-600/30 text-purple-600/30 font-black text-3xl px-4 py-1.5 rounded-xl uppercase tracking-widest rotate-[-12deg] select-none pointer-events-none">
                  PARTIAL REFUND
                </div>
              )}
              {invoice.paymentStatus === 'PAID' && (
                <div className="absolute right-8 top-28 border-4 border-emerald-600/30 text-emerald-600/30 font-black text-4xl px-4 py-1.5 rounded-xl uppercase tracking-widest rotate-[-12deg] select-none pointer-events-none">
                  PAID IN FULL
                </div>
              )}

              {/* 1. Hospital Letterhead */}
              <div className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b-2 border-slate-900 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <img
                      src="/adyapan-logo.png"
                      alt="Adyapan Hospital Logo"
                      className="w-10 h-10 rounded-full object-contain shadow-sm filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.2)]"
                    />
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                        {hospital?.name || 'Adyapan Central Hospital & Clinic'}
                      </h1>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Patient Billing & Revenue Accounts • Healthcare GSTIN: 36ADYAP9921M1Z5
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                    <div>{hospital?.address || '742 Healthcare Avenue, Medical Enclave, Central City'}</div>
                    <div>Accounts Ph: {hospital?.phone || '+91 98765 00001'} | Billing Desk: billing@adyapan.com</div>
                  </div>
                </div>

                <div className="text-left sm:text-right sm:self-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Tax Invoice No.
                  </span>
                  <div className="text-base font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded border border-slate-200">
                    {invoice.invoiceNumber}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Date: {new Date(invoice.createdAt).toLocaleString('en-GB')}
                  </div>
                </div>
              </div>

              {/* 2. Patient Demographics & Payment Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed To (Patient)</div>
                  <div className="text-sm font-bold text-slate-900">{patient?.fullName}</div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    UHID: <span className="font-bold text-slate-800">{patient?.uhid}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Phone: {patient?.phone} | Gender: {patient?.gender}
                  </div>
                </div>

                <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Status</div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        invoice.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : invoice.paymentStatus === 'PARTIALLY_PAID'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {invoice.paymentStatus}
                    </span>
                    {doctor && (
                      <span className="text-[11px] text-slate-500">
                        Attending: Dr. {doctor.user?.name}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] pt-1">
                    Total Invoiced: <span className="font-bold text-slate-800 font-mono">₹{invoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 3. Itemized Bill Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Itemized Healthcare Services & Supplies</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {items.length} service line{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Service / Supply Description</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            ₹{item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{item.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Financial Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  {invoice.consultationFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Doctor Consultation:</span>
                      <span className="font-mono">₹{invoice.consultationFee.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.pharmacyFee > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Pharmacy Medicines:</span>
                      <span className="font-mono">₹{invoice.pharmacyFee.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.otherCharges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Other Procedures:</span>
                      <span className="font-mono">₹{invoice.otherCharges.toFixed(2)}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Concession / Discount:</span>
                      <span className="font-mono">-₹{invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>Tax (0% Healthcare):</span>
                    <span className="font-mono">₹{invoice.tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                    <span>Total Invoiced:</span>
                    <span className="font-mono font-black">₹{invoice.totalAmount.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                    <span>Gross Collected:</span>
                    <span className="font-mono">₹{invoice.paidAmount.toFixed(2)}</span>
                  </div>

                  {Number(invoice.refundedAmount || 0) > 0 && (
                    <div className="flex justify-between text-xs text-rose-700 font-semibold">
                      <span>Refunded to Date:</span>
                      <span className="font-mono">-₹{Number(invoice.refundedAmount).toFixed(2)}</span>
                    </div>
                  )}

                  {Number(invoice.refundedAmount || 0) > 0 && (
                    <div className="flex justify-between text-xs text-slate-900 font-bold">
                      <span>Net Hospital Receipts:</span>
                      <span className="font-mono">₹{(Number(invoice.paidAmount || 0) - Number(invoice.refundedAmount || 0)).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-sm">
                    <span className={balanceDue > 0 ? 'text-red-700' : 'text-slate-700'}>
                      Balance Due:
                    </span>
                    <span className={`font-mono font-black ${balanceDue > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      ₹{balanceDue.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Payments & Refunds History Log */}
              {payments.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Payment & Refund Ledger
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {payments.map((p, pIdx) => {
                      const isRefund = p.type === 'REFUND' || p.amount < 0;
                      return (
                        <div
                          key={p.id || pIdx}
                          className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                            isRefund
                              ? 'bg-rose-50/75 border-rose-200 text-rose-900'
                              : 'bg-emerald-50/50 border-emerald-100 text-slate-800'
                          }`}
                        >
                          <div>
                            <div className="font-semibold flex items-center gap-1">
                              {isRefund && <RotateCcw className="w-3 h-3 text-rose-600 inline" />}
                              <span>
                                {isRefund ? 'REFUND' : 'PAYMENT'}: {p.paymentMethod}{' '}
                                {p.transactionRef && `• ${p.transactionRef}`}
                              </span>
                            </div>
                            {isRefund && p.refundReason && (
                              <div className="text-[10px] text-rose-700 font-medium italic">
                                Reason: {p.refundReason}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400">
                              {new Date(p.createdAt).toLocaleString('en-GB')}
                            </div>
                          </div>
                          <div
                            className={`font-mono font-bold ${
                              isRefund ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            {isRefund ? '-' : ''}₹{Math.abs(p.amount).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. Footer & Digital Signature */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs text-slate-400">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-brand-700 font-semibold text-[11px]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorized Computerized Financial Tax Invoice</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Received with thanks. All healthcare charges comply with National Health Authority schedules.
                  </div>
                </div>

                <div className="text-center sm:text-right border-t border-slate-400 pt-1 min-w-[150px]">
                  <div className="font-medium text-slate-700 text-xs">
                    Adyapan Hospital Cashier
                  </div>
                  <div className="text-[10px] text-slate-400">Authorized Accounts Signature</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-slip, .invoice-slip * {
            visibility: visible;
          }
          .invoice-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
