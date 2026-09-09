import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertCircle, Stethoscope } from 'lucide-react';
import api from '../../services/api';

export default function TransferTokenModal({ token, currentDoctorId, onClose, onSuccess }) {
  const [doctors, setDoctors] = useState([]);
  const [targetDoctorId, setTargetDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        const docs = res.data?.data?.doctors || res.data?.data || [];
        // Filter out current doctor
        const available = docs.filter((d) => d.id !== currentDoctorId);
        setDoctors(available);
        if (available.length > 0) {
          setTargetDoctorId(available[0].id);
        }
      } catch (err) {
        console.error('Failed to load doctors for transfer:', err);
      }
    };
    fetchDoctors();
  }, [currentDoctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetDoctorId) {
      setError('Please select a destination doctor');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/queue/transfer', {
        tokenId: token.id,
        toDoctorId: targetDoctorId,
        reason,
      });

      if (res.data?.success) {
        onSuccess(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to transfer patient token');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Transfer Patient Queue</h3>
              <p className="text-xs text-slate-500">Reassign token to another available physician</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Token Info Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-mono font-bold text-brand-700 text-sm mr-2">{token.formattedToken}</span>
              <span className="font-medium text-slate-800">{token.patient?.fullName}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[11px] bg-white border border-slate-200 text-slate-600 font-semibold">
              {token.tokenType}
            </span>
          </div>

          {/* Destination Doctor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Destination Doctor *
            </label>
            <select
              value={targetDoctorId}
              onChange={(e) => setTargetDoctorId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="">-- Choose Physician --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user?.name} ({d.department?.name}) - {d.status}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Transfer Reason
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Physician emergency break, specialized pediatric consultation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
            >
              {submitting ? 'Transferring...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
