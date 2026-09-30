import axios from 'axios';

const getBaseUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    if (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('onrender.com')) {
      return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }
    return '/api';
  }
  return import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, '') : '/api';
};

const patientApi = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach patient JWT token on every request
patientApi.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('adyapan_patient_token') || localStorage.getItem('adyapan_patient_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to unwrap data and handle auth expiration
patientApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('adyapan_patient_token');
      localStorage.removeItem('adyapan_patient_token');
      // Redirect to patient login if trying to access protected patient portal
      if (window.location.pathname.startsWith('/patient/portal')) {
        window.location.href = '/patient/login';
      }
    }
    const message = error.response?.data?.message || error.message || 'Network request failed';
    return Promise.reject(new Error(message));
  }
);

// Patient Auth APIs
export const sendPatientOtp = (phone) => patientApi.post('/patient-auth/send-otp', { phone });
export const verifyPatientOtp = (phone, otp, patientId) =>
  patientApi.post('/patient-auth/verify-otp', { phone, otp, patientId });
export const getPatientMe = () => patientApi.get('/patient-auth/me');

// Patient Portal APIs
export const getPatientDashboard = () => patientApi.get('/patient-portal/dashboard');
export const getPatientAppointments = () => patientApi.get('/patient-portal/appointments');
export const cancelPatientAppointment = (id, reason) =>
  patientApi.post(`/patient-portal/appointments/${id}/cancel`, { reason });
export const getPatientPrescriptions = () => patientApi.get('/patient-portal/prescriptions');
export const getPatientTokens = () => patientApi.get('/patient-portal/tokens');
export const getPatientInvoices = () => patientApi.get('/patient-portal/invoices');

// Download Prescription PDF as Blob
export const downloadPrescriptionPdf = async (prescriptionId, prescriptionCode = 'Prescription') => {
  const token = sessionStorage.getItem('adyapan_patient_token') || localStorage.getItem('adyapan_patient_token');
  const apiBase = getBaseUrl();
  const response = await fetch(`${apiBase}/patient-portal/prescriptions/${prescriptionId}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to generate prescription PDF document');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${prescriptionCode}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export default patientApi;
