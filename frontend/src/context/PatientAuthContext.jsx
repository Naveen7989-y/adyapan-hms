import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { getPatientMe, sendPatientOtp, verifyPatientOtp } from '../services/patientApi';

const PatientAuthContext = createContext(null);

export const PatientAuthProvider = ({ children }) => {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  const [patient, setPatient] = useState(null);
  const [token, setToken] = useState(() => {
    return sessionStorage.getItem('adyapan_patient_token') || localStorage.getItem('adyapan_patient_token');
  });
  const [loading, setLoading] = useState(true);

  // Permanent clean logout handler
  const logout = useCallback(() => {
    sessionStorage.removeItem('adyapan_patient_token');
    localStorage.removeItem('adyapan_patient_token');
    setToken(null);
    setPatient(null);
  }, []);

  // When patient exits from the patient portal (navigates away to another page)
  useEffect(() => {
    const prevPath = prevPathRef.current;
    const currentPath = location.pathname;
    prevPathRef.current = currentPath;

    // If the patient was on /patient/portal and navigates away to any other page (e.g. /, /login, etc.)
    if (prevPath.startsWith('/patient/portal') && !currentPath.startsWith('/patient/portal')) {
      logout();
    }
  }, [location.pathname, logout]);

  // When visiting homepage (/), guarantee patient session is completely signed out
  useEffect(() => {
    if (location.pathname === '/' && (token || patient)) {
      logout();
    }
  }, [location.pathname, token, patient, logout]);

  // When browser tab or window is closed or unloaded, purge tokens
  useEffect(() => {
    const handlePageExit = () => {
      sessionStorage.removeItem('adyapan_patient_token');
      localStorage.removeItem('adyapan_patient_token');
    };

    window.addEventListener('pagehide', handlePageExit);
    window.addEventListener('beforeunload', handlePageExit);
    return () => {
      window.removeEventListener('pagehide', handlePageExit);
      window.removeEventListener('beforeunload', handlePageExit);
    };
  }, []);

  // Initialize session only if not on the public homepage or login page
  useEffect(() => {
    const initPatientSession = async () => {
      if (window.location.pathname === '/' || window.location.pathname === '/patient/login') {
        logout();
        setLoading(false);
        return;
      }

      const storedToken = sessionStorage.getItem('adyapan_patient_token') || localStorage.getItem('adyapan_patient_token');
      if (storedToken) {
        try {
          const res = await getPatientMe();
          setPatient(res.data);
        } catch (err) {
          console.warn('Patient session invalid or expired:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initPatientSession();
  }, [logout]);

  const requestOtp = async (phone) => {
    const res = await sendPatientOtp(phone);
    return res.data;
  };

  const loginWithOtp = async (phone, otp, patientId) => {
    const res = await verifyPatientOtp(phone, otp, patientId);
    const { token: newToken, patient: newPatient } = res.data;

    // Store in sessionStorage so closing the tab immediately invalidates session
    sessionStorage.setItem('adyapan_patient_token', newToken);
    localStorage.removeItem('adyapan_patient_token'); // Ensure localStorage has no lingering patient token
    setToken(newToken);
    setPatient(newPatient);
    return newPatient;
  };

  const value = {
    patient,
    token,
    isAuthenticated: !!patient,
    loading,
    requestOtp,
    loginWithOtp,
    logout,
  };

  return <PatientAuthContext.Provider value={value}>{children}</PatientAuthContext.Provider>;
};

export const usePatientAuth = () => {
  const context = useContext(PatientAuthContext);
  if (!context) {
    throw new Error('usePatientAuth must be used within a PatientAuthProvider');
  }
  return context;
};

export default PatientAuthContext;
