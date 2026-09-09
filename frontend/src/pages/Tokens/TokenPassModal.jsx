import React, { useRef } from 'react';
import { X, Printer, Clock } from 'lucide-react';

export default function TokenPassModal({ token, onClose }) {
  const printRef = useRef(null);

  if (!token) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPriorityBadge = (type) => {
    switch (type) {
      case 'EMERGENCY':
        return 'bg-red-100 text-red-700 border-red-300 font-bold animate-pulse';
      case 'PRIORITY':
        return 'bg-amber-100 text-amber-700 border-amber-300 font-medium';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200 font-normal';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <h3 className="text-base font-semibold text-slate-800">Outpatient Token Slip</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Pass Area */}
        <div ref={printRef} className="p-6 space-y-5 print:p-8">
          {/* Hospital Brand Header */}
          <div className="text-center border-b border-dashed border-slate-200 pb-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white font-bold text-lg mb-2 shadow-sm shadow-brand-500/30">
              A
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">ADYAPAN HOSPITAL</h2>
            <p className="text-xs text-slate-500">Outpatient Queue & Token System</p>
          </div>

          {/* Big Token Number Card */}
          <div className="text-center py-4 px-6 bg-gradient-to-b from-brand-50 to-white rounded-xl border border-brand-100 shadow-sm">
            <span className="text-xs font-semibold tracking-wider text-brand-700 uppercase">Your Token Number</span>
            <div className="text-5xl font-black text-brand-600 tracking-tight my-1 font-mono">
              {token.formattedToken || `T-${String(token.tokenNumber).padStart(3, '0')}`}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getPriorityBadge(token.tokenType)}`}>
                {token.tokenType} QUEUE
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Status: <span className="text-slate-700 font-semibold">{token.status}</span>
              </span>
            </div>
          </div>

          {/* Key Queue Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="flex items-center justify-center text-slate-500 mb-1">
                <Clock className="w-4 h-4 mr-1 text-brand-600" />
                <span className="text-xs font-medium">Queue Position</span>
              </div>
              <div className="text-xl font-bold text-slate-800">
                #{token.queuePosition || 1}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
              <div className="flex items-center justify-center text-slate-500 mb-1">
                <Clock className="w-4 h-4 mr-1 text-emerald-600" />
                <span className="text-xs font-medium">Est. Wait Time</span>
              </div>
              <div className="text-xl font-bold text-slate-800">
                ~{token.estimatedWaitMins ?? 0} <span className="text-xs font-normal text-slate-500">mins</span>
              </div>
            </div>
          </div>

          {/* Patient & Doctor Details */}
          <div className="bg-slate-50/75 p-4 rounded-xl space-y-2.5 text-xs border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient Name:</span>
              <span className="font-semibold text-slate-800">{token.patient?.fullName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">UHID:</span>
              <span className="font-mono font-medium text-slate-700">{token.patient?.uhid || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone:</span>
              <span className="text-slate-700">{token.patient?.phone || 'N/A'}</span>
            </div>
            <div className="border-t border-slate-200/60 pt-2 flex justify-between">
              <span className="text-slate-500">Consulting Doctor:</span>
              <span className="font-semibold text-brand-700">
                {token.doctor?.user?.name || 'Assigned Physician'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <span className="text-slate-700">{token.department?.name || 'General Clinic'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time Issued:</span>
              <span className="text-slate-600">
                {new Date(token.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(token.queueDate || Date.now()).toLocaleDateString()})
              </span>
            </div>
          </div>

          {/* Instructions Footer */}
          <div className="text-center text-[11px] text-slate-400 border-t border-dashed border-slate-200 pt-3">
            Please watch the Queue TV Display or listen for your token announcement.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Print Token Slip
          </button>
        </div>
      </div>
    </div>
  );
}
