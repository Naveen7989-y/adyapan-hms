import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Stethoscope,
  Users,
  PhoneCall,
  Play,
  CheckCircle2,
  SkipForward,
  ArrowRightLeft,
  Tv,
  RefreshCw,
  Clock,
  AlertTriangle,
  HeartPulse,
  User,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socket';
import TransferTokenModal from './TransferTokenModal';
import ConsultationWorkstationModal from '../Consultations/ConsultationWorkstationModal';

export default function LiveQueue() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [roomNumber, setRoomNumber] = useState('Room 101');
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Transfer modal state
  const [transferToken, setTransferToken] = useState(null);
  // Consultation workstation modal state
  const [consultationToken, setConsultationToken] = useState(null);

  // Active queue tab: 'waiting' | 'skipped' | 'completed'
  const [tab, setTab] = useState('waiting');

  // Futuristic audio visualizer announcement state
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const announcingTimerRef = useRef(null);

  const triggerAnnounceState = () => {
    setIsAnnouncing(true);
    if (announcingTimerRef.current) clearTimeout(announcingTimerRef.current);
    announcingTimerRef.current = setTimeout(() => {
      setIsAnnouncing(false);
    }, 4000);
  };

  // Helper: resolve doctor room number from profile/department
  const getDoctorRoomNumber = (doc) => {
    if (doc?.roomNumber) return doc.roomNumber;
    const deptCode = (doc?.department?.code || '').toUpperCase();
    const deptName = (doc?.department?.name || '').toUpperCase();
    if (deptCode.includes('CARD') || deptName.includes('CARD')) return 'Room 102';
    if (deptCode.includes('PED') || deptName.includes('PED')) return 'Room 103';
    if (deptCode.includes('ORTH') || deptName.includes('ORTH')) return 'Room 104';
    if (deptCode.includes('DENT') || deptName.includes('DENT')) return 'Room 105';
    if (deptCode.includes('NEU') || deptName.includes('NEU')) return 'Room 106';
    return 'Room 101';
  };

  // Load list of doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await api.get('/doctors');
        const docs = Array.isArray(res.data)
          ? res.data
          : (Array.isArray(res)
            ? res
            : (res.data?.doctors || res.data?.data?.doctors || res.data?.data || []));
        setDoctors(docs);

        // Preselect current user's doctor profile if logged in as DOCTOR
        const myDocProfile = docs.find(
          (d) => d.userId === user?.id || (user?.doctor?.id && d.id === user.doctor.id)
        );

        if (myDocProfile) {
          setSelectedDoctorId(myDocProfile.id);
          setRoomNumber(getDoctorRoomNumber(myDocProfile));
        } else if (docs.length > 0 && !selectedDoctorId) {
          setSelectedDoctorId(docs[0].id);
          setRoomNumber(getDoctorRoomNumber(docs[0]));
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
    };
    fetchDoctors();
  }, [user]);

  // Load live queue for selected doctor
  const fetchQueue = useCallback(async () => {
    if (!selectedDoctorId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/queue/doctor/${selectedDoctorId}`);
      const payload = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
      setQueueData(payload);
    } catch (err) {
      console.error('Failed to load doctor queue:', err);
      const msg = err.message || err.response?.data?.message || 'Failed to load live queue';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedDoctorId]);

  useEffect(() => {
    fetchQueue();

    if (!selectedDoctorId) return;

    // Real-time Socket.IO subscription
    const socket = getSocket({ doctorId: selectedDoctorId, onReconnect: fetchQueue });
    socket.emit('subscribe:doctor_queue', { doctorId: selectedDoctorId });

    const handleRealtimeQueueUpdate = () => {
      fetchQueue();
    };

    socket.on('queue:called', handleRealtimeQueueUpdate);
    socket.on('queue:checkin', handleRealtimeQueueUpdate);
    socket.on('queue:status_changed', handleRealtimeQueueUpdate);
    socket.on('queue:transferred', handleRealtimeQueueUpdate);
    socket.on('queue:priority_updated', handleRealtimeQueueUpdate);

    // Fallback polling (every 15s) in case socket connection experiences intermittent drops
    const timer = setInterval(fetchQueue, 15000);

    return () => {
      socket.emit('unsubscribe:doctor_queue', { doctorId: selectedDoctorId });
      socket.off('queue:called', handleRealtimeQueueUpdate);
      socket.off('queue:checkin', handleRealtimeQueueUpdate);
      socket.off('queue:status_changed', handleRealtimeQueueUpdate);
      socket.off('queue:transferred', handleRealtimeQueueUpdate);
      socket.off('queue:priority_updated', handleRealtimeQueueUpdate);
      clearInterval(timer);
    };
  }, [fetchQueue, selectedDoctorId]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 1. Call Next Patient
  const handleCallNext = async (force = false) => {
    if (!selectedDoctorId) {
      alert('Please select an active physician first.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/queue/call-next', {
        doctorId: selectedDoctorId,
        roomNumber,
        force,
      });

      const tokenData = res.data?.data || res.data || res;
      if (res.success || res.data?.success || tokenData?.formattedToken) {
        showToast(`Called: ${tokenData.formattedToken} to ${roomNumber}`);
        triggerAnnounceState();
        // Browser Speech Synthesis
        if ('speechSynthesis' in window && tokenData.ttsAnnouncement) {
          const utterance = new SpeechSynthesisUtterance(tokenData.ttsAnnouncement);
          window.speechSynthesis.speak(utterance);
        }
        await fetchQueue();
      }
    } catch (err) {
      const is409 = err.status === 409 || err.response?.status === 409;
      const msg = err.message || err.response?.data?.message || 'Another patient is currently called.';
      if (is409) {
        if (window.confirm(`${msg}\n\nDo you want to proceed and call next anyway?`)) {
          handleCallNext(true);
        }
      } else {
        alert(msg || 'Failed to call next patient');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Recall Current Patient
  const handleRecall = async () => {
    if (!queueData?.currentToken) return;
    setActionLoading(true);
    try {
      const res = await api.post('/queue/recall', {
        tokenId: queueData.currentToken.id,
        roomNumber,
      });

      const tokenData = res.data?.data || res.data || res;
      if (res.success || res.data?.success || tokenData?.formattedToken) {
        showToast(`Re-announced ${queueData.currentToken.formattedToken}`);
        triggerAnnounceState();
        if ('speechSynthesis' in window && tokenData.ttsAnnouncement) {
          const utterance = new SpeechSynthesisUtterance(tokenData.ttsAnnouncement);
          window.speechSynthesis.speak(utterance);
        }
        await fetchQueue();
      }
    } catch (err) {
      alert(err.message || err.response?.data?.message || 'Failed to recall patient');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Status Transition (IN_CONSULTATION, COMPLETED, SKIPPED)
  const handleStatusChange = async (tokenId, status) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/tokens/${tokenId}/status`, { status, roomNumber });
      if (res.success || res.data?.success || res.data) {
        showToast(`Status updated to ${status}`);
        await fetchQueue();
      }
    } catch (err) {
      alert(err.message || err.response?.data?.message || 'Failed to update token status');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Call specific waiting patient directly
  const handleCallSpecific = async (token) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/tokens/${token.id}/status`, { status: 'CALLED', roomNumber });
      const tokenData = res.data?.data || res.data || res;
      if (res.success || res.data?.success || tokenData) {
        showToast(`Called: ${token.formattedToken} to ${roomNumber}`);
        triggerAnnounceState();
        if ('speechSynthesis' in window) {
          const tts = `Token ${token.formattedToken.split('').join(' ')}, please proceed to ${roomNumber}.`;
          window.speechSynthesis.speak(new SpeechSynthesisUtterance(tts));
        }
        await fetchQueue();
      }
    } catch (err) {
      alert(err.message || err.response?.data?.message || 'Failed to call patient');
    } finally {
      setActionLoading(false);
    }
  };

  const getPriorityBadgeClass = (type) => {
    switch (type) {
      case 'EMERGENCY':
        return 'bg-red-100 text-red-700 border-red-300 font-bold animate-pulse';
      case 'PRIORITY':
        return 'bg-amber-100 text-amber-700 border-amber-300 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const currentToken = queueData?.currentToken;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4 flex-shrink-0" />
            <span>Doctor Calling Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Live Queue & Consultation Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time patient calling, triage queue management, consultation controls, and public TV display.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchQueue}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-brand-600' : ''}`} />
            Refresh
          </button>
          <a
            href="/queue/tv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-xl shadow-sm transition-all"
          >
            <Tv className="w-4 h-4 mr-1.5 text-brand-400" />
            Open TV Display Mode
          </a>
        </div>
      </div>

      {/* Action Toast */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Control Bar: Physician & Room Number Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="text-xs font-semibold text-slate-700 whitespace-nowrap">Active Physician:</div>
          <select
            value={selectedDoctorId}
            onChange={(e) => {
              setSelectedDoctorId(e.target.value);
              const selDoc = doctors.find((d) => d.id === e.target.value);
              if (selDoc) {
                setRoomNumber(getDoctorRoomNumber(selDoc));
              }
            }}
            className="w-full sm:w-auto px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.user?.name} ({d.department?.name}) - {d.status}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-xs font-semibold text-slate-700 whitespace-nowrap">Calling Room:</div>
          <input
            type="text"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="e.g. Room 101"
            className="w-28 sm:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Metrics Ribbon for Doctor */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white/90 glass-panel interactive-card rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-blue-600 text-xs font-medium flex items-center">
            <Users className="w-3.5 h-3.5 mr-1" />
            Patients Waiting
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">
            {queueData?.metrics?.waitingCount ?? 0}
          </div>
        </div>

        <div className="p-4 bg-white/90 glass-panel interactive-card rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-slate-500 text-xs font-medium flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Est. Remaining Time
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            ~{queueData?.metrics?.estimatedRemainingMins ?? 0} <span className="text-xs font-normal text-slate-400">mins</span>
          </div>
        </div>

        <div className="p-4 bg-white/90 glass-panel interactive-card rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-emerald-600 text-xs font-medium flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Consultations Done
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {queueData?.metrics?.completedCount ?? 0}
          </div>
        </div>

        <div className="p-4 bg-white/90 glass-panel interactive-card rounded-xl border border-slate-200/80 shadow-sm">
          <div className="text-amber-600 text-xs font-medium flex items-center">
            <SkipForward className="w-3.5 h-3.5 mr-1" />
            Skipped Patients
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {queueData?.metrics?.skippedCount ?? 0}
          </div>
        </div>
      </div>

      {/* HERO SECTION: ACTIVE CONSULTATION ROOM DESK */}
      <div className={`rounded-2xl border transition-all duration-500 relative overflow-hidden ${
        currentToken
          ? 'neon-border-gold glass-panel border-amber-400/60 shadow-gold-glow-lg'
          : 'glass-panel bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${currentToken ? (currentToken.status === 'IN_CONSULTATION' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse') : 'bg-slate-300'}`} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {roomNumber} Desk — Current Patient in Room
            </h3>
          </div>
          {currentToken && (
            <span className={`text-xs px-3 py-1 rounded-full border font-semibold ${
              currentToken.status === 'IN_CONSULTATION'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-glow'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse'
            }`}>
              {currentToken.status}
            </span>
          )}
        </div>
        <div className="p-4 sm:p-6">
          {currentToken ? (
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-50/90 via-white to-amber-50/30 border border-slate-200">
              {/* Token & Patient Info */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left w-full lg:w-auto">
                <div className="text-center flex-shrink-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Token</span>
                  <div className="text-5xl sm:text-6xl font-black text-brand-600 font-mono tracking-tight my-0.5 filter drop-shadow-[0_2px_8px_rgba(198,138,12,0.25)]">
                    {currentToken.formattedToken}
                  </div>
                  <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full border ${getPriorityBadgeClass(currentToken.tokenType)}`}>
                    {currentToken.tokenType}
                  </span>
                </div>

                <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 space-y-1 w-full">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">{currentToken.patient?.fullName}</h2>
                  <div className="text-xs text-slate-500 font-mono">
                    UHID: {currentToken.patient?.uhid} | Ph: {currentToken.patient?.phone}
                  </div>
                  <div className="text-xs text-slate-500">
                    Gender/Age: {currentToken.patient?.gender || 'N/A'}, {currentToken.patient?.age ? `${currentToken.patient.age} yrs` : 'N/A'}
                  </div>
                  {currentToken.calledAt && (
                    <div className="text-[11px] text-slate-400 flex items-center justify-center sm:justify-start pt-1">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      Called at: {new Date(currentToken.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Current Patient */}
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end w-full lg:w-auto">
                {/* Recall Button with Live Soundwave Visualizer */}
                <button
                  onClick={handleRecall}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Volume2 className={`w-4 h-4 mr-1 text-brand-600 ${isAnnouncing ? 'animate-pulse' : ''}`} />
                  <span>Recall / Announce</span>
                  {isAnnouncing && (
                    <div className="flex items-center space-x-0.5 h-3 ml-2" title="Audio Announcement Active">
                      <span className="w-0.5 h-full bg-amber-500 animate-sound-wave-1 rounded-full"></span>
                      <span className="w-0.5 h-full bg-amber-500 animate-sound-wave-2 rounded-full"></span>
                      <span className="w-0.5 h-full bg-amber-500 animate-sound-wave-3 rounded-full"></span>
                      <span className="w-0.5 h-full bg-amber-500 animate-sound-wave-4 rounded-full"></span>
                    </div>
                  )}
                </button>

                {/* Start Consultation (if CALLED) */}
                {currentToken.status === 'CALLED' && (
                  <button
                    onClick={() => setConsultationToken(currentToken)}
                    disabled={actionLoading}
                    className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-emerald-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="w-4 h-4 mr-1.5 animate-pulse" />
                    Start Consultation
                  </button>
                )}

                {/* Open Workstation / Resume Consultation (if IN_CONSULTATION) */}
                {currentToken.status === 'IN_CONSULTATION' && (
                  <button
                    onClick={() => setConsultationToken(currentToken)}
                    className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 rounded-xl shadow-gold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <HeartPulse className="w-4 h-4 mr-1.5 animate-pulse" />
                    Open Clinical Workstation
                  </button>
                )}

                {/* Complete Consultation (Fast Finish) */}
                {currentToken.status === 'IN_CONSULTATION' && (
                  <button
                    onClick={() => handleStatusChange(currentToken.id, 'COMPLETED')}
                    disabled={actionLoading}
                    className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                    Complete
                  </button>
                )}

                {/* Skip Patient */}
                <button
                  onClick={() => handleStatusChange(currentToken.id, 'SKIPPED')}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <SkipForward className="w-3.5 h-3.5 mr-1" />
                  Skip
                </button>

                {/* Transfer Patient */}
                <button
                  onClick={() => setTransferToken(currentToken)}
                  disabled={actionLoading}
                  className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 mr-1" />
                  Transfer
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <div className="text-base font-bold text-slate-800">Consultation Room is Currently Open</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                No patient is currently inside the room. Click below to automatically call the highest priority waiting patient.
              </p>
              <button
                onClick={() => handleCallNext(false)}
                disabled={actionLoading || (queueData?.waitingTokens?.length === 0)}
                className="inline-flex items-center px-5 sm:px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:bg-slate-300 rounded-xl shadow-emerald-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PhoneCall className="w-5 h-5 mr-2 animate-bounce flex-shrink-0" />
                <span>Call Next Patient ({queueData?.waitingTokens?.length ?? 0} Waiting)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QUEUE TABS: WAITING / SKIPPED / COMPLETED */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 border-b border-slate-200 bg-slate-50/50 gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto whitespace-nowrap py-1">
            <button
              onClick={() => setTab('waiting')}
              className={`py-3 sm:py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                tab === 'waiting'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Waiting Queue</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand-50 text-brand-700 font-mono">
                {queueData?.waitingTokens?.length ?? 0}
              </span>
            </button>

            <button
              onClick={() => setTab('skipped')}
              className={`py-3 sm:py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                tab === 'skipped'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Skipped Queue</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 font-mono">
                {queueData?.skippedTokens?.length ?? 0}
              </span>
            </button>

            <button
              onClick={() => setTab('completed')}
              className={`py-3 sm:py-3.5 text-xs font-bold border-b-2 transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                tab === 'completed'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Completed Today</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 font-mono">
                {queueData?.completedTokens?.length ?? 0}
              </span>
            </button>
          </div>

          {/* Quick "Call Next" when in waiting tab and room is free */}
          {tab === 'waiting' && !currentToken && (
            <button
              onClick={() => handleCallNext(false)}
              disabled={actionLoading || queueData?.waitingTokens?.length === 0}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm self-start sm:self-auto mb-2 sm:mb-0"
            >
              <PhoneCall className="w-3.5 h-3.5 mr-1" />
              Call Top Patient
            </button>
          )}
        </div>

        {/* TAB 1: WAITING QUEUE */}
        {tab === 'waiting' && (
          <div>
            {queueData?.waitingTokens?.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-700">Waiting queue is empty</div>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No patients are currently waiting for this physician. Issue tokens at the check-in desk to add patients to the line.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px] whitespace-nowrap">
                    <tr>
                      <th className="py-3.5 px-4 whitespace-nowrap">Pos #</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Token</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Patient Information</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Triage Priority</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Est. Wait Time</th>
                      <th className="py-3.5 px-4 text-right whitespace-nowrap">Desk Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queueData?.waitingTokens?.map((t) => (
                      <tr key={t.id} className="hover:bg-amber-50/40 transition-all duration-150 group">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                          <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors inline-flex items-center justify-center text-[11px]">
                            #{t.queuePosition}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-brand-700 text-sm tracking-wide whitespace-nowrap">
                          {t.formattedToken}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900 group-hover:text-brand-900 transition-colors">{t.patient?.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {t.patient?.uhid} | {t.patient?.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] border shadow-xs ${getPriorityBadgeClass(t.tokenType)}`}>
                            {t.tokenType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                          ~{t.estimatedWaitMins} mins
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              onClick={() => handleCallSpecific(t)}
                              disabled={actionLoading}
                              className="px-3 py-1 bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white border border-brand-200/80 rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97]"
                            >
                              Call Now
                            </button>
                            <button
                              onClick={() => setTransferToken(t)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                              title="Transfer to another doctor"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>
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

        {/* TAB 2: SKIPPED QUEUE */}
        {tab === 'skipped' && (
          <div>
            {queueData?.skippedTokens?.length === 0 ? (
              <div className="p-12 text-center">
                <SkipForward className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-700">No skipped patients</div>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Patients marked as "Skip" when called will be listed here and can be called or recalled when they arrive.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px] whitespace-nowrap">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Token</th>
                      <th className="py-3 px-4 whitespace-nowrap">Patient</th>
                      <th className="py-3 px-4 whitespace-nowrap">Priority</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queueData?.skippedTokens?.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">{t.formattedToken}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{t.patient?.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{t.patient?.uhid}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getPriorityBadgeClass(t.tokenType)}`}>
                            {t.tokenType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleStatusChange(t.id, 'WAITING')}
                            className="px-2.5 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 rounded-lg text-xs font-semibold"
                          >
                            Re-insert in Queue
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPLETED QUEUE */}
        {tab === 'completed' && (
          <div>
            {queueData?.completedTokens?.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <div className="text-sm font-semibold text-slate-700">No completed consultations today</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 text-[11px] uppercase tracking-wider whitespace-nowrap">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Token</th>
                      <th className="py-3 px-4 whitespace-nowrap">Patient</th>
                      <th className="py-3 px-4 whitespace-nowrap">Priority</th>
                      <th className="py-3 px-4 whitespace-nowrap">Completed At</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queueData?.completedTokens?.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">{t.formattedToken}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{t.patient?.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{t.patient?.uhid}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] border ${getPriorityBadgeClass(t.tokenType)}`}>
                            {t.tokenType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {t.completedAt ? new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold text-[11px]">
                            COMPLETED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {transferToken && (
        <TransferTokenModal
          token={transferToken}
          currentDoctorId={selectedDoctorId}
          onClose={() => setTransferToken(null)}
          onSuccess={(transferred) => {
            setTransferToken(null);
            showToast(`Patient ${transferred.formattedToken} transferred to ${transferred.transferredTo}`);
            fetchQueue();
          }}
        />
      )}

      {/* Consultation Workstation Modal */}
      {consultationToken && (
        <ConsultationWorkstationModal
          tokenId={consultationToken.id}
          patient={consultationToken.patient}
          onClose={() => {
            setConsultationToken(null);
            fetchQueue();
          }}
          onComplete={() => {
            const tokenName = consultationToken.formattedToken;
            setConsultationToken(null);
            showToast(`Consultation completed for ${tokenName}`);
            fetchQueue();
          }}
        />
      )}
    </div>
  );
}
