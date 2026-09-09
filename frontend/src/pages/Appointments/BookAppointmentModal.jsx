import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const BookAppointmentModal = ({ onClose, onBooked }) => {
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
      });
      onBooked();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Book OPD Patient Appointment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select patient, physician, date, and reserve an available consultation slot.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
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
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              1. Select Patient *
            </label>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 bg-sky-50 border border-sky-200 rounded-lg">
                <div>
                  <span className="text-sm font-bold text-slate-800">{selectedPatient.fullName}</span>
                  <span className="text-xs text-sky-700 font-mono ml-2">
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
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                        className="p-2.5 hover:bg-sky-50 cursor-pointer flex items-center justify-between text-xs"
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

          {/* Doctor & Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                2. Select Physician *
              </label>
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name} — {d.department?.name} (₹{d.consultationFee})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                3. Consultation Date *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Live Slots Discovery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase">
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
                          ? 'bg-sky-600 text-white shadow-md ring-2 ring-sky-300 scale-105'
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
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Reason / Symptoms (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Routine checkup, chronic back pain, fever..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedSlot || !selectedPatient}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
