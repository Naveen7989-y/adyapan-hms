import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  FileText,
  Stethoscope,
  Calendar,
  User,
  HeartPulse,
  Activity,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  FileDown,
} from 'lucide-react';
import api from '../../services/api';
import { downloadAuthenticatedFile } from '../../utils/fileDownloader';

export default function PrescriptionPrintModal({ prescriptionId, prescriptionData, onClose }) {
  const [prescription, setPrescription] = useState(prescriptionData || null);
  const [loading, setLoading] = useState(!prescriptionData);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    if (!prescriptionData && prescriptionId) {
      const fetchPrescription = async () => {
        setLoading(true);
        try {
          const res = await api.get(`/prescriptions/${prescriptionId}`);
          const rx = res.data?.prescription || res.data || res;
          setPrescription(rx);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load prescription');
        } finally {
          setLoading(false);
        }
      };
      fetchPrescription();
    }
  }, [prescriptionId, prescriptionData]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!prescription) return;
    setDownloadingPdf(true);
    try {
      await downloadAuthenticatedFile(
        `/prescriptions/${prescription.id}/pdf`,
        `Prescription-${prescription.prescriptionCode || prescription.id}.pdf`
      );
    } catch (err) {
      alert(`Failed to download PDF: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const patient = prescription?.patient;
  const doctor = prescription?.doctor;
  const hospital = prescription?.hospital;
  const consultation = prescription?.consultation;
  const items = prescription?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-150">
        {/* Modal Top Actions (Hidden during print) */}
        <div className="no-print px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold">
            <FileText className="w-4 h-4 text-brand-400" />
            <span>Digital Medical Prescription Slip</span>
            <span className="bg-slate-800 text-brand-300 font-mono text-[11px] px-2 py-0.5 rounded">
              {prescription?.prescriptionCode || 'RX-SLIP'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              disabled={loading || !prescription || downloadingPdf}
              className="inline-flex items-center px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold shadow transition-all"
              title="Download Server-Generated PDF"
            >
              {downloadingPdf ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
              ) : (
                <FileDown className="w-3.5 h-3.5 mr-1.5 text-brand-400" />
              )}
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={loading || !prescription}
              className="inline-flex items-center px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Slip
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content / Printable Area */}
        <div className="overflow-y-auto p-6 sm:p-10 flex-1 bg-white" ref={printRef}>
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading medical prescription...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 text-center">
              {error}
            </div>
          ) : prescription ? (
            <div className="prescription-slip border border-slate-300 rounded-2xl p-8 bg-white shadow-sm space-y-6">
              {/* 1. Hospital Letterhead */}
              <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b-2 border-slate-900 gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <img
                      src="/adyapan-logo.png"
                      alt="Adyapan Hospital Logo"
                      className="w-11 h-11 rounded-full object-contain shadow-sm filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.2)]"
                    />
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                        {hospital?.name || 'Adyapan Central Hospital & Clinic'}
                      </h1>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Advanced Clinical Care • Electronic Health Records • Accreditation #ADY-MED-9921
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                    <div>{hospital?.address || '742 Healthcare Avenue, Medical Enclave, Central City'}</div>
                    <div>Emergency: {hospital?.phone || '+91 98765 00001'} | Email: {hospital?.email || 'care@adyapan.com'}</div>
                  </div>
                </div>

                <div className="text-right sm:self-center">
                  <div className="text-3xl font-black font-serif text-brand-700 tracking-wider">℞</div>
                  <div className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 mt-1">
                    {prescription.prescriptionCode}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Issued: {new Date(prescription.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* 2. Doctor & Patient Demographics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/75 p-4 rounded-xl border border-slate-200 text-xs">
                {/* Doctor Column */}
                <div className="border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prescribing Physician</div>
                  <div className="text-sm font-bold text-slate-900">
                    {doctor?.user?.name || 'Dr. Rajesh Sharma'}
                  </div>
                  <div className="text-slate-600 font-medium">
                    {doctor?.specialization || 'Senior Consultant Physician (MBBS, MD)'}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Department: <span className="font-semibold text-slate-700">{doctor?.department?.name || 'General Medicine'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Reg No: MED-{doctor?.id?.substring(0, 8).toUpperCase()}
                  </div>
                </div>

                {/* Patient Column */}
                <div className="space-y-1 md:pl-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Demographics</div>
                  <div className="text-sm font-bold text-slate-900">
                    {patient?.fullName}
                  </div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    UHID: <span className="font-bold text-slate-800">{patient?.uhid}</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Age / Gender: <span className="font-semibold text-slate-700">{patient?.age || 'Adult'} yrs</span> / <span className="font-semibold text-slate-700">{patient?.gender}</span>
                    {patient?.bloodGroup && <span className="ml-2 font-semibold text-red-600">({patient.bloodGroup})</span>}
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Contact: {patient?.phone}
                  </div>
                </div>
              </div>

              {/* 3. Clinical Vitals & Diagnosis Banner */}
              {consultation && (
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Primary Clinical Diagnosis
                    </span>
                    <span className="text-sm font-bold text-emerald-950">
                      {consultation.diagnosis || 'Clinical evaluation completed'}
                    </span>
                    {consultation.symptoms && (
                      <div className="text-[11px] text-emerald-800/80 mt-0.5">
                        <span className="font-semibold">Complaints:</span> {consultation.symptoms}
                      </div>
                    )}
                  </div>

                  {consultation.followUpDate && (
                    <div className="sm:text-right flex-shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Next Review / Follow-Up
                      </span>
                      <span className="text-xs font-bold text-slate-800 flex items-center sm:justify-end">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-brand-600" />
                        {new Date(consultation.followUpDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Prescribed Medications Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-lg font-serif text-brand-700 font-black">℞</span>
                    <span>Medications (Rx)</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {items.length} prescribed drug{items.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Medicine & Strength</th>
                        <th className="py-2.5 px-3">Dosage</th>
                        <th className="py-2.5 px-3">Frequency</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Instructions</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {items.map((item, index) => (
                        <tr key={item.id || index} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                            {index + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{item.medicine?.name || item.medicineName}</div>
                            {item.medicine?.genericName && (
                              <div className="text-[10px] text-slate-400 italic">
                                ({item.medicine.genericName})
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {item.dosage}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold rounded text-[11px]">
                              {item.frequency}
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5">(Morn - Aft - Night)</div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-600">
                            {item.duration}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-slate-700 font-medium">{item.instructions}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {item.quantityPrescribed} <span className="text-[10px] font-normal text-slate-400">{item.medicine?.unit?.toLowerCase() || 'units'}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Doctor Advice & Notes */}
              {(prescription.notes || consultation?.advice) && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Physician's Advice & Lifestyle Guidelines
                  </span>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {prescription.notes || consultation?.advice}
                  </p>
                </div>
              )}

              {/* 6. Footer & Digital Signature */}
              <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-500">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Digitally Authenticated Medical Record</span>
                  </div>
                  <div className="text-[10px] text-slate-400 max-w-sm leading-tight">
                    This computer-generated prescription is signed electronically by the licensed medical practitioner and complies with Digital Health Telemedicine & Clinical Establishment Guidelines.
                  </div>
                </div>

                <div className="text-center sm:text-right border-t-2 border-slate-800 pt-2 min-w-[180px]">
                  <div className="font-serif italic font-bold text-slate-900 text-sm">
                    {doctor?.user?.name || 'Dr. Rajesh Sharma'}
                  </div>
                  <div className="text-[10px] text-slate-500">Authorized Signature & Seal</div>
                  <div className="text-[9px] text-slate-400 font-mono">Date: {new Date().toLocaleDateString('en-GB')}</div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Print Stylesheet Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .prescription-slip, .prescription-slip * {
            visibility: visible;
          }
          .prescription-slip {
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
