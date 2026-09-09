import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  FileCheck,
  CheckCircle2,
  Building2,
  Calendar,
  User,
  ShieldCheck,
  Pill,
} from 'lucide-react';
import api from '../../services/api';

export default function PharmacyReceiptModal({ dispenseId, dispenseData, onClose }) {
  const [dispense, setDispense] = useState(dispenseData || null);
  const [loading, setLoading] = useState(!dispenseData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!dispenseData && dispenseId) {
      const fetchDispense = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/pharmacy/dispenses/${dispenseId}`);
          const data = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
          setDispense(data);
        } catch (err) {
          setError(err.message || err.response?.data?.message || 'Failed to load dispense receipt');
        } finally {
          setLoading(false);
        }
      };
      fetchDispense();
    }
  }, [dispenseId, dispenseData]);

  const handlePrint = () => {
    window.print();
  };

  const hospital = dispense?.hospital;
  const prescription = dispense?.prescription;
  const patient = prescription?.patient;
  const doctor = prescription?.doctor;
  const pharmacist = dispense?.pharmacist;
  const items = dispense?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-150">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <FileCheck className="w-4 h-4 text-emerald-400" />
            <span>Pharmacy Dispense Receipt & Cash Memo</span>
            <span className="bg-slate-800 text-emerald-300 font-mono text-[11px] px-2 py-0.5 rounded">
              {dispense?.id?.substring(0, 8).toUpperCase() || 'RECEIPT'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              disabled={loading || !dispense}
              className="inline-flex items-center px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content / Printable Receipt */}
        <div className="overflow-y-auto p-6 sm:p-8 flex-1 bg-white">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading receipt details...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-center">
              {error}
            </div>
          ) : dispense ? (
            <div className="receipt-slip border border-slate-300 rounded-2xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
              {/* 1. Hospital Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start pb-4 border-b-2 border-slate-900 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow">
                      ☤
                    </div>
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                        {hospital?.name || 'Adyapan Central Hospital & Clinic'}
                      </h1>
                      <div className="text-[11px] text-emerald-800 font-semibold uppercase tracking-wider">
                        Licensed In-House Hospital Pharmacy • Tax Invoice / Cash Memo
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                    <div>{hospital?.address || '742 Healthcare Avenue, Medical Enclave, Central City'}</div>
                    <div>Ph: {hospital?.phone || '+91 98765 00001'} | Pharmacy License: #DL-2026-ADY-09</div>
                  </div>
                </div>

                <div className="text-left sm:text-right sm:self-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Receipt Number
                  </span>
                  <div className="text-sm font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                    DISP-{dispense.id.substring(0, 8).toUpperCase()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Date: {new Date(dispense.createdAt).toLocaleString('en-GB')}
                  </div>
                </div>
              </div>

              {/* 2. Patient & Prescriber Demographics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Details</div>
                  <div className="text-sm font-bold text-slate-900">{patient?.fullName}</div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    UHID: <span className="font-bold text-slate-800">{patient?.uhid}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Contact: {patient?.phone} | Gender/Age: {patient?.gender}, {patient?.age || 'Adult'}y
                  </div>
                </div>

                <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prescription & Doctor</div>
                  <div className="text-xs font-mono font-bold text-brand-700">
                    Rx Code: {prescription?.prescriptionCode}
                  </div>
                  <div className="text-slate-800 font-medium">
                    Dr: {doctor?.user?.name} ({doctor?.department?.name || 'General Medicine'})
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Dispensing Pharmacist: <span className="font-semibold text-slate-700">{pharmacist?.name || 'Staff Pharmacist'}</span>
                  </div>
                </div>
              </div>

              {/* 3. Dispensed Medicines Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                  <span>Dispensed Medication Items</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {items.length} item{items.length !== 1 ? 's' : ''} fulfilled
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Medicine Formulation</th>
                        <th className="py-2.5 px-3">Batch No</th>
                        <th className="py-2.5 px-3">Expiry</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.medicineBatch?.medicine?.name}
                            {item.medicineBatch?.medicine?.genericName && (
                              <div className="text-[10px] text-slate-400 font-normal italic">
                                ({item.medicineBatch.medicine.genericName})
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                            {item.medicineBatch?.batchNumber}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                            {item.medicineBatch?.expiryDate
                              ? new Date(item.medicineBatch.expiryDate).toLocaleDateString('en-GB', {
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            ₹{item.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹{item.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Total Calculation Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-64 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{dispense.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Healthcare GST (0%):</span>
                    <span className="font-mono">₹0.00</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-700 font-black">
                      ₹{dispense.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Footer & Verification */}
              <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs text-slate-400">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pharmacy Dispense Verified & Stock Deducted</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Medicines once sold cannot be returned without original cash memo. Keep away from direct sunlight.
                  </div>
                </div>

                <div className="text-center sm:text-right border-t border-slate-400 pt-1 min-w-[150px]">
                  <div className="font-medium text-slate-700 text-xs">
                    {pharmacist?.name || 'Chief Pharmacist'}
                  </div>
                  <div className="text-[10px] text-slate-400">Authorized Pharmacist Signature</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-slip, .receipt-slip * {
            visibility: visible;
          }
          .receipt-slip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
