import React from 'react';
import { Package, Pill, Download, AlertTriangle, CheckCircle2, Banknote } from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';

export default function PharmacyReportTab({ data }) {
  const summary = data?.summary || {};
  const topMeds = data?.topDispensedMedicines || [];
  const lowStock = data?.lowStockList || [];

  const handleExport = () => {
    const rows = topMeds.map((m) => ({
      'Medicine Name': m.name,
      'Generic Formula': m.genericName || '',
      'Unit': m.unit || '',
      'Units Dispensed': m.unitsDispensed,
      'Total Sales (INR)': m.totalSales,
    }));
    exportToCsv('Adyapan_Pharmacy_Dispense_Report', rows);
  };

  return (
    <div className="space-y-6">
      {/* 4 Pharmacy KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Prescriptions Fulfilled
          </span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 block">
            {summary.dispensesCount || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Completed dispenses</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Medication Units Dispensed
          </span>
          <span className="text-2xl font-extrabold text-brand-600 tracking-tight mt-1 block">
            {summary.totalUnitsDispensed || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Tablets, syrups & vials</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Total Pharmacy Revenue
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1 block">
            ₹{(summary.totalPharmacyRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Counter dispense sales</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Low Stock Alerts
          </span>
          <span className="text-2xl font-extrabold text-rose-600 tracking-tight mt-1 block">
            {summary.lowStockMedicinesCount || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Formulations below threshold</span>
        </div>
      </div>

      {/* Main Grid: Top Dispensed & Low Stock Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Top Dispensed Drugs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Top Dispensed Medications</h3>
              <p className="text-[11px] text-slate-500">Highest volume prescriptions fulfilled</p>
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
                  <th className="px-4 py-2.5">Medicine Name</th>
                  <th className="px-4 py-2.5">Generic Formula</th>
                  <th className="px-4 py-2.5 text-center">Units Dispensed</th>
                  <th className="px-4 py-2.5 text-right">Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topMeds.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-400">
                      No dispense activity logged in this period.
                    </td>
                  </tr>
                ) : (
                  topMeds.map((m) => (
                    <tr key={m.medicineId} className="hover:bg-slate-50/75">
                      <td className="px-4 py-3 font-bold text-slate-900">{m.name}</td>
                      <td className="px-4 py-3 text-slate-500">{m.genericName || '-'}</td>
                      <td className="px-4 py-3 text-center font-bold text-brand-700">
                        {m.unitsDispensed} {m.unit || 'units'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        ₹{(m.totalSales || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Low Stock Critical Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-800">Critical Low Stock Alerts</h3>
          </div>

          {lowStock.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1" />
              <p className="text-xs font-semibold text-emerald-800">All inventory adequately stocked</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStock.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-rose-900">{item.name}</p>
                    <p className="text-[10px] text-rose-700">Min Alert: {item.minStockAlert}</p>
                  </div>
                  <span className="font-bold font-mono px-2 py-1 bg-rose-200 text-rose-900 rounded-lg text-xs">
                    {item.currentStock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
