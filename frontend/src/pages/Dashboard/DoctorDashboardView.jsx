import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Stethoscope,
  Users,
  Calendar,
  Clock,
  Activity,
  FileText,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Phone,
  PhoneCall,
  User,
  Zap,
  Volume2,
  Play,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import ConsultationWorkstationModal from '../Consultations/ConsultationWorkstationModal';

export default function DoctorDashboardView({ stats, onRefresh }) {
  const doctor = stats?.doctor;
  const kpis = stats?.kpis || {};
  const activeToken = stats?.activeToken;
  const waitingTokens = stats?.waitingTokens || [];
  const todayAppointments = stats?.todayAppointments || [];

  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [showWorkstationModal, setShowWorkstationModal] = useState(false);
  const [workstationToken, setWorkstationToken] = useState(null);
  const announceTimerRef = useRef(null);

  // Compute room based on specialty / department
  const doctorRoom = doctor?.roomNumber || (() => {
    const dept = (doctor?.department || '').toUpperCase();
    if (dept.includes('CARDIO')) return 'Room 102';
    if (dept.includes('PEDIATRIC')) return 'Room 103';
    if (dept.includes('ORTHO')) return 'Room 104';
    if (dept.includes('DENTAL')) return 'Room 105';
    if (dept.includes('NEURO')) return 'Room 106';
    return 'Room 101';
  })();

  const triggerAnnounce = (text) => {
    setIsAnnouncing(true);
    if (announceTimerRef.current) clearTimeout(announceTimerRef.current);

    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }

    announceTimerRef.current = setTimeout(() => {
      setIsAnnouncing(false);
    }, 4000);
  };

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Call Next Patient from queue
  const handleCallNext = async (force = false) => {
    if (!doctor?.id) {
      showToastMsg('Physician profile not loaded.', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post('/queue/call-next', {
        doctorId: doctor.id,
        roomNumber: doctorRoom,
        force,
      });

      const tokenData = res.data?.data || res.data || res;
      if (res.success || res.data?.success || tokenData?.formattedToken) {
        const formatted = tokenData.formattedToken || `T-${String(tokenData.tokenNumber).padStart(3, '0')}`;
        showToastMsg(`Called Token ${formatted} to ${doctorRoom}`, 'success');

        if (tokenData.ttsAnnouncement) {
          triggerAnnounce(tokenData.ttsAnnouncement);
        } else {
          triggerAnnounce(`Token ${formatted}, please proceed to ${doctorRoom}`);
        }

        if (onRefresh) await onRefresh();
      }
    } catch (err) {
      const is409 = err.status === 409 || err.response?.status === 409;
      const msg = err.message || err.response?.data?.message || 'Another patient is currently called.';
      if (is409) {
        if (window.confirm(`${msg}\n\nDo you want to clear the room and call next patient anyway?`)) {
          await handleCallNext(true);
        }
      } else {
        showToastMsg(msg || 'Failed to call next patient', 'error');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Recall Current Patient
  const handleRecall = async () => {
    if (!activeToken?.id) return;
    setActionLoading(true);
    try {
      const res = await api.post('/queue/recall', {
        tokenId: activeToken.id,
        roomNumber: doctorRoom,
      });

      const tokenData = res.data?.data || res.data || res;
      const formatted = `T-${String(activeToken.tokenNumber).padStart(3, '0')}`;
      showToastMsg(`Re-announced token ${formatted}`, 'success');

      if (tokenData.ttsAnnouncement) {
        triggerAnnounce(tokenData.ttsAnnouncement);
      } else {
        triggerAnnounce(`Token ${formatted}, please proceed to ${doctorRoom}`);
      }

      if (onRefresh) await onRefresh();
    } catch (err) {
      showToastMsg(err.message || 'Failed to recall patient', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Call specific waiting patient
  const handleCallSpecific = async (token) => {
    if (!token?.id) return;
    setActionLoading(true);
    try {
      await api.patch(`/tokens/${token.id}/status`, {
        status: 'CALLED',
        roomNumber: doctorRoom,
      });

      const formatted = `T-${String(token.tokenNumber).padStart(3, '0')}`;
      showToastMsg(`Called Token ${formatted} (${token.patient?.fullName || 'Patient'}) to ${doctorRoom}`, 'success');
      triggerAnnounce(`Token ${formatted}, please proceed to ${doctorRoom}`);

      if (onRefresh) await onRefresh();
    } catch (err) {
      showToastMsg(err.message || err.response?.data?.message || 'Failed to call patient', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-sm animate-in fade-in ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>

          {isAnnouncing && (
            <div className="flex items-center space-x-1" title="Voice Announcement Active">
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mr-1">Voice Live</span>
              <span className="w-1 h-3 bg-emerald-500 animate-sound-wave-1 rounded-full"></span>
              <span className="w-1 h-3 bg-emerald-500 animate-sound-wave-2 rounded-full"></span>
              <span className="w-1 h-3 bg-emerald-500 animate-sound-wave-3 rounded-full"></span>
              <span className="w-1 h-3 bg-emerald-500 animate-sound-wave-4 rounded-full"></span>
            </div>
          )}
        </div>
      )}

      {/* Active Consultation Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Doctor Clinical Workstation • {doctorRoom}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Welcome, {doctor?.name || 'Doctor'}
            </h2>
            <p className="text-xs md:text-sm text-slate-300">
              {doctor?.department} • {doctor?.specialization} • Fee: ₹
              {(doctor?.consultationFee || 0).toFixed(2)}
            </p>
          </div>

          {/* Current Patient Quick Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[300px]">
            <span className="text-[11px] uppercase tracking-wider text-slate-300 font-bold block mb-1">
              Current Calling Status
            </span>
            {activeToken ? (
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-black font-mono text-brand-300">
                    T-{String(activeToken.tokenNumber).padStart(3, '0')}
                  </span>
                  <span className="text-xs font-bold text-white truncate max-w-[170px]">
                    {activeToken.patient?.fullName}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                  {activeToken.patient?.uhid} • <span className="text-emerald-400 font-bold">{activeToken.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={handleRecall}
                    disabled={actionLoading}
                    className="flex-1 text-center px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Recall</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkstationToken(activeToken);
                      setShowWorkstationModal(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Open Workstation</span>
                  </button>
                  <Link
                    to="/queue"
                    className="px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Desk
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-200 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Room {doctorRoom} Available</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {waitingTokens.length > 0
                    ? `${waitingTokens.length} patient${waitingTokens.length > 1 ? 's' : ''} waiting in queue.`
                    : 'Queue is currently empty.'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleCallNext(false)}
                    disabled={actionLoading || waitingTokens.length === 0}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-gold-glow disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <PhoneCall className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : 'animate-bounce'}`} />
                    <span>{actionLoading ? 'Calling...' : `Call Next Patient (${waitingTokens.length})`}</span>
                  </button>
                  <Link
                    to="/queue"
                    className="px-2.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-colors"
                    title="Open Full Queue Desk"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* 3 Clinical KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Waiting in Queue
            </span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
              {kpis.waitingTokensCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">Tokens pending consult</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Assigned Appointments
            </span>
            <span className="text-2xl font-extrabold text-brand-600 mt-1 block">
              {kpis.assignedAppointmentsCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">Scheduled for today</span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Completed Consults
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 mt-1 block">
              {kpis.completedTodayCount || 0}
            </span>
            <span className="text-[11px] text-slate-400">Patients treated today</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Waiting Queue & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Waiting Queue List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800">Waiting Queue (Triage Sorted)</h3>
            </div>
            <Link to="/queue" className="text-xs font-bold text-brand-600 hover:underline">
              Open Calling Desk →
            </Link>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100 overflow-y-auto max-h-96">
            {waitingTokens.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No patients currently waiting.</p>
              </div>
            ) : (
              waitingTokens.map((t) => (
                <div key={t.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 font-mono font-bold flex items-center justify-center text-xs border border-slate-200">
                      T-{String(t.tokenNumber).padStart(3, '0')}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t.patient?.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        UHID: {t.patient?.uhid} • {t.patient?.gender}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.tokenType === 'EMERGENCY'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : t.tokenType === 'PRIORITY'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.tokenType}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCallSpecific(t)}
                      disabled={actionLoading}
                      className="text-xs px-2.5 py-1 bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-700 font-bold rounded-lg transition-all shadow-xs disabled:opacity-50 flex items-center space-x-1 interactive-card"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Call Now</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Appointments Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">My Appointments Today</h3>
            </div>
            <Link to="/appointments" className="text-xs font-bold text-brand-600 hover:underline">
              All Slots →
            </Link>
          </div>

          <div className="p-4 flex-1 divide-y divide-slate-100 overflow-y-auto max-h-96">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No appointments scheduled for you today.</p>
              </div>
            ) : (
              todayAppointments.map((a) => (
                <div key={a.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 bg-brand-50 text-brand-700 font-mono font-bold text-xs rounded-lg">
                      {a.timeSlot}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{a.patient?.fullName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">UHID: {a.patient?.uhid}</p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {a.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Consultation Workstation Modal */}
      {showWorkstationModal && workstationToken && (
        <ConsultationWorkstationModal
          tokenId={workstationToken.id}
          patient={workstationToken.patient}
          appointmentId={workstationToken.appointmentId}
          onClose={() => {
            setShowWorkstationModal(false);
            setWorkstationToken(null);
            if (onRefresh) onRefresh();
          }}
          onComplete={async () => {
            const name = workstationToken.patient?.fullName || 'Patient';
            setShowWorkstationModal(false);
            setWorkstationToken(null);
            showToastMsg(`Consultation completed for ${name}`, 'success');
            if (onRefresh) await onRefresh();
          }}
        />
      )}
    </div>
  );
}
