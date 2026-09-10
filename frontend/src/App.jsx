import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/common/Layout';
import Dashboard from './pages/Dashboard';
import HealthCheck from './pages/HealthCheck';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import UsersList from './pages/UsersList';
import PatientsList from './pages/Patients/PatientsList';
import PatientRegistration from './pages/Patients/PatientRegistration';
import PatientDetail from './pages/Patients/PatientDetail';
import DepartmentsList from './pages/Departments/DepartmentsList';
import DoctorsList from './pages/Doctors/DoctorsList';
import AppointmentsList from './pages/Appointments/AppointmentsList';
import NotificationsList from './pages/Notifications/NotificationsList';
import CheckInTokens from './pages/Tokens/CheckInTokens';
import LiveQueue from './pages/Queue/LiveQueue';
import QueueTvDisplay from './pages/Queue/QueueTvDisplay';
import ConsultationsList from './pages/Consultations/ConsultationsList';
import PrescriptionsList from './pages/Prescriptions/PrescriptionsList';
import PharmacyDashboard from './pages/Pharmacy/PharmacyDashboard';
import BillingDashboard from './pages/Billing/BillingDashboard';
import ReportsDashboard from './pages/Reports/ReportsDashboard';
import NotFound from './pages/NotFound';
import Home from './pages/Home';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
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
    </AuthProvider>
  );
}

export default App;
