import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  User,
  Pill,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const COMMON_DOSAGES = ['500mg', '650mg', '250mg', '100mg', '10mg', '5mg', '1 tablet', '1 capsule', '5ml', '10ml'];
const FREQUENCIES = [
  { label: '1-0-1 (Twice daily)', val: '1-0-1' },
  { label: '1-1-1 (Thrice daily)', val: '1-1-1' },
  { label: '1-0-0 (Morning only)', val: '1-0-0' },
  { label: '0-0-1 (Night only)', val: '0-0-1' },
  { label: 'SOS (As needed)', val: 'SOS' },
  { label: 'Once Daily', val: 'Once daily' },
];
const DURATIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month'];
const INSTRUCTIONS = ['After food', 'Before food', 'With warm water', 'At bedtime', 'Empty stomach'];

export default function CreatePrescriptionModal({ patientId, doctorId, consultationId, onClose, onSuccess }) {
  const { user } = useAuth();

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [preselectedPatient, setPreselectedPatient] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctorId || '');

  // Medicine catalog for autocomplete
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Items list
  const [items, setItems] = useState([
    {
      medicineId: '',
      medicineName: '',
      dosage: '500mg',
      frequency: '1-0-1',
      duration: '5 days',
      instructions: 'After food',
      quantityPrescribed: 10,
      isCustom: false,
    },
  ]);

  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch preselected patient info if patientId provided
  useEffect(() => {
    if (patientId) {
      api.get(`/patients/${patientId}`)
        .then((res) => {
          const pat = res.data?.patient || res.data || res;
          if (pat?.id) setPreselectedPatient(pat);
        })
        .catch(() => {});
    }
  }, [patientId]);

  // Pre-load patients, doctors, and medicines catalog
  useEffect(() => {
    const loadPrereqs = async () => {
      try {
        if (!patientId) {
          const pRes = await api.get('/patients?limit=50');
          const pList = Array.isArray(pRes.data?.patients)
            ? pRes.data.patients
            : Array.isArray(pRes.patients)
            ? pRes.patients
            : Array.isArray(pRes.data)
            ? pRes.data
            : Array.isArray(pRes)
            ? pRes
            : [];
          setPatients(pList);
          if (pList.length > 0 && !selectedPatientId) {
            setSelectedPatientId(pList[0].id);
          }
        }

        const dRes = await api.get('/doctors');
        const dList = Array.isArray(dRes.data)
          ? dRes.data
          : Array.isArray(dRes.data?.doctors)
          ? dRes.data.doctors
          : Array.isArray(dRes)
          ? dRes
          : [];
        setDoctors(dList);

        if (doctorId) {
          setSelectedDoctorId(doctorId);
        } else if (user?.role === 'DOCTOR') {
          const currentDoc = dList.find(
            (d) =>
              d.id === user.doctor?.id ||
              d.userId === user.id ||
              d.user?.id === user.id ||
              d.user?.email === user.email
          );
          if (currentDoc) {
            setSelectedDoctorId(currentDoc.id);
          } else if (user.doctor?.id) {
            setSelectedDoctorId(user.doctor.id);
          } else if (dList.length > 0) {
            setSelectedDoctorId(dList[0].id);
          }
        } else if (dList.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(dList[0].id);
        }

        // Fetch catalog
        setLoadingCatalog(true);
        const medRes = await api.get('/prescriptions/medicines');
        const medList = Array.isArray(medRes.data)
          ? medRes.data
          : Array.isArray(medRes.data?.medicines)
          ? medRes.data.medicines
          : Array.isArray(medRes)
          ? medRes
          : [];
        setCatalog(medList);
      } catch (err) {
        console.error('Failed to load prescription prerequisites:', err);
      } finally {
        setLoadingCatalog(false);
      }
    };
    loadPrereqs();
  }, [patientId, doctorId, user]);

  // Live patient search when user types in search box
  useEffect(() => {
    if (patientId) return;
    if (!patientSearch.trim()) return;

    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await api.get(`/patients?search=${encodeURIComponent(patientSearch.trim())}&limit=20`);
        const list = Array.isArray(res.data?.patients)
          ? res.data.patients
          : Array.isArray(res.patients)
          ? res.patients
          : Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        if (list.length > 0) {
          setPatients(list);
          if (!list.some((p) => p.id === selectedPatientId)) {
            setSelectedPatientId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Patient search error:', err);
      } finally {
        setSearchingPatients(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [patientSearch, patientId, selectedPatientId]);

  // Calculate quantity helper
  const calcQty = (freq, dur) => {
    let daily = 1;
    if (freq && freq.includes('-')) {
      daily = freq.split('-').reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0) || 1;
    } else if (/once/i.test(freq)) {
      daily = 1;
    } else if (/twice/i.test(freq)) {
      daily = 2;
    } else if (/thrice/i.test(freq)) {
      daily = 3;
    }
    let days = 1;
    const m = dur?.match(/(\d+)/);
    if (m) {
      days = parseInt(m[1], 10) || 1;
      if (/month/i.test(dur)) days *= 30;
      if (/week/i.test(dur)) days *= 7;
    }
    return Math.max(1, daily * days);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];

    if (field === 'medicineId') {
      if (value === '__CUSTOM__') {
        updated[index].medicineId = '';
        updated[index].isCustom = true;
      } else {
        updated[index].medicineId = value;
        updated[index].isCustom = false;
        const selectedMed = catalog.find((m) => m.id === value);
        if (selectedMed) {
          updated[index].medicineName = selectedMed.name;
        }
      }
    } else {
      updated[index][field] = value;
    }

    // Auto-update quantity if frequency or duration change
    if (field === 'frequency' || field === 'duration') {
      updated[index].quantityPrescribed = calcQty(
        field === 'frequency' ? value : updated[index].frequency,
        field === 'duration' ? value : updated[index].duration
      );
    }

    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        medicineId: '',
        medicineName: '',
        dosage: '500mg',
        frequency: '1-0-1',
        duration: '5 days',
        instructions: 'After food',
        quantityPrescribed: 10,
        isCustom: false,
      },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!selectedPatientId) {
      setError('Please select a patient for this prescription');
      return;
    }
    if (!selectedDoctorId) {
      setError('Please select the prescribing physician');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.medicineId && !it.medicineName?.trim()) {
        setError(`Item #${i + 1}: Please select a medicine from catalog or enter a medicine name`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatientId,
        doctorId: selectedDoctorId,
        consultationId: consultationId || undefined,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({
          medicineId: it.medicineId && it.medicineId !== '__CUSTOM__' ? it.medicineId : undefined,
          medicineName: it.medicineId && it.medicineId !== '__CUSTOM__' ? undefined : it.medicineName?.trim(),
          dosage: it.dosage?.trim() || 'As directed',
          frequency: it.frequency?.trim() || '1-0-1',
          duration: it.duration?.trim() || '5 days',
          instructions: it.instructions?.trim() || 'After food',
          quantityPrescribed: parseInt(it.quantityPrescribed, 10) || 1,
        })),
      };

      const res = await api.post('/prescriptions', payload);
      const resData = res.data || res;
      if (res.success || resData?.id || resData?.prescriptionCode) {
        if (onSuccess) onSuccess(resData?.id ? resData : res);
        onClose();
      } else {
        setError(res.message || 'Failed to issue prescription');
      }
    } catch (err) {
      console.error('Prescription submission failed:', err);
      setError(err.response?.data?.message || err.message || 'Failed to issue prescription');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientObj =
    preselectedPatient || patients.find((p) => p.id === selectedPatientId);
  const selectedDoctorObj = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Author Digital Prescription (Rx)</h2>
              <p className="text-xs text-slate-500">Issue official medication order linked to patient electronic medical record</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Patient & Doctor Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {/* Patient Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-brand-600" />
                  Patient *
                </span>
                {!patientId && (
                  <span className="text-[11px] font-normal text-slate-500 lowercase">
                    {patients.length} loaded
                  </span>
                )}
              </label>

              {patientId ? (
                <div className="p-3 bg-white border border-brand-200 rounded-xl shadow-xs">
                  <div className="text-xs font-bold text-slate-900">
                    {selectedPatientObj?.fullName || 'Pre-selected Patient Encounter'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-2">
                    {selectedPatientObj?.uhid && (
                      <span className="font-mono text-brand-700 font-semibold">{selectedPatientObj.uhid}</span>
                    )}
                    {selectedPatientObj?.phone && <span>• {selectedPatientObj.phone}</span>}
                    {selectedPatientObj?.gender && <span>• {selectedPatientObj.gender}</span>}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search patient by name, UHID, or phone..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                      className="w-full pl-8 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-brand-500/20"
                    />
                    {searchingPatients && (
                      <div className="absolute right-3 top-2.5 w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.uhid}) {p.phone ? `— ${p.phone}` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedPatientObj && (
                    <div className="p-2 bg-brand-50/70 border border-brand-200/70 rounded-lg text-[11px] text-brand-900 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold">{selectedPatientObj.fullName}</span>
                        <span className="text-brand-600 font-mono">({selectedPatientObj.uhid})</span>
                      </div>
                      {selectedPatientObj.phone && (
                        <span className="text-slate-600 font-medium">{selectedPatientObj.phone}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Doctor Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center">
                  <Stethoscope className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Prescribing Physician *
                </span>
                <span className="text-[11px] font-normal text-slate-500 lowercase">
                  {doctors.length} doctors
                </span>
              </label>

              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">-- Select Prescribing Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user?.name || 'Doctor'} {d.specialization ? `(${d.specialization})` : ''} {d.department?.name ? `— ${d.department?.name}` : ''}
                  </option>
                ))}
              </select>

              {selectedDoctorObj && (
                <div className="mt-2 p-2 bg-emerald-50/70 border border-emerald-200/70 rounded-lg text-[11px] text-emerald-900 flex items-center space-x-1.5">
                  <span className="font-bold">Dr. {selectedDoctorObj.user?.name}</span>
                  <span className="text-emerald-700">
                    • {selectedDoctorObj.specialization || selectedDoctorObj.department?.name || 'Physician'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Medication Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center">
                <Pill className="w-4 h-4 mr-1.5 text-brand-600" />
                Prescription Items (Medications)
                {catalog.length > 0 && (
                  <span className="ml-2 text-[11px] font-normal text-slate-500 normal-case">
                    ({catalog.length} formulary drugs available)
                  </span>
                )}
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-lg text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 relative group hover:border-brand-300 transition-colors"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-brand-700 font-mono flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-brand-500" />
                      Medication #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Medicine Catalog Picker or Custom Name */}
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Select / Enter Medicine *
                      </label>
                      <select
                        value={item.isCustom ? '__CUSTOM__' : item.medicineId}
                        onChange={(e) => handleItemChange(idx, 'medicineId', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                      >
                        <option value="">-- Choose from Catalog ({catalog.length}) --</option>
                        {catalog.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.category?.name ? `(${m.category.name})` : ''} {m.unit ? `• ${m.unit}` : ''}
                          </option>
                        ))}
                        <option value="__CUSTOM__">-- Custom / Other Medicine (Type Name) --</option>
                      </select>

                      {(!item.medicineId || item.isCustom) && (
                        <input
                          type="text"
                          placeholder="Or type medicine name (e.g. Paracetamol 650mg)..."
                          value={item.medicineName}
                          onChange={(e) => handleItemChange(idx, 'medicineName', e.target.value)}
                          className="mt-1.5 w-full px-3 py-1.5 bg-slate-50 border border-brand-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500/20"
                        />
                      )}
                    </div>

                    {/* Dosage & Frequency */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dosage</label>
                        <input
                          type="text"
                          list={`dosages-${idx}`}
                          value={item.dosage}
                          onChange={(e) => handleItemChange(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 500mg"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                        <datalist id={`dosages-${idx}`}>
                          {COMMON_DOSAGES.map((d) => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Frequency</label>
                        <select
                          value={item.frequency}
                          onChange={(e) => handleItemChange(idx, 'frequency', e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        >
                          {FREQUENCIES.map((f) => (
                            <option key={f.val} value={f.val}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Duration, Instructions & Qty */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration</label>
                        <input
                          type="text"
                          list={`durations-${idx}`}
                          value={item.duration}
                          onChange={(e) => handleItemChange(idx, 'duration', e.target.value)}
                          placeholder="e.g. 5 days"
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                        <datalist id={`durations-${idx}`}>
                          {DURATIONS.map((d) => (
                            <option key={d} value={d} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Timing</label>
                        <input
                          type="text"
                          list={`instructions-${idx}`}
                          value={item.instructions}
                          onChange={(e) => handleItemChange(idx, 'instructions', e.target.value)}
                          placeholder="After food"
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                        <datalist id={`instructions-${idx}`}>
                          {INSTRUCTIONS.map((i) => (
                            <option key={i} value={i} />
                          ))}
                        </datalist>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Total Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantityPrescribed}
                          onChange={(e) => handleItemChange(idx, 'quantityPrescribed', e.target.value)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono text-brand-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes / Advice */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Doctor's Advice & Patient Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Take complete course. Drink plenty of warm liquids. Avoid heavy meals before sleep."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {submitting ? 'Issuing Prescription...' : 'Issue Prescription (Rx)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
