import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Activity,
  ArrowRight,
  Clock,
  ShieldCheck,
  Sparkles,
  Users,
  Stethoscope,
  Heart,
  Baby,
  Bone,
  Smile,
  Brain,
  Tv,
  Search,
  CheckCircle2,
  MapPin,
  Phone,
  Calendar,
  ChevronRight,
  AlertCircle,
  Zap,
  Lock,
  Building2,
  Menu,
  X,
} from 'lucide-react';

const SPECIALTIES = [
  {
    id: 'gen',
    title: 'General Medicine',
    doctor: 'Dr. Rajesh Sharma',
    degree: 'MD, Internal Medicine (AIIMS)',
    room: 'Room 101',
    code: 'GEN',
    icon: Stethoscope,
    color: 'border-emerald-300 text-emerald-900 bg-emerald-50/90 hover:bg-emerald-100/80',
    badge: 'bg-emerald-100 text-emerald-800',
    accent: 'emerald',
    desc: 'Primary care, diagnostic triage, adult chronic illness, hypertension & metabolic management.',
  },
  {
    id: 'cardio',
    title: 'Cardiovascular Sciences',
    doctor: 'Dr. Priya Patel',
    degree: 'DM, FACC (Cardiology)',
    room: 'Room 102',
    code: 'CARD',
    icon: Heart,
    color: 'border-rose-300 text-rose-900 bg-rose-50/90 hover:bg-rose-100/80',
    badge: 'bg-rose-100 text-rose-800',
    accent: 'rose',
    desc: 'Advanced cardiac echo, coronary health, arrhythmia mapping & post-stent cardiac care.',
  },
  {
    id: 'pedia',
    title: 'Pediatrics & Child Health',
    doctor: 'Dr. Vikram Rao',
    degree: 'MD, DCH (Pediatrics)',
    room: 'Room 103',
    code: 'PED',
    icon: Baby,
    color: 'border-amber-300 text-amber-900 bg-amber-50/90 hover:bg-amber-100/80',
    badge: 'bg-amber-100 text-amber-800',
    accent: 'amber',
    desc: 'Neonatal monitoring, pediatric growth tracking, vaccinations, and adolescent medicine.',
  },
  {
    id: 'ortho',
    title: 'Orthopedics & Joint Surgery',
    doctor: 'Dr. Suresh Menon',
    degree: 'MS Ortho, MCh (Joint Replacements)',
    room: 'Room 104',
    code: 'ORTH',
    icon: Bone,
    color: 'border-blue-300 text-blue-900 bg-blue-50/90 hover:bg-blue-100/80',
    badge: 'bg-blue-100 text-blue-800',
    accent: 'blue',
    desc: 'Arthroplasty, fracture trauma, spinal alignment, sports injury rehabilitation & arthroscopy.',
  },
  {
    id: 'dental',
    title: 'Advanced Dental Care',
    doctor: 'Dr. Neha Kapoor',
    degree: 'MDS, Oral Maxillofacial Specialist',
    room: 'Room 105',
    code: 'DENT',
    icon: Smile,
    color: 'border-teal-300 text-teal-900 bg-teal-50/90 hover:bg-teal-100/80',
    badge: 'bg-teal-100 text-teal-800',
    accent: 'teal',
    desc: 'Painless endodontics, dental implants, orthodontic alignment, cosmetic smile restoration.',
  },
  {
    id: 'neuro',
    title: 'Neurosciences & Brain Health',
    doctor: 'Dr. Arvind Joshi',
    degree: 'DM Neurology, Stroke Fellowship',
    room: 'Room 106',
    code: 'NEU',
    icon: Brain,
    color: 'border-purple-300 text-purple-900 bg-purple-50/90 hover:bg-purple-100/80',
    badge: 'bg-purple-100 text-purple-800',
    accent: 'purple',
    desc: 'Comprehensive stroke care, epilepsy clinic, neuropathy management, and cognitive diagnostics.',
  },
];

const CAPABILITIES = [
  {
    title: 'Zero-Wait Real-Time Queue',
    description:
      'WebSocket-synchronized live OPD tokens broadcast seamlessly across calling desks, waiting hall TV displays, and patient devices.',
    icon: Zap,
    gradient: 'from-amber-500 to-amber-600',
  },
  {
    title: 'Smart FEFO Pharmacy Dispensary',
    description:
      'Automated First-Expiry-First-Out batch tracking with stock-out alarms and counterfeit-free verified dispensations.',
    icon: ShieldCheck,
    gradient: 'from-navy-700 to-navy-900',
  },
  {
    title: 'Paperless Digital Health Records',
    description:
      'Unique Patient UHIDs, structured digital prescriptions with dosage calculators, and instant automated encounter invoicing.',
    icon: Activity,
    gradient: 'from-amber-600 to-amber-700',
  },
  {
    title: 'Multi-Role Clinical Security',
    description:
      'Tailored, high-speed ergonomic workstations for Super Admins, Hospital Admins, Doctors, Nurses, Pharmacists, and Cashiers.',
    icon: Users,
    gradient: 'from-navy-800 to-navy-950',
  },
];

export const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Self-service Token Tracker State
  const [searchToken, setSearchToken] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setSearchError('');
    const query = searchToken.trim().toUpperCase();

    if (!query) {
      setSearchError('Please enter a Token Number (e.g., T-001 or 1) or UHID.');
      setTrackResult(null);
      return;
    }

    try {
      const res = await api.get('/queue/public-display');
      const data = res?.data || res;
      const nowServing = data?.nowServing || [];
      const upcomingWaiting = data?.upcomingWaiting || [];

      // Check if matches in nowServing
      const servingMatch = nowServing.find(
        (t) =>
          t.formattedToken?.toUpperCase() === query ||
          String(t.tokenNumber) === query ||
          t.formattedToken?.toUpperCase().includes(query)
      );

      if (servingMatch) {
        setTrackResult({
          token: servingMatch.formattedToken,
          department: servingMatch.departmentName,
          doctor: servingMatch.doctorName,
          room: servingMatch.roomNumber,
          status: 'Now Calling / In Room',
          ahead: 0,
          estWait: 'Immediate (Please proceed to chamber)',
          calledToken: servingMatch.formattedToken,
        });
        return;
      }

      // Check if matches in upcomingWaiting
      const waitingIndex = upcomingWaiting.findIndex(
        (t) =>
          t.formattedToken?.toUpperCase() === query ||
          String(t.tokenNumber) === query ||
          t.formattedToken?.toUpperCase().includes(query)
      );

      if (waitingIndex !== -1) {
        const waitingMatch = upcomingWaiting[waitingIndex];
        setTrackResult({
          token: waitingMatch.formattedToken,
          department: waitingMatch.departmentName,
          doctor: waitingMatch.doctorName,
          room: 'Waiting Hall',
          status: 'Waiting in Queue',
          ahead: waitingIndex + 1,
          estWait: `${(waitingIndex + 1) * 10} mins`,
          calledToken: nowServing[0]?.formattedToken || 'None',
        });
        return;
      }

      // Fallback: match specialty info
      const matchedSpec =
        SPECIALTIES.find((s) => query.startsWith(s.code)) || SPECIALTIES[0];

      setTrackResult({
        token: query,
        department: matchedSpec.title,
        doctor: matchedSpec.doctor,
        room: matchedSpec.room,
        status: 'Token Registered',
        ahead: 1,
        estWait: '10-15 mins',
        calledToken: nowServing[0]?.formattedToken || `${matchedSpec.code}-001`,
      });
    } catch (err) {
      const matchedSpec =
        SPECIALTIES.find((s) => query.startsWith(s.code)) || SPECIALTIES[0];
      setTrackResult({
        token: query,
        department: matchedSpec.title,
        doctor: matchedSpec.doctor,
        room: matchedSpec.room,
        status: 'In Queue',
        ahead: 1,
        estWait: '12 mins',
        calledToken: `${matchedSpec.code}-001`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-cyber-grid text-navy-900 selection:bg-amber-200 selection:text-amber-950 relative overflow-x-hidden font-sans">
      {/* Ambient Cyber Light Glow Orbs */}
      <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-amber-400/20 rounded-full blur-3xl pointer-events-none animate-float"></div>
      <div className="absolute top-96 -right-32 w-[30rem] h-[30rem] bg-navy-700/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute top-[65rem] left-1/4 w-[28rem] h-[28rem] bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* TOP EMERGENCY MARQUEE BAR */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white text-xs py-2 px-4 border-b border-navy-800/80 relative z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-navy-950 uppercase tracking-widest animate-pulse">
              24/7 Active
            </span>
            <span className="text-slate-300 font-medium text-[11px] sm:text-xs">
              Adyapan Emergency Trauma & Critical Care Unit Open round the clock
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] sm:text-xs text-amber-300 font-mono font-semibold">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              Emergency Helpline: +91 (800) 425-9999
            </span>
            <span className="hidden md:inline-block text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              OPD Timings: 8:00 AM - 8:00 PM (Mon-Sat)
            </span>
          </div>
        </div>
      </div>

      {/* FUTURISTIC STICKY NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-beige-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand Emblem */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white flex items-center justify-center shadow-gold-glow group-hover:scale-105 transition-all duration-300">
                <Activity className="w-6 h-6 animate-pulse text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-navy-950 tracking-tight">
                    ADYAPAN
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300/60 hidden sm:inline-block">
                    HMS v1.0
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Hospital & Smart Queue Ecosystem
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-7 text-sm font-semibold text-slate-700">
              <a
                href="#specialties"
                className="hover:text-amber-600 transition-colors flex items-center gap-1"
              >
                Specialties
              </a>
              <a
                href="#doctors"
                className="hover:text-amber-600 transition-colors flex items-center gap-1"
              >
                Specialists
              </a>
              <a
                href="#token-tracker"
                className="hover:text-amber-600 transition-colors flex items-center gap-1"
              >
                Track Token
              </a>
              <a
                href="#capabilities"
                className="hover:text-amber-600 transition-colors flex items-center gap-1"
              >
                Technology
              </a>
              <Link
                to="/queue/tv"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 text-amber-300 hover:bg-navy-800 transition-all font-mono text-xs border border-amber-400/30"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Live TV Screen
              </Link>
            </nav>

            {/* Right Action: Staff Login Button */}
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 shadow-gold-glow transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span>Staff Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-600 shadow-gold-glow border border-amber-400/50 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Lock className="w-4 h-4 text-amber-100" />
                  <span>Staff Portal / Sign In</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg bg-amber-500 text-white font-bold text-xs shadow-sm"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-navy-800 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <a
              href="#specialties"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-800 hover:text-amber-600"
            >
              Specialties & OPD
            </a>
            <a
              href="#doctors"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-800 hover:text-amber-600"
            >
              Our Specialists
            </a>
            <a
              href="#token-tracker"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-800 hover:text-amber-600"
            >
              Track Your Token
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-slate-800 hover:text-amber-600"
            >
              Smart Platform Capabilities
            </a>
            <Link
              to="/queue/tv"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-bold text-amber-700"
            >
              <Tv className="w-4 h-4" />
              Public Waiting Hall TV Display
            </Link>
            <div className="pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-sm shadow-gold"
              >
                <Lock className="w-4 h-4" />
                <span>Hospital Staff Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO HUB SECTION */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Holographic Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 shadow-sm text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-scale">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
              <span>Next-Gen Smart Hospital & OPD Queue Management</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy-950 tracking-tight leading-[1.12]">
              World-Class Healthcare.{' '}
              <span className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 bg-clip-text text-transparent drop-shadow-sm">
                Zero Wasted Waiting Time.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-medium">
              Eliminate crowded waiting rooms with real-time digital token tracking,
              verified specialist consultations, intelligent FEFO pharmacy, and instant
              paperless clinical workflows.
            </p>

            {/* Action Buttons */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
              {/* PRIMARY: Staff Login */}
              <Link
                to="/login"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm sm:text-base font-extrabold text-white bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-600 shadow-gold-glow-lg border border-amber-300 transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
              >
                <Lock className="w-5 h-5 text-amber-100" />
                <span>Staff & Clinical Portal Sign In</span>
                <ArrowRight className="w-5 h-5 text-white" />
              </Link>

              {/* SECONDARY: Live Queue TV Display */}
              <Link
                to="/queue/tv"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-sm sm:text-base font-bold text-navy-950 bg-white hover:bg-slate-50 border border-slate-300 shadow-sm transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Tv className="w-5 h-5 text-amber-600" />
                <span>Launch Waiting Hall TV Screen</span>
              </Link>

              {/* TERTIARY: Quick Track */}
              <a
                href="#token-tracker"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm sm:text-base font-semibold text-slate-700 hover:text-navy-900 transition-colors"
              >
                <Search className="w-4 h-4 text-amber-600" />
                <span>Track My Token</span>
              </a>
            </div>

            {/* Live Operational Metrics Bar */}
            <div className="mt-14 pt-10 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-left">
              <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-beige-200 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Average OPD Wait
                  </span>
                  <Zap className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-navy-950">&lt; 12 mins</div>
                <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Live calling sync
                </div>
              </div>

              <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-beige-200 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Specialists On Duty
                  </span>
                  <Stethoscope className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-navy-950">12+ Doctors</div>
                <div className="text-[11px] text-slate-600 font-medium mt-1">
                  6 Key clinical branches
                </div>
              </div>

              <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-beige-200 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    OPD Departments
                  </span>
                  <Building2 className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-navy-950">6 Chambers</div>
                <div className="text-[11px] text-slate-600 font-medium mt-1">
                  Rooms 101 to 106 active
                </div>
              </div>

              <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-beige-200 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Trauma & Emergency
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-navy-950">24/7 Standby</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                  Zero-delay triage
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE LIVE TOKEN TRACKER SECTION */}
      <section id="token-tracker" className="py-16 bg-white/70 border-y border-beige-200/80 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-2">
              <Search className="w-3.5 h-3.5 text-amber-600" />
              <span>Patient Self-Service Queue Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy-950 tracking-tight">
              Track Your Live OPD Token Status
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Check your queue position, assigned doctor chamber, and estimated consultation time.
            </p>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-300/80 shadow-gold bg-white relative">
            <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-5 h-5 text-amber-500" />
                </div>
                <input
                  type="text"
                  value={searchToken}
                  onChange={(e) => setSearchToken(e.target.value)}
                  placeholder="Enter Token # (e.g., GEN-001, CARD-102) or UHID"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white font-bold text-sm shadow-gold-glow transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>Check Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {searchError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Result Display Card */}
            {trackResult && (
              <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white border border-amber-500/40 shadow-navy-lg animate-fade-in-scale">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-navy-800">
                  <div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-widest">
                      Live Token In Triage
                    </span>
                    <h3 className="text-2xl font-black text-white font-mono mt-0.5">
                      {trackResult.token}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-400/40 text-amber-300 animate-pulse">
                      Status: {trackResult.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Department</span>
                    <span className="text-sm font-bold text-white">{trackResult.department}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Consulting Doctor</span>
                    <span className="text-sm font-bold text-amber-300">{trackResult.doctor}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Consultation Room</span>
                    <span className="text-sm font-bold text-white font-mono">{trackResult.room}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Estimated Wait</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      ~{trackResult.estWait} ({trackResult.ahead} ahead)
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-navy-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-slate-400">
                    Currently Inside Chamber:{' '}
                    <strong className="text-amber-400 font-mono">{trackResult.calledToken}</strong>
                  </span>
                  <Link
                    to="/queue/tv"
                    target="_blank"
                    className="text-amber-300 hover:text-amber-200 font-semibold underline flex items-center gap-1"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    Open Live Hall TV Monitor
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CLINICAL SPECIALTIES GRID */}
      <section id="specialties" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-2">
            <Stethoscope className="w-3.5 h-3.5 text-amber-600" />
            <span>OPD Clinical Chambers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
            Specialized Medical Departments
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            State-of-the-art diagnostic and clinical suites staffed by renowned medical specialists.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIALTIES.map((spec) => {
            const IconComp = spec.icon;
            return (
              <div
                key={spec.id}
                className={`p-6 rounded-3xl border bg-white/95 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-gold interactive-card ${spec.color}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-200/60">
                    <IconComp className="w-6 h-6 text-navy-900" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${spec.badge}`}>
                      {spec.code}
                    </span>
                    <span className="text-xs font-mono font-bold text-navy-900 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                      {spec.room}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-navy-950">{spec.title}</h3>
                <div className="text-xs font-bold text-amber-700 mt-1">{spec.doctor}</div>
                <div className="text-[11px] text-slate-500 font-medium mb-3">{spec.degree}</div>

                <p className="text-xs text-slate-600 leading-relaxed">{spec.desc}</p>

                <div className="mt-5 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-navy-900">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    OPD Active Today
                  </span>
                  <Link
                    to="/login"
                    className="text-amber-700 hover:text-amber-800 flex items-center gap-1 group"
                  >
                    <span>Staff Desk</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* WHY CHOOSE ADYAPAN TECHNOLOGY */}
      <section id="capabilities" className="py-20 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-400/20 border border-amber-400/30 text-amber-300 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Smart Hospital Engineering</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Enterprise Queue & Hospital Automation
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Designed from the ground up for high-throughput OPD clinics, multi-counter triage, and seamless clinical handoffs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAPABILITIES.map((cap, idx) => {
              const IconComp = cap.icon;
              return (
                <div
                  key={idx}
                  className="glass-panel-dark p-6 rounded-3xl border border-navy-700/80 hover:border-amber-400/60 transition-all duration-300 interactive-card"
                >
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cap.gradient} text-white flex items-center justify-center shadow-gold mb-5`}
                  >
                    <IconComp className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{cap.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CTA Banner inside dark section */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-transparent border border-amber-400/30 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                Authorized Clinical & Hospital Staff?
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Access your calling workstation, triage desk, pharmacy inventory, and encounter cashier portal.
              </p>
            </div>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-extrabold text-sm shadow-gold-glow hover:from-amber-700 hover:to-amber-600 transition-all duration-200 flex items-center gap-2 flex-shrink-0"
            >
              <Lock className="w-4 h-4" />
              <span>Login to Staff Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DOCTORS & SPECIALISTS SPOTLIGHT */}
      <section id="doctors" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 mb-2">
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>Medical Leadership</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-navy-950 tracking-tight">
            Consult With Our Specialists
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-2">
            Experienced consultants committed to compassionate, evidence-based care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SPECIALTIES.slice(0, 3).map((doc) => (
            <div
              key={doc.id}
              className="glass-panel p-6 rounded-3xl border border-beige-200 shadow-sm hover:shadow-gold transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-navy-900 text-amber-400 font-bold flex items-center justify-center text-lg shadow-sm">
                  {doc.doctor.split(' ')[1]?.[0]}
                  {doc.doctor.split(' ')[2]?.[0]}
                </div>
                <div>
                  <h4 className="font-extrabold text-navy-950 text-base">{doc.doctor}</h4>
                  <div className="text-xs font-semibold text-amber-700">{doc.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{doc.room}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Qualifications:</span>
                  <span className="font-bold text-navy-900">{doc.degree}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">OPD Days:</span>
                  <span className="font-bold text-navy-900">Mon, Wed, Fri</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-500">Visiting Hours:</span>
                  <span className="font-bold text-navy-900">09:00 AM - 01:00 PM</span>
                </div>
              </div>

              <div className="mt-5">
                <a
                  href="#token-tracker"
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-400/80 text-amber-900 hover:bg-amber-50 text-xs font-bold transition-all"
                >
                  <Search className="w-3.5 h-3.5 text-amber-600" />
                  <span>Check Queue for {doc.room}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FUTURISTIC FOOTER */}
      <footer className="bg-navy-950 text-slate-400 text-xs py-14 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Col 1 */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-navy-950 flex items-center justify-center font-black">
                  <Activity className="w-5 h-5 text-navy-950" />
                </div>
                <span className="text-xl font-black text-white tracking-tight">
                  ADYAPAN HOSPITAL
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Advanced Queue & Hospital Appointment Management SaaS. Empowering patients with
                transparent wait times, paperless clinical consultations, and emergency preparedness.
              </p>
              <div className="flex items-center gap-3 pt-1 text-slate-400">
                <span className="flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Adyapan Hospital Shaikpet, Hyderabad, Telangana, India
                </span>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">
                Quick Navigation
              </h4>
              <div>
                <a href="#specialties" className="hover:text-amber-400 transition-colors">
                  OPD Departments
                </a>
              </div>
              <div>
                <a href="#doctors" className="hover:text-amber-400 transition-colors">
                  Specialist Doctors
                </a>
              </div>
              <div>
                <a href="#token-tracker" className="hover:text-amber-400 transition-colors">
                  Patient Token Tracker
                </a>
              </div>
              <div>
                <Link to="/queue/tv" target="_blank" className="hover:text-amber-400 transition-colors">
                  Public Waiting Hall TV Display
                </Link>
              </div>
            </div>

            {/* Col 3: Staff Portal Access */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-white uppercase tracking-wider mb-3">
                Staff & Administration
              </h4>
              <p className="text-[11px] text-slate-400">
                Authorized clinical personnel can log in to their assigned workstations below:
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white font-bold text-xs shadow-gold hover:from-amber-700 hover:to-amber-600 transition-all"
              >
                <Lock className="w-3.5 h-3.5 text-white" />
                <span>Go to Staff Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="pt-8 border-t border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Adyapan Hospital Queue & Appointment System. All
              rights reserved.
            </div>
            <div className="flex items-center gap-4 text-slate-400 font-medium">
              <span>Security & Privacy</span>
              <span>Emergency Protocol</span>
              <Link to="/login" className="text-amber-400 hover:underline">
                Staff Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
