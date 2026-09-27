import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 text-[#334155] dark:text-[#F8FAFC]">
      <div className="text-5xl font-extrabold text-[#0D9488]/40 dark:text-amber-500/30 mb-4 font-mono">404</div>
      <h2 className="text-xl font-bold text-[#334155] dark:text-white mb-2">Module or Page Not Found</h2>
      <p className="text-sm text-[#64748B] dark:text-slate-400 max-w-md mb-6">
        This route is currently unavailable or does not exist.
      </p>
      <Link
        to="/"
        className="hms-btn-primary px-4 py-2 text-sm"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;
