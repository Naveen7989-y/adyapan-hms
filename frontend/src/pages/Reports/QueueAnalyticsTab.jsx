import React from 'react';
import { Clock, Ticket, Download, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';

export default function QueueAnalyticsTab({ data }) {
  const summary = data?.summary || {};
  const triage = data?.triageBreakdown || {};
  const status = data?.statusBreakdown || {};
  const hourly = data?.hourlyArrivals || {};

  const handleExport = () => {
    const rows = Object.entries(hourly).map(([time, count]) => ({
      'Time Hour': time,
      'Arrivals Count': count,
      'Normal Triage Total': triage.NORMAL || 0,
      'Priority Triage Total': triage.PRIORITY || 0,
      'Emergency Triage Total': triage.EMERGENCY || 0,
      'Completed Count': status.COMPLETED || 0,
      'Skipped Count': status.SKIPPED || 0,
      'Avg Wait Time (Mins)': summary.avgWaitTimeMinutes || 0,
    }));
    exportToCsv('Adyapan_Queue_Analytics_Report', rows);
  };

  const totalTokens = summary.totalTokensIssued || 0;

  return (
    <div className="space-y-6">
      {/* 4 Flow KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Total Tokens Generated
          </span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 block">
            {totalTokens}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Digital queue passes</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Avg Patient Wait Time
          </span>
          <span className="text-2xl font-extrabold text-amber-600 tracking-tight mt-1 block">
            {summary.avgWaitTimeMinutes || 0} mins
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Intake to doctor call</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Queue Clearance Rate
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1 block">
            {summary.completionRate || 0}%
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Completed consultations</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Emergency Cases
          </span>
          <span className="text-2xl font-extrabold text-rose-600 tracking-tight mt-1 block">
            {summary.emergencyCases || 0}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Immediate triage flags</span>
        </div>
      </div>

      {/* Triage Urgency & Queue Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Triage Distribution */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Patient Triage Distribution
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Standard / Normal Triage</span>
                <span className="font-bold text-slate-900">{triage.NORMAL || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-brand-500 h-2.5 rounded-full"
                  style={{ width: `${totalTokens > 0 ? ((triage.NORMAL || 0) / totalTokens) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">Priority Triage (Elderly / Pediatric)</span>
                <span className="font-bold text-amber-900">{triage.PRIORITY || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-2.5 rounded-full"
                  style={{ width: `${totalTokens > 0 ? ((triage.PRIORITY || 0) / totalTokens) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-700">Emergency Red Flag</span>
                <span className="font-bold text-rose-900">{triage.EMERGENCY || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-2.5 rounded-full"
                  style={{ width: `${totalTokens > 0 ? ((triage.EMERGENCY || 0) / totalTokens) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Token Status Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Completed</span>
              <span className="text-xl font-extrabold text-emerald-800">{status.COMPLETED || 0}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Waiting in Line</span>
              <span className="text-xl font-extrabold text-amber-800">{status.WAITING || 0}</span>
            </div>
            <div className="p-3 bg-sky-50 rounded-xl">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">In Room / Called</span>
              <span className="text-xl font-extrabold text-sky-800">
                {(status.CALLED || 0) + (status.IN_CONSULTATION || 0)}
              </span>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Skipped / Absent</span>
              <span className="text-xl font-extrabold text-slate-800">{status.SKIPPED || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Arrival Distribution */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Peak Patient Arrival Hours</h3>
            <p className="text-[11px] text-slate-500">Hourly patient token check-in density</p>
          </div>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-2">
          {Object.entries(hourly).map(([time, count]) => {
            const maxVal = Math.max(1, ...Object.values(hourly));
            const pct = Math.round((count / maxVal) * 100);
            return (
              <div key={time} className="flex flex-col items-center space-y-1">
                <div className="h-24 w-full bg-slate-100 rounded-lg flex items-end justify-center p-1">
                  <div
                    className="w-full bg-brand-600 rounded min-h-[4px] transition-all"
                    style={{ height: `${Math.max(6, pct)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-900">{count}</span>
                <span className="text-[9px] font-mono text-slate-400">{time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
