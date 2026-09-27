import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Search, X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export const BookAppointmentModal = ({ onClose, onBooked, existingAppointmentsList = [] }) => {
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [slotsData, setSlotsData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Existing same-day appointment state & popup control
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [sameDayAppointment, setSameDayAppointment] = useState(null);
  const [showExistingPopup, setShowExistingPopup] = useState(false);
  const [acknowledgedExisting, setAcknowledgedExisting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);

  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load active doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        setDoctors(res.data);
        if (res.data.length > 0) {
          setSelectedDoctorId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, []);

  // Search patients
  useEffect(() => {
    if (!patientSearch || patientSearch.length < 2) {
      setPatients([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await api.get('/patients', { params: { search: patientSearch, limit: 5 } });
        setPatients(res.data.patients || []);
      } catch (err) {
        console.error('Failed to search patients:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [patientSearch]);

  // Reset acknowledgment when patient changes
  useEffect(() => {
    setAcknowledgedExisting(false);
  }, [selectedPatient?.id]);

  // Check if patient already has an existing appointment on the selected date
  useEffect(() => {
    if (!selectedPatient || !selectedDate) {
      setExistingAppointments([]);
      setSameDayAppointment(null);
      setShowExistingPopup(false);
      return;
    }

    let isMounted = true;

    // Check locally passed list first for 0ms instant popup
    const localMatches = (existingAppointmentsList || []).filter(
      (a) =>
        !['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(a.status) &&
        (a.patientId === selectedPatient.id ||
          a.patient?.id === selectedPatient.id ||
          (selectedPatient.uhid && a.patient?.uhid === selectedPatient.uhid) ||
          (selectedPatient.phone && a.patient?.phone === selectedPatient.phone)) &&
        a.appointmentDate &&
        a.appointmentDate.split('T')[0] === selectedDate
    );

    if (localMatches.length > 0 && isMounted) {
      setExistingAppointments(localMatches);
      setSameDayAppointment(localMatches[0]);
      setShowExistingPopup(true);
    }

    // Query server for live confirmation
    const checkPatientAppointments = async () => {
      setCheckingExisting(true);
      try {
        const res = await api.get('/appointments', {
          params: {
            date: selectedDate,
            search: selectedPatient.uhid || selectedPatient.phone,
            limit: 10,
          },
        });

        if (!isMounted) return;

        const serverMatches = (res.data?.appointments || []).filter(
          (a) =>
            !['CANCELLED', 'EXPIRED', 'NO_SHOW'].includes(a.status) &&
            (a.patientId === selectedPatient.id ||
              a.patient?.id === selectedPatient.id ||
              (selectedPatient.uhid && a.patient?.uhid === selectedPatient.uhid) ||
              (selectedPatient.phone && a.patient?.phone === selectedPatient.phone)) &&
            a.appointmentDate &&
            a.appointmentDate.split('T')[0] === selectedDate
        );

        if (serverMatches.length > 0) {
          setExistingAppointments(serverMatches);
          setSameDayAppointment(serverMatches[0]);
          setShowExistingPopup(true);
        } else if (localMatches.length === 0) {
          setExistingAppointments([]);
          setSameDayAppointment(null);
          setShowExistingPopup(false);
        }
      } catch (err) {
        console.warn('Could not verify existing appointments:', err);
      } finally {
        if (isMounted) setCheckingExisting(false);
      }
    };

    checkPatientAppointments();

    return () => {
      isMounted = false;
    };
  }, [selectedPatient?.id, selectedDate]);

  // Fetch available slots whenever doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot('');
      setError(null);
      try {
        const res = await api.get('/appointments/slots', {
          params: { doctorId: selectedDoctorId, date: selectedDate },
        });
        setSlotsData(res.data);
      } catch (err) {
        setSlotsData(null);
        setError(err.message || 'Failed to retrieve available slots');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      setError('Please search and select a registered patient');
      return;
    }

    // Check if patient already has an existing appointment on this day
    if (sameDayAppointment) {
      if (sameDayAppointment.doctorId === selectedDoctorId) {
        const docName = sameDayAppointment.doctor?.user?.name || 'this physician';
        setError(
          `Patient has an existing Appointment with Dr. ${docName} at ${sameDayAppointment.timeSlot}. Duplicate booking for the same physician on the same date is not allowed.`
        );
        setShowExistingPopup(true);
        return;
      }

      if (!acknowledgedExisting) {
        setShowExistingPopup(true);
        return;
      }
    }

    if (!selectedSlot) {
      setError('Please select an available time slot');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.post('/appointments', {
        patientId: selectedPatient.id,
        doctorId: selectedDoctorId,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        reason,
        allowMultipleSameDay: acknowledgedExisting,
      });
      onBooked();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
      if (err.message && err.message.toLowerCase().includes('existing appointment')) {
        setShowExistingPopup(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="hms-modal-backdrop">
      <div className="bg-white dark:bg-[#0B1524] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-[#1E293B] text-[#334155] dark:text-[#F8FAFC] max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#1E293B]">
          <div>
            <h3 className="text-lg font-bold text-[#334155] dark:text-[#F8FAFC] flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-[#0D9488]" />
              <span>Book OPD Patient Appointment</span>
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Select patient, physician, date, and reserve an available consultation slot.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#64748B] dark:text-slate-400 hover:text-[#334155] dark:hover:text-white rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-[#070D18]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Patient Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] uppercase mb-1">
              1. Select Patient *
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-[#0D9488]/10 border border-[#0D9488]/20 rounded-lg">
                <div>
                  <span className="text-sm font-bold text-slate-800">{selectedPatient.fullName}</span>
                  <span className="text-xs text-[#0D9488] font-mono ml-2">
                    UHID: {selectedPatient.uhid}
                  </span>
                  <span className="text-xs text-slate-500 block">Phone: {selectedPatient.phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="text-xs text-rose-600 font-semibold hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search patient by UHID, name, or phone number..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D9488] focus:outline-none"
                />

                {patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {patients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearch('');
                          setPatients([]);
                        }}
                        className="p-2.5 hover:bg-[#0D9488]/10 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{p.fullName}</span>
                          <span className="text-slate-500 ml-2 font-mono">({p.uhid})</span>
                        </div>
                        <span className="text-slate-400 font-mono">{p.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Persistent Same-Day Existing Appointment Banner */}
          {sameDayAppointment && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-xl text-xs flex items-start justify-between text-amber-900 dark:text-amber-200 shadow-xs animate-in fade-in">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950 dark:text-amber-100 flex items-center space-x-1.5">
                    <span>Patient has an existing Appointment</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                      {selectedDate}
                    </span>
                  </div>
                  <div className="mt-1 text-amber-800 dark:text-amber-300">
                    Dr. <strong>{sameDayAppointment.doctor?.user?.name || 'Physician'}</strong> ({sameDayAppointment.doctor?.department?.name || 'Clinic'}) at <strong className="font-mono">{sameDayAppointment.timeSlot}</strong> • Status: <span className="font-semibold uppercase">{sameDayAppointment.status}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExistingPopup(true)}
                className="ml-2 px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors shadow-xs flex-shrink-0"
              >
                View Details
              </button>
            </div>
          )}

          {/* Doctor & Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#334155] uppercase mb-1">
                2. Select Physician *
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#0D9488] focus:outline-none"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name} — {d.department?.name} (₹{d.consultationFee})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#334155] uppercase mb-1">
                3. Consultation Date *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#0D9488] focus:outline-none"
              />
            </div>
          </div>

          {/* Live Slots Discovery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#334155] uppercase">
                4. Select Available Time Slot *
              </label>
              {slotsData?.shift && (
                <span className="text-[11px] text-slate-500 font-medium">
                  Shift: {slotsData.shift.startTime} - {slotsData.shift.endTime} (
                  {slotsData.shift.slotDurationMinutes} min slots)
                </span>
              )}
            </div>

            {loadingSlots ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Scanning doctor schedule and booked slots...
              </div>
            ) : !slotsData || slotsData.slots.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                {slotsData?.message || 'No slots available for this physician on selected date.'}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                {slotsData.slots.map((slot) => {
                  const isSelected = selectedSlot === slot.timeSlot;
                  return (
                    <button
                      key={slot.timeSlot}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot.timeSlot)}
                      className={`py-2 px-1 rounded-lg text-xs font-mono font-bold transition-all ${
                        isSelected
                          ? 'bg-[#0D9488] text-white shadow-md ring-2 ring-[#0D9488]/30 scale-105'
                          : slot.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 line-through cursor-not-allowed opacity-50'
                      }`}
                      title={slot.isBooked ? 'Already Booked' : 'Available'}
                    >
                      {slot.timeSlot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reason for Visit */}
          <div>
            <label className="block text-xs font-semibold text-[#334155] uppercase mb-1">
              Reason / Symptoms (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Routine checkup, chronic back pain, fever..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D9488] focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-[#1E293B] flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="hms-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !selectedSlot ||
                !selectedPatient ||
                (sameDayAppointment && sameDayAppointment.doctorId === selectedDoctorId)
              }
              className="hms-btn-primary disabled:opacity-50"
            >
              {submitting
                ? 'Confirming...'
                : sameDayAppointment && sameDayAppointment.doctorId === selectedDoctorId
                ? 'Cannot Book (Same Doctor Duplicate)'
                : 'Confirm Appointment'}
            </button>
          </div>
        </form>

        {/* Existing Appointment Warning Popup Modal */}
        {showExistingPopup && sameDayAppointment && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#0B1524] rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-amber-400 dark:border-amber-500/60 text-[#334155] dark:text-[#F8FAFC] relative animate-in zoom-in-95 duration-150">
              {/* Top Close Button */}
              <button
                type="button"
                onClick={() => setShowExistingPopup(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-start space-x-3.5 pb-4 border-b border-amber-100 dark:border-amber-900/30">
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 mb-1">
                    Schedule Conflict Alert
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    Patient has an existing Appointment
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    An appointment is already scheduled on this same date for this patient.
                  </p>
                </div>
              </div>

              {/* Patient & Appointment Details Card */}
              <div className="my-4 space-y-3">
                {/* Patient Banner */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{selectedPatient.fullName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">UHID: {selectedPatient.uhid} • Ph: {selectedPatient.phone}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded font-semibold text-[11px] border border-amber-200 dark:border-amber-800/50">
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Existing Booking Card */}
                <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 space-y-2.5 text-xs">
                  <div className="font-semibold text-amber-950 dark:text-amber-200 flex items-center justify-between">
                    <span>Current Active Booking</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-800/70 text-amber-900 dark:text-amber-100 uppercase">
                      {sameDayAppointment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Doctor:</span>
                      <strong className="text-slate-900 dark:text-white">
                        Dr. {sameDayAppointment.doctor?.user?.name || 'Physician'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Department:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {sameDayAppointment.doctor?.department?.name || 'OPD'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Time Slot:</span>
                      <span className="font-mono font-bold text-amber-900 dark:text-amber-300">
                        {sameDayAppointment.timeSlot}
                      </span>
                    </div>
                    {sameDayAppointment.token && (
                      <div>
                        <span className="text-[11px] text-slate-500 block">Token #:</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          #{sameDayAppointment.token.tokenNumber}
                        </span>
                      </div>
                    )}
                  </div>

                  {sameDayAppointment.reason && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-amber-200/60 dark:border-amber-800/30">
                      <span className="font-medium">Reason: </span>
                      {sameDayAppointment.reason}
                    </div>
                  )}
                </div>

                {/* Conflict Analysis Banner */}
                {sameDayAppointment.doctorId === selectedDoctorId ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block">Same Doctor Conflict:</strong>
                      Patient already has a consultation booked with <strong>Dr. {sameDayAppointment.doctor?.user?.name}</strong> at <strong>{sameDayAppointment.timeSlot}</strong> on this date. You cannot book two appointments with the same doctor on the same day.
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-300 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-200 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block">Different Specialist:</strong>
                      The existing appointment is with <strong>Dr. {sameDayAppointment.doctor?.user?.name}</strong>. If this patient requires a second consultation with another specialist on the same day, you may acknowledge and proceed.
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowExistingPopup(false);
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Keep Existing Only (Close)
                </button>

                {sameDayAppointment.doctorId === selectedDoctorId ? (
                  <button
                    type="button"
                    onClick={() => setShowExistingPopup(false)}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 rounded-xl transition-colors"
                  >
                    Change Date or Doctor
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAcknowledgedExisting(true);
                      setShowExistingPopup(false);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors flex items-center space-x-1.5 shadow-sm"
                  >
                    <span>Acknowledge & Continue Booking</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentModal;
