import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PatientAuthProvider } from './context/PatientAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import PatientProtectedRoute from './routes/PatientProtectedRoute';
import Layout from './components/common/Layout';

// Public pages dynamically code-split for lightning-fast mobile First Contentful Paint
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const PatientLogin = lazy(() => import('./pages/Patient/PatientLogin'));
const PatientPortal = lazy(() => import('./pages/Patient/PatientPortal'));

// Dynamic code-splitting for secondary, administrative, and clinical modules
const Dashboard = lazy(() => import('./pages/Dashboard'));
const HealthCheck = lazy(() => import('./pages/HealthCheck'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const UsersList = lazy(() => import('./pages/UsersList'));
const PatientsList = lazy(() => import('./pages/Patients/PatientsList'));
const PatientRegistration = lazy(() => import('./pages/Patients/PatientRegistration'));
const PatientDetail = lazy(() => import('./pages/Patients/PatientDetail'));
const DepartmentsList = lazy(() => import('./pages/Departments/DepartmentsList'));
const DoctorsList = lazy(() => import('./pages/Doctors/DoctorsList'));
const AppointmentsList = lazy(() => import('./pages/Appointments/AppointmentsList'));
const NotificationsList = lazy(() => import('./pages/Notifications/NotificationsList'));
const CheckInTokens = lazy(() => import('./pages/Tokens/CheckInTokens'));
const LiveQueue = lazy(() => import('./pages/Queue/LiveQueue'));
const QueueTvDisplay = lazy(() => import('./pages/Queue/QueueTvDisplay'));
const ConsultationsList = lazy(() => import('./pages/Consultations/ConsultationsList'));
const PrescriptionsList = lazy(() => import('./pages/Prescriptions/PrescriptionsList'));
const PharmacyDashboard = lazy(() => import('./pages/Pharmacy/PharmacyDashboard'));
const BillingDashboard = lazy(() => import('./pages/Billing/BillingDashboard'));
const ReportsDashboard = lazy(() => import('./pages/Reports/ReportsDashboard'));
const NotFound = lazy(() => import('./pages/NotFound'));

function PageLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-600 rounded-full animate-spin" />
        <span className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">Loading module...</span>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PatientAuthProvider>
          <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/patient/login" element={<PatientLogin />} />
          <Route
            path="/patient/portal"
            element={
              <PatientProtectedRoute>
                <PatientPortal />
              </PatientProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/queue/tv" element={<QueueTvDisplay />} />

          {/* Protected Staff Routes */}
          <Route
            element={
              <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/health-check" element={<HealthCheck />} />

          {/* Admin Only: Staff & Role Management */}
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN']}>
                <UsersList />
              </ProtectedRoute>
            }
          />

          {/* Departments Management */}
          <Route
            path="departments"
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST']}
              >
                <DepartmentsList />
              </ProtectedRoute>
            }
          />

          {/* Doctors & Dynamic Schedules */}
          <Route
            path="doctors"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'RECEPTIONIST',
                  'DOCTOR',
                  'NURSE_ASSISTANT',
                ]}
              >
                <DoctorsList />
              </ProtectedRoute>
            }
          />

          {/* Appointment Booking & Management */}
          <Route
            path="appointments"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'RECEPTIONIST',
                  'DOCTOR',
                  'NURSE_ASSISTANT',
                ]}
              >
                <AppointmentsList />
              </ProtectedRoute>
            }
          />

          {/* Notifications Outbox & Delivery Logs */}
          <Route
            path="notifications"
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST']}
              >
                <NotificationsList />
              </ProtectedRoute>
            }
          />

          {/* Patient Check-In & Digital Tokens */}
          <Route
            path="tokens"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'RECEPTIONIST',
                  'DOCTOR',
                  'NURSE_ASSISTANT',
                ]}
              >
                <CheckInTokens />
              </ProtectedRoute>
            }
          />
          <Route
            path="checkin"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'RECEPTIONIST',
                  'DOCTOR',
                  'NURSE_ASSISTANT',
                ]}
              >
                <CheckInTokens />
              </ProtectedRoute>
            }
          />

          {/* Live Queue & Calling Desk */}
          <Route
            path="queue"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'RECEPTIONIST',
                  'DOCTOR',
                  'NURSE_ASSISTANT',
                ]}
              >
                <LiveQueue />
              </ProtectedRoute>
            }
          />

          {/* Doctor Consultation Workstation & Visits */}
          <Route
            path="consultations"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'DOCTOR',
                  'NURSE_ASSISTANT',
                ]}
              >
                <ConsultationsList />
              </ProtectedRoute>
            }
          />

          {/* Digital Prescriptions */}
          <Route
            path="prescriptions"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'DOCTOR',
                  'PHARMACIST',
                  'NURSE_ASSISTANT',
                  'RECEPTIONIST',
                ]}
              >
                <PrescriptionsList />
              </ProtectedRoute>
            }
          />

          {/* Pharmacy & Inventory Management */}
          <Route
            path="pharmacy"
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST']}
              >
                <PharmacyDashboard />
              </ProtectedRoute>
            }
          />

          {/* Billing & Invoicing */}
          <Route
            path="billing"
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']}
              >
                <BillingDashboard />
              </ProtectedRoute>
            }
          />

          {/* Reports & Hospital Analytics */}
          <Route
            path="reports"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'ACCOUNTANT',
                  'PHARMACIST',
                  'DOCTOR',
                  'RECEPTIONIST',
                ]}
              >
                <ReportsDashboard />
              </ProtectedRoute>
            }
          />

          {/* Patient Management */}
          <Route
            path="patients"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'RECEPTIONIST',
                  'DOCTOR',
                  'NURSE_ASSISTANT',
                  'PHARMACIST',
                  'ACCOUNTANT',
                ]}
              >
                <PatientsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="patients/new"
            element={
              <ProtectedRoute
                allowedRoles={['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'NURSE_ASSISTANT']}
              >
                <PatientRegistration />
              </ProtectedRoute>
            }
          />

          <Route
            path="patients/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SUPER_ADMIN',
                  'HOSPITAL_ADMIN',
                  'RECEPTIONIST',
                  'DOCTOR',
                  'NURSE_ASSISTANT',
                  'PHARMACIST',
                  'ACCOUNTANT',
                ]}
              >
                <PatientDetail />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
        </Routes>
      </Suspense>
      </PatientAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
