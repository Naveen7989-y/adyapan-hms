import React, { useState } from 'react';
import { Phone, Activity, Tv, Search, X, ChevronUp, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const QuickAssistWidget = ({ onQuickTrack }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const emergencyNumber = '+91 800 425-9999';

  const handleCopyPhone = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('+918004259999');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[990] flex flex-col items-end">
      {/* Expanded Quick Assist Panel */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-3xl bg-[#FFFCF7] dark:bg-navy-950/95 text-[#14243A] dark:text-white backdrop-blur-xl border border-[#E6D9C6] dark:border-amber-400/50 shadow-xl dark:shadow-2xl p-5 animate-hud-popup overflow-hidden transition-colors duration-300">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E6D9C6] dark:border-navy-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#FFF9F0] dark:bg-amber-500/20 text-[#D99A32] dark:text-amber-400 flex items-center justify-center border border-[#E6D9C6] dark:border-amber-400/30">
                <Activity className="w-4 h-4 animate-continuous-heartbeat text-[#D99A32] dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#14243A] dark:text-white">OPD & Patient Assist</h4>
                <p className="text-[10px] text-[#B97B20] dark:text-amber-300 font-mono font-bold">Live Hospital Triage Hub</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-[#526174] hover:text-[#14243A] hover:bg-[#FFF9F0] dark:text-slate-400 dark:hover:text-white dark:hover:bg-navy-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body actions */}
          <div className="py-4 space-y-2.5">
            {/* 1. Emergency Dial */}
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center animate-pulse">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-rose-700 dark:text-rose-300 block">
                    24/7 Trauma Emergency
                  </span>
                  <a
                    href="tel:+918004259999"
                    className="text-xs font-mono font-bold text-[#14243A] dark:text-white hover:underline"
                  >
                    {emergencyNumber}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyPhone}
                className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-[10px] font-bold text-rose-800 border border-rose-300 dark:bg-rose-900/80 dark:hover:bg-rose-800 dark:text-rose-200 dark:border-rose-400/30 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* 2. Public Live Hall TV Display */}
            <Link
              to="/queue/tv"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9F0] hover:bg-[#FFFCF7] border border-[#E6D9C6] text-[#14243A] hover:border-[#D99A32] dark:bg-navy-900 dark:hover:bg-navy-850 dark:border-amber-400/30 dark:text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFFCF7] dark:bg-amber-500/20 text-[#D99A32] dark:text-amber-400 flex items-center justify-center border border-[#E6D9C6] dark:border-transparent">
                  <Tv className="w-4 h-4 group-hover:scale-110 transition-transform text-[#D99A32] dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#14243A] dark:text-white block">
                    Public Hall TV Display
                  </span>
                  <span className="text-[10px] text-[#526174] dark:text-slate-400">
                    Full-screen live calling tokens & chimes
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#D99A32] dark:text-amber-400 group-hover:translate-x-1 transition-transform" />
            </Link>

            {/* 3. Quick Queue Lookup */}
            <a
              href="#token-tracker"
              onClick={() => {
                setIsOpen(false);
                if (onQuickTrack) onQuickTrack('GEN-001');
              }}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF9F0] hover:bg-[#FFFCF7] border border-[#E6D9C6] text-[#14243A] hover:border-[#D99A32] dark:bg-navy-900 dark:hover:bg-navy-850 dark:border-slate-700 dark:text-white transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFFCF7] dark:bg-slate-800 text-[#526174] dark:text-slate-200 flex items-center justify-center border border-[#E6D9C6] dark:border-transparent">
                  <Search className="w-4 h-4 group-hover:scale-110 transition-transform text-[#D99A32] dark:text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#14243A] dark:text-white block">
                    Track Your Token Status
                  </span>
                  <span className="text-[10px] text-[#526174] dark:text-slate-400">
                    Check your live chamber queue position
                  </span>
                </div>
              </div>
              <ChevronUp className="w-4 h-4 text-[#526174] dark:text-slate-400 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>

          {/* Footer note */}
          <div className="pt-2 border-t border-[#E6D9C6] dark:border-navy-900 flex items-center justify-between text-[10px] text-[#526174] dark:text-slate-400">
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="w-3 h-3 text-[#D99A32] dark:text-amber-400" />
              OPD Hours: 8:00 AM - 8:00 PM
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              All 6 Chambers Open
            </span>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#D99A32] hover:bg-[#B97B20] text-[#14243A] font-extrabold shadow-md border border-[#B97B20]/40 dark:bg-gradient-to-r dark:from-amber-600 dark:via-amber-500 dark:to-amber-600 dark:text-navy-950 dark:font-black dark:border-amber-300 dark:shadow-gold-glow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#14243A] dark:bg-navy-950"></span>
        </span>
        <Activity className="w-5 h-5 text-[#14243A] dark:text-navy-950 animate-continuous-heartbeat" />
        <span className="text-xs font-black tracking-wide hidden sm:inline-block">
          {isOpen ? 'Close Assist Hub' : 'Live OPD & Emergency'}
        </span>
      </button>
    </div>
  );
};

export default QuickAssistWidget;
