import React, { useState, useEffect } from 'react';
import {
  X,
  Stethoscope,
  Activity,
  User,
  History,
  CheckCircle2,
  Save,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  ArrowRight,
  Pill,
  Printer,
  Plus,
  Trash2,
} from 'lucide-react';
import api from '../../services/api';
import PrescriptionPrintModal from '../Prescriptions/PrescriptionPrintModal';

const QUICK_SYMPTOMS = [
  'Fever',
  'Cough',
  'Throat Pain',
  'Headache',
  'Body Ache',
  'Shortness of Breath',
  'Chest Pain',
  'Abdominal Pain',
  'Nausea',
  'Fatigue',
];

export default function ConsultationWorkstationModal({ consultationId, tokenId, appointmentId, patient, onClose, onComplete }) {
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Clinical Form Fields
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Prescription & Medications Fields
  const [medications, setMedications] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [activePrescription, setActivePrescription] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Vitals Fields
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState('');

  // Patient History
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auto calculate BMI when weight and height change
  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      const heightInMeters = h / 100;
      const calculatedBmi = (w / (heightInMeters * heightInMeters)).toFixed(1);
      setBmi(calculatedBmi);
    } else {
      setBmi('');
    }
  }, [weight, height]);

  // Load or initialize consultation
  useEffect(() => {
    const initConsultation = async () => {
      setLoading(true);
      setError('');
      try {
        let consult = null;
        if (consultationId) {
          const res = await api.get(`/consultations/${consultationId}`);
          consult = res.data || res;
        } else if (tokenId || appointmentId) {
          // Start or retrieve in-progress consultation
          const res = await api.post('/consultations/start', {
            tokenId,
            appointmentId,
            patientId: patient?.id,
          });
          consult = res.data || res;
        }

        if (consult?.data) {
          consult = consult.data;
        }

        if (consult && (consult.id || consult.patientId)) {
          setConsultation(consult);
          setSymptoms(consult.symptoms || '');
          setDiagnosis(consult.diagnosis || '');

          // Parse and extract vitals from notes if present
          let cleanNotes = consult.notes || '';
          if (cleanNotes.includes('--- CLINICAL VITALS ---')) {
            const bpM = cleanNotes.match(/BP:\s*([^\s|]+(?:\s*mmHg)?)/i);
            if (bpM) setBp(bpM[1].replace(/mmHg/i, '').trim());
            const pulseM = cleanNotes.match(/Pulse:\s*(\d+)/i);
            if (pulseM) setPulse(pulseM[1]);
            const tempM = cleanNotes.match(/Temp:\s*([0-9.]+)/i);
            if (tempM) setTemp(tempM[1]);
            const spo2M = cleanNotes.match(/SpO2:\s*(\d+)/i);
            if (spo2M) setSpo2(spo2M[1]);
            const weightM = cleanNotes.match(/Weight:\s*([0-9.]+)/i);
            if (weightM) setWeight(weightM[1]);
            const heightM = cleanNotes.match(/Height:\s*([0-9.]+)/i);
            if (heightM) setHeight(heightM[1]);
            const bmiM = cleanNotes.match(/BMI:\s*([0-9.]+)/i);
            if (bmiM) setBmi(bmiM[1]);

            // Clean the observations textarea so vitals text is not mixed in
            cleanNotes = cleanNotes.replace(/--- CLINICAL VITALS ---[\s\S]*?(\n\n|$)/, '').trim();
          }

          setNotes(cleanNotes);
          setAdvice(consult.advice || '');
          if (consult.followUpDate) {
            setFollowUpDate(new Date(consult.followUpDate).toISOString().split('T')[0]);
          }

          // Fetch patient history timeline
          const targetPatientId = consult.patientId || patient?.id;
          if (targetPatientId) {
            fetchPatientHistory(targetPatientId);
          }

          // Fetch linked prescription if already created
          try {
            const rxRes = await api.get(`/prescriptions/consultation/${consult.id}`);
            const rxData = rxRes.data || rxRes;
            const rxObj = rxData?.data || rxData;
            if (rxObj?.id || rxObj?.items) {
              setActivePrescription(rxObj);
              if (rxObj.items?.length > 0) {
                setMedications(
                  rxObj.items.map((it) => ({
                    medicineId: it.medicineId,
                    medicineName: it.medicine?.name || '',
                    dosage: it.dosage,
                    frequency: it.frequency,
                    duration: it.duration,
                    instructions: it.instructions,
                    quantityPrescribed: it.quantityPrescribed,
                  }))
                );
              }
            }
          } catch (rxErr) {
            // No prescription yet
          }

          // Fetch catalog for autocompletion
          try {
            const catRes = await api.get('/prescriptions/medicines');
            const catData = catRes.data || catRes;
            const catList = Array.isArray(catData)
              ? catData
              : Array.isArray(catData?.medicines)
              ? catData.medicines
              : Array.isArray(catData?.data)
              ? catData.data
              : [];
            setCatalog(catList);
          } catch (cErr) {
            console.warn('Catalog load warning:', cErr);
          }
        }
      } catch (err) {
        console.error('Failed to initialize consultation:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load consultation workstation');
      } finally {
        setLoading(false);
      }
    };

    const fetchPatientHistory = async (patientId) => {
      setLoadingHistory(true);
      try {
        const res = await api.get(`/consultations/patient/${patientId}`);
        const histData = res.data || res;
        const histList = Array.isArray(histData)
          ? histData
          : Array.isArray(histData?.consultations)
          ? histData.consultations
          : Array.isArray(histData?.data)
          ? histData.data
          : [];
        setHistory(histList);
      } catch (err) {
        console.error('Failed to fetch patient history:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    initConsultation();
  }, [consultationId, tokenId, appointmentId, patient?.id]);

  // Helper for quick symptom chips
  const addSymptom = (sym) => {
    if (symptoms.includes(sym)) return;
    setSymptoms(symptoms ? `${symptoms}, ${sym}` : sym);
  };

  // Quick follow up helper (in days)
  const setQuickFollowUp = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowUpDate(d.toISOString().split('T')[0]);
  };

  // Medication handlers
  const addMedicationRow = () => {
    const defaultMed = catalog[0];
    setMedications([
      ...medications,
      {
        medicineId: defaultMed?.id || '',
        medicineName: defaultMed?.name || '',
        dosage: '500mg',
        frequency: '1-0-1',
        duration: '5 days',
        instructions: 'After food',
        quantityPrescribed: 10,
      },
    ]);
  };

  const updateMedicationRow = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;

    if (field === 'medicineId') {
      const selected = catalog.find((m) => m.id === value);
      if (selected) updated[index].medicineName = selected.name;
    }

    if (field === 'frequency' || field === 'duration') {
      let daily = 1;
      const freq = field === 'frequency' ? value : updated[index].frequency;
      if (freq && freq.includes('-')) {
        daily = freq.split('-').reduce((sum, p) => sum + (parseInt(p, 10) || 0), 0) || 1;
      }
      let days = 1;
      const dur = field === 'duration' ? value : updated[index].duration;
      const m = dur?.match(/(\d+)/);
      if (m) {
        days = parseInt(m[1], 10) || 1;
        if (/week/i.test(dur)) days *= 7;
        if (/month/i.test(dur)) days *= 30;
      }
      updated[index].quantityPrescribed = daily * days;
    }

    setMedications(updated);
  };

  const removeMedicationRow = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  // Save in-progress draft
  const handleSaveDraft = async () => {
    if (!consultation) return;
    setSubmitting(true);
    setError('');
    try {
      const vitalsObj = {};
      if (bp) vitalsObj.bp = bp;
      if (pulse) vitalsObj.pulse = pulse;
      if (temp) vitalsObj.temp = temp;
      if (spo2) vitalsObj.spo2 = spo2;
      if (weight) vitalsObj.weight = weight;
      if (height) vitalsObj.height = height;
      if (bmi) vitalsObj.bmi = bmi;

      const res = await api.put(`/consultations/${consultation.id}`, {
        symptoms,
        diagnosis,
        notes,
        advice,
        followUpDate: followUpDate || null,
        vitals: Object.keys(vitalsObj).length > 0 ? vitalsObj : undefined,
      });

      // Also save medications if present with valid medicine selections
      const validMeds = medications.filter((m) => m.medicineId && m.medicineId.trim());
      if (validMeds.length > 0) {
        try {
          const rxRes = await api.post('/prescriptions', {
            consultationId: consultation.id,
            patientId: consultation.patientId,
            doctorId: consultation.doctorId,
            notes: advice || 'Consultation medications',
            items: validMeds,
          });
          const rxData = rxRes.data || rxRes;
          const rxObj = rxData?.data || rxData;
          if (rxObj?.id || rxObj?.items) {
            setActivePrescription(rxObj);
          }
        } catch (rxErr) {
          console.warn('Prescription draft save warning:', rxErr);
        }
      }

      const resData = res.data || res;
      if (res.success || resData?.id) {
        const updated = resData?.id ? resData : consultation;
        setConsultation(updated);
        setSaveSuccess('Clinical notes and medications saved successfully');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save notes');
    } finally {
      setSubmitting(false);
    }
  };

  // Finalize and complete consultation
  const handleComplete = async () => {
    if (!diagnosis.trim()) {
      setError('A clinical diagnosis is required to complete the consultation');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const vitalsObj = {};
      if (bp) vitalsObj.bp = bp;
      if (pulse) vitalsObj.pulse = pulse;
      if (temp) vitalsObj.temp = temp;
      if (spo2) vitalsObj.spo2 = spo2;
      if (weight) vitalsObj.weight = weight;
      if (height) vitalsObj.height = height;
      if (bmi) vitalsObj.bmi = bmi;

      const res = await api.post(`/consultations/${consultation.id}/complete`, {
        diagnosis,
        advice,
        notes,
        followUpDate: followUpDate || null,
        vitals: Object.keys(vitalsObj).length > 0 ? vitalsObj : undefined,
      });

      // Save medications if authored with valid medicine selections
      const validMeds = medications.filter((m) => m.medicineId && m.medicineId.trim());
      if (validMeds.length > 0) {
        try {
          const rxRes = await api.post('/prescriptions', {
            consultationId: consultation.id,
            patientId: consultation.patientId,
            doctorId: consultation.doctorId,
            notes: advice || 'Prescribed medications',
            items: validMeds,
          });
          const rxData = rxRes.data || rxRes;
          const rxObj = rxData?.data || rxData;
          if (rxObj?.id || rxObj?.items) {
            setActivePrescription(rxObj);
          }
        } catch (rxErr) {
          console.warn('Prescription complete save warning:', rxErr);
        }
      }

      const resData = res.data || res;
      if (res.success || resData?.id) {
        if (onComplete) onComplete(resData?.id ? resData : consultation);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to complete consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const patientInfo = consultation?.patient || patient;
  const patientAge =
    patientInfo?.age ||
    (patientInfo?.dateOfBirth
      ? `${new Date().getFullYear() - new Date(patientInfo.dateOfBirth).getFullYear()} yrs`
      : 'N/A');

  const tokenFormatted =
    consultation?.token?.formattedToken ||
    (consultation?.token?.tokenNumber
      ? `T-${String(consultation.token.tokenNumber).padStart(3, '0')}`
      : 'Active');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white/95 glass-panel rounded-2xl shadow-2xl max-w-5xl w-full overflow-hidden border border-brand-200/50 flex flex-col max-h-[92vh] animate-fade-in-scale relative">
        {/* 1. Header Bar */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between flex-shrink-0 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-brand-100 text-brand-600">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Doctor Clinical Consultation Workstation
                </h2>
                {(consultation?.token || tokenId) && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200">
                    Token #{tokenFormatted}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  consultation?.status === 'COMPLETED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {consultation?.status || 'IN_PROGRESS'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patientInfo?.fullName || 'Patient'}</span> (UHID: {patientInfo?.uhid || 'N/A'}) | Ph: {patientInfo?.phone || 'N/A'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Body: Split Panels */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT PANEL: Patient Summary & History (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Patient Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-brand-600" />
                Patient Demographics
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Age / Gender:</span>
                <span className="font-medium text-slate-800">
                  {patientAge} / {patientInfo?.gender || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Blood Group:</span>
                <span className="font-semibold text-red-600 font-mono">
                  {patientInfo?.bloodGroup || 'Not recorded'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Known Allergies:</span>
                <span className="font-medium text-amber-700">
                  {patientInfo?.allergies || 'None recorded'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medical History:</span>
                <span className="font-medium text-slate-700 max-w-[160px] truncate" title={patientInfo?.medicalHistory}>
                  {patientInfo?.medicalHistory || 'Nil'}
                </span>
              </div>
            </div>

            {/* Visit History Accordion */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <div className="flex items-center">
                  <History className="w-3.5 h-3.5 mr-1 text-brand-600" />
                  Past Consultation Visits ({history.length})
                </div>
              </div>

              {loadingHistory ? (
                <div className="text-xs text-slate-400 py-3 text-center">Loading past records...</div>
              ) : history.length === 0 ? (
                <div className="text-xs text-slate-400 py-3 text-center">First recorded consultation visit</div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {history.map((h) => (
                    <div key={h.id} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-900 truncate">
                          {h.diagnosis || 'Clinical Follow-up'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-brand-700 font-medium">
                        {h.doctor?.user?.name || 'Doctor'} ({h.doctor?.department?.name})
                      </div>
                      {h.symptoms && (
                        <div className="text-[11px] text-slate-500 truncate">
                          Symptoms: {h.symptoms}
                        </div>
                      )}
                      {h.advice && (
                        <div className="text-[11px] text-slate-600 italic truncate">
                          Advice: {h.advice}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Active Clinical Documentation (8 Cols) */}
          <div className="lg:col-span-8 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-600 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-700 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{saveSuccess}</span>
              </div>
            )}

            {/* Vitals Strip */}
            <div className="p-4 rounded-xl bg-slate-50/90 glass-panel border border-slate-200/80 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  <span>Patient Vitals & Biometrics</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1"></span>
                    TELEMETRY ACTIVE
                  </span>
                </div>
                {bmi && (
                  <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-brand-700 font-bold font-mono shadow-xs">
                    BMI: {bmi}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">BP (mmHg)</label>
                  <input
                    type="text"
                    placeholder="120/80"
                    value={bp}
                    onChange={(e) => setBp(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Pulse (bpm)</label>
                  <input
                    type="number"
                    placeholder="72"
                    value={pulse}
                    onChange={(e) => setPulse(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Temp (°F)</label>
                  <input
                    type="text"
                    placeholder="98.6"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="99"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Weight (kg)</label>
                  <input
                    type="number"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">Height (cm)</label>
                  <input
                    type="number"
                    placeholder="175"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 uppercase font-semibold">BMI</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="--"
                    value={bmi}
                    className="w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Chief Complaints & Symptoms */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Chief Complaints & Symptoms
                </label>
                <span className="text-[10px] text-slate-400">Click quick tags to append</span>
              </div>

              {/* Quick Tags */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {QUICK_SYMPTOMS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => addSymptom(sym)}
                    className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200 rounded-md transition-colors"
                  >
                    + {sym}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe presenting symptoms, onset, duration, and severity..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Clinical Examination Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                Clinical Examination & Observations
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Physical findings, systemic examination (CVS, RS, PA, CNS)..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-sans"
              />
            </div>

            {/* Diagnosis (Primary / Provisional) */}
            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                Clinical Diagnosis * <span className="text-red-500 text-xs font-normal">(Required to complete)</span>
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Bronchitis, Type 2 Diabetes Mellitus, Essential Hypertension..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Advice & Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                  Advice & Dietary Instructions
                </label>
                <textarea
                  rows={2}
                  value={advice}
                  onChange={(e) => setAdvice(e.target.value)}
                  placeholder="e.g. Low sodium diet, steam inhalation, rest, fluid intake..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Follow-up Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-1.5">
                  Follow-Up Review Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 mb-1.5"
                />
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(3)}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border text-slate-600"
                  >
                    3 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(7)}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border text-slate-600"
                  >
                    1 week
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(14)}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border text-slate-600"
                  >
                    2 weeks
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickFollowUp(30)}
                    className="px-2 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 rounded border text-slate-600"
                  >
                    1 month
                  </button>
                </div>
              </div>
            </div>

            {/* Rx Medications & Digital Prescription Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-brand-100 text-brand-700 rounded-lg">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Prescribed Medications (Rx)
                    </h3>
                    <p className="text-[10px] text-slate-500">Add medications from the hospital catalog or specify custom dosing</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addMedicationRow}
                  className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-brand-700 bg-white hover:bg-brand-50 border border-brand-200 rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Medicine
                </button>
              </div>

              {medications.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white">
                  No medications added yet. Click "+ Add Medicine" to prescribe drugs for this visit.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {medications.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-brand-700 text-[11px]">
                          Drug #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeMedicationRow(idx)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded"
                          title="Remove medication"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        {/* Medicine Selector */}
                        <div className="sm:col-span-1">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Medicine</label>
                          <select
                            value={item.medicineId}
                            onChange={(e) => updateMedicationRow(idx, 'medicineId', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                          >
                            <option value="">-- Select Medicine --</option>
                            {catalog.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Dosage & Frequency */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Dosage / Freq</label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="500mg"
                              value={item.dosage}
                              onChange={(e) => updateMedicationRow(idx, 'dosage', e.target.value)}
                              className="w-1/2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                            <select
                              value={item.frequency}
                              onChange={(e) => updateMedicationRow(idx, 'frequency', e.target.value)}
                              className="w-1/2 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                            >
                              <option value="1-0-1">1-0-1</option>
                              <option value="1-1-1">1-1-1</option>
                              <option value="1-0-0">1-0-0</option>
                              <option value="0-0-1">0-0-1</option>
                              <option value="SOS">SOS</option>
                              <option value="Once daily">Once daily</option>
                            </select>
                          </div>
                        </div>

                        {/* Duration & Instructions */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Duration / Timing</label>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="5 days"
                              value={item.duration}
                              onChange={(e) => updateMedicationRow(idx, 'duration', e.target.value)}
                              className="w-1/2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                            <input
                              type="text"
                              placeholder="After food"
                              value={item.instructions}
                              onChange={(e) => updateMedicationRow(idx, 'instructions', e.target.value)}
                              className="w-1/2 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                          </div>
                        </div>

                        {/* Total Quantity */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Total Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantityPrescribed}
                            onChange={(e) => updateMedicationRow(idx, 'quantityPrescribed', parseInt(e.target.value, 10) || 1)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-brand-700"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Footer Action Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Close / Minimize
          </button>

          <div className="flex items-center space-x-3">
            {activePrescription && (
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Print Rx Slip ({activePrescription.prescriptionCode})
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Save className="w-4 h-4 mr-1.5 text-slate-500" />
              Save In-Progress Notes
            </button>

            <button
              type="button"
              onClick={handleComplete}
              disabled={submitting || !diagnosis.trim()}
              className="inline-flex items-center px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 rounded-xl shadow-emerald-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Complete Consultation
            </button>
          </div>
        </div>

        {/* Printable Modal Integration */}
        {showPrintModal && activePrescription && (
          <PrescriptionPrintModal
            prescriptionData={activePrescription}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </div>
    </div>
  );
}
