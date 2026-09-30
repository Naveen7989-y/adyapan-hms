import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  FileText,
  HeartPulse,
  LogOut,
  Download,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  User,
  Phone,
  Mail,
  MapPin,
  Stethoscope,
  Activity,
  Receipt,
  Pill,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  XCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { usePatientAuth } from '../../context/PatientAuthContext';
import {
  getPatientDashboard,
  getPatientAppointments,
  cancelPatientAppointment,
  getPatientPrescriptions,
  getPatientTokens,
  getPatientInvoices,
  downloadPrescriptionPdf,
} from '../../services/patientApi';
import HeartbeatLogo from '../../components/common/HeartbeatLogo';
import ThemeToggle from '../../components/common/ThemeToggle';

export default function PatientPortal() {
  const navigate = useNavigate();
  const { patient, logout } = usePatientAuth();

  const [activeTab, setActiveTab] = useState('prescriptions'); // 'prescriptions' | 'appointments' | 'tokens' | 'invoices'
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [copiedUhid, setCopiedUhid] = useState(false);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);
  const [cancellingApptId, setCancellingApptId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [dashRes, apptRes, rxRes, tokRes, invRes] = await Promise.all([
        getPatientDashboard(),
        getPatientAppointments(),
        getPatientPrescriptions(),
        getPatientTokens(),
        getPatientInvoices(),
      ]);

      setDashboardData(dashRes.data);
      setAppointments(apptRes.data || []);
      setPrescriptions(rxRes.data || []);
      setTokens(tokRes.data || []);
      setInvoices(invRes.data || []);
    } catch (err) {
      console.error('Failed to load patient records:', err);
      setErrorMsg(err.message || 'Failed to load your medical records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCopyUhid = () => {
    if (!patient?.uhid) return;
    navigator.clipboard.writeText(patient.uhid);
    setCopiedUhid(true);
    setTimeout(() => setCopiedUhid(false), 2000);
  };

  const handleDownloadPdf = async (prescriptionId, code) => {
    setDownloadingPdfId(prescriptionId);
    try {
      await downloadPrescriptionPdf(prescriptionId, code);
      setSuccessMsg(`Prescription ${code} downloaded successfully.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to download prescription PDF.');
    } finally {
      setDownloadingPdfId(null);
    }
  };

  const handleCancelAppointment = async (apptId) => {
    const reason = prompt('Please enter a cancellation reason (optional):', 'Personal emergency');
    if (reason === null) return; // user clicked cancel in prompt

    setCancellingApptId(apptId);
    try {
      await cancelPatientAppointment(apptId, reason);
      setSuccessMsg('Appointment cancelled successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchAllData();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancellingApptId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/patient/login', { replace: true });
  };

  // Age calculation
  let ageDisplay = '—';
  if (patient?.dateOfBirth) {
    const birthYear = new Date(patient.dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    ageDisplay = `${currentYear - birthYear} yrs`;
  }

  const liveQueue = dashboardData?.liveQueueInfo;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-['Inter',sans-serif] selection:bg-teal-500/30 transition-colors duration-300">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-300 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/" onClick={handleLogout} className="flex items-center gap-2.5 group">
            <HeartbeatLogo size="sm" />
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white block group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                ADYAPAN HMS
              </span>
              <span className="text-[10px] uppercase tracking-widest text-teal-600 dark:text-teal-400 font-bold block -mt-1">
                Patient Medical Portal
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-800 dark:text-white">{patient?.fullName}</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">({patient?.uhid})</span>
          </div>

          <ThemeToggle size="md" />

          <button
            type="button"
            onClick={fetchAllData}
            title="Refresh records"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors border border-slate-200 dark:border-white/5"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Page Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-between text-rose-700 dark:text-rose-300 text-sm shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-200 font-bold">
              ✕
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-sm animate-fade-in shadow-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* TOP SECTION: Digital Health Card & Live Queue Token */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* DIGITAL UHID HEALTH CARD (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl p-6 sm:p-7 bg-gradient-to-br from-slate-900 via-[#0B1E36] to-[#081524] text-white border border-teal-500/30 shadow-2xl overflow-hidden group">
              
              {/* Card Background Ornaments */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none transform translate-x-20 -translate-y-20 group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="relative z-10 flex items-start justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
                    <HeartPulse className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-widest text-teal-400 font-bold block">
                      Digital Patient Health ID
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {patient?.fullName}
                    </h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified UHID
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                    Adyapan Central HMS
                  </p>
                </div>
              </div>

              {/* Card Body: UHID Bar & Demographic Details */}
              <div className="relative z-10 py-6 space-y-4">
                {/* UHID Highlight Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Universal Hospital Identifier (UHID)
                    </span>
                    <span className="text-xl sm:text-2xl font-black tracking-widest text-teal-300 font-mono">
                      {patient?.uhid || '—'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyUhid}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all self-start sm:self-auto cursor-pointer"
                  >
                    {copiedUhid ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-teal-300" />
                        <span>Copy UHID</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Patient Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block font-medium">Gender</span>
                    <span className="font-bold text-white text-sm mt-0.5 block">{patient?.gender || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block font-medium">Age</span>
                    <span className="font-bold text-white text-sm mt-0.5 block">{ageDisplay}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block font-medium">Blood Group</span>
                    <span className="font-bold text-rose-400 text-sm mt-0.5 block">
                      {patient?.bloodGroup || 'Not Recorded'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 block font-medium">Registered Phone</span>
                    <span className="font-bold text-white text-sm mt-0.5 block font-mono">
                      {patient?.phone ? `+91 ${patient.phone}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">Hospital Code: ADY-HYD-01</span>
                <span>Carry this Digital UHID for fast hospital kiosk check-ins</span>
              </div>

            </div>
          </div>

          {/* LIVE QUEUE / ACTIVE TOKEN OR NEXT APPOINTMENT (5 Cols) */}
          <div className="lg:col-span-5">
            {liveQueue?.hasActiveQueueToday ? (
              /* LIVE OPD QUEUE TRACKER */
              <div className="h-full rounded-3xl p-6 bg-gradient-to-br from-teal-950/80 via-slate-900 to-slate-900 border border-teal-500/40 shadow-2xl flex flex-col justify-between text-white">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                      Live OPD Consultation Active
                    </span>
                    <span className="text-xs font-mono text-slate-400">Today</span>
                  </div>

                  <div className="flex items-baseline gap-3 my-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Token</span>
                    <span className="text-4xl sm:text-5xl font-black text-white font-mono">
                      #{liveQueue.activeToken?.tokenNumber}
                    </span>
                    <span className="text-xs font-bold text-teal-400 uppercase px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                      {liveQueue.activeToken?.status}
                    </span>
                  </div>

                  <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Doctor:</span>
                      <span className="font-bold text-white">{liveQueue.activeToken?.doctor?.user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department / Chamber:</span>
                      <span className="font-semibold text-teal-300">{liveQueue.activeToken?.department?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Now Calling in OPD:</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {liveQueue.currentlyCalling ? `Token #${liveQueue.currentlyCalling}` : 'Preparing queue'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Patients ahead of you: <strong className="text-white font-bold">{liveQueue.patientsAhead}</strong>
                  </span>
                  <span className="text-teal-400 font-semibold">
                    ~{liveQueue.approxWaitMinutes} mins wait
                  </span>
                </div>
              </div>
            ) : (
              /* NEXT SCHEDULED APPOINTMENT CARD */
              <div className="h-full rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-2xl flex flex-col justify-between transition-colors duration-300">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                      <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      Next Appointment
                    </span>
                    <Link
                      to="/#specialties"
                      onClick={handleLogout}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                    >
                      + Book New
                    </Link>
                  </div>

                  {dashboardData?.nextAppointment ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Doctor</span>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                          {dashboardData.nextAppointment.doctor?.user?.name}
                        </h4>
                        <p className="text-xs text-teal-600 dark:text-teal-300 font-medium">
                          {dashboardData.nextAppointment.department?.name}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block font-medium">Date</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {new Date(dashboardData.nextAppointment.appointmentDate).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block font-medium">Time Slot</span>
                          <span className="font-bold text-teal-600 dark:text-teal-300 font-mono">
                            {dashboardData.nextAppointment.timeSlot}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30">
                          {dashboardData.nextAppointment.status}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                      <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No upcoming appointments</p>
                      <p className="text-xs text-slate-500 mt-1">Book your next consultation with our top specialists.</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Adyapan Central Shaikpet</span>
                  <a href="tel:+918000000000" className="text-teal-600 dark:text-teal-400 hover:underline font-semibold">
                    Emergency: 24/7
                  </a>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* METRICS STATS COUNTER BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-none flex items-center gap-3.5 transition-colors duration-300">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 dark:text-white block">{prescriptions.length}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Prescriptions</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-none flex items-center gap-3.5 transition-colors duration-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 dark:text-white block">{appointments.length}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Appointments</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-none flex items-center gap-3.5 transition-colors duration-300">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 dark:text-white block">{tokens.length}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Hospital Visits</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs dark:shadow-none flex items-center gap-3.5 transition-colors duration-300">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold text-slate-900 dark:text-white block">{invoices.length}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Invoices & Bills</span>
            </div>
          </div>
        </div>

        {/* CLINICAL RECORDS TABS SECTION */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl p-6 sm:p-8 space-y-6 transition-colors duration-300">
          
          {/* Tab Navigation Buttons */}
          <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
            {[
              { id: 'prescriptions', label: `Digital Prescriptions (${prescriptions.length})`, icon: Pill },
              { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
              { id: 'tokens', label: `OPD Queue Visits (${tokens.length})`, icon: Clock },
              { id: 'invoices', label: `Billing & Invoices (${invoices.length})`, icon: Receipt },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/25'
                      : 'bg-slate-100 hover:bg-slate-200/70 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:bg-white/[0.08] dark:hover:text-white border border-slate-200 dark:border-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: PRESCRIPTIONS */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-6">
              {prescriptions.length === 0 ? (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                  <Pill className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Prescriptions on Record</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Once you complete a consultation with your doctor, your verified clinical prescriptions will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 hover:border-teal-500/40 transition-all p-5 sm:p-6 space-y-4"
                    >
                      {/* Rx Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 flex items-center justify-center text-teal-600 dark:text-teal-400 font-bold text-sm">
                            Rx
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                                {rx.prescriptionCode}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30">
                                {rx.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Prescribed by <strong className="text-slate-800 dark:text-slate-200">{rx.doctor?.user?.name}</strong> • {new Date(rx.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Download PDF CTA */}
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(rx.id, rx.prescriptionCode)}
                          disabled={downloadingPdfId === rx.id}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-500/20 dark:hover:bg-teal-500/30 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-400/40 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                        >
                          {downloadingPdfId === rx.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Download PDF Prescription</span>
                        </button>
                      </div>

                      {/* Clinical Diagnosis / Advice */}
                      {rx.consultation && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-3.5 rounded-xl bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block font-semibold">Diagnosis:</span>
                            <span className="text-slate-900 dark:text-white font-medium">{rx.consultation.diagnosis || 'Clinical evaluation'}</span>
                          </div>
                          {rx.consultation.advice && (
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 block font-semibold">Doctor's Advice:</span>
                              <span className="text-teal-600 dark:text-teal-300 font-medium">{rx.consultation.advice}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Medicines List */}
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                          Prescribed Medications ({rx.items?.length || 0})
                        </h5>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-semibold">
                                <th className="py-2 pr-3">Medicine</th>
                                <th className="py-2 pr-3">Dosage</th>
                                <th className="py-2 pr-3">Frequency</th>
                                <th className="py-2 pr-3">Duration</th>
                                <th className="py-2 pr-3">Instructions</th>
                                <th className="py-2 text-right">Qty</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                              {rx.items?.map((item) => (
                                <tr key={item.id} className="text-slate-700 dark:text-slate-200">
                                  <td className="py-2.5 pr-3 font-semibold text-slate-900 dark:text-white">
                                    {item.medicine?.name}
                                    {item.medicine?.genericName && (
                                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                        ({item.medicine.genericName})
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 pr-3 font-mono text-teal-600 dark:text-teal-300 font-medium">{item.dosage}</td>
                                  <td className="py-2.5 pr-3 font-mono text-amber-600 dark:text-amber-300 font-medium">{item.frequency}</td>
                                  <td className="py-2.5 pr-3">{item.duration}</td>
                                  <td className="py-2.5 pr-3 text-slate-500 dark:text-slate-400">{item.instructions || 'As advised'}</td>
                                  <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">{item.quantityPrescribed}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Manage all your upcoming and past OPD consultations</span>
                <Link
                  to="/#specialties"
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-sm transition-all"
                >
                  + Book New Appointment
                </Link>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Appointments Found</h4>
                  <p className="text-xs text-slate-500 mt-1">Book an appointment online in under 60 seconds.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-white/10">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            {apt.doctor?.user?.name}
                          </h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              apt.status === 'COMPLETED'
                                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                                : apt.status === 'BOOKED'
                                ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30'
                                : apt.status === 'CANCELLED'
                                ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                                : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {apt.status}
                          </span>
                        </div>

                        <p className="text-xs text-teal-600 dark:text-teal-300 font-medium">
                          {apt.department?.name}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {apt.timeSlot}
                          </span>
                          {apt.token && (
                            <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">
                              Token #{apt.token.tokenNumber}
                            </span>
                          )}
                        </div>

                        {apt.cancellationReason && (
                          <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80 italic mt-1">
                            Note: {apt.cancellationReason}
                          </p>
                        )}
                      </div>

                      {/* Action */}
                      <div>
                        {apt.status === 'BOOKED' && (
                          <button
                            type="button"
                            onClick={() => handleCancelAppointment(apt.id)}
                            disabled={cancellingApptId === apt.id}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {cancellingApptId === apt.id ? 'Cancelling...' : 'Cancel Appointment'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TOKENS & QUEUE VISITS */}
          {activeTab === 'tokens' && (
            <div className="space-y-4">
              {tokens.length === 0 ? (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                  <Clock className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Queue Tokens Logged</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    When you check in at the hospital reception or book a walk-in visit, your OPD queue tokens appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-white/10">
                  {tokens.map((tok) => (
                    <div
                      key={tok.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 flex flex-col items-center justify-center font-mono font-black text-teal-600 dark:text-teal-300">
                          <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Token</span>
                          <span className="text-base leading-none">#{tok.tokenNumber}</span>
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{tok.doctor?.user?.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-mono">
                              {tok.tokenType}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            {tok.department?.name} • Queue Date: {new Date(tok.queueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            tok.status === 'COMPLETED'
                              ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                              : tok.status === 'IN_CONSULTATION'
                              ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                              : tok.status === 'WAITING'
                              ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30'
                              : 'bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {tok.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BILLING & INVOICES */}
          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <div className="text-center py-16 text-slate-500 dark:text-slate-400">
                  <Receipt className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">No Billing Invoices Logged</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Receipts and invoices issued for consultations and pharmacy orders will be listed here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                              {inv.invoiceNumber}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.paymentStatus === 'PAID'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                                  : inv.paymentStatus === 'PARTIALLY_PAID'
                                  ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30'
                                  : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                              }`}
                            >
                              {inv.paymentStatus}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Date: {new Date(inv.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total Amount</span>
                          <span className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                            ₹{inv.totalAmount?.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div>Consultation: <strong className="text-slate-800 dark:text-slate-200">₹{inv.consultationFee?.toFixed(2)}</strong></div>
                        <div>Pharmacy: <strong className="text-slate-800 dark:text-slate-200">₹{inv.pharmacyFee?.toFixed(2)}</strong></div>
                        <div>Amount Paid: <strong className="text-emerald-600 dark:text-emerald-400">₹{inv.paidAmount?.toFixed(2)}</strong></div>
                        <div>
                          Balance:{' '}
                          <strong className={inv.totalAmount - inv.paidAmount > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                            ₹{Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0)).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200 dark:border-white/5 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Adyapan Hospital Patient Health Records</span>
          <span>Emergency Support: +91 8000 000 000 • Shaikpet, Hyderabad</span>
        </div>
      </footer>

    </div>
  );
}
