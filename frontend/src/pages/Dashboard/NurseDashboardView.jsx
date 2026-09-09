import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  Clock,
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  ShieldAlert,
  User,
} from 'lucide-react';

export default function NurseDashboardView({ stats }) {
  const kpis = stats?.kpis || {};
  const emergencyTokens = stats?.emergencyTokens || [];
  const priorityTokens = stats?.priorityTokens || [];
  const waitingTokens = stats?.waitingTokens || [];
  const activeDoctors = stats?.activeDoctors || [];

  return (
    <div className="space-y-6">
      {/* Emergency Alert Banner (if any emergency cases) */}
      {emergencyTokens.length > 0 && (
        <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600 text-white rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                CRITICAL TRIAGE ALERT: {emergencyTokens.length} Emergency Patient(s) in Waiting Area
              </h3>
              <p className="text-xs text-rose-700">
                Immediate clinical assessment and doctor notification required.
              </p>
            </div>
          </div>
          <Link
            to="/queue"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
          >
            Direct to Doctor Now
          </Link>
        </div>
      )}

      {/* 4 Nursing KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Waiting in Queue
            </span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
              {kpis.waitingQueueCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">Needing vitals & triage</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Emergency Priority
            </span>
            <span className="text-2xl font-extrabold text-rose-600 mt-1 block">
              {kpis.emergencyCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">Immediate care flag</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Priority Triage
            </span>
            <span className="text-2xl font-extrabold text-brand-600 mt-1 block">
              {kpis.priorityCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">Elderly / pediatric priority</span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              In Consultation
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              {kpis.inConsultationCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">Currently with doctors</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <HeartPulse className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Waiting Triage Patients & Active Doctors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Waiting Patients Triage Board */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <HeartPulse className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">Waiting Patients Triage Queue</h3>
            </div>
            <Link to="/queue" className="text-xs font-bold text-brand-600 hover:underline">
              Live Queue Desk →
            </Link>
          </div>

          <div className="p-4 divide-y divide-slate-100 overflow-y-auto max-h-96">
            {waitingTokens.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">Triage area is clear. No waiting patients.</p>
              </div>
            ) : (
              waitingTokens.map((t) => (
                <div key={t.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-mono font-bold flex items-center justify-center text-xs border border-slate-200">
                      T-{String(t.tokenNumber).padStart(3, '0')}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t.patient?.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        UHID: {t.patient?.uhid} • Dr. {t.doctor?.user?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.tokenType === 'EMERGENCY'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : t.tokenType === 'PRIORITY'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.tokenType}
                    </span>
                    <Link
                      to="/consultations"
                      className="px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      Enter Vitals
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Doctors On Duty */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-800">Doctors on Duty</h3>
          </div>

          <div className="space-y-2.5">
            {activeDoctors.map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{doc.user?.name}</p>
                  <p className="text-[11px] text-slate-500">{doc.department?.name}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    doc.status === 'AVAILABLE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
