import React, { useState } from 'react';
import { X, Plus, AlertCircle, Pill } from 'lucide-react';
import api from '../../services/api';

const UNITS = ['TABLETS', 'CAPSULES', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS'];

export default function AddMedicineModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [categoryName, setCategoryName] = useState('Antibiotics');
  const [manufacturer, setManufacturer] = useState('Standard Pharma');
  const [unit, setUnit] = useState('TABLETS');
  const [minStockAlert, setMinStockAlert] = useState('50');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Medicine name is required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/pharmacy/medicines', {
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        categoryName: categoryName.trim() || 'General',
        manufacturer: manufacturer.trim() || 'Standard Pharma',
        unit,
        minStockAlert: parseInt(minStockAlert, 10) || 50,
      });

      const medData = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
      if (res.success || res.data?.success || medData?.id) {
        if (onSuccess) onSuccess(medData);
        onClose();
      }
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to create medicine');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Add New Medicine to Catalog</h2>
              <p className="text-xs text-slate-500">Register therapeutic drug in pharmacy inventory</p>
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
              Medicine Brand & Strength *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Augmentin 625 Duo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
              Generic Formula / Composition
            </label>
            <input
              type="text"
              placeholder="e.g. Amoxicillin & Potassium Clavulanate"
              value={genericName}
              onChange={(e) => setGenericName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Antibiotics"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                Dosage Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                placeholder="e.g. GSK Pharma"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider text-[11px] mb-1">
                Min Stock Alert
              </label>
              <input
                type="number"
                min="0"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
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
              className="inline-flex items-center px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow transition-all"
            >
              <Plus className="w-4 h-4 mr-1" />
              {submitting ? 'Creating...' : 'Create Medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
