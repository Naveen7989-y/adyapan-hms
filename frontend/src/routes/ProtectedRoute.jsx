import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Super Admin can access all authorized hospital routes
  if (allowedRoles && allowedRoles.length > 0 && user?.role !== 'SUPER_ADMIN') {
    if (!allowedRoles.includes(user?.role)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
