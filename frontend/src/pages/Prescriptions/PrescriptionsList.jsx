import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  Printer,
  Pill,
  CheckCircle2,
  Clock,
  User,
  Stethoscope,
  Filter,
  Eye,
  FileDown,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CreatePrescriptionModal from './CreatePrescriptionModal';
import PrescriptionPrintModal from './PrescriptionPrintModal';
import { downloadAuthenticatedFile } from '../../utils/fileDownloader';

export default function PrescriptionsList() {
  const { user } = useAuth();

  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [doctors, setDoctors] = useState([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [printPrescriptionId, setPrintPrescriptionId] = useState(null);

  const handleDownloadPdf = async (prescription) => {
    setDownloadingPdfId(prescription.id);
    try {
      await downloadAuthenticatedFile(
        `/prescriptions/${prescription.id}/pdf`,
        `Prescription-${prescription.prescriptionCode || prescription.id}.pdf`
      );
    } catch (err) {
      alert(`Failed to download prescription PDF: ${err.message}`);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Load doctors for filter
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        const docList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.doctors)
          ? res.data.doctors
          : Array.isArray(res)
          ? res
          : [];
        setDoctors(docList);
      } catch (err) {
        console.error('Failed to load doctors list:', err);
      }
    };
    fetchDoctors();
  }, []);

  // Load prescriptions
  const fetchPrescriptions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedDoctorId) params.doctorId = selectedDoctorId;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await api.get('/prescriptions', { params });
      const rxList = Array.isArray(res.data?.prescriptions)
        ? res.data.prescriptions
        : Array.isArray(res.prescriptions)
        ? res.prescriptions
        : Array.isArray(res.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setPrescriptions(rxList);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  }, [search, selectedDoctorId, statusFilter]);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  // Metrics
  const activeCount = prescriptions.filter((p) => p.status === 'ACTIVE').length;
  const dispensedCount = prescriptions.filter((p) => p.status === 'DISPENSED').length;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>Phase 11 — Electronic Medication Orders</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Digital Prescriptions (Rx)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue, review, and print standardized digital medical prescriptions linked to consultations and the pharmacy catalog.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchPrescriptions}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            Refresh
          </button>

          {['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(user?.role) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Prescription (Rx)
            </button>
          )}
        </div>
      </div>

      {/* 2. Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Total Prescriptions
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{prescriptions.length}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-blue-600 text-xs font-medium flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Active / Pending Dispense
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{activeCount}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-emerald-600 text-xs font-medium flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Dispensed by Pharmacy
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{dispensedCount}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-brand-600 text-xs font-medium flex items-center">
            <Pill className="w-3.5 h-3.5 mr-1" />
            Ready for Phase 12
          </div>
          <div className="text-xs text-slate-500 mt-2 font-medium">
            Pharmacy Inventory Auto-Sync
          </div>
        </div>
      </div>

      {/* 3. Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search RX code, patient name, UHID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="">All Doctors ({doctors.length})</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                Dr. {d.user?.name || 'Doctor'} {d.specialization ? `(${d.specialization})` : ''} {d.department?.name ? `— ${d.department?.name}` : ''}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE (Pending)</option>
            <option value="DISPENSED">DISPENSED</option>
          </select>
        </div>
      </div>

      {/* 4. Prescriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading prescriptions log...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs">{error}</div>
        ) : prescriptions.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No prescriptions found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Prescriptions authored during doctor consultations or issued manually will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">RX Code</th>
                  <th className="py-3.5 px-4">Patient Demographics</th>
                  <th className="py-3.5 px-4">Physician</th>
                  <th className="py-3.5 px-4">Diagnosis / Notes</th>
                  <th className="py-3.5 px-4">Medications Prescribed</th>
                  <th className="py-3.5 px-4">Date Issued</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Slip Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                      {p.prescriptionCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.patient?.fullName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        UHID: {p.patient?.uhid} | {p.patient?.gender}, {p.patient?.age || 'Adult'}y
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{p.doctor?.user?.name}</div>
                      <div className="text-[11px] text-slate-400">{p.doctor?.department?.name}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate">
                      <span className="font-semibold text-slate-800">
                        {p.consultation?.diagnosis || 'General Prescription'}
                      </span>
                      {p.notes && <div className="text-[11px] text-slate-400 truncate">{p.notes}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {p.items?.slice(0, 2).map((it) => (
                          <span
                            key={it.id}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                          >
                            {it.medicine?.name} ({it.dosage})
                          </span>
                        ))}
                        {p.items?.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded text-[10px] font-semibold">
                            +{p.items.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          p.status === 'DISPENSED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDownloadPdf(p)}
                          disabled={downloadingPdfId === p.id}
                          className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
                          title="Download PDF"
                        >
                          {downloadingPdfId === p.id ? (
                            <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mr-1" />
                          ) : (
                            <FileDown className="w-3.5 h-3.5 mr-1 text-brand-600" />
                          )}
                          PDF
                        </button>
                        <button
                          onClick={() => setPrintPrescriptionId(p.id)}
                          className="inline-flex items-center px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1 text-brand-600" />
                          Print Rx
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Author Prescription Modal */}
      {showCreateModal && (
        <CreatePrescriptionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(created) => {
            setShowCreateModal(false);
            fetchPrescriptions();
            setPrintPrescriptionId(created.id);
          }}
        />
      )}

      {/* Print Prescription Slip Modal */}
      {printPrescriptionId && (
        <PrescriptionPrintModal
          prescriptionId={printPrescriptionId}
          onClose={() => setPrintPrescriptionId(null)}
        />
      )}
    </div>
  );
}
