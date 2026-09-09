import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Receipt,
  IndianRupee,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  FileText,
} from 'lucide-react';
import api from '../../services/api';

export default function RefundModal({ invoice, onClose, onSuccess }) {
  const paidAmount = Number(invoice?.paidAmount || 0);
  const refundedAmount = Number(invoice?.refundedAmount || 0);
  const maxRefundable = Math.max(0, paidAmount - refundedAmount);

  const [amount, setAmount] = useState(maxRefundable.toString());
  const [reason, setReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numAmount = parseFloat(amount) || 0;
  const isFullRefund = Math.abs(numAmount - maxRefundable) < 0.01;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (numAmount <= 0) {
      setError('Refund amount must be greater than 0');
      return;
    }

    if (numAmount > maxRefundable) {
      setError(`Refund amount cannot exceed max refundable balance of ₹${maxRefundable.toFixed(2)}`);
      return;
    }

    if (!reason.trim()) {
      setError('A valid reason for the refund is mandatory for audit compliance');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(`/billing/invoices/${invoice.id}/refunds`, {
        amount: numAmount,
        reason: reason.trim(),
        paymentMethod,
      });

      const data = res.data?.data !== undefined ? res.data.data : res.data;
      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to process refund');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Process Patient Refund</h2>
              <p className="text-xs text-slate-400">
                Invoice {invoice?.invoiceNumber} • {invoice?.patient?.fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Balance Breakdown Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Total Billed:</span>
              <span className="font-mono font-bold text-slate-800">
                ₹{Number(invoice?.totalAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Total Collected:</span>
              <span className="font-mono font-bold">₹{paidAmount.toFixed(2)}</span>
            </div>
            {refundedAmount > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Previously Refunded:</span>
                <span className="font-mono font-bold">- ₹{refundedAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span className="text-rose-700">Max Refundable Balance:</span>
              <span className="font-mono text-rose-700 font-black">
                ₹{maxRefundable.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Refund Amount */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Refund Amount (₹) *</label>
              <button
                type="button"
                onClick={() => setAmount(maxRefundable.toString())}
                className="text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
              >
                Full Refund (₹{maxRefundable.toFixed(2)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxRefundable}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                placeholder="0.00"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {isFullRefund ? (
                <span className="text-rose-600 font-semibold">
                  This will issue a FULL refund and mark the invoice as REFUNDED.
                </span>
              ) : (
                <span className="text-amber-600 font-semibold">
                  This will issue a PARTIAL refund of ₹{numAmount.toFixed(2)}.
                </span>
              )}
            </p>
          </div>

          {/* Refund Mode */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Refund Disbursement Method *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'UPI', label: 'UPI', icon: Smartphone },
                { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                { id: 'BANK_TRANSFER', label: 'Bank', icon: Building2 },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-rose-50 border-rose-500 text-rose-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Reason for Refund *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 mb-2"
            >
              <option value="">-- Select Common Reason or Type Below --</option>
              <option value="Consultation Cancelled / Doctor Unavailable">
                Consultation Cancelled / Doctor Unavailable
              </option>
              <option value="Medication Returned to Pharmacy">Medication Returned to Pharmacy</option>
              <option value="Billing Discrepancy / Overcharge Correction">
                Billing Discrepancy / Overcharge Correction
              </option>
              <option value="Lab Test Cancelled">Lab Test Cancelled</option>
              <option value="Patient Dissatisfaction / Administrative Exemption">
                Patient Dissatisfaction / Administrative Exemption
              </option>
            </select>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Specify the detailed reason for hospital audit records..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || maxRefundable <= 0}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Refund...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Confirm & Issue ₹{numAmount.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
