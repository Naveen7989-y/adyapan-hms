import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import HeartbeatLogo from '../components/common/HeartbeatLogo';
import ChamberDetailModal from '../components/common/ChamberDetailModal';
import QuickAssistWidget from '../components/common/QuickAssistWidget';
import PediatricBuddy from '../components/common/PediatricBuddy';
import ThemeToggle from '../components/common/ThemeToggle';
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
  Eye,
  Check,
  Flame,
  Filter,
  Hospital,
  HeartPulse,
  Siren,
} from 'lucide-react';
import hospitalFacilityImg from '../assets/hospital-facility.jpg';
import heroHeartBg from '../assets/hero-heart-bg.jpg';

const SPECIALTIES = [
  {
    id: 'gen',
    title: 'General Medicine',
    doctor: 'Dr. Rajesh Sharma',
    degree: 'MD, Internal Medicine (AIIMS)',
    room: 'Room 101',
    code: 'GEN',
    category: 'general',
    icon: Stethoscope,
    color: 'border-emerald-300/80 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 hover:border-emerald-500',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-300/70 dark:border-emerald-700/60',
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
    category: 'cardiac',
    icon: Heart,
    color: 'border-rose-300/80 dark:border-rose-700/60 text-rose-900 dark:text-rose-200 bg-rose-50/70 dark:bg-rose-950/30 hover:border-rose-500',
    badge: 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-300/70 dark:border-rose-700/60',
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
    category: 'general',
    icon: Baby,
    color: 'border-amber-300/80 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 bg-amber-50/70 dark:bg-amber-950/30 hover:border-amber-500',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-300/70 dark:border-amber-700/60',
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
    category: 'surgical',
    icon: Bone,
    color: 'border-blue-300/80 dark:border-blue-700/60 text-blue-900 dark:text-blue-200 bg-blue-50/70 dark:bg-blue-950/30 hover:border-blue-500',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-300/70 dark:border-blue-700/60',
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
    category: 'surgical',
    icon: Smile,
    color: 'border-teal-300/80 dark:border-teal-700/60 text-teal-900 dark:text-teal-200 bg-teal-50/70 dark:bg-teal-950/30 hover:border-teal-500',
    badge: 'bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 border-teal-300/70 dark:border-teal-700/60',
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
    category: 'cardiac',
    icon: Brain,
    color: 'border-purple-300/80 dark:border-purple-700/60 text-purple-900 dark:text-purple-200 bg-purple-50/70 dark:bg-purple-950/30 hover:border-purple-500',
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-300/70 dark:border-purple-700/60',
    accent: 'purple',
    desc: 'Comprehensive stroke care, epilepsy clinic, neuropathy management, and cognitive diagnostics.',
  },
];

const SAMPLE_TOKENS = ['T-001', 'T-002', 'GEN-001', 'CARD-102', 'ADY-202609-0001'];

const CAPABILITIES = [
  {
    title: 'Zero-Wait Real-Time Queue',
    description:
      'WebSocket-synchronized live OPD tokens broadcast seamlessly across calling desks, waiting hall TV displays, and patient devices.',
    icon: Zap,
    gradient: 'from-amber-500 to-amber-600',
    tag: 'WebSocket Sync',
  },
  {
    title: 'Smart FEFO Pharmacy Dispensary',
    description:
      'Automated First-Expiry-First-Out batch tracking with stock-out alarms and counterfeit-free verified dispensations.',
    icon: ShieldCheck,
    gradient: 'from-navy-700 to-navy-900',
    tag: 'Batch Tracking',
  },
  {
    title: 'Paperless Digital Health Records',
    description:
      'Unique Patient UHIDs, structured digital prescriptions with dosage calculators, and instant automated encounter invoicing.',
    icon: Activity,
    gradient: 'from-amber-600 to-amber-700',
    tag: 'Instant UHID',
  },
  {
    title: 'Multi-Role Clinical Security',
    description:
      'Tailored, high-speed ergonomic workstations for Super Admins, Hospital Admins, Doctors, Nurses, Pharmacists, and Cashiers.',
    icon: Users,
    gradient: 'from-navy-800 to-navy-950',
    tag: 'Role Workstations',
  },
];

// Kinetic Smooth Animated Number Component
const AnimatedNumber = ({ value, duration = 1600, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const elementRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const targetVal = Number(value);
    if (isNaN(targetVal)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime = null;

          const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease-out cubic for crisp, organic landing
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(targetVal * easedProgress);
            setDisplayValue(current);
            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setDisplayValue(targetVal);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.15 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={elementRef} className="tabular-nums">
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

// Scroll-Triggered Reveal Component using IntersectionObserver with progressive enhancement
const ScrollReveal = ({
  children,
  className = '',
  animation = 'up', // 'up' | 'scale' | 'left' | 'right'
  delay = 0,
  threshold = 0.12,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  const animClass =
    animation === 'department'
      ? 'scroll-department-card'
      : animation === 'scale'
      ? 'scroll-reveal-scale'
      : animation === 'left'
      ? 'scroll-reveal-left'
      : animation === 'right'
      ? 'scroll-reveal-right'
      : 'scroll-reveal';

  return (
    <div
      ref={ref}
      className={`${animClass} ${isRevealed ? 'is-revealed' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
};

export const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Self-service Token Tracker State
  const [searchToken, setSearchToken] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Interactive Department Filtering & Modal
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedChamber, setSelectedChamber] = useState(null);

  // Parallax Scroll & Cursor Depth Engine (Throttled via requestAnimationFrame)
  const [scrollY, setScrollY] = useState(0);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion.current) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHeroMouseMove = useCallback((e) => {
    if (prefersReducedMotion.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMouseOffset({ x, y });
  }, []);

  const handleHeroMouseLeave = useCallback(() => {
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  // Interactive Magnetic Button Physics
  const handleMagneticMove = (e) => {
    if (prefersReducedMotion.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    e.currentTarget.style.transform = `translate3d(${x * 0.28}px, ${y * 0.28}px, 0)`;
  };

  const handleMagneticLeave = (e) => {
    e.currentTarget.style.transform = 'translate3d(0px, 0px, 0px)';
  };

  // 3D Tilt and Spotlight Mouse Coordinates Handler
  const handleCardMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    e.currentTarget.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  };

  const handleCardMouseLeave = (e) => {
    e.currentTarget.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  };

  const performTrack = async (rawQuery) => {
    setSearchError('');
    const query = rawQuery.trim().toUpperCase();

    if (!query) {
      setSearchError('Please enter a Token Number (e.g., T-001, GEN-001, or 1) or Patient UHID.');
      setTrackResult(null);
      return;
    }

    setIsSearching(true);

    try {
      const res = await api.get(`/queue/track?query=${encodeURIComponent(query)}`);
      const data = res?.data || res;

      if (data && data.found) {
        setTrackResult({
          token: data.displayToken || data.token,
          canonicalToken: data.token,
          tokenNumber: data.tokenNumber,
          department: data.department,
          doctor: data.doctor,
          room: data.room,
          status: data.status,
          ahead: data.ahead,
          estWait: data.estWait,
          calledToken: data.calledToken || 'None',
          stageIndex: data.stageIndex ?? 1,
          patientName: data.patientName,
          uhid: data.uhid,
        });
        setSearchError('');
      } else {
        setTrackResult(null);
        setSearchError(
          data?.message ||
            `No active consultation token or patient found matching "${rawQuery}". Please verify your token number or visit the reception desk.`
        );
      }
    } catch (err) {
      console.error('Track token query error:', err);
      setTrackResult(null);
      setSearchError(
        err?.message ||
          'Unable to look up token from database. Please verify the number or consult the hospital reception desk.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    performTrack(searchToken);
  };

  const handleQuickSelectToken = (tokenStr) => {
    setSearchToken(tokenStr);
    performTrack(tokenStr);
    const element = document.getElementById('token-tracker');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const filteredSpecialties = SPECIALTIES.filter((s) => {
    if (activeCategory === 'all') return true;
    return s.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-[#F7F1E7] dark:bg-[#070D18] bg-cyber-grid text-[#14243A] dark:text-slate-100 selection:bg-[#E6D9C6] dark:selection:bg-amber-800 selection:text-[#14243A] dark:selection:text-amber-100 relative overflow-x-hidden font-sans transition-colors duration-300">
      {/* Interactive Chamber Details Modal */}
      <ChamberDetailModal
        chamber={selectedChamber}
        isOpen={!!selectedChamber}
        onClose={() => setSelectedChamber(null)}
        onSelectToken={handleQuickSelectToken}
      />

      {/* Floating 24/7 Patient & Emergency Hub */}
      <QuickAssistWidget onQuickTrack={handleQuickSelectToken} />

      {/* Playful Pediatric Prescription Buddy on bottom-left */}
      <PediatricBuddy />

      {/* Ambient Cyber Light Glow Orbs with Parallax Depth */}
      <div
        className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-[#D99A32]/15 dark:bg-amber-400/20 rounded-full blur-3xl pointer-events-none will-change-transform animate-breathing-aura"
        style={{
          transform: `translate3d(0, ${scrollY * 0.14}px, 0)`,
        }}
      />
      <div
        className="absolute top-96 -right-32 w-[30rem] h-[30rem] bg-[#14243A]/5 dark:bg-navy-700/15 rounded-full blur-3xl pointer-events-none will-change-transform animate-breathing-aura"
        style={{
          transform: `translate3d(0, ${scrollY * -0.09}px, 0)`,
        }}
      />
      <div
        className="absolute top-[65rem] left-1/4 w-[28rem] h-[28rem] bg-[#D99A32]/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none will-change-transform animate-breathing-aura"
        style={{
          transform: `translate3d(0, ${scrollY * 0.16}px, 0)`,
        }}
      />

      {/* TOP EMERGENCY MARQUEE BAR */}
      <div className="bg-[#FFF9F0] dark:bg-gradient-to-r dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 text-[#14243A] dark:text-white text-xs py-2 px-4 border-b border-[#E6D9C6] dark:border-navy-800/80 transition-colors duration-300 relative z-50 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#D99A32] text-[#14243A] uppercase tracking-widest animate-pulse shadow-xs">
              24/7 Active
            </span>
            <span className="text-[#14243A] dark:text-slate-300 font-semibold text-[11px] sm:text-xs">
              Adyapan Emergency Trauma & Critical Care Unit Open round the clock
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] sm:text-xs font-mono font-bold">
            <a
              href="tel:+918004259999"
              className="flex items-center gap-1.5 text-[#B97B20] hover:text-[#D99A32] dark:text-amber-300 dark:hover:text-amber-200 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#D99A32] dark:text-amber-400 animate-pulse" />
              Emergency Helpline: +91 (800) 425-9999
            </a>
            <span className="hidden md:inline-block text-[#E6D9C6] dark:text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1.5 text-[#526174] dark:text-slate-300 font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#D99A32] dark:text-amber-400" />
              OPD Timings: 8:00 AM - 8:00 PM (Mon-Sat)
            </span>
          </div>
        </div>
      </div>

      {/* FUTURISTIC STICKY NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#F7F1E7]/95 dark:bg-navy-950/90 backdrop-blur-md border-b border-[#E6D9C6] dark:border-navy-800 transition-all duration-300 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand Emblem */}
            <Link to="/" className="flex items-center gap-3 group">
              <HeartbeatLogo size="md" className="group-hover:scale-105 transition-all duration-300" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-black text-[#14243A] dark:text-white tracking-tight">
                    ADYAPAN
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#FFF9F0] dark:bg-amber-950/60 text-[#D99A32] dark:text-amber-300 border border-[#E6D9C6] dark:border-amber-700/60 hidden sm:inline-block shadow-xs">
                    HMS v1.0
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] font-bold text-[#526174] dark:text-amber-400 uppercase tracking-wider">
                  Hospital & Smart Queue Ecosystem
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-7 text-sm font-bold text-[#14243A] dark:text-slate-200">
              <a
                href="#specialties"
                className="hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                Specialties
              </a>
              <a
                href="#doctors"
                className="hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                Specialists
              </a>
              <a
                href="#token-tracker"
                className="hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                Track Token
              </a>
              <a
                href="#capabilities"
                className="hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors flex items-center gap-1"
              >
                Technology
              </a>
              <Link
                to="/queue/tv"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF9F0] text-[#14243A] hover:bg-[#FFFCF7] hover:text-[#D99A32] transition-all font-mono text-xs border border-[#E6D9C6] hover:border-[#D99A32] dark:bg-navy-900 dark:text-amber-300 dark:border-amber-400/40 dark:hover:bg-navy-800 shadow-xs group"
              >
                <Tv className="w-3.5 h-3.5 text-[#D99A32] group-hover:animate-bounce" />
                Live TV Screen
              </Link>
            </nav>

            {/* Right Action: Theme Toggle & Staff Login Button */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Light / Dark Mode Toggle Button beside Login */}
              <ThemeToggle />

              {isAuthenticated ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="shimmer-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-[#14243A] bg-[#D99A32] hover:bg-[#B97B20] dark:text-navy-950 dark:bg-gradient-to-r dark:from-amber-600 dark:to-amber-500 dark:hover:from-amber-700 dark:hover:to-amber-600 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <span>Staff Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  to="/login"
                  className="shimmer-btn flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-[#14243A] bg-[#D99A32] hover:bg-[#B97B20] border border-[#B97B20]/30 dark:bg-gradient-to-r dark:from-amber-600 dark:via-amber-500 dark:to-amber-600 dark:text-navy-950 dark:border-amber-400/50 shadow-sm hover:shadow-md dark:shadow-gold-glow transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Lock className="w-4 h-4 text-[#14243A] dark:text-amber-950" />
                  <span>Staff Portal / Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#14243A] dark:text-navy-950 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>

            {/* Mobile menu button & Theme Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Theme Toggle beside Login in Mobile Header */}
              <ThemeToggle size="sm" />

              <Link
                to="/login"
                className="px-3 py-2 rounded-lg bg-[#D99A32] hover:bg-[#B97B20] text-[#14243A] font-extrabold text-xs shadow-xs transition-colors"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-[#14243A] dark:text-slate-200 hover:bg-[#FFF9F0] dark:hover:bg-navy-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E6D9C6] dark:border-navy-800 bg-[#F7F1E7] dark:bg-navy-950 px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6D9C6] dark:border-navy-800">
              <span className="text-xs font-bold text-[#14243A] dark:text-slate-300 uppercase tracking-wider">
                Appearance
              </span>
              <ThemeToggle size="sm" showLabel />
            </div>
            <a
              href="#specialties"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#14243A] dark:text-slate-200 hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors"
            >
              Specialties & OPD
            </a>
            <a
              href="#doctors"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#14243A] dark:text-slate-200 hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors"
            >
              Our Specialists
            </a>
            <a
              href="#token-tracker"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#14243A] dark:text-slate-200 hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors"
            >
              Track Your Token
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-bold text-[#14243A] dark:text-slate-200 hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors"
            >
              Smart Platform Capabilities
            </a>
            <Link
              to="/queue/tv"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-2 text-sm font-bold text-[#B97B20] dark:text-amber-400 hover:text-[#D99A32] transition-colors"
            >
              <Tv className="w-4 h-4 text-[#D99A32]" />
              Public Waiting Hall TV Display
            </Link>
            <div className="pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex justify-center items-center gap-2 py-3 rounded-xl bg-[#D99A32] hover:bg-[#B97B20] text-[#14243A] font-extrabold text-sm shadow-sm"
              >
                <Lock className="w-4 h-4" />
                <span>Hospital Staff Sign In</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO HUB SECTION - HOSPITAL CENTRIC WITH PARALLAX FUTURISTIC HEART BACKGROUND */}
      <section
        className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-[#F7F1E7] via-[#FFF9F0] to-[#F7F1E7] dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 text-[#14243A] dark:text-white transition-colors duration-300"
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
      >
        {/* Futuristic Glowing Heart & Neural Cyber AI Background with Dual-Axis Parallax */}
        <div
          className="absolute inset-0 z-0 overflow-hidden pointer-events-none will-change-transform"
          style={{
            transform: `translate3d(${mouseOffset.x * -16}px, ${scrollY * 0.36 + mouseOffset.y * -12}px, 0) scale(1.15)`,
            transition: 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <img
            src={heroHeartBg}
            alt="Adyapan Holographic Cardiology & Smart Hospital Architecture"
            className="w-full h-full object-cover object-center lg:object-[65%_center] opacity-25 mix-blend-multiply dark:mix-blend-normal dark:opacity-85"
            loading="eager"
            fetchPriority="high"
          />
          {/* Multi-layered cinematic gradient overlays for contrast & crystal-clear readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F7F1E7] via-[#F7F1E7]/92 to-transparent dark:from-navy-950 dark:via-navy-950/85 dark:to-navy-950/40 lg:dark:via-navy-950/80 lg:dark:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F7F1E7] via-transparent to-[#F7F1E7]/70 dark:from-navy-950 dark:via-transparent dark:to-navy-950/70" />
          <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-[#F7F1E7]/80 to-transparent dark:from-navy-950/80 dark:to-transparent" />

          {/* Ambient Cyber Light Glow Orb with Secondary Parallax Layer */}
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D99A32]/10 dark:bg-amber-500/15 rounded-full blur-3xl pointer-events-none will-change-transform animate-breathing-aura"
            style={{
              transform: `translate3d(${mouseOffset.x * 24}px, ${scrollY * 0.18 + mouseOffset.y * 18}px, 0)`,
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* LEFT COLUMN: Clinical Authority & Hospital Overview */}
            <div className="lg:col-span-7 text-center lg:text-left">
              {/* Hospital Accreditation & Location Badge (Falls down 1st) */}
              <div
                className="animate-hero-fall inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#E6D9C6] dark:border-amber-400/50 bg-[#FFFCF7]/95 dark:bg-navy-900/80 text-[#D99A32] dark:text-amber-300 shadow-xs dark:shadow-lg text-xs font-bold uppercase tracking-wider mb-5 backdrop-blur-md"
                style={{ animationDelay: '100ms' }}
              >
                <Hospital className="w-4 h-4 text-[#D99A32] dark:text-amber-400" />
                <span className="text-[#14243A] dark:text-amber-300">NABH Accredited Multi-Specialty Hospital • Hyderabad</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>

              {/* Main Headline (Falls down 2nd) */}
              <h1
                className="animate-hero-fall text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-[#14243A] dark:text-white tracking-tight leading-[1.14] drop-shadow-xs"
                style={{ animationDelay: '220ms' }}
              >
                Compassionate Healing.{' '}
                <span className="text-[#D99A32] dark:bg-gradient-to-r dark:from-amber-400 dark:via-amber-300 dark:to-amber-500 dark:bg-clip-text dark:text-transparent block sm:inline">
                  Zero-Wait Smart Hospital OPD.
                </span>
              </h1>

              {/* Clinical Narrative (Falls down 3rd) */}
              <p
                className="animate-hero-fall mt-5 text-base sm:text-lg text-[#526174] dark:text-slate-200 leading-relaxed font-medium max-w-2xl mx-auto lg:mx-0"
                style={{ animationDelay: '360ms' }}
              >
                Adyapan Hospital integrates renowned clinical experts, 24/7 critical care,
                and real-time digital queue orchestration — eliminating crowded waiting rooms with
                instant tokens, 6 specialized OPD suites, and paperless health records.
              </p>

              {/* Quick Hospital Chamber Launcher (Falls down 4th) */}
              <div
                className="animate-hero-fall mt-6 pt-5 border-t border-[#E6D9C6] dark:border-white/10"
                style={{ animationDelay: '480ms' }}
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526174] dark:text-slate-400 block mb-2.5 text-center lg:text-left">
                  Active OPD Clinical Chambers Today:
                </span>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  {SPECIALTIES.map((spec) => {
                    const IconComp = spec.icon;
                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => setSelectedChamber(spec)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFCF7] dark:bg-navy-900/85 backdrop-blur-md border border-[#E6D9C6] dark:border-navy-700/80 hover:border-[#D99A32] dark:hover:border-amber-400 hover:bg-[#FFF9F0] dark:hover:bg-navy-800/90 text-xs font-bold text-[#14243A] dark:text-white shadow-xs dark:shadow-md transition-all transform hover:scale-105 active:scale-95"
                        title={`View ${spec.title} - ${spec.room}`}
                      >
                        <IconComp className="w-3.5 h-3.5 text-[#D99A32] dark:text-amber-400" />
                        <span>{spec.code}</span>
                        <span className="text-[10px] text-[#B97B20] dark:text-amber-300/80 font-mono">({spec.room.replace('Room ', 'R')})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons (Falls down 5th) */}
              <div
                className="animate-hero-fall mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5"
                style={{ animationDelay: '600ms' }}
              >
                {/* PRIMARY: Staff Login with Magnetic Cursor Attraction & Shimmer Light */}
                <Link
                  to="/login"
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticLeave}
                  className="magnetic-btn shimmer-btn w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm sm:text-base font-extrabold text-[#14243A] bg-[#D99A32] hover:bg-[#B97B20] border border-[#B97B20]/30 dark:bg-gradient-to-r dark:from-amber-600 dark:via-amber-500 dark:to-amber-600 dark:text-navy-950 dark:border-amber-300 shadow-md hover:shadow-lg dark:shadow-gold-glow-lg transition-all duration-300 active:translate-y-0 group"
                >
                  <Lock className="w-4 h-4 text-[#14243A] dark:text-amber-950" />
                  <span>Staff & Doctor Portal</span>
                  <ArrowRight className="w-4 h-4 text-[#14243A] dark:text-navy-950 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* SECONDARY: Live Queue TV Display with Magnetic Pull */}
                <Link
                  to="/queue/tv"
                  target="_blank"
                  rel="noreferrer"
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticLeave}
                  className="magnetic-btn w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold bg-[#FFF9F0] hover:bg-[#FFFCF7] text-[#14243A] border-2 border-[#14243A] dark:bg-navy-900/90 dark:text-white dark:border-white/20 dark:hover:border-amber-400 shadow-xs transition-all duration-200 group"
                >
                  <Tv className="w-4 h-4 text-[#D99A32] dark:text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Waiting Hall TV Screen</span>
                </Link>

                {/* TERTIARY: Quick Track with Magnetic Pull */}
                <a
                  href="#token-tracker"
                  onMouseMove={handleMagneticMove}
                  onMouseLeave={handleMagneticLeave}
                  className="magnetic-btn w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold text-[#14243A] hover:text-[#B97B20] bg-[#FFF9F0] hover:bg-[#FFFCF7] border border-[#E6D9C6] hover:border-[#D99A32] dark:bg-white/5 dark:text-slate-300 dark:hover:text-white dark:border-white/10 rounded-xl transition-all shadow-2xs"
                >
                  <Search className="w-4 h-4 text-[#D99A32] dark:text-amber-400" />
                  <span>Track Token</span>
                </a>
              </div>

              {/* Hospital Credentials Badges (Falls down 6th) */}
              <div
                className="animate-hero-fall mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-[#526174] dark:text-slate-300"
                style={{ animationDelay: '720ms' }}
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <AnimatedNumber value={500} suffix="+ Inpatient Beds" />
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  24/7 Trauma ICU
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  NABH & JCI Certified
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: Modern Smart Hospital Facility Showcase & Telemetry */}
            <div
              className="lg:col-span-5 relative will-change-transform"
              style={{ transform: `translate3d(0, ${scrollY * -0.05}px, 0)` }}
            >
              <div
                className="hud-corners spotlight-card tilt-card animate-hero-card relative rounded-3xl overflow-hidden border border-[#E6D9C6] dark:border-amber-400/40 shadow-xl dark:shadow-2xl bg-[#FFFCF7] dark:bg-navy-950/90 text-[#14243A] dark:text-white backdrop-blur-xl"
                style={{ animationDelay: '300ms' }}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                {/* Holographic Laser Telemetry Scanline */}
                <div className="cyber-scanline" />

                {/* Hospital Facility Image */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                  <img
                    src={hospitalFacilityImg}
                    alt="Adyapan Multi-Specialty Hospital Medical Center"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    loading="eager"
                    fetchPriority="high"
                  />
                  {/* Subtle Gradient Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#FFFCF7] dark:from-navy-950 via-transparent to-transparent" />

                  {/* Top Floating Hospital Status Badge */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFCF7]/95 dark:bg-navy-950/85 backdrop-blur-md border border-[#E6D9C6] dark:border-amber-400/40 text-[#14243A] dark:text-amber-300 text-[11px] font-bold shadow-xs">
                      <Hospital className="w-3.5 h-3.5 text-[#D99A32] dark:text-amber-400" />
                      <span>Adyapan Medical Center</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 dark:bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      24/7 Trauma Open
                    </div>
                  </div>
                </div>

                {/* Bottom Clinical Telemetry Overlay */}
                <div className="p-5 relative bg-[#FFF9F0] dark:bg-navy-950/95 border-t border-[#E6D9C6] dark:border-amber-400/30">
                  {/* Live Calling Alert Strip */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#E6D9C6] dark:border-navy-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#FFFCF7] dark:bg-amber-500/20 text-[#D99A32] dark:text-amber-400 flex items-center justify-center border border-[#E6D9C6] dark:border-amber-400/40 shadow-2xs">
                        <Stethoscope className="w-4 h-4 animate-pulse text-[#D99A32] dark:text-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#14243A] dark:text-white flex items-center gap-1.5">
                          <span>Dr. Rajesh Sharma</span>
                          <span className="text-[10px] text-[#D99A32] dark:text-amber-400 font-mono font-bold">MD (AIIMS)</span>
                        </div>
                        <div className="text-[11px] text-[#526174] dark:text-slate-300 flex items-center gap-1">
                          <span className="text-[#14243A] dark:text-amber-300 font-mono font-bold">Room 101</span>
                          <span>•</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Calling GEN-004</span>
                        </div>
                      </div>
                    </div>

                    {/* Animated ECG Pulse Wave */}
                    <div className="flex items-center gap-1 bg-[#FFFCF7] dark:bg-navy-900/80 px-2.5 py-1.5 rounded-lg border border-[#E6D9C6] dark:border-amber-400/30 shadow-2xs">
                      <HeartPulse className="w-4 h-4 text-rose-500 animate-continuous-heartbeat" />
                      <svg className="w-14 h-5 text-[#D99A32] dark:text-amber-400 stroke-current fill-none stroke-[2]" viewBox="0 0 70 20">
                        <path d="M0,10 L18,10 L22,3 L27,17 L31,2 L35,13 L38,10 L70,10" className="animate-ecg-stroke" />
                      </svg>
                    </div>
                  </div>

                  {/* Futuristic Live Telemetry Diagnostic Micro-Strip */}
                  <div className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#FFFCF7] dark:bg-navy-900/60 border border-[#E6D9C6] dark:border-navy-800 text-[10px] font-mono text-[#526174] dark:text-slate-400 my-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                      <span className="text-[#14243A] dark:text-slate-300 font-bold">OPD.SYNC: 120 FPS</span>
                    </div>
                    <div className="text-[#B97B20] dark:text-amber-300/90 font-bold">
                      LATENCY: &lt; 14ms
                    </div>
                  </div>

                  {/* Hospital Real-Time Capacity Strip */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-2 rounded-xl bg-[#FFFCF7] dark:bg-navy-900/90 border border-[#E6D9C6] dark:border-navy-800 shadow-2xs">
                      <span className="text-[10px] text-[#526174] dark:text-slate-400 font-bold block uppercase tracking-wider">ICU Beds</span>
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">14 Available</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#FFFCF7] dark:bg-navy-900/90 border border-[#E6D9C6] dark:border-navy-800 shadow-2xs">
                      <span className="text-[10px] text-[#526174] dark:text-slate-400 font-bold block uppercase tracking-wider">OPD Suites</span>
                      <span className="text-xs font-black text-[#D99A32] dark:text-amber-300 font-mono">6 Active</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#FFFCF7] dark:bg-navy-900/90 border border-[#E6D9C6] dark:border-navy-800 shadow-2xs">
                      <span className="text-[10px] text-[#526174] dark:text-slate-400 font-bold block uppercase tracking-wider">Ambulance</span>
                      <span className="text-xs font-black text-[#14243A] dark:text-white font-mono">4 Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Live Operational Metrics Bar with Rising Entrance Animations & Animated Number Counters */}
          <div className="mt-14 pt-10 border-t border-[#E6D9C6] dark:border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div
              className="hud-corners spotlight-card tilt-card animate-hero-rise bg-[#FFFCF7] dark:bg-navy-900/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-[#E6D9C6] dark:border-white/10 hover:border-[#D99A32] dark:hover:border-amber-400/50 shadow-sm dark:shadow-xl text-[#14243A] dark:text-white transition-all"
              style={{ animationDelay: '800ms' }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#526174] dark:text-slate-400 uppercase tracking-wider">
                  Average OPD Wait
                </span>
                <Zap className="w-4 h-4 text-[#D99A32] dark:text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#14243A] dark:text-white font-mono">
                <AnimatedNumber value={12} prefix="< " suffix=" mins" />
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Live calling sync
              </div>
            </div>

            <div
              className="hud-corners spotlight-card tilt-card animate-hero-rise bg-[#FFFCF7] dark:bg-navy-900/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-[#E6D9C6] dark:border-white/10 hover:border-[#D99A32] dark:hover:border-amber-400/50 shadow-sm dark:shadow-xl text-[#14243A] dark:text-white transition-all"
              style={{ animationDelay: '900ms' }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#526174] dark:text-slate-400 uppercase tracking-wider">
                  Specialists On Duty
                </span>
                <Stethoscope className="w-4 h-4 text-[#D99A32] dark:text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#14243A] dark:text-white font-mono">
                <AnimatedNumber value={12} suffix="+ Doctors" />
              </div>
              <div className="text-[11px] text-[#526174] dark:text-slate-300 font-semibold mt-1">
                AIIMS & DM Board Certified
              </div>
            </div>

            <div
              className="hud-corners spotlight-card tilt-card animate-hero-rise bg-[#FFFCF7] dark:bg-navy-900/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-[#E6D9C6] dark:border-white/10 hover:border-[#D99A32] dark:hover:border-amber-400/50 shadow-sm dark:shadow-xl text-[#14243A] dark:text-white transition-all"
              style={{ animationDelay: '1000ms' }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#526174] dark:text-slate-400 uppercase tracking-wider">
                  OPD Clinical Suites
                </span>
                <Building2 className="w-4 h-4 text-[#D99A32] dark:text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#14243A] dark:text-white font-mono">
                <AnimatedNumber value={6} suffix=" Chambers" />
              </div>
              <div className="text-[11px] text-[#526174] dark:text-slate-300 font-semibold mt-1">
                Rooms 101 to 106 active
              </div>
            </div>

            <div
              className="hud-corners spotlight-card tilt-card animate-hero-rise bg-[#FFFCF7] dark:bg-navy-900/80 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-[#E6D9C6] dark:border-white/10 hover:border-[#D99A32] dark:hover:border-amber-400/50 shadow-sm dark:shadow-xl text-[#14243A] dark:text-white transition-all"
              style={{ animationDelay: '1100ms' }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-[#526174] dark:text-slate-400 uppercase tracking-wider">
                  Trauma & Critical Care
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#14243A] dark:text-white font-mono">24/7 Standby</div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                Zero-delay emergency triage
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE LIVE TOKEN TRACKER SECTION */}
      <section id="token-tracker" className="py-16 bg-[#FFF9F0] dark:bg-navy-950/80 border-y border-[#E6D9C6] dark:border-navy-800 transition-colors duration-300 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F7F1E7] dark:bg-amber-950/80 text-[#D99A32] dark:text-amber-300 border border-[#E6D9C6] dark:border-amber-800/80 mb-2">
                <Search className="w-3.5 h-3.5 text-[#D99A32] dark:text-amber-400" />
                <span>Patient Self-Service Queue Portal</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#14243A] dark:text-white tracking-tight">
                Track Your Live OPD Token Status
              </h2>
              <p className="text-sm text-[#526174] dark:text-slate-300 mt-1">
                Check your queue position, assigned doctor chamber, and estimated consultation time.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal animation="scale" delay={100}>
            <div
              className="hud-corners glass-panel p-6 sm:p-8 rounded-3xl border border-[#E6D9C6] dark:border-navy-700 shadow-sm dark:shadow-gold bg-[#FFFCF7] dark:bg-navy-900/90 relative transition-colors duration-300"
            >
              <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#526174]">
                    <Search className="w-5 h-5 text-[#D99A32]" />
                  </div>
                  <input
                    type="text"
                    value={searchToken}
                    onChange={(e) => setSearchToken(e.target.value)}
                    placeholder="Enter Token # (e.g., GEN-001, CARD-102) or UHID"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-[#E6D9C6] dark:border-navy-700 bg-[#FFF9F0] dark:bg-navy-950 text-sm font-semibold text-[#14243A] dark:text-white placeholder-[#526174]/60 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D99A32] focus:border-transparent transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-6 py-3.5 rounded-xl bg-[#D99A32] hover:bg-[#B97B20] text-[#14243A] font-extrabold text-sm shadow-sm dark:bg-gradient-to-r dark:from-amber-600 dark:to-amber-500 dark:hover:from-amber-700 dark:hover:to-amber-600 dark:text-navy-950 dark:font-black transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isSearching ? 'Checking...' : 'Check Status'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Token Chips */}
              <div className="mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-[#E6D9C6] dark:border-navy-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526174] dark:text-slate-400">
                  Try Sample Token:
                </span>
                {SAMPLE_TOKENS.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleQuickSelectToken(sample)}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#FFF9F0] dark:bg-navy-800 text-[#14243A] dark:text-amber-300 border border-[#E6D9C6] dark:border-amber-500/40 hover:bg-[#F7F1E7] dark:hover:bg-navy-700 hover:border-[#D99A32] transition-all transform hover:scale-105 active:scale-95 shadow-2xs"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {searchError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Result Display Card with Queue Journey Timeline */}
              {trackResult && (
                <div className="hud-corners relative mt-6 p-5 sm:p-6 rounded-2xl bg-[#FFF9F0] dark:bg-gradient-to-br dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 text-[#14243A] dark:text-white border-2 border-[#D99A32] dark:border-amber-500/40 shadow-md dark:shadow-navy-lg animate-fade-in-scale overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6D9C6] dark:border-navy-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#B97B20] dark:text-amber-400 font-bold uppercase tracking-widest">
                            Live Token In Triage
                          </span>
                          {trackResult.patientName && (
                            <span className="text-[10px] text-[#526174] dark:text-slate-400 font-mono font-semibold">
                              • Patient: {trackResult.patientName} {trackResult.uhid ? `(${trackResult.uhid})` : ''}
                            </span>
                          )}
                        </div>
                        <h3 className="text-2xl font-black text-[#14243A] dark:text-white font-mono mt-0.5">
                          {trackResult.token}
                        </h3>
                      </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D99A32]/20 border border-[#D99A32]/40 text-[#14243A] dark:text-amber-300 animate-pulse">
                        Status: {trackResult.status}
                      </span>
                    </div>
                  </div>

                  {/* 4-Stage Queue Progress Tracker */}
                  <div className="py-6 border-b border-[#E6D9C6] dark:border-navy-800">
                    <div className="grid grid-cols-4 gap-2 text-center relative">
                      {/* Connecting Background Line */}
                      <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#E6D9C6] dark:bg-navy-800 -z-0" />
                      
                      {[
                        { label: 'Registered', sub: 'UHID Verified' },
                        { label: 'Waiting Hall', sub: 'Queue Staged' },
                        { label: 'Vital Triage', sub: 'Nurse Station' },
                        { label: 'Doctor Suite', sub: 'Consultation' },
                      ].map((stg, sIdx) => {
                        const isPast = sIdx < (trackResult.stageIndex ?? 1);
                        const isCurrent = sIdx === (trackResult.stageIndex ?? 1);
                        return (
                          <div key={stg.label} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                                isPast
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : isCurrent
                                  ? 'bg-[#D99A32] text-[#14243A] ring-4 ring-[#D99A32]/30 font-extrabold animate-bounce'
                                  : 'bg-[#E6D9C6] dark:bg-navy-800 text-[#526174] dark:text-slate-400'
                              }`}
                            >
                              {isPast ? <Check className="w-4 h-4" /> : sIdx + 1}
                            </div>
                            <span
                              className={`text-xs font-bold mt-2 ${
                                isCurrent ? 'text-[#D99A32] dark:text-amber-400' : isPast ? 'text-[#14243A] dark:text-white' : 'text-[#526174] dark:text-slate-400'
                              }`}
                            >
                              {stg.label}
                            </span>
                            <span className="text-[10px] text-[#526174] dark:text-slate-400 hidden sm:inline-block">
                              {stg.sub}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational Telemetry Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5 text-left">
                    <div>
                      <span className="text-[10px] text-[#526174] dark:text-slate-400 font-bold uppercase tracking-wider block">
                        Assigned Chamber
                      </span>
                      <span className="text-sm font-black text-[#D99A32] dark:text-amber-300 font-mono mt-0.5 block">
                        {trackResult.room}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#526174] dark:text-slate-400 font-bold uppercase tracking-wider block">
                        Consultant Doctor
                      </span>
                      <span className="text-sm font-bold text-[#14243A] dark:text-white mt-0.5 block truncate">
                        {trackResult.doctor}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#526174] dark:text-slate-400 font-bold uppercase tracking-wider block">
                        Tokens Ahead
                      </span>
                      <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">
                        {trackResult.ahead} Patients
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#526174] dark:text-slate-400 font-bold uppercase tracking-wider block">
                        Est. Consultation
                      </span>
                      <span className="text-sm font-black text-[#B97B20] dark:text-amber-400 font-mono mt-0.5 block">
                        {trackResult.estWait}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-[#E6D9C6] dark:border-navy-800 flex flex-col sm:flex-row items-center justify-between text-xs text-[#526174] dark:text-slate-400 gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      Live Calling Now: <strong className="text-[#14243A] dark:text-white font-mono">{trackResult.calledToken}</strong>
                    </span>
                    <Link
                      to="/queue/tv"
                      target="_blank"
                      className="text-[#D99A32] hover:text-[#B97B20] dark:text-amber-300 dark:hover:text-amber-200 font-bold underline flex items-center gap-1"
                    >
                      <Tv className="w-3.5 h-3.5" />
                      Open Live Hall TV Monitor
                    </Link>
                  </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CLINICAL SPECIALTIES GRID WITH 3D SCROLL EFFECTS AND AMBIENT PARALLAX */}
      <section id="specialties" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#F7F1E7] dark:bg-transparent transition-colors duration-300">
        {/* Parallax Department Ambient Light Glow Orbs */}
        <div
          className="absolute -top-24 -left-28 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none will-change-transform"
          style={{
            transform: `translate3d(0, ${(scrollY - 1300) * 0.12}px, 0)`,
          }}
        />
        <div
          className="absolute -bottom-20 -right-24 w-88 h-88 bg-rose-400/10 rounded-full blur-3xl pointer-events-none will-change-transform"
          style={{
            transform: `translate3d(0, ${(scrollY - 1600) * -0.10}px, 0)`,
          }}
        />

        <ScrollReveal animation="up">
          <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFF9F0] dark:bg-amber-950/80 text-[#D99A32] dark:text-amber-300 mb-2 shadow-xs border border-[#E6D9C6] dark:border-amber-800/80">
              <Stethoscope className="w-3.5 h-3.5 text-[#D99A32] dark:text-amber-400 animate-pulse" />
              <span>OPD Clinical Chambers</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14243A] dark:text-white tracking-tight">
              Specialized Medical Departments
            </h2>
            <p className="text-[#526174] dark:text-slate-300 text-sm sm:text-base mt-2">
              State-of-the-art diagnostic and clinical suites staffed by renowned medical specialists. Click any chamber card to view schedule and details.
            </p>
          </div>
        </ScrollReveal>

        {/* Filter Tabs */}
        <ScrollReveal animation="up" delay={80}>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 relative z-10">
            {[
              { id: 'all', label: 'All Chambers' },
              { id: 'general', label: 'General & Pediatrics' },
              { id: 'cardiac', label: 'Cardio & Neurology' },
              { id: 'surgical', label: 'Orthopedic & Dental' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-[#14243A] text-[#D99A32] dark:bg-amber-500 dark:text-navy-950 shadow-sm border border-[#14243A] dark:border-amber-400/40 transform scale-105'
                    : 'bg-[#FFFCF7] dark:bg-navy-900 text-[#526174] dark:text-slate-300 hover:text-[#14243A] hover:bg-[#FFF9F0] dark:hover:bg-navy-800 border border-[#E6D9C6] dark:border-navy-700 hover:border-[#D99A32] dark:hover:border-amber-500/50 shadow-2xs'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Dynamic 3D Unfurling Chamber Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {filteredSpecialties.map((spec, sIdx) => {
            const IconComp = spec.icon;
            return (
              <ScrollReveal key={spec.id} animation="department" delay={sIdx * 85}>
                <div
                  onClick={() => setSelectedChamber(spec)}
                  onMouseMove={handleCardMouseMove}
                  onMouseLeave={handleCardMouseLeave}
                  className={`spotlight-card tilt-card p-6 rounded-3xl border border-[#E6D9C6] dark:border-navy-700/80 bg-[#FFFCF7] dark:bg-navy-900/90 backdrop-blur-sm shadow-xs hover:shadow-md cursor-pointer h-full relative overflow-hidden transition-all duration-300 hover:border-[#D99A32] dark:hover:border-amber-400 ${spec.color}`}
                >
                  {/* Scroll-triggered light sweep sheen */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent pointer-events-none animate-sheen-entry -z-0" />

                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF9F0] dark:bg-navy-950 shadow-xs flex items-center justify-center border border-[#E6D9C6] dark:border-navy-700 scroll-icon-pop">
                      <IconComp className="w-6 h-6 text-[#14243A] dark:text-amber-400" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${spec.badge}`}>
                        {spec.code}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#14243A] dark:text-slate-200 bg-[#FFF9F0] dark:bg-navy-950/80 px-2 py-0.5 rounded-md border border-[#E6D9C6] dark:border-navy-700">
                        {spec.room}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-[#14243A] dark:text-white relative z-10">{spec.title}</h3>
                  <div className="text-xs font-bold text-[#B97B20] dark:text-amber-400 mt-1 relative z-10">{spec.doctor}</div>
                  <div className="text-[11px] text-[#526174] dark:text-slate-400 font-medium mb-3 relative z-10">{spec.degree}</div>

                  <p className="text-xs text-[#526174] dark:text-slate-300 leading-relaxed relative z-10">{spec.desc}</p>

                  <div className="mt-5 pt-4 border-t border-[#E6D9C6] dark:border-navy-800 flex items-center justify-between text-xs font-bold text-[#14243A] dark:text-slate-200 relative z-10">
                    <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      OPD Active Today
                    </span>
                    <div className="text-[#D99A32] hover:text-[#B97B20] dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1 group font-bold">
                      <span>View Chamber</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* WHY CHOOSE ADYAPAN TECHNOLOGY */}
      <section id="capabilities" className="py-20 bg-gradient-to-b from-[#FFF9F0] via-[#F7F1E7] to-[#FFF9F0] dark:from-navy-950 dark:via-navy-900 dark:to-navy-950 text-[#14243A] dark:text-white relative overflow-hidden transition-colors duration-300">
        {/* Parallax Cyber Depth Glow Orbs */}
        <div
          className="absolute -top-32 -left-20 w-80 h-80 bg-[#D99A32]/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none will-change-transform"
          style={{
            transform: `translate3d(0, ${(scrollY - 1800) * 0.12}px, 0)`,
          }}
        />
        <div
          className="absolute bottom-0 -right-20 w-96 h-96 bg-[#14243A]/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none will-change-transform"
          style={{
            transform: `translate3d(0, ${(scrollY - 2100) * -0.10}px, 0)`,
          }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal animation="up">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFF9F0] dark:bg-amber-400/20 border border-[#E6D9C6] dark:border-amber-400/30 text-[#D99A32] dark:text-amber-300 mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#D99A32] dark:text-amber-400" />
                <span>Smart Hospital Engineering</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-[#14243A] dark:text-white tracking-tight">
                Enterprise Queue & Hospital Automation
              </h2>
              <p className="text-[#526174] dark:text-slate-400 text-sm sm:text-base mt-2">
                Designed from the ground up for high-throughput OPD clinics, multi-counter triage, and seamless clinical handoffs.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CAPABILITIES.map((cap, idx) => {
              const IconComp = cap.icon;
              return (
                <ScrollReveal key={idx} animation="scale" delay={idx * 90}>
                  <div
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    className="hud-corners spotlight-card tilt-card p-6 rounded-3xl border border-[#E6D9C6] dark:border-navy-700/80 bg-[#FFFCF7] dark:bg-navy-900/80 text-[#14243A] dark:text-white shadow-xs hover:shadow-md hover:border-[#D99A32] dark:hover:border-amber-400/60 transition-all duration-300 h-full relative overflow-hidden group"
                  >
                    <div className="relative z-10">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${cap.gradient} text-white flex items-center justify-center shadow-xs mb-5`}
                      >
                        <IconComp className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-[#14243A] dark:text-white mb-2">{cap.title}</h3>
                      <p className="text-xs text-[#526174] dark:text-slate-300 leading-relaxed font-normal">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* CTA Banner inside capabilities section */}
          <ScrollReveal animation="up" delay={150}>
            <div className="mt-16 p-8 rounded-3xl bg-[#FFFCF7] dark:bg-[#0B1524] border border-[#E6D9C6] dark:border-[#1E293B] dark:border-amber-400/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs relative overflow-hidden">
              <div className="absolute inset-0 bg-transparent dark:bg-gradient-to-r dark:from-amber-500/10 dark:via-amber-500/5 dark:to-transparent pointer-events-none" />
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-[#14243A] dark:text-[#F8FAFC]">
                  Authorized Clinical & Hospital Staff?
                </h3>
                <p className="text-xs text-[#526174] dark:text-[#94A3B8] mt-1 max-w-xl font-medium">
                  Access your calling workstation, triage desk, pharmacy inventory, and encounter cashier portal.
                </p>
              </div>
              <Link
                to="/login"
                className="hms-btn-primary px-6 py-3.5 text-sm shadow-md flex-shrink-0 relative z-10"
              >
                <Lock className="w-4 h-4" />
                <span>Login to Staff Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* DOCTORS & SPECIALISTS SPOTLIGHT */}
      <section id="doctors" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-[#F7F1E7] dark:bg-transparent transition-colors duration-300">
        <ScrollReveal animation="up">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFF9F0] dark:bg-amber-950/80 text-[#D99A32] dark:text-amber-300 border border-[#E6D9C6] dark:border-amber-800/80 mb-2 shadow-xs">
              <Users className="w-3.5 h-3.5 text-[#D99A32] dark:text-amber-400" />
              <span>Medical Leadership</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#14243A] dark:text-white tracking-tight">
              Consult With Our Specialists
            </h2>
            <p className="text-[#526174] dark:text-slate-300 text-sm sm:text-base mt-2">
              Experienced consultants committed to compassionate, evidence-based care.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SPECIALTIES.slice(0, 3).map((doc, dIdx) => (
            <ScrollReveal key={doc.id} animation="up" delay={dIdx * 110}>
              <div
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
                className="spotlight-card tilt-card bg-[#FFFCF7] dark:bg-navy-900/90 p-6 rounded-3xl border border-[#E6D9C6] dark:border-navy-700/80 shadow-xs hover:shadow-md hover:border-[#D99A32] dark:hover:border-amber-400 transition-all duration-300 h-full"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#14243A] text-[#D99A32] font-bold flex items-center justify-center text-lg shadow-xs border border-[#D99A32]/30 dark:bg-navy-900 dark:text-amber-400">
                    {doc.doctor.split(' ')[1]?.[0]}
                    {doc.doctor.split(' ')[2]?.[0]}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-[#14243A] dark:text-white text-base">{doc.doctor}</h4>
                    <div className="text-xs font-bold text-[#B97B20] dark:text-amber-400">{doc.title}</div>
                    <div className="text-[11px] text-[#526174] dark:text-slate-400 font-mono">{doc.room}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FFF9F0] dark:bg-navy-950/80 border border-[#E6D9C6] dark:border-navy-800 text-xs text-[#526174] dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium text-[#526174] dark:text-slate-400">Qualifications:</span>
                    <span className="font-bold text-[#14243A] dark:text-slate-100">{doc.degree}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#526174] dark:text-slate-400">OPD Days:</span>
                    <span className="font-bold text-[#14243A] dark:text-slate-100">Mon, Wed, Fri</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-[#526174] dark:text-slate-400">Visiting Hours:</span>
                    <span className="font-bold text-[#14243A] dark:text-slate-100">09:00 AM - 01:00 PM</span>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={() => handleQuickSelectToken(`${doc.code}-001`)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-[#D99A32] bg-[#FFF9F0] hover:bg-[#D99A32] text-[#14243A] font-extrabold dark:border-amber-400/80 dark:bg-transparent dark:text-amber-300 dark:hover:bg-amber-950/50 text-xs transition-all transform hover:scale-[1.02] active:scale-95 shadow-2xs"
                  >
                    <Search className="w-3.5 h-3.5 text-[#14243A] dark:text-amber-400" />
                    <span>Check Queue for {doc.room}</span>
                  </button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* FUTURISTIC FOOTER */}
      <footer className="bg-[#FFF9F0] dark:bg-navy-950 text-[#526174] dark:text-slate-400 text-xs py-14 border-t border-[#E6D9C6] dark:border-navy-800 transition-colors duration-300">
        <ScrollReveal animation="up">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
              {/* Col 1 */}
              <div className="space-y-3 md:col-span-2">
                <div className="flex items-center gap-2.5">
                  <HeartbeatLogo size="sm" />
                  <span className="text-xl font-black text-[#14243A] dark:text-white tracking-tight">
                    ADYAPAN HOSPITAL
                  </span>
                </div>
                <p className="text-xs text-[#526174] dark:text-slate-400 max-w-sm leading-relaxed font-medium">
                  Advanced Queue & Hospital Appointment Management SaaS. Empowering patients with
                  transparent wait times, paperless clinical consultations, and emergency preparedness.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[#526174] dark:text-slate-400">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#D99A32]" />
                    Adyapan Hospital Shaikpet, Hyderabad, Telangana, India
                  </span>
                </div>
              </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#14243A] dark:text-white uppercase tracking-wider mb-3">
                Quick Navigation
              </h4>
              <div>
                <a href="#specialties" className="hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors font-medium">
                  OPD Departments
                </a>
              </div>
              <div>
                <a href="#doctors" className="hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors font-medium">
                  Specialist Doctors
                </a>
              </div>
              <div>
                <a href="#token-tracker" className="hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors font-medium">
                  Patient Token Tracker
                </a>
              </div>
              <div>
                <Link to="/queue/tv" target="_blank" className="hover:text-[#D99A32] dark:hover:text-amber-400 transition-colors font-medium">
                  Public Waiting Hall TV Display
                </Link>
              </div>
            </div>

            {/* Col 3: Staff Portal Access */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-[#14243A] dark:text-[#F8FAFC] uppercase tracking-wider mb-3">
                Staff & Administration
              </h4>
              <p className="text-[11px] text-[#526174] dark:text-[#94A3B8] font-medium">
                Authorized clinical personnel can log in to their assigned workstations below:
              </p>
              <Link
                to="/login"
                className="hms-btn-primary text-xs py-2.5 px-4 shadow-xs inline-flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Go to Staff Login</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E6D9C6] dark:border-navy-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#526174] dark:text-slate-500">
            <div>
              &copy; {new Date().getFullYear()} Adyapan Hospital Queue & Appointment System. All
              rights reserved.
            </div>
            <div className="flex items-center gap-4 text-[#526174] dark:text-slate-400 font-medium">
              <span>Security & Privacy</span>
              <span>Emergency Protocol</span>
              <Link to="/login" className="text-[#D99A32] hover:underline font-bold">
                Staff Portal
              </Link>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </footer>
    </div>
  );
};

export default Home;
