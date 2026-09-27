import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Ticket,
  UserCheck,
  UserPlus,
  Clock,
  Search,
  RefreshCw,
  Printer,
  CheckCircle2,
  PhoneCall,
  Play,
  HeartPulse,
} from 'lucide-react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import WalkInTokenModal from './WalkInTokenModal';
import TokenPassModal from './TokenPassModal';

export default function CheckInTokens() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'checkin';
  const [activeTab, setActiveTab] = useState(initialTab); // 'checkin' | 'waiting' | 'tokens'
  const [bookedAppointments, setBookedAppointments] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [stats, setStats] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modals
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [selectedPassToken, setSelectedPassToken] = useState(null);

  // Check-in priority selection per appointment
  const [checkInPriorityMap, setCheckInPriorityMap] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Load Stats
      const statsRes = await api.get('/tokens/stats');
      setStats(statsRes.data || statsRes);

      // 2. Load Booked Appointments for Check-in
      const bookedRes = await api.get(`/checkin/today-appointments?doctorId=${doctorFilter}&search=${encodeURIComponent(search)}`);
      const bookedList = Array.isArray(bookedRes.data)
        ? bookedRes.data
        : Array.isArray(bookedRes)
        ? bookedRes
        : bookedRes.data?.appointments || [];
      setBookedAppointments(bookedList);

      // 3. Load Tokens Queue
      let tokenUrl = `/tokens?doctorId=${doctorFilter}&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') tokenUrl += `&status=${statusFilter}`;
      if (typeFilter !== 'ALL') tokenUrl += `&tokenType=${typeFilter}`;

      const tokensRes = await api.get(tokenUrl);
      const tokenList = Array.isArray(tokensRes.data)
        ? tokensRes.data
        : Array.isArray(tokensRes)
        ? tokensRes
        : tokensRes.data?.tokens || [];
      setTokens(tokenList);

      // 4. Load Doctors for filter dropdown
      if (doctors.length === 0) {
        const docsRes = await api.get('/doctors');
        const docList = Array.isArray(docsRes.data)
          ? docsRes.data
          : Array.isArray(docsRes)
          ? docsRes
          : docsRes.data?.doctors || [];
        setDoctors(docList);
      }
    } catch (err) {
      console.error('Failed to fetch token/check-in data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load queue data');
    } finally {
      setLoading(false);
    }
  }, [doctorFilter, search, statusFilter, typeFilter, doctors.length]);

  useEffect(() => {
    loadData();

    // Socket.IO real-time subscription for reception check-in updates
    const socket = getSocket({ onReconnect: loadData });
    const handleUpdate = () => loadData();

    socket.on('queue:checkin', handleUpdate);
    socket.on('queue:called', handleUpdate);
    socket.on('queue:status_changed', handleUpdate);
    socket.on('queue:transferred', handleUpdate);

    return () => {
      socket.off('queue:checkin', handleUpdate);
      socket.off('queue:called', handleUpdate);
      socket.off('queue:status_changed', handleUpdate);
      socket.off('queue:transferred', handleUpdate);
    };
  }, [loadData]);

  // Handle appointment check-in
  const handleCheckIn = async (appointmentId) => {
    const appt = bookedAppointments.find((a) => a.id === appointmentId);
    if (appt) {
      const alreadyActive = tokens.find(
        (t) =>
          ['WAITING', 'CALLED', 'IN_CONSULTATION'].includes(t.status) &&
          (t.patientId === appt.patientId ||
            (appt.patient?.uhid && t.patient?.uhid === appt.patient?.uhid))
      );
      if (alreadyActive) {
        alert(
          `Cannot check in: Patient "${appt.patient?.fullName}" (${appt.patient?.uhid || ''}) is already checked in with active Token #${
            alreadyActive.formattedToken || 'T-' + alreadyActive.tokenNumber
          } (Status: ${alreadyActive.status}). Same person cannot be checked in at the same time.`
        );
        return;
      }
    }

    const priority = checkInPriorityMap[appointmentId] || 'NORMAL';
    try {
      const res = await api.post('/checkin', {
        appointmentId,
        tokenType: priority,
      });

      const tokenData = res.data || res;
      if (res.success || tokenData?.formattedToken || tokenData?.tokenNumber) {
        const tokenCode = tokenData.formattedToken || `T-${String(tokenData.tokenNumber).padStart(3, '0')}`;
        setActionSuccessMsg(`Checked in! Issued Token: ${tokenCode}. Patient added to Waiting Lounge.`);
        setSelectedPassToken(tokenData);
        await loadData();
        handleTabChange('waiting');
        setTimeout(() => setActionSuccessMsg(''), 5000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Check-in failed');
    }
  };

  // Handle token status update (CALLED, IN_CONSULTATION, COMPLETED, SKIPPED, CANCELLED)
  const handleStatusUpdate = async (tokenId, newStatus) => {
    try {
      const res = await api.patch(`/tokens/${tokenId}/status`, { status: newStatus });
      if (res.success || res.data) {
        setActionSuccessMsg(`Token updated to ${newStatus}`);
        loadData();
        setTimeout(() => setActionSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Status update failed');
    }
  };

  const getPriorityBadgeClass = (type) => {
    switch (type) {
      case 'EMERGENCY':
        return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'PRIORITY':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'WAITING':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CALLED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse font-semibold';
      case 'IN_CONSULTATION':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'SKIPPED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const waitingTokens = tokens.filter((t) => t.status === 'WAITING');

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Ticket className="w-4 h-4" />
            <span>Patient Intake</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Check-In & Digital Tokens
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sequential token issuance, triage prioritization, appointment arrival check-in, and printable slips.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowWalkInModal(true)}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Issue Walk-In Token
          </button>
        </div>
      </div>

      {/* Action Toast */}
      {actionSuccessMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-500 text-xs font-medium">Total Issued Today</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{stats?.total ?? 0}</div>
        </div>
        <div
          onClick={() => handleTabChange('waiting')}
          className="p-4 bg-amber-50/50 hover:bg-amber-50 rounded-xl border-2 border-amber-300 shadow-sm cursor-pointer transition-all hover:scale-[1.01]"
        >
          <div className="text-amber-800 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Waiting in Lounge
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{stats?.waiting ?? waitingTokens.length}</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-indigo-600 text-xs font-medium">In Consultation</div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{stats?.inConsultation ?? 0}</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-emerald-600 text-xs font-medium">Consultations Done</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats?.completed ?? 0}</div>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
          <div className="text-red-600 text-xs font-medium flex items-center">
            <HeartPulse className="w-3.5 h-3.5 mr-1 text-red-500 animate-pulse" />
            Emergency Cases
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1">{stats?.emergency ?? 0}</div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => handleTabChange('checkin')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all flex-shrink-0 ${
            activeTab === 'checkin'
              ? 'border-brand-600 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Check-In Desk ({bookedAppointments.length} Booked Ready)</span>
        </button>

        <button
          onClick={() => handleTabChange('waiting')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all flex-shrink-0 ${
            activeTab === 'waiting'
              ? 'border-amber-500 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Waiting in Lounge ({waitingTokens.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('tokens')}
          className={`pb-3 px-4 text-xs font-semibold flex items-center space-x-2 border-b-2 transition-all flex-shrink-0 ${
            activeTab === 'tokens'
              ? 'border-brand-600 text-brand-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>All Tokens Today ({tokens.length})</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by patient name, phone, UHID, or token number (e.g. T-001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Physicians</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.user?.name}
              </option>
            ))}
          </select>

          {activeTab === 'tokens' && (
            <>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="ALL">All Statuses</option>
                <option value="WAITING">Waiting</option>
                <option value="CALLED">Called</option>
                <option value="IN_CONSULTATION">In Consultation</option>
                <option value="COMPLETED">Completed</option>
                <option value="SKIPPED">Skipped</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="ALL">All Priorities</option>
                <option value="NORMAL">Normal</option>
                <option value="PRIORITY">Priority</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: CHECK-IN DESK (Today's Booked Appointments) */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Today's Booked Appointments Ready for Check-In</h3>
              <p className="text-xs text-slate-500">Patients arriving at the clinic reception to claim their digital token</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full border border-brand-200">
              {bookedAppointments.length} pending check-in
            </span>
          </div>

          {bookedAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-700">No pending appointments ready for check-in</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All scheduled appointments for today have either already checked in or no appointments match the current filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Slot</th>
                    <th className="py-3.5 px-4">Patient Details</th>
                    <th className="py-3.5 px-4">Doctor & Clinic</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4">Triage Priority</th>
                    <th className="py-3.5 px-4 text-right">Check-In Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookedAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                          <Clock className="w-3 h-3 mr-1 text-slate-500" />
                          {appt.timeSlot}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{appt.patient?.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {appt.patient?.uhid} | Ph: {appt.patient?.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{appt.doctor?.user?.name}</div>
                        <div className="text-[11px] text-slate-500">{appt.department?.name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                        {appt.reason || 'General Consultation'}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={checkInPriorityMap[appt.id] || 'NORMAL'}
                          onChange={(e) =>
                            setCheckInPriorityMap({
                              ...checkInPriorityMap,
                              [appt.id]: e.target.value,
                            })
                          }
                          className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="PRIORITY">Priority</option>
                          <option value="EMERGENCY">Emergency</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {tokens.some(
                          (t) =>
                            ['WAITING', 'CALLED', 'IN_CONSULTATION'].includes(t.status) &&
                            (t.patientId === appt.patientId ||
                              (appt.patient?.uhid && t.patient?.uhid === appt.patient?.uhid))
                        ) ? (
                          <span
                            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded-lg cursor-not-allowed"
                            title="Patient is already active in the waiting lounge"
                          >
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                            Already in Lounge
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCheckIn(appt.id)}
                            className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Check In & Issue Token
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WAITING PATIENTS IN LOUNGE */}
      {activeTab === 'waiting' && (
        <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50/70 to-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                <h3 className="text-sm font-bold text-slate-900">Patients Waiting in Lounge</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                  {waitingTokens.length} waiting
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Checked-in patients seated in the waiting area awaiting consultation call
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">
                Live queue synchronized with Doctor Workstation & TV Monitor
              </span>
            </div>
          </div>

          {waitingTokens.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-90" />
              <div className="text-sm font-bold text-slate-800">Lounge is currently clear</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No patients are currently waiting. Check in arriving patients from the Check-In Desk tab or issue walk-in tokens.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Token #</th>
                    <th className="py-3.5 px-4">Patient Information</th>
                    <th className="py-3.5 px-4">Doctor & Clinic</th>
                    <th className="py-3.5 px-4 text-center">Triage Priority</th>
                    <th className="py-3.5 px-4 text-center">Waiting Time</th>
                    <th className="py-3.5 px-4 text-right">Desk Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingTokens.map((t) => {
                    const elapsedMins = Math.max(0, Math.floor((new Date() - new Date(t.createdAt)) / 60000));
                    return (
                      <tr key={t.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-base font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                            {t.formattedToken || `T-${String(t.tokenNumber).padStart(3, '0')}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{t.patient?.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {t.patient?.uhid} {t.patient?.phone ? `| Ph: ${t.patient.phone}` : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{t.doctor?.user?.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {t.department?.name} • {t.doctor?.roomNumber || 'Room 101'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${getPriorityBadgeClass(t.tokenType)}`}>
                            {t.tokenType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-mono">
                            <Clock className="w-3 h-3 mr-1 text-slate-400" />
                            {elapsedMins === 0 ? 'Just now' : `${elapsedMins}m waiting`}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => setSelectedPassToken(t)}
                              title="Print Token Slip"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(t.id, 'CALLED')}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1"
                            >
                              <PhoneCall className="w-3 h-3 mr-0.5" />
                              <span>Call</span>
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(t.id, 'SKIPPED')}
                              className="px-2 py-1 text-amber-700 hover:bg-amber-50 rounded-lg text-[11px] font-medium transition-colors border border-amber-200"
                            >
                              Skip
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Cancel token #${t.formattedToken || t.tokenNumber} for ${t.patient?.fullName}?`)) {
                                  handleStatusUpdate(t.id, 'CANCELLED');
                                }
                              }}
                              title="Cancel duplicate/mistaken token"
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg text-[11px] font-medium transition-colors border border-red-200"
                            >
                              Cancel
                            </button>
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
      )}

      {/* TAB 3: ALL TOKENS TODAY */}
      {activeTab === 'tokens' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Active Outpatient Queue & Digital Tokens</h3>
              <p className="text-xs text-slate-500">Real-time status updates, calling desk, and token slips</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
              {tokens.length} total tokens
            </span>
          </div>

          {tokens.length === 0 ? (
            <div className="p-12 text-center">
              <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <div className="text-sm font-semibold text-slate-700">No tokens issued yet for today</div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Check in arriving patients or issue walk-in tokens above to start populating today's live queue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Token #</th>
                    <th className="py-3.5 px-4">Patient Info</th>
                    <th className="py-3.5 px-4">Assigned Doctor</th>
                    <th className="py-3.5 px-4">Triage Priority</th>
                    <th className="py-3.5 px-4">Live Status</th>
                    <th className="py-3.5 px-4">Issued At</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tokens.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-base font-black text-brand-700">
                          {t.formattedToken || `T-${String(t.tokenNumber).padStart(3, '0')}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{t.patient?.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {t.patient?.uhid} | {t.patient?.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{t.doctor?.user?.name}</div>
                        <div className="text-[11px] text-slate-500">{t.department?.name}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] border ${getPriorityBadgeClass(t.tokenType)}`}>
                          {t.tokenType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${getStatusBadgeClass(t.status)}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center space-x-1.5">
                          {/* Print / View Pass */}
                          <button
                            onClick={() => setSelectedPassToken(t)}
                            title="View / Print Token Pass"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Action by status */}
                          {t.status === 'WAITING' && (
                            <button
                              onClick={() => handleStatusUpdate(t.id, 'CALLED')}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1"
                            >
                              <PhoneCall className="w-3 h-3 mr-0.5" />
                              <span>Call</span>
                            </button>
                          )}

                          {t.status === 'CALLED' && (
                            <button
                              onClick={() => handleStatusUpdate(t.id, 'IN_CONSULTATION')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1"
                            >
                              <Play className="w-3 h-3 mr-0.5" />
                              <span>Consult</span>
                            </button>
                          )}

                          {t.status === 'IN_CONSULTATION' && (
                            <button
                              onClick={() => handleStatusUpdate(t.id, 'COMPLETED')}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-lg text-[11px] font-semibold transition-colors flex items-center space-x-1"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" />
                              <span>Done</span>
                            </button>
                          )}

                          {(t.status === 'WAITING' || t.status === 'CALLED') && (
                            <button
                              onClick={() => handleStatusUpdate(t.id, 'SKIPPED')}
                              className="px-2 py-1 text-amber-700 hover:bg-amber-50 rounded-lg text-[11px] font-medium transition-colors"
                            >
                              Skip
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showWalkInModal && (
        <WalkInTokenModal
          existingTokens={tokens}
          onClose={() => setShowWalkInModal(false)}
          onSuccess={async (token) => {
            setShowWalkInModal(false);
            setSelectedPassToken(token);
            const tokenCode = token?.formattedToken || (token?.tokenNumber ? `T-${String(token.tokenNumber).padStart(3, '0')}` : 'Generated');
            setActionSuccessMsg(`Walk-in token issued: ${tokenCode}. Patient added to Waiting Lounge.`);
            await loadData();
            handleTabChange('waiting');
            setTimeout(() => setActionSuccessMsg(''), 5000);
          }}
        />
      )}

      {selectedPassToken && (
        <TokenPassModal
          token={selectedPassToken}
          onClose={() => setSelectedPassToken(null)}
        />
      )}
    </div>
  );
}
