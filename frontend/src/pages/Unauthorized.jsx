import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F1E7] dark:bg-[#070D18] bg-cyber-grid p-6 transition-colors duration-300">
      <div className="max-w-md w-full hms-card p-8 text-center shadow-lg">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-800">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#14243A] dark:text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-[#526174] dark:text-slate-400 mb-4 leading-relaxed">
          Your current account role does not have authorization to view this module.
        </p>

        <div className="p-3 bg-[#FFF9F0] dark:bg-navy-950 rounded-xl border border-[#E6D9C6] dark:border-navy-800 mb-6 text-xs text-[#526174] dark:text-slate-300">
          Current Role: <span className="font-bold text-[#D99A32]">{user?.role || 'Guest'}</span>
        </div>

        <Link
          to="/"
          className="hms-btn-primary px-5 py-2.5"
        >
          <ArrowLeft className="w-4 h-4 text-[#14243A]" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
