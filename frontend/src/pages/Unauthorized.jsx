import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          Your current account role does not have authorization to view this module.
        </p>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-6 text-xs text-slate-600">
          Current Role: <span className="font-bold text-sky-700">{user?.role || 'Guest'}</span>
        </div>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
