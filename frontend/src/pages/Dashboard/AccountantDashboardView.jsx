import React from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Receipt,
  CreditCard,
  Smartphone,
  Globe,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Plus,
  IndianRupee,
} from 'lucide-react';

export default function AccountantDashboardView({ stats }) {
  const kpis = stats?.kpis || {};
  const collectionsByMethod = stats?.collectionsByMethod || {};
  const recentUnpaidInvoices = stats?.recentUnpaidInvoices || [];

  return (
    <div className="space-y-6">
      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              ₹{(kpis.todayCollections || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Hospital cash & digital inflow</span>
              {kpis.todayRefunds > 0 && (
                <span className="text-purple-700 font-semibold">
                  (-₹{kpis.todayRefunds.toFixed(2)} refunded)
                </span>
              )}
            </div>
            <Link
              to="/billing"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Cashier Desk</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Billed Today
            </span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              ₹{(kpis.todayBilled || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Invoices issued today</div>
            <Link
              to="/billing"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-brand-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Generate Invoices</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Invoices
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {kpis.pendingInvoicesCount || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Unpaid or partially settled</div>
            <Link
              to="/billing"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-amber-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Review Dues</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Dues
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
              ₹{(kpis.totalPendingDues || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Requires cashier collection</div>
            <Link
              to="/billing"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-rose-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Collect Outstanding</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Payment Modes Ribbon */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Today's Collections by Payment Method
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center space-x-3">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <Banknote className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Cash Desk</span>
              <span className="text-base font-extrabold text-emerald-900">
                ₹{(collectionsByMethod.CASH || 0).toFixed(2)}
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
                ₹{(collectionsByMethod.UPI || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-center space-x-3">
            <div className="p-2 bg-purple-600 text-white rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Cards (POS)</span>
              <span className="text-base font-extrabold text-purple-900">
                ₹{(collectionsByMethod.CARD || 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-700 block">Net Banking</span>
              <span className="text-base font-extrabold text-indigo-900">
                ₹{(collectionsByMethod.ONLINE || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Invoices Table & Fast Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Unpaid Invoices Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">Pending Invoices for Clearance</h3>
            </div>
            <Link to="/billing" className="text-xs font-bold text-brand-600 hover:underline">
              All Invoices →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Invoice #</th>
                  <th className="px-4 py-2.5">Patient</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5 text-right">Balance Due</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUnpaidInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                      All invoices are cleared and paid!
                    </td>
                  </tr>
                ) : (
                  recentUnpaidInvoices.map((inv) => {
                    const balance = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/75">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{inv.patient?.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{inv.patient?.uhid}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          ₹{(inv.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600">
                          ₹{balance.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to="/billing"
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            Collect
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Fast Cashier Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cash Desk Shortcuts
            </h3>

            <div className="space-y-2">
              <Link
                to="/billing"
                className="w-full flex items-center justify-between p-3 bg-brand-50/50 hover:bg-brand-50 border border-brand-200 rounded-xl text-xs font-bold text-brand-800 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Plus className="w-4 h-4 text-brand-600" />
                  <span>Generate New Invoice</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-500" />
              </Link>

              <Link
                to="/billing"
                className="w-full flex items-center justify-between p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Record Cash / Digital Inflow</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
