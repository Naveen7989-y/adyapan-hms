import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="text-5xl font-extrabold text-slate-300 mb-4">404</div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">Module or Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        This route is either scheduled for a subsequent development phase or does not exist.
      </p>
      <Link
        to="/"
        className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;
