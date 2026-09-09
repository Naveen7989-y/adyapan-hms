import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  Banknote,
  Stethoscope,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Tv,
  Plus,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';

export default function AdminDashboardView({ stats }) {
  const kpis = stats?.kpis || {};
  const appointmentBreakdown = stats?.appointmentBreakdown || {};
  const tokenBreakdown = stats?.tokenBreakdown || {};
  const recentAppointments = stats?.recentAppointments || [];
  const doctorsList = stats?.doctorsList || [];

  return (
    <div className="space-y-6">
      {/* Top 4 Hospital Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white/90 glass-panel interactive-card rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-brand-400/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Patients
            </span>
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl shadow-xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpis.totalPatients || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Unique UHID records on file</div>
            <Link
              to="/patients"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-brand-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Manage Patients Directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white/90 glass-panel interactive-card rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-indigo-400/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Appointments
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {kpis.todayAppointmentsCount || 0}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
              <span>{appointmentBreakdown.COMPLETED || 0} completed</span>
              <span>•</span>
              <span>{appointmentBreakdown.BOOKED || 0} booked</span>
            </div>
            <Link
              to="/appointments"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>View Appointment Slots</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Active Queue Patients */}
        <div className="bg-white/90 glass-panel interactive-card rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-amber-400/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Queue
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl shadow-xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
              {kpis.activeQueueCount || 0}
            </div>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
              <span>{tokenBreakdown.WAITING || 0} waiting</span>
              <span>•</span>
              <span>{tokenBreakdown.IN_CONSULTATION || 0} inside</span>
            </div>
            <Link
              to="/queue"
              className="mt-3 pt-2 border-t border-slate-100 text-xs text-amber-600 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Live Queue Monitor</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Today's Revenue */}
        <div className="bg-white/90 glass-panel interactive-card rounded-2xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden transition-all duration-300 hover:border-emerald-400/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today's Collections
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shadow-xs">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
              ₹{(kpis.todayCollections || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Billed: ₹{(kpis.todayBilled || 0).toFixed(2)}</span>
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
              <span>Open Cashier Desk</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Today's Appointments & Doctor Roster */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Appointments */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800">Today's Appointment Schedule</h3>
              </div>
              <Link to="/appointments" className="text-xs font-bold text-indigo-600 hover:underline">
                View All →
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Time</th>
                    <th className="px-4 py-2.5">Patient</th>
                    <th className="px-4 py-2.5">Doctor</th>
                    <th className="px-4 py-2.5">Dept</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAppointments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                        No appointments scheduled for today yet.
                      </td>
                    </tr>
                  ) : (
                    recentAppointments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/75">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{a.timeSlot}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{a.patient?.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{a.patient?.uhid}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{a.doctor?.user?.name}</td>
                        <td className="px-4 py-3 text-slate-500">{a.department?.name}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Doctor Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Stethoscope className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-800">Medical Staff Roster</h3>
              </div>
              <Link to="/doctors" className="text-xs font-bold text-brand-600 hover:underline">
                Manage Doctors ({kpis.totalDoctors || 0}) →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctorsList.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                      {doc.user?.name?.replace('Dr. ', '').charAt(0) || 'D'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{doc.user?.name}</p>
                      <p className="text-[11px] text-slate-500">{doc.department?.name}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'BUSY'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Fast Administrative Controls */}
        <div className="space-y-6">
          {/* Quick Operation Launchers */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Operations
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
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Issue Tokens & Check-In</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
              </Link>

              <Link
                to="/billing"
                className="w-full flex items-center justify-between p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Generate Invoice / Payment</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
              </Link>

              <Link
                to="/queue/tv"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <div className="flex items-center space-x-2.5">
                  <Tv className="w-4 h-4 text-brand-400" />
                  <span>Launch Public TV Display</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* System Infrastructure Health */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              System Infrastructure
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Departments Configured</span>
                <span className="font-bold text-slate-900">{kpis.totalDepartments || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Multi-Tenant Isolation</span>
                <span className="font-bold text-emerald-600 font-mono">Active (SaaS)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-600 font-medium">Database Layer</span>
                <span className="font-bold text-slate-900 font-mono">SQLite / PG Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
