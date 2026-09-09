import React, { useState, useEffect } from 'react';
import {
  X,
  PackageCheck,
  CheckCircle2,
  AlertTriangle,
  Pill,
  User,
  Stethoscope,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api';

export default function DispenseModal({ prescriptionId, onClose, onSuccess }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/pharmacy/prescriptions/${prescriptionId}/preview`);
        const prevData = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
        setPreview(prevData);
      } catch (err) {
        setError(err.message || err.response?.data?.message || 'Failed to generate dispense preview');
      } finally {
        setLoading(false);
      }
    };
    if (prescriptionId) {
      fetchPreview();
    }
  }, [prescriptionId]);

  const handleDispense = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/pharmacy/dispense', {
        prescriptionId,
      });

      const dispenseData = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
      if (res.success || res.data?.success || dispenseData?.id) {
        if (onSuccess) onSuccess(dispenseData);
        onClose();
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to dispense medications');
    } finally {
      setSubmitting(false);
    }
  };

  const patient = preview?.patient;
  const doctor = preview?.doctor;
  const consultation = preview?.consultation;
  const items = preview?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">Dispense Prescription Medications</h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-brand-50 text-brand-700 rounded border border-brand-200">
                  {preview?.prescriptionCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                FEFO Stock allocation (First Expiring First Out) & pharmacy inventory deduction
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 flex-1 space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Inspecting inventory batches & calculating FEFO allocation...
            </div>
          ) : preview ? (
            <>
              {/* Patient & Doctor Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Patient Demographics
                  </span>
                  <div className="font-bold text-slate-900 text-sm">{patient?.fullName}</div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    UHID: {patient?.uhid} | Phone: {patient?.phone}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Physician & Clinical Context
                  </span>
                  <div className="font-semibold text-slate-900">
                    {doctor?.user?.name} ({doctor?.department?.name || 'Doctor'})
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Diagnosis: <span className="font-medium text-slate-800">{consultation?.diagnosis || 'Standard Encounter'}</span>
                  </div>
                </div>
              </div>

              {/* Items & FEFO Allocation Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <Pill className="w-4 h-4 mr-1.5 text-emerald-600" />
                    Prescribed Items & Inventory Allocation
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    {items.length} prescribed drug{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={item.prescriptionItemId || idx}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-2.5">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {item.medicineName}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-mono">
                              {item.dosage} • {item.frequency}
                            </span>
                          </div>
                          {item.genericName && (
                            <div className="text-[11px] text-slate-400 italic">
                              Generic: {item.genericName}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Prescribed</span>
                            <span className="font-mono font-bold text-slate-800">
                              {item.quantityPrescribed} {item.unit?.toLowerCase()}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-semibold">Allocated</span>
                            <span className={`font-mono font-bold ${item.isShort ? 'text-amber-600' : 'text-emerald-700'}`}>
                              {item.quantityAllocated} / {item.quantityRemaining}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Batches Allocated */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          FEFO Batch Allocation:
                        </span>

                        {item.batchAllocations?.length === 0 ? (
                          <div className="p-2.5 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2 text-[11px]">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            <span>Out of stock! No non-expired batches found in inventory for this medicine.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.batchAllocations.map((alloc, aIdx) => (
                              <div
                                key={alloc.batchId || aIdx}
                                className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                              >
                                <div>
                                  <div className="font-mono font-bold text-slate-800">
                                    Batch: {alloc.batchNumber}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Exp: {new Date(alloc.expiryDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono font-bold text-emerald-700">
                                    {alloc.allocatedQuantity} units
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    @ ₹{alloc.unitPrice.toFixed(2)} = ₹{alloc.subtotal.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5 text-xs text-emerald-900">
                  <div className="font-bold flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                    Ready for Dispensing & Inventory Sync
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Stock will be deducted from active batches and prescription status updated to DISPENSED.
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Billing Amount</span>
                  <div className="text-2xl font-black font-mono text-emerald-700">
                    ₹{preview.totalEstimatedAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDispense}
            disabled={submitting || loading || !preview?.canFullyDispense}
            className="inline-flex items-center px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {submitting ? 'Deducting Stock & Dispensing...' : 'Confirm Dispense & Deduct Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
