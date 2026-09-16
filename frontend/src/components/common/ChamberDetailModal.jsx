import React, { useEffect } from 'react';
import { X, Stethoscope, Clock, MapPin, CheckCircle2, ArrowRight, ShieldCheck, Calendar, Phone, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ChamberDetailModal = ({ chamber, isOpen, onClose, onSelectToken }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !chamber) return null;

  const IconComp = chamber.icon || Stethoscope;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/70 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-[#FFFCF7] dark:bg-navy-950 rounded-3xl border border-[#E6D9C6] dark:border-navy-700 shadow-2xl p-6 sm:p-8 z-10 animate-fade-in-scale overflow-hidden transition-colors duration-300">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D99A32]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-[#E6D9C6] dark:border-navy-800 relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#14243A] text-[#D99A32] flex items-center justify-center shadow-md border border-[#D99A32]/30 dark:bg-gradient-to-tr dark:from-navy-950 dark:to-navy-800 dark:text-amber-400">
              <IconComp className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF9F0] dark:bg-amber-950/80 text-[#D99A32] dark:text-amber-300 border border-[#E6D9C6] dark:border-amber-700/60">
                  {chamber.code}
                </span>
                <span className="text-xs font-mono font-bold text-[#14243A] dark:text-slate-200 bg-[#FFF9F0] dark:bg-navy-900 px-2 py-0.5 rounded-md border border-[#E6D9C6] dark:border-navy-700">
                  {chamber.room}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Active Now
                </span>
              </div>
              <h3 className="text-2xl font-black text-[#14243A] dark:text-white mt-1">{chamber.title}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#526174] hover:text-[#14243A] dark:hover:text-white hover:bg-[#FFF9F0] dark:hover:bg-navy-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="py-6 space-y-5">
          {/* Doctor Briefing */}
          <div className="p-4 rounded-2xl bg-[#FFF9F0] dark:bg-navy-900/80 border border-[#E6D9C6] dark:border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#B97B20] dark:text-amber-400">
                Primary Attending Consultant
              </span>
              <h4 className="text-lg font-extrabold text-[#14243A] dark:text-white">{chamber.doctor}</h4>
              <p className="text-xs font-semibold text-[#526174] dark:text-slate-300 mt-0.5">{chamber.degree}</p>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#526174] dark:text-slate-400 block">
                Estimated Queue
              </span>
              <span className="text-base font-black text-[#14243A] dark:text-amber-300 font-mono">
                ~2 to 4 Patients Waiting
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#526174] dark:text-slate-400 mb-1.5">
              Clinical Scope & Capabilities
            </h5>
            <p className="text-sm text-[#526174] dark:text-slate-200 leading-relaxed font-normal">
              {chamber.desc}
            </p>
          </div>

          {/* Clinical Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#FFF9F0] dark:bg-navy-900/60 border border-[#E6D9C6] dark:border-navy-800 shadow-2xs">
              <span className="text-[10px] font-bold text-[#526174] dark:text-slate-400 uppercase tracking-wider block">
                OPD Schedule
              </span>
              <span className="text-xs font-bold text-[#14243A] dark:text-slate-100 block mt-0.5">
                Mon - Sat (8 AM - 4 PM)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFF9F0] dark:bg-navy-900/60 border border-[#E6D9C6] dark:border-navy-800 shadow-2xs">
              <span className="text-[10px] font-bold text-[#526174] dark:text-slate-400 uppercase tracking-wider block">
                Consultation Type
              </span>
              <span className="text-xs font-bold text-[#14243A] dark:text-slate-100 block mt-0.5">
                Walk-in & Token Triage
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#FFF9F0] dark:bg-navy-900/60 border border-[#E6D9C6] dark:border-navy-800 shadow-2xs">
              <span className="text-[10px] font-bold text-[#526174] dark:text-slate-400 uppercase tracking-wider block">
                Room Location
              </span>
              <span className="text-xs font-bold text-[#14243A] dark:text-slate-100 block mt-0.5">
                OPD Wing A, Ground Floor
              </span>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-[#E6D9C6] dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onSelectToken) onSelectToken(`${chamber.code}-001`);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#D99A32] hover:bg-[#B97B20] text-[#14243A] font-extrabold text-xs sm:text-sm shadow-sm dark:bg-gradient-to-r dark:from-amber-600 dark:to-amber-500 dark:text-navy-950 dark:font-black flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-[#14243A] dark:text-amber-200" />
            <span>Check Queue for {chamber.code}-001</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <Link
            to="/login"
            className="w-full sm:w-auto px-4 py-3 rounded-xl border-2 border-[#14243A] bg-[#FFF9F0] hover:bg-[#FFFCF7] text-[#14243A] dark:border-navy-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-navy-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Staff Chamber Desk</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ChamberDetailModal;
