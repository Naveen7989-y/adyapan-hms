import React from 'react';
import {
  Banknote,
  Receipt,
  Download,
  IndianRupee,
  TrendingUp,
  CreditCard,
  Smartphone,
  Globe,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';

export default function FinancialReportTab({ data }) {
  const summary = data?.summary || {};
  const breakdown = data?.paymentMethodBreakdown || {};
  const invoices = data?.invoices || [];

  const handleExport = () => {
    const rows = invoices.map((inv) => ({
      'Invoice Number': inv.invoiceNumber,
      'Created Date': new Date(inv.createdAt).toLocaleDateString('en-IN'),
      'Patient Name': inv.patient?.fullName || '',
      'UHID': inv.patient?.uhid || '',
      'Consultation Fee (INR)': inv.consultationFee,
      'Pharmacy Fee (INR)': inv.pharmacyFee,
      'Other Charges (INR)': inv.otherCharges,
      'Discount (INR)': inv.discount,
      'Tax (INR)': inv.tax,
      'Total Amount (INR)': inv.totalAmount,
      'Gross Paid (INR)': inv.paidAmount,
      'Refunded Amount (INR)': inv.refundedAmount || 0,
      'Net Paid (INR)': (inv.paidAmount || 0) - (inv.refundedAmount || 0),
      'Balance Due (INR)': Math.max(0, inv.totalAmount - inv.paidAmount),
      'Payment Status': inv.paymentStatus,
    }));
    exportToCsv('Adyapan_Financial_Revenue_Report', rows);
  };

  return (
    <div className="space-y-6">
      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Total Revenue Billed
          </span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 block">
            ₹{(summary.totalBilled || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {summary.invoicesCount || 0} patient invoices
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Total Collected
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">
              (Net)
            </span>
          </div>
          <span className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1 block">
            ₹{(summary.totalCollected || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {summary.totalRefunded > 0 ? (
              <span className="text-purple-700 font-medium">
                Net of ₹{(summary.totalRefunded || 0).toFixed(2)} refunded
              </span>
            ) : (
              `${summary.collectionRate || 0}% collection efficiency`
            )}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Outstanding Balance
          </span>
          <span className="text-2xl font-extrabold text-rose-600 tracking-tight mt-1 block">
            ₹{(summary.totalOutstanding || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Unpaid or partial patient dues
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Settled Transactions
          </span>
          <span className="text-2xl font-extrabold text-brand-600 tracking-tight mt-1 block">
            {summary.paymentsCount || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Individual receipts cleared
          </span>
        </div>
      </div>

      {/* Payment Modes & Fee Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Modes */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Collections by Payment Channel
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center space-x-3">
              <div className="p-2 bg-emerald-600 text-white rounded-lg">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Cash Desk</span>
                <span className="text-base font-extrabold text-emerald-900">
                  ₹{(breakdown.CASH || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl flex items-center space-x-3">
              <div className="p-2 bg-sky-600 text-white rounded-lg">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-sky-700 block">UPI / QR</span>
                <span className="text-base font-extrabold text-sky-900">
                  ₹{(breakdown.UPI || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center space-x-3">
              <div className="p-2 bg-purple-600 text-white rounded-lg">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-700 block">POS Cards</span>
                <span className="text-base font-extrabold text-purple-900">
                  ₹{(breakdown.CARD || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 text-white rounded-lg">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-700 block">Online Portal</span>
                <span className="text-base font-extrabold text-indigo-900">
                  ₹{(breakdown.ONLINE || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Category Composition */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Revenue Source Breakdown
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">Doctor Consultation Fees</span>
              <span className="font-bold text-slate-900">
                ₹{(summary.totalConsultationFees || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">Pharmacy Medication Sales</span>
              <span className="font-bold text-slate-900">
                ₹{(summary.totalPharmacyFees || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">Clinical Procedures & Nursing</span>
              <span className="font-bold text-slate-900">
                ₹{(summary.totalOtherCharges || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-600 font-medium">Hospital Discounts Applied</span>
              <span className="font-bold text-rose-600">
                - ₹{(summary.totalDiscounts || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Transaction Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Invoices & Billing Ledger</h3>
            <p className="text-[11px] text-slate-500">
              Showing {invoices.length} invoices generated in selected range
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Invoice #</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5 text-right">Paid</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
                <th className="px-4 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No invoices generated in selected date range.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const bal = Math.max(0, inv.totalAmount - inv.paidAmount);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/75">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{inv.patient?.fullName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.patient?.uhid}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ₹{inv.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-semibold">
                        ₹{inv.paidAmount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">
                        ₹{bal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.paymentStatus === 'PARTIALLY_PAID'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
