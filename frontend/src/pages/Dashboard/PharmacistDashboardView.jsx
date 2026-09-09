import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Banknote,
  ArrowRight,
  Plus,
  Layers,
  Calendar,
} from 'lucide-react';

export default function PharmacistDashboardView({ stats }) {
  const kpis = stats?.kpis || {};
  const pendingPrescriptions = stats?.pendingPrescriptions || [];
  const recentDispenses = stats?.recentDispenses || [];
  const expiringBatches = stats?.expiringBatches || [];

  return (
    <div className="space-y-6">
      {/* 4 Pharmacy Operational KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Pending Prescriptions
            </span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
              {kpis.pendingPrescriptionsCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">Waiting for fulfillment</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Pill className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Dispenses Today
            </span>
            <span className="text-2xl font-extrabold text-brand-600 mt-1 block">
              {kpis.todayDispensesCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">Medications dispensed</span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Today's Dispense Value
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              ₹{(kpis.todayDispenseRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-400">Pharmacy counter sales</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Inventory Warnings
            </span>
            <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
              {(kpis.lowStockCount || 0) + (kpis.expiringBatchesCount || 0)}
            </span>
            <span className="text-[11px] text-slate-400">Low stock & expiring soon</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Prescriptions Queue & Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Pending Prescriptions Queue */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Pill className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">Prescription Dispense Queue</h3>
            </div>
            <Link to="/pharmacy" className="text-xs font-bold text-brand-600 hover:underline">
              Open Pharmacy Desk →
            </Link>
          </div>

          <div className="p-4 divide-y divide-slate-100 overflow-y-auto max-h-96">
            {pendingPrescriptions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No pending prescriptions in queue.</p>
              </div>
            ) : (
              pendingPrescriptions.map((rx) => (
                <div key={rx.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-1 bg-brand-50 text-brand-800 font-mono font-bold text-xs rounded-lg border border-brand-200">
                      {rx.prescriptionCode}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rx.patient?.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        UHID: {rx.patient?.uhid} • Dr. {rx.doctor?.user?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      {rx.items?.length || 0} drug(s)
                    </span>
                    <Link
                      to="/pharmacy"
                      className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                      Dispense
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Inventory Alerts & Fast Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span>Expiring Batches (30 Days)</span>
              <span className="text-rose-600">{expiringBatches.length}</span>
            </h3>

            {expiringBatches.length === 0 ? (
              <p className="text-xs text-slate-400">No batches expiring within 30 days.</p>
            ) : (
              <div className="space-y-2">
                {expiringBatches.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-rose-900">{b.medicine?.name}</p>
                      <p className="text-[10px] text-rose-700 font-mono">
                        Batch: {b.batchNumber} • Qty: {b.quantity}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-rose-800">
                      {new Date(b.expiryDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Pharmacy Controls
            </h3>
            <Link
              to="/pharmacy"
              className="w-full flex items-center justify-between p-2.5 bg-brand-50/50 hover:bg-brand-50 border border-brand-200 rounded-xl text-xs font-bold text-brand-800 transition-colors"
            >
              <span>Inventory Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-500" />
            </Link>
            <Link
              to="/prescriptions"
              className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
            >
              <span>All Prescriptions</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
