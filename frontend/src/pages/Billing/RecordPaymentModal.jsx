import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Globe,
  AlertCircle,
  CheckCircle2,
  Receipt,
  User,
  IndianRupee,
} from 'lucide-react';
import api from '../../services/api';

export default function RecordPaymentModal({ invoice, onClose, onSuccess }) {
  const remainingBalance = Math.max(
    0,
    parseFloat(((invoice?.totalAmount || 0) - (invoice?.paidAmount || 0)).toFixed(2))
  );

  const [amount, setAmount] = useState(remainingBalance.toString());
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const paymentMethods = [
    { id: 'CASH', label: 'Cash Desk', icon: Banknote, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'UPI', label: 'UPI / QR', icon: Smartphone, color: 'text-sky-600 bg-sky-50 border-sky-200' },
    { id: 'CARD', label: 'Debit / Credit Card', icon: CreditCard, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'ONLINE', label: 'Net Banking / Portal', icon: Globe, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  ];

  const handleQuickAmount = (val) => {
    setAmount(val.toFixed(2));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (numericAmount > remainingBalance + 0.01) {
      setError(`Payment cannot exceed the remaining balance of ₹${remainingBalance.toFixed(2)}.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/billing/invoices/${invoice.id}/payments`, {
        amount: numericAmount,
        paymentMethod,
        transactionRef: transactionRef.trim() || undefined,
      });

      const resultData = res.data?.data || res.data;
      if (onSuccess) {
        onSuccess(resultData);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Record Payment
                <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {invoice?.invoiceNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Collect fees and issue receipt update</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Patient Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                {invoice?.patient?.fullName?.charAt(0) || 'P'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{invoice?.patient?.fullName}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {invoice?.patient?.uhid} • {invoice?.patient?.phone}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total Billed
              </span>
              <span className="text-sm font-bold text-slate-800">
                ₹{(invoice?.totalAmount || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Balance Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <span className="text-[11px] font-medium text-emerald-700 block">Already Paid</span>
              <span className="text-base font-bold text-emerald-800">
                ₹{(invoice?.paidAmount || 0).toFixed(2)}
              </span>
            </div>
            <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl">
              <span className="text-[11px] font-medium text-rose-700 block">Remaining Due</span>
              <span className="text-base font-bold text-rose-800">
                ₹{remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Payment Amount (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-xl shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={remainingBalance}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                required
                className="block w-full pl-8 pr-28 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-base"
                placeholder="0.00"
              />
              <div className="absolute inset-y-0 right-1 flex items-center pr-1">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(remainingBalance)}
                  className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg font-bold transition-colors"
                >
                  Pay Full
                </button>
              </div>
            </div>

            {/* Quick Helper buttons */}
            {remainingBalance > 100 && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleQuickAmount(Math.round(remainingBalance / 2))}
                  className="text-[11px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                >
                  50% (₹{(remainingBalance / 2).toFixed(2)})
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAmount(remainingBalance)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                >
                  100% (₹{remainingBalance.toFixed(2)})
                </button>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Payment Mode <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transaction Reference / Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Transaction Reference / Cheque / Notes
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder={
                paymentMethod === 'UPI'
                  ? 'e.g. UPI Ref / GooglePay / PhonePe Txn ID'
                  : paymentMethod === 'CARD'
                  ? 'e.g. Last 4 digits / POS Slip No.'
                  : 'e.g. Counter Cash Drawer No. / Note'
              }
              className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || remainingBalance <= 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment of ₹{parseFloat(amount || 0).toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
