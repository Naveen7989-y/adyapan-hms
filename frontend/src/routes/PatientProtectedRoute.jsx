import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePatientAuth } from '../context/PatientAuthContext';
import { RefreshCw } from 'lucide-react';

export const PatientProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = usePatientAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Loading Patient Health Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/patient/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PatientProtectedRoute;
