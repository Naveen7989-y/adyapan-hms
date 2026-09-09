import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Search,
  AlertCircle,
  AlertTriangle,
  HeartPulse,
  User,
  UserCheck,
  Stethoscope,
  Building2,
  Sparkles,
  Check,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';

export default function WalkInTokenModal({ onClose, onSuccess }) {
  // Mode: 'search' for existing patients, 'quick_register' for direct walk-in registration
  const [patientMode, setPatientMode] = useState('search');

  // Patients state
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Quick new patient state
  const [newPatientData, setNewPatientData] = useState({
    fullName: '',
    phone: '',
    gender: 'MALE',
    age: '',
  });

  // Doctors state
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Token options
  const [tokenType, setTokenType] = useState('NORMAL');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch all doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await api.get('/doctors');
        // Unwrapped response handling: res.data or res
        const docList = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : res.data?.doctors || [];

        setDoctors(docList);
        if (docList.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docList[0].id);
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
  }, []);

  // Search existing patients as user types with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setPatients([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingPatients(true);
      try {
        const res = await api.get(`/patients?search=${encodeURIComponent(searchQuery.trim())}&limit=8`);
        // Extract patients array properly from response
        const list =
          res.data?.patients ||
          res.patients ||
          (Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []);
        setPatients(list);
      } catch (err) {
        console.error('Patient search error:', err);
      } finally {
        setLoadingPatients(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle specialty category filter for doctors
  const filteredDoctors = doctors.filter((doc) => {
    if (selectedSpecialty === 'ALL') return true;
    const spec = (doc.specialization || '').toLowerCase();
    const dept = (doc.department?.name || doc.department?.code || '').toLowerCase();
    const target = selectedSpecialty.toLowerCase();
    return spec.includes(target) || dept.includes(target);
  });

  // Assign doctor room helper
  const getDoctorRoom = (doc) => {
    const code = (doc.department?.code || doc.department?.name || '').toUpperCase();
    if (code.includes('CARD')) return 'Room 102';
    if (code.includes('PED')) return 'Room 103';
    if (code.includes('ORTH')) return 'Room 104';
    if (code.includes('DENT')) return 'Room 105';
    if (code.includes('NEU')) return 'Room 106';
    return 'Room 101';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let targetPatientId = selectedPatient?.id;

    // If in quick registration mode, register the patient first
    if (patientMode === 'quick_register') {
      if (!newPatientData.fullName.trim() || !newPatientData.phone.trim()) {
        setError('Please enter patient full name and contact phone number');
        return;
      }

      setSubmitting(true);
      try {
        const regRes = await api.post('/patients/quick', {
          fullName: newPatientData.fullName.trim(),
          phone: newPatientData.phone.trim(),
          gender: newPatientData.gender,
          age: newPatientData.age ? parseInt(newPatientData.age, 10) : undefined,
          reuseExistingIfFound: true,
        });

        const createdPatient = regRes.data?.patient || regRes.patient || regRes.data;
        if (!createdPatient?.id) {
          throw new Error('Failed to register walk-in patient profile');
        }
        targetPatientId = createdPatient.id;
      } catch (err) {
        setError(err.message || 'Quick patient registration failed');
        setSubmitting(false);
        return;
      }
    } else {
      if (!selectedPatient) {
        setError('Please search and select an existing patient, or switch to Quick New Walk-In');
        return;
      }
    }

    if (!selectedDoctorId) {
      setError('Please assign a consultation doctor');
      setSubmitting(false);
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post('/tokens/walk-in', {
        patientId: targetPatientId,
        doctorId: selectedDoctorId,
        tokenType,
      });

      // Handle unwrap format from api interceptor
      const token = res.data || res;
      if (res.success || token?.id || token?.formattedToken) {
        onSuccess(token);
      } else {
        throw new Error(res.message || 'Token creation returned invalid status');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to issue walk-in token');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-sky-100 text-sky-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Issue Walk-In Queue Token</h3>
              <p className="text-xs text-slate-500">
                Instant OPD check-in & token generation for walk-in arrivals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient Selection Mode Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Patient Identification *
              </label>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setPatientMode('search');
                    setError('');
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    patientMode === 'search'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Search Existing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPatientMode('quick_register');
                    setError('');
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    patientMode === 'quick_register'
                      ? 'bg-white text-sky-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  + New Walk-In
                </button>
              </div>
            </div>

            {/* Mode A: Search Existing Patient */}
            {patientMode === 'search' && (
              <div>
                {selectedPatient ? (
                  <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl flex items-center justify-between shadow-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {selectedPatient.fullName?.[0]?.toUpperCase() || 'P'}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                          <span>{selectedPatient.fullName}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                            {selectedPatient.uhid}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span>Ph: {selectedPatient.phone}</span>
                          {selectedPatient.gender && <span>• {selectedPatient.gender}</span>}
                          {selectedPatient.dateOfBirth && (
                            <span>
                              • {new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()} yrs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setSearchQuery('');
                      }}
                      className="text-xs text-sky-700 hover:text-sky-900 font-semibold px-2.5 py-1 bg-white border border-sky-200 rounded-lg hover:bg-sky-50 shadow-xs"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search by Patient Name, Phone Number, or UHID (e.g. ADY-...)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all font-medium"
                      />
                    </div>

                    {loadingPatients && (
                      <div className="text-xs text-slate-500 py-2.5 px-3 flex items-center space-x-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                        <span>Searching registered patients...</span>
                      </div>
                    )}

                    {/* Results Dropdown */}
                    {patients.length > 0 && !selectedPatient && (
                      <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {patients.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedPatient(p);
                              setSearchQuery('');
                              setPatients([]);
                            }}
                            className="p-3 hover:bg-sky-50/70 cursor-pointer flex items-center justify-between text-xs transition-colors"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                                {p.fullName?.[0]?.toUpperCase() || 'P'}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800">{p.fullName}</div>
                                <div className="text-[11px] text-slate-400 font-mono">
                                  UHID: {p.uhid} | Phone: {p.phone}
                                </div>
                              </div>
                            </div>
                            <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchQuery.trim().length > 1 && !loadingPatients && patients.length === 0 && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
                        <div>
                          <span>No patient matched "</span>
                          <span className="font-semibold">{searchQuery}</span>
                          <span>"</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPatientMode('quick_register');
                            // Pre-fill phone if numeric, otherwise name
                            if (/^\d+$/.test(searchQuery.trim())) {
                              setNewPatientData((prev) => ({ ...prev, phone: searchQuery.trim() }));
                            } else {
                              setNewPatientData((prev) => ({ ...prev, fullName: searchQuery.trim() }));
                            }
                          }}
                          className="font-bold text-amber-900 underline hover:text-amber-950 ml-2"
                        >
                          + Quick Register Walk-In
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mode B: Quick Walk-In Registration Fields */}
            {patientMode === 'quick_register' && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Chandra"
                      value={newPatientData.fullName}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, fullName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 9876543210"
                      value={newPatientData.phone}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Gender
                    </label>
                    <select
                      value={newPatientData.gender}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, gender: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      placeholder="e.g. 42"
                      value={newPatientData.age}
                      onChange={(e) =>
                        setNewPatientData({ ...newPatientData, age: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span>
                    A permanent UHID will be generated and linked to this walk-in token instantly.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Doctor Assigning */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Stethoscope className="w-4 h-4 text-sky-600" />
                <span>2. Assign Consultation Physician *</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Available
              </span>
            </div>

            {/* Quick Specialty Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
              {[
                { id: 'ALL', label: 'All Doctors' },
                { id: 'ortho', label: '🦴 Orthopedic' },
                { id: 'surgeon', label: '🩺 General Surgeon' },
                { id: 'neuro', label: '🧠 Neurologist' },
                { id: 'cardio', label: '❤️ Cardio' },
                { id: 'pediatric', label: '👶 Pediatrics' },
                { id: 'dent', label: '🦷 Dental' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedSpecialty(pill.id)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all border ${
                    selectedSpecialty === pill.id
                      ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {loadingDoctors ? (
              <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-600 mx-auto mb-1" />
                Loading hospital clinical staff...
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="p-3 text-center text-xs text-amber-700 bg-amber-50 rounded-xl border border-amber-200">
                No active doctors found matching "{selectedSpecialty}". Switch filter to "All Doctors".
              </div>
            ) : (
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              >
                <option value="">-- Select Consultation Doctor --</option>
                {filteredDoctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name || 'Physician'} — {d.specialization} ({d.department?.name || 'OPD'}) • {getDoctorRoom(d)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Token Category & Triage Priority */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              3. Triage Category & Queue Priority *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Normal */}
              <label
                className={`cursor-pointer rounded-xl p-3 border text-center transition-all ${
                  tokenType === 'NORMAL'
                    ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="tokenType"
                  value="NORMAL"
                  checked={tokenType === 'NORMAL'}
                  onChange={(e) => setTokenType(e.target.value)}
                  className="sr-only"
                />
                <User className="w-4 h-4 mx-auto mb-1 text-slate-600" />
                <div className="text-xs font-bold text-slate-800">Normal</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Standard Line</div>
              </label>

              {/* Priority */}
              <label
                className={`cursor-pointer rounded-xl p-3 border text-center transition-all ${
                  tokenType === 'PRIORITY'
                    ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="tokenType"
                  value="PRIORITY"
                  checked={tokenType === 'PRIORITY'}
                  onChange={(e) => setTokenType(e.target.value)}
                  className="sr-only"
                />
                <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                <div className="text-xs font-bold text-amber-800">Priority</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Senior / Infant</div>
              </label>

              {/* Emergency */}
              <label
                className={`cursor-pointer rounded-xl p-3 border text-center transition-all ${
                  tokenType === 'EMERGENCY'
                    ? 'border-red-500 bg-red-50/70 ring-2 ring-red-500/20 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="tokenType"
                  value="EMERGENCY"
                  checked={tokenType === 'EMERGENCY'}
                  onChange={(e) => setTokenType(e.target.value)}
                  className="sr-only"
                />
                <HeartPulse className="w-4 h-4 mx-auto mb-1 text-red-600 animate-pulse" />
                <div className="text-xs font-bold text-red-800">Emergency</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Immediate Front</div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
            >
              {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{submitting ? 'Generating Walk-In Token...' : 'Issue Digital Token & Pass'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
