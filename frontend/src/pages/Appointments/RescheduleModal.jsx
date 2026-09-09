import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';

export const RescheduleModal = ({ appointment, onClose, onRescheduled }) => {
  const [newDate, setNewDate] = useState(() => {
    return new Date(appointment.appointmentDate).toISOString().split('T')[0];
  });
  const [slotsData, setSlotsData] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot('');
      setError(null);
      try {
        const res = await api.get('/appointments/slots', {
          params: { doctorId: appointment.doctorId, date: newDate },
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
  }, [newDate, appointment.doctorId]);

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select a new time slot');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.put(`/appointments/${appointment.id}/reschedule`, {
        appointmentDate: newDate,
        timeSlot: selectedSlot,
      });
      onRescheduled();
      onClose();
    } catch (err) {
      setError(err.message || 'Rescheduling failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Reschedule Appointment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Patient: <span className="font-semibold text-slate-700">{appointment.patient?.fullName}</span> • Doctor: <span className="font-semibold text-slate-700">{appointment.doctor?.user?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleReschedule} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select New Date *
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-2">
              Select Available Slot *
            </label>
            {loadingSlots ? (
              <div className="p-6 text-center text-slate-400 text-xs">Scanning available slots...</div>
            ) : !slotsData || slotsData.slots.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                {slotsData?.message || 'No slots available on this date.'}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1">
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
                          ? 'bg-sky-600 text-white shadow-md'
                          : slot.isAvailable
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 line-through opacity-50 cursor-not-allowed'
                      }`}
                    >
                      {slot.timeSlot}
                    </button>
                  );
                })}
              </div>
            )}
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
              disabled={submitting || !selectedSlot}
              className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Confirm Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RescheduleModal;
