import React from 'react';
import { Stethoscope, Download, CheckCircle2, Calendar, Clock, IndianRupee } from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';

export default function DoctorWorkloadTab({ data }) {
  const workload = data?.workload || [];

  const handleExport = () => {
    const rows = workload.map((doc) => ({
      'Doctor Name': doc.doctorName || '',
      'Department': doc.department || '',
      'Specialization': doc.specialization || '',
      'Consultation Fee (INR)': doc.consultationFee || 0,
      'Status': doc.status || '',
      'Appointments Scheduled': doc.appointmentsScheduled,
      'Appointments Completed': doc.appointmentsCompleted,
      'Appointments Cancelled': doc.appointmentsCancelled,
      'Tokens Issued': doc.tokensIssued,
      'Tokens Completed': doc.tokensCompleted,
      'Tokens Skipped': doc.tokensSkipped,
      'Consultations Logged': doc.consultationsCount,
      'Estimated Revenue (INR)': doc.estimatedRevenue,
    }));
    exportToCsv('Adyapan_Doctor_Workload_Report', rows);
  };

  const totalAppts = workload.reduce((acc, d) => acc + d.appointmentsScheduled, 0);
  const totalCompleted = workload.reduce((acc, d) => acc + d.appointmentsCompleted, 0);
  const totalTokens = workload.reduce((acc, d) => acc + d.tokensIssued, 0);
  const totalEstimatedRev = workload.reduce((acc, d) => acc + d.estimatedRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Top Clinical Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Doctors Evaluated
          </span>
          <span className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 block">
            {workload.length}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Active medical specialists</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Completed Visits
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1 block">
            {totalCompleted}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Out of {totalAppts} total scheduled
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Total Queue Tokens
          </span>
          <span className="text-2xl font-extrabold text-amber-600 tracking-tight mt-1 block">
            {totalTokens}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Tokens served across OPDs</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
            Consultation Revenue
          </span>
          <span className="text-2xl font-extrabold text-brand-600 tracking-tight mt-1 block">
            ₹{totalEstimatedRev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Physician fee generation</span>
        </div>
      </div>

      {/* Doctor Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Physician Workload & Productivity</h3>
            <p className="text-[11px] text-slate-500">
              Comparative consultation rates and patient throughput
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
                <th className="px-4 py-2.5">Doctor & Dept</th>
                <th className="px-4 py-2.5">Specialization</th>
                <th className="px-4 py-2.5 text-center">Appts Scheduled</th>
                <th className="px-4 py-2.5 text-center">Completed</th>
                <th className="px-4 py-2.5 text-center">Tokens Issued</th>
                <th className="px-4 py-2.5 text-center">Tokens Cleared</th>
                <th className="px-4 py-2.5 text-right">Fee</th>
                <th className="px-4 py-2.5 text-right">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workload.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    No doctor workload data found in selected date range.
                  </td>
                </tr>
              ) : (
                workload.map((doc) => (
                  <tr key={doc.doctorId} className="hover:bg-slate-50/75">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{doc.doctorName}</div>
                      <div className="text-[10px] text-slate-500">{doc.department}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{doc.specialization}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {doc.appointmentsScheduled}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-emerald-700">
                      {doc.appointmentsCompleted}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{doc.tokensIssued}</td>
                    <td className="px-4 py-3 text-center font-bold text-brand-700">
                      {doc.tokensCompleted}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ₹{(doc.consultationFee || 0).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      ₹{doc.estimatedRevenue.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
