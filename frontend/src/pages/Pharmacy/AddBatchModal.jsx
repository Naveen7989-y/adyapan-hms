import React, { useState } from 'react';
import { X, Plus, AlertCircle, CheckCircle2, Layers } from 'lucide-react';
import api from '../../services/api';

export default function AddBatchModal({ medicine, onClose, onSuccess }) {
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [purchasePrice, setPurchasePrice] = useState('1.50');
  const [sellingPrice, setSellingPrice] = useState('3.00');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!batchNumber.trim() || !expiryDate || !quantity) {
      setError('Batch number, expiry date, and quantity are required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/pharmacy/medicines/${medicine.id}/batches`, {
        batchNumber: batchNumber.trim(),
        expiryDate,
        quantity: parseInt(quantity, 10) || 0,
        purchasePrice: parseFloat(purchasePrice) || 0.0,
        sellingPrice: parseFloat(sellingPrice) || 0.0,
      });

      const batchData = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
      if (res.success || res.data?.success || batchData?.id || batchData?.batchNumber) {
        if (onSuccess) onSuccess(batchData);
        onClose();
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to add batch');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Add Inventory Batch</h2>
              <p className="text-xs text-slate-500">{medicine?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
              Batch Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BATCH-2026-X1"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-bold shadow transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              {submitting ? 'Adding...' : 'Add Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
