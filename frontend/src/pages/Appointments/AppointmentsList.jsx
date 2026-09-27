import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  CalendarX,
  Stethoscope,
  Ticket,
  ArrowRight,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BookAppointmentModal from './BookAppointmentModal';
import RescheduleModal from './RescheduleModal';
import CancelModal from './CancelModal';

const STATUS_TABS = [
  { id: '', label: 'All' },
  { id: 'BOOKED', label: 'Booked' },
  { id: 'CHECKED_IN', label: 'Checked In' },
  { id: 'IN_CONSULTATION', label: 'In Consultation' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
  { id: 'EXPIRED', label: 'Expired' },
];

export const AppointmentsList = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals state
  const [showBookModal, setShowBookModal] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [cancelAppointment, setCancelAppointment] = useState(null);
  const [checkingInId, setCheckingInId] = useState(null);
  const [checkInSuccess, setCheckInSuccess] = useState(null);

  const isReceptionOrAdmin = ['RECEPTIONIST', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'NURSE_ASSISTANT'].includes(
    user?.role
  );

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFilter) params.date = dateFilter;
      if (doctorFilter) params.doctorId = doctorFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await api.get('/appointments', { params });
      setAppointments(res.data.appointments || []);
    } catch (err) {
      console.error('Failed to fetch appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAppointments();
    }, 250);
    return () => clearTimeout(delayDebounce);
  }, [dateFilter, doctorFilter, statusFilter, search]);

  const handleCheckIn = async (apt) => {
    setCheckingInId(apt.id);
    try {
      const res = await api.post('/checkin', {
        appointmentId: apt.id,
        tokenType: 'NORMAL',
      });
      if (res.data?.success) {
        const token = res.data.data;
        setCheckInSuccess({
          patientName: apt.patient?.fullName || 'Patient',
          tokenNumber: token.formattedToken,
          doctorName: apt.doctor?.user?.name || 'Physician',
          position: token.position || token.queuePosition || 1,
          estimatedWaitMins: token.estimatedWaitMins || 0,
        });
        fetchAppointments();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Check-in failed');
    } finally {
      setCheckingInId(null);
    }
  };

  const handleQuickStatusChange = async (aptId, newStatus) => {
    try {
      await api.patch(`/appointments/${aptId}/status`, { status: newStatus });
      fetchAppointments();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      BOOKED: 'bg-sky-50 text-sky-700 border-sky-200',
      CHECKED_IN: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      WAITING: 'bg-amber-50 text-amber-700 border-amber-200',
      IN_CONSULTATION: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200 line-through',
      NO_SHOW: 'bg-purple-50 text-purple-700 border-purple-200',
      EXPIRED: 'bg-zinc-100 text-zinc-600 border-zinc-300 line-through',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${
          styles[status] || 'bg-slate-100 text-slate-700'
        }`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-sky-600" />
            <span>Appointment Management</span>
          </h2>
          <p className="text-sm text-slate-500">
            Schedule consultations, manage OPD bookings, and monitor clinic arrival statuses.
          </p>
        </div>

        {isReceptionOrAdmin && (
          <button
            onClick={() => setShowBookModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search patient name, UHID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">All Physicians</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user?.name}
                </option>
              ))}
            </select>

            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-xs text-sky-600 font-semibold hover:underline px-2 py-1"
              >
                Clear Date
              </button>
            )}

            <button
              onClick={fetchAppointments}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
            <span className="text-sm font-medium">Loading appointments...</span>
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No appointments found matching current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Date & Slot</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Patient Details</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Physician & Specialty</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Reason</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((apt) => {
                  const isCancelled = apt.status === 'CANCELLED';
                  const isCompleted = apt.status === 'COMPLETED';

                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 text-sm">
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="inline-flex items-center space-x-1 text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded mt-0.5 border border-sky-200">
                          <Clock className="w-3 h-3 text-sky-600" />
                          <span>{apt.timeSlot}</span>
                        </div>
                      </td>

                      <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{apt.patient?.fullName}</div>
                        <div className="text-xs text-slate-500 font-mono">
                          UHID: {apt.patient?.uhid} • {apt.patient?.phone}
                        </div>
                      </td>

                      <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{apt.doctor?.user?.name}</div>
                        <div className="text-xs text-slate-500">{apt.doctor?.department?.name}</div>
                      </td>

                      <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5 items-start">
                          {getStatusBadge(apt.status)}
                          {apt.token && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded shadow-sm">
                              <Ticket className="w-3 h-3 text-amber-600" />
                              <span>{apt.token.formattedToken || `T-${String(apt.token.tokenNumber).padStart(3, '0')}`} ({apt.token.status})</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 sm:px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate whitespace-nowrap">
                        {apt.reason || '—'}
                      </td>

                      <td className="px-5 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {isReceptionOrAdmin && !apt.token && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCheckIn(apt)}
                              disabled={checkingInId === apt.id}
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-gold transition-all flex items-center gap-1.5 disabled:opacity-50"
                              title="Generate Digital Token and put in Doctor's Queue"
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>{checkingInId === apt.id ? 'Checking In...' : 'Check In (Generate Token)'}</span>
                            </button>
                          )}

                          {apt.token && (
                            <Link
                              to="/queue"
                              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-amber-300 border border-navy-700 shadow-sm transition-all flex items-center gap-1"
                              title="View Patient in Live Doctor Queue"
                            >
                              <span>Live Queue</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          )}

                          {isReceptionOrAdmin && !isCancelled && !isCompleted && !apt.token && (
                            <>
                              <button
                                onClick={() => setRescheduleAppointment(apt)}
                                className="text-xs font-semibold px-2.5 py-1 rounded hover:bg-slate-100 text-slate-600 border border-slate-200"
                              >
                                Reschedule
                              </button>
                              <button
                                onClick={() => setCancelAppointment(apt)}
                                className="text-xs font-semibold px-2.5 py-1 rounded hover:bg-rose-50 text-rose-600 border border-rose-200"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showBookModal && (
        <BookAppointmentModal
          onClose={() => setShowBookModal(false)}
          onBooked={fetchAppointments}
          existingAppointmentsList={appointments}
        />
      )}

      {rescheduleAppointment && (
        <RescheduleModal
          appointment={rescheduleAppointment}
          onClose={() => setRescheduleAppointment(null)}
          onRescheduled={fetchAppointments}
        />
      )}

      {cancelAppointment && (
        <CancelModal
          appointment={cancelAppointment}
          onClose={() => setCancelAppointment(null)}
          onCancelled={fetchAppointments}
        />
      )}

      {/* Check-In Success Digital Token Modal */}
      {checkInSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-navy border border-slate-200 max-w-md w-full p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-gold">
              <Ticket className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                Digital Queue Token Issued
              </span>
              <div className="text-5xl font-black font-mono text-navy-900 tracking-tight my-2">
                {checkInSuccess.tokenNumber}
              </div>
              <h3 className="text-base font-bold text-navy-900">
                {checkInSuccess.patientName}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Assigned to <span className="font-semibold text-slate-700">{checkInSuccess.doctorName}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-beige-50 border border-slate-200 text-xs">
              <div>
                <div className="text-slate-400 font-medium">Queue Position</div>
                <div className="text-lg font-extrabold text-navy-900">#{checkInSuccess.position}</div>
              </div>
              <div>
                <div className="text-slate-400 font-medium">Estimated Wait</div>
                <div className="text-lg font-extrabold text-amber-700">~{checkInSuccess.estimatedWaitMins} mins</div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCheckInSuccess(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Done
              </button>
              <Link
                to="/queue"
                onClick={() => setCheckInSuccess(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold shadow-gold transition-all flex items-center justify-center gap-1.5"
              >
                <span>Go to Live Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
