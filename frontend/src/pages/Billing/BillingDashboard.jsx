import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Plus,
  Search,
  RefreshCw,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Filter,
  User,
  ArrowUpRight,
  IndianRupee,
  FileDown,
  RotateCcw,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CreateInvoiceModal from './CreateInvoiceModal';
import RecordPaymentModal from './RecordPaymentModal';
import InvoiceReceiptModal from './InvoiceReceiptModal';
import RefundModal from './RefundModal';
import { downloadAuthenticatedFile } from '../../utils/fileDownloader';

export default function BillingDashboard() {
  const { user } = useAuth();

  // Metrics State
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Invoices List State
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & PDF state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState(null);
  const [selectedInvoiceForRefund, setSelectedInvoiceForRefund] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const handleDownloadPdf = async (inv) => {
    try {
      setDownloadingPdfId(inv.id);
      await downloadAuthenticatedFile(
        `/billing/invoices/${inv.id}/pdf`,
        `Invoice-${inv.invoiceNumber}.pdf`
      );
      showToast(`Downloaded invoice PDF for ${inv.invoiceNumber}`);
    } catch (err) {
      showToast(`Failed to download PDF: ${err.message}`);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleRefundProcessed = (result) => {
    showToast(`Refund of ₹${result.refund?.amount?.toFixed(2)} processed successfully!`);
    fetchInvoices();
    fetchMetrics();
    if (result.invoice) {
      setSelectedInvoiceForReceipt(result.invoice);
    }
  };

  // 1. Fetch Financial Metrics
  const fetchMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const res = await api.get('/billing/metrics');
      const data = res.data?.data !== undefined ? res.data.data : res.data;
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load billing metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // 2. Fetch Invoices List
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/billing/invoices', {
        params: {
          search: search.trim() || undefined,
          paymentStatus: paymentStatus !== 'ALL' ? paymentStatus : undefined,
          page,
          limit: 15,
        },
      });

      const payload = res.data?.data !== undefined ? res.data.data : res.data;
      const list = payload?.invoices || (Array.isArray(payload) ? payload : []);
      const pagination = payload?.pagination || {};

      setInvoices(list);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || list.length);
    } catch (err) {
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [search, paymentStatus, page]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleInvoiceCreated = (newInv) => {
    showToast(`Invoice ${newInv.invoiceNumber} created successfully!`);
    fetchInvoices();
    fetchMetrics();
    // Open receipt modal automatically
    setSelectedInvoiceForReceipt(newInv);
  };

  const handlePaymentRecorded = (result) => {
    showToast(`Payment of ₹${result.payment?.amount?.toFixed(2)} recorded successfully!`);
    fetchInvoices();
    fetchMetrics();
    if (result.invoice) {
      setSelectedInvoiceForReceipt(result.invoice);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <RotateCcw className="w-3 h-3 mr-1" />
            REFUNDED
          </span>
        );
      case 'PARTIALLY_REFUNDED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <RotateCcw className="w-3 h-3 mr-1" />
            PARTIAL REFUND
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            PAID
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 mr-1" />
            PARTIAL
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            UNPAID
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-medium animate-in fade-in slide-in-from-bottom duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Billing & Invoicing
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Generate patient invoices, collect payments across multiple modes, and issue official receipts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              fetchMetrics();
              fetchInvoices();
            }}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Collections */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Collections
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ₹{(metrics?.todayCollection || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>{metrics?.todayPaymentsCount || 0} collections today</span>
              {metrics?.todayRefunds > 0 && (
                <span className="text-purple-700 font-bold">
                  -₹{metrics.todayRefunds.toFixed(2)} refunded
                </span>
              )}
            </div>
            {/* Quick breakdown tags */}
            <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-600">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                Cash: ₹{(metrics?.collectionsByMethod?.CASH || 0).toFixed(0)}
              </span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                UPI: ₹{(metrics?.collectionsByMethod?.UPI || 0).toFixed(0)}
              </span>
              <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                Card: ₹{(metrics?.collectionsByMethod?.CARD || 0).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Billed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Billed
            </span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ₹{(metrics?.totalBilled || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Across {metrics?.totalInvoicesCount || 0} total patient invoices
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-brand-600 font-semibold flex items-center justify-between">
              <span>{metrics?.paidInvoicesCount || 0} invoices cleared</span>
              {metrics?.refundedInvoicesCount > 0 && (
                <span className="text-purple-700 font-mono text-[10px]">
                  {metrics.refundedInvoicesCount} refunded
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total Collected (Net after refunds) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Total Collected
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                (Net of Refunds)
              </span>
            </div>
            <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              ₹{(metrics?.totalCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {metrics?.totalRefunded > 0 ? (
                <span className="text-purple-700 font-medium">
                  Net of ₹{(metrics.totalRefunded || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} refunded
                </span>
              ) : metrics?.totalBilled > 0 ? (
                `${Math.round(((metrics?.totalCollected || 0) / metrics.totalBilled) * 100)}% collection efficiency`
              ) : (
                'No invoices yet'
              )}
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-emerald-700 font-semibold flex items-center justify-between">
              <span>Hospital Operating Cash Flow</span>
              {metrics?.totalRefunded > 0 && (
                <span className="text-slate-400 font-mono text-[10px]">
                  Gross: ₹{(metrics.totalGrossCollected || 0).toFixed(0)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pending Outstanding */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Dues
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
              ₹{(metrics?.totalPending || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {metrics?.pendingInvoicesCount || 0} unpaid or partial bills
            </div>
            <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-rose-700 font-semibold">
              Requires cashier follow-up
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Workstation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters and Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
          {/* Status Tabs */}
          <div className="flex items-center space-x-1 bg-slate-200/70 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
            {['ALL', 'PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setPaymentStatus(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-1 md:flex-none ${
                  paymentStatus === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'ALL'
                  ? 'All Invoices'
                  : st === 'PENDING'
                  ? 'Unpaid'
                  : st === 'PARTIALLY_PAID'
                  ? 'Partial'
                  : st === 'REFUNDED'
                  ? 'Refunded'
                  : 'Paid'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search invoice #, patient, UHID..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                <th className="px-5 py-3 whitespace-nowrap">Invoice #</th>
                <th className="px-5 py-3 whitespace-nowrap">Patient</th>
                <th className="px-5 py-3 whitespace-nowrap">Created</th>
                <th className="px-5 py-3 text-right whitespace-nowrap">Total Billed</th>
                <th className="px-5 py-3 text-right whitespace-nowrap">Paid</th>
                <th className="px-5 py-3 text-right whitespace-nowrap">Balance Due</th>
                <th className="px-5 py-3 text-center whitespace-nowrap">Status</th>
                <th className="px-5 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="font-semibold text-xs">Loading hospital invoices...</p>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-16 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600 text-sm">No Invoices Found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search
                        ? `No results match your search "${search}"`
                        : 'Generate a new invoice using the button above to begin billing.'}
                    </p>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const balance = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/75 transition-colors">
                      {/* Invoice Number */}
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedInvoiceForReceipt(inv)}
                          className="hover:text-brand-600 hover:underline flex items-center gap-1"
                        >
                          <span>{inv.invoiceNumber}</span>
                          <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>

                      {/* Patient */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{inv.patient?.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {inv.patient?.uhid} • {inv.patient?.phone}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-slate-500">
                        <div>{new Date(inv.createdAt).toLocaleDateString('en-IN')}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(inv.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Total Billed */}
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                        ₹{(inv.totalAmount || 0).toFixed(2)}
                      </td>

                      {/* Paid */}
                      <td className="px-5 py-3.5 text-right text-emerald-700 font-semibold">
                        ₹{(inv.paidAmount || 0).toFixed(2)}
                      </td>

                      {/* Balance Due */}
                      <td className="px-5 py-3.5 text-right font-bold">
                        {balance > 0 ? (
                          <span className="text-rose-700">₹{balance.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400 font-normal">₹0.00</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        {getStatusBadge(inv.paymentStatus)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPdf(inv)}
                            disabled={downloadingPdfId === inv.id}
                            className="p-1.5 text-slate-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg border border-slate-200 transition-colors"
                            title="Download Official PDF"
                          >
                            {downloadingPdfId === inv.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Print Receipt Slip */}
                          <button
                            onClick={() => setSelectedInvoiceForReceipt(inv)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                            title="Print Tax Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Collect Payment */}
                          {inv.paymentStatus !== 'PAID' && inv.paymentStatus !== 'REFUNDED' && (
                            <button
                              onClick={() => setSelectedInvoiceForPayment(inv)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center space-x-1 shadow-sm"
                              title="Collect Payment"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Collect</span>
                            </button>
                          )}

                          {/* Issue Refund */}
                          {['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'].includes(user?.role) &&
                            Number(inv.paidAmount || 0) > Number(inv.refundedAmount || 0) && (
                              <button
                                onClick={() => setSelectedInvoiceForRefund(inv)}
                                className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors flex items-center space-x-1 shadow-sm"
                                title="Issue Partial or Full Refund"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Refund</span>
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
            <span>
              Showing {invoices.length} of {totalCount} invoices
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                Previous
              </button>
              <span className="font-bold text-slate-700">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold disabled:opacity-40 hover:bg-slate-100 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <CreateInvoiceModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleInvoiceCreated}
        />
      )}

      {/* Record Payment Modal */}
      {selectedInvoiceForPayment && (
        <RecordPaymentModal
          invoice={selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
          onSuccess={handlePaymentRecorded}
        />
      )}

      {/* Print Receipt Modal */}
      {selectedInvoiceForReceipt && (
        <InvoiceReceiptModal
          invoiceId={selectedInvoiceForReceipt.id}
          invoiceData={selectedInvoiceForReceipt}
          onClose={() => setSelectedInvoiceForReceipt(null)}
          onPaymentRecorded={fetchInvoices}
          onOpenRefund={(inv) => setSelectedInvoiceForRefund(inv)}
        />
      )}

      {/* Refund Modal */}
      {selectedInvoiceForRefund && (
        <RefundModal
          invoice={selectedInvoiceForRefund}
          onClose={() => setSelectedInvoiceForRefund(null)}
          onSuccess={handleRefundProcessed}
        />
      )}
    </div>
  );
}
