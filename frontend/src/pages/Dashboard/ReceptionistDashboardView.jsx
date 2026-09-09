import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  Calendar,
  Ticket,
  Plus,
  Tv,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Building2,
  UserCheck,
} from 'lucide-react';

export default function ReceptionistDashboardView({ stats }) {
  const [activeListTab, setActiveListTab] = React.useState('waiting'); // 'waiting' | 'recent'

  const kpis = stats?.kpis || {};
  const tokenTypeBreakdown = stats?.tokenTypeBreakdown || {};
  const recentArrivals = stats?.recentArrivals || [];
  const waitingPatients = stats?.waitingPatients || [];
  const doctorQueues = stats?.doctorQueues || [];
  const waitingCount = kpis.todayWaitingCount ?? waitingPatients.length;

  return (
    <div className="space-y-6">
      {/* Top 5 Front Desk KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Today's Registrations */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              New Registrations
            </span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpis.todayRegistrations || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Walk-ins intake today</div>
            <Link
              to="/patients/new"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-brand-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>+ Register Patient</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Tokens Issued Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tokens Issued
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {kpis.todayTokensIssued || 0}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
              <span>{tokenTypeBreakdown.NORMAL || 0} normal</span>
              <span>•</span>
              <span className="text-rose-600 font-bold">{tokenTypeBreakdown.EMERGENCY || 0} emergency</span>
            </div>
            <Link
              to="/tokens"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-amber-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Issue Digital Pass</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Waiting in Lounge (NEW PROMINENT KPI) */}
        <div className="bg-white rounded-2xl p-5 border-2 border-amber-300 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-amber-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Waiting in Lounge
            </span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-700 tracking-tight">
              {waitingCount}
            </div>
            <div className="text-[11px] text-amber-800/80 mt-1 font-medium">
              Patients seated in waiting area
            </div>
            <button
              onClick={() => setActiveListTab('waiting')}
              className="mt-3 pt-2 border-t border-amber-200 text-xs text-amber-800 font-bold flex items-center gap-1 hover:underline w-full text-left"
            >
              <span>View Waiting List</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Appointments Scheduled */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Appointments
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">
              {kpis.todayScheduledAppointments || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {kpis.checkedInCount || 0} arrived & checked in
            </div>
            <Link
              to="/appointments"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Check-in Appointments</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Public Waiting Display */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Waiting Area TV
              </span>
              <div className="p-2 bg-slate-800 text-brand-400 rounded-xl">
                <Tv className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm font-bold text-white mt-2">Public Queue Monitor</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Masked patient feed & voice TTS</p>
          </div>
          <Link
            to="/queue/tv"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center space-x-1 text-xs font-bold text-brand-300 hover:text-brand-200"
          >
            <span>Open Display Screen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Grid: Doctor Queue Balancer & Live Lounge Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Doctor Queue Balancer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-800">Doctor Queue Load Balancer</h3>
              </div>
              <span className="text-xs text-slate-400">Live active tokens per doctor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctorQueues.map((doc) => (
                <div
                  key={doc.doctorId}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{doc.doctorName}</p>
                      <p className="text-[11px] text-slate-500">{doc.department}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doc.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Now Serving
                      </span>
                      <span className="font-mono font-bold text-brand-700">
                        {doc.servingTokenNumber}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Waiting in Line
                      </span>
                      <span className="font-bold text-amber-600">{doc.waitingCount} patients</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Dual Table: Waiting in Lounge OR Recent Arrivals */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveListTab('waiting')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeListTab === 'waiting'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Waiting in Lounge ({waitingPatients.length})</span>
                </button>
                <button
                  onClick={() => setActiveListTab('recent')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeListTab === 'recent'
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Recent Arrivals ({recentArrivals.length})</span>
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <Link to="/tokens" className="text-xs font-bold text-brand-600 hover:underline">
                  Manage Queue & Tokens →
                </Link>
              </div>
            </div>

            {/* TAB 1: Live Waiting in Lounge */}
            {activeListTab === 'waiting' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Token #</th>
                      <th className="px-4 py-2.5">Patient Details</th>
                      <th className="px-4 py-2.5">Assigned Doctor</th>
                      <th className="px-4 py-2.5 text-center">Priority</th>
                      <th className="px-4 py-2.5 text-center">Issued At</th>
                      <th className="px-4 py-2.5 text-right">Quick Desk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {waitingPatients.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                          <div className="font-semibold text-slate-600">No patients currently waiting in lounge.</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">All issued tokens have been called or completed.</div>
                        </td>
                      </tr>
                    ) : (
                      waitingPatients.map((t) => (
                        <tr key={t.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-mono font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-xs">
                              {t.formattedToken || `T-${String(t.tokenNumber).padStart(3, '0')}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{t.patient?.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {t.patient?.uhid} {t.patient?.phone ? `• ${t.patient.phone}` : ''}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">{t.doctor?.user?.name || 'General Doctor'}</div>
                            <div className="text-[10px] text-slate-500">{t.department?.name || 'OPD'}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.tokenType === 'EMERGENCY'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : t.tokenType === 'PRIORITY'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {t.tokenType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500 font-mono text-[11px]">
                            {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              to="/queue"
                              className="inline-flex items-center px-2.5 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-[11px] font-bold transition-colors"
                            >
                              Live Queue
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Recent Arrivals */}
            {activeListTab === 'recent' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Token</th>
                      <th className="px-4 py-2.5">Patient</th>
                      <th className="px-4 py-2.5">Doctor</th>
                      <th className="px-4 py-2.5 text-center">Type</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentArrivals.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                          No tokens issued today yet.
                        </td>
                      </tr>
                    ) : (
                      recentArrivals.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/75">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            T-{String(t.tokenNumber).padStart(3, '0')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{t.patient?.fullName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{t.patient?.uhid}</div>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">{t.doctor?.user?.name}</td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.tokenType === 'EMERGENCY'
                                  ? 'bg-rose-100 text-rose-800'
                                  : t.tokenType === 'PRIORITY'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {t.tokenType}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Fast Receptionist Tasks */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Front Desk Tasks
            </h3>

            <div className="space-y-2">
              <Link
                to="/patients/new"
                className="w-full flex items-center justify-between p-3 bg-brand-50/50 hover:bg-brand-50 border border-brand-200 rounded-xl text-xs font-bold text-brand-800 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Plus className="w-4 h-4 text-brand-600" />
                  <span>Register Walk-in Patient</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-brand-500" />
              </Link>

              <Link
                to="/tokens"
                className="w-full flex items-center justify-between p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Ticket className="w-4 h-4 text-amber-600" />
                  <span>Issue Walk-in Token</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
              </Link>

              <Link
                to="/appointments"
                className="w-full flex items-center justify-between p-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-800 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <span>Book / Check-in Slots</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
              </Link>

              <Link
                to="/billing"
                className="w-full flex items-center justify-between p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Cashier Counter</span>
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
