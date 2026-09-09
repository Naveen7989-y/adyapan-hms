import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import api from '../../services/api';

export const CancelModal = ({ appointment, onClose, onCancelled }) => {
  const [reason, setReason] = useState('Patient requested cancellation');
  const [submitting, setSubmitting] = useState(false);

  const handleCancel = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/appointments/${appointment.id}/cancel`, {
        cancellationReason: reason,
      });
      onCancelled();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center space-x-3 mb-3 text-rose-600">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Cancel Appointment</h3>
            <p className="text-xs text-slate-500">The reserved time slot will be released.</p>
          </div>
        </div>

        <form onSubmit={handleCancel} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 border border-slate-100">
            <div>
              <span className="font-semibold text-slate-600">Patient:</span>{' '}
              <span className="font-bold text-slate-800">{appointment.patient?.fullName}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Physician:</span>{' '}
              <span className="font-bold text-slate-800">{appointment.doctor?.user?.name}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-600">Scheduled:</span>{' '}
              <span className="font-bold text-sky-700">
                {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Cancellation Reason *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelModal;
