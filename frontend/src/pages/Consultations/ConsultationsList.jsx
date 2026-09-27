import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Stethoscope,
  Calendar,
  CheckCircle2,
  Clock,
  User,
  Activity,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import ConsultationWorkstationModal from './ConsultationWorkstationModal';

export default function ConsultationsList() {
  const [consultations, setConsultations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');

  // Active Workstation Modal
  const [activeConsultationId, setActiveConsultationId] = useState(null);

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let url = `/consultations?page=${page}&limit=20&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (doctorFilter) url += `&doctorId=${doctorFilter}`;
      if (date) url += `&date=${date}`;

      const res = await api.get(url);
      const resData = res.data || res;
      const consultList = Array.isArray(resData)
        ? resData
        : Array.isArray(resData?.consultations)
        ? resData.consultations
        : Array.isArray(resData?.data)
        ? resData.data
        : [];
      setConsultations(consultList);
      setTotal(resData?.total || resData?.pagination?.total || consultList.length || 0);

      if (doctors.length === 0) {
        const docRes = await api.get('/doctors');
        const docData = docRes.data || docRes;
        const docList = Array.isArray(docData)
          ? docData
          : Array.isArray(docData?.doctors)
          ? docData.doctors
          : [];
        setDoctors(docList);
      }
    } catch (err) {
      console.error('Failed to load consultations:', err);
      setError(err.response?.data?.message || 'Failed to fetch clinical consultations');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, doctorFilter, search, date, doctors.length]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Clinical Documentation</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Doctor Consultations & Clinical Visits
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Longitudinal patient consultation records, clinical diagnoses, symptoms, vitals, and medical advice.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchConsultations}
            disabled={loading}
            className="inline-flex items-center px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, UHID, symptoms, or clinical diagnosis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.user?.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Consultations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Consultation Records ({total})
          </h3>
          <span className="text-xs text-slate-500">Page {page}</span>
        </div>

        {consultations.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700">No consultation records found</div>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Start consultations from the Live Calling Desk to generate clinical records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Patient Demographics</th>
                  <th className="py-3.5 px-4">Physician & Clinic</th>
                  <th className="py-3.5 px-4">Clinical Diagnosis</th>
                  <th className="py-3.5 px-4">Presenting Symptoms</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consultations.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono">
                      <div>{new Date(c.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{c.patient?.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        UHID: {c.patient?.uhid}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{c.doctor?.user?.name}</div>
                      <div className="text-[11px] text-slate-500">{c.doctor?.department?.name}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-brand-700">
                        {c.diagnosis || <span className="text-slate-400 font-normal italic">Provisional / In Progress</span>}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      {c.symptoms || 'General Check-Up'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] border font-semibold ${
                        c.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setActiveConsultationId(c.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <span>Open Workstation</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Workstation Modal */}
      {activeConsultationId && (
        <ConsultationWorkstationModal
          consultationId={activeConsultationId}
          onClose={() => setActiveConsultationId(null)}
          onComplete={() => {
            setActiveConsultationId(null);
            fetchConsultations();
          }}
        />
      )}
    </div>
  );
}
