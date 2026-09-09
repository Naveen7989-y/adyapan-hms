import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Activity,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Stethoscope,
  Heart,
  Baby,
  Bone,
  Smile,
  Brain,
  ShieldCheck,
  User,
} from 'lucide-react';

const STAFF_ACCOUNTS = [
  { role: 'Hospital Admin', email: 'admin@adyapan.com', desc: 'Full System Ops', color: 'border-amber-400 text-amber-900 bg-amber-50' },
  { role: 'Receptionist', email: 'reception@adyapan.com', desc: 'Front Desk & Triage', color: 'border-navy-300 text-navy-800 bg-navy-50' },
  { role: 'Pharmacist', email: 'pharmacist@adyapan.com', desc: 'Dispensary & Stock', color: 'border-amber-300 text-amber-800 bg-amber-50/60' },
  { role: 'Accountant', email: 'accounts@adyapan.com', desc: 'Billing & Cashier', color: 'border-beige-300 text-beige-800 bg-beige-100' },
  { role: 'Nurse Assistant', email: 'nurse@adyapan.com', desc: 'Vitals & Staging', color: 'border-teal-300 text-teal-800 bg-teal-50' },
  { role: 'Super Admin', email: 'superadmin@adyapan.com', desc: 'Multi-hospital Lead', color: 'border-navy-700 text-amber-300 bg-navy-900' },
];

const DOCTOR_CATEGORIES = [
  {
    category: 'General Medicine',
    name: 'Dr. Rajesh Sharma',
    email: 'doctor.sharma@adyapan.com',
    room: 'Room 101',
    code: 'GEN',
    icon: Stethoscope,
    color: 'border-emerald-300 text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100/70',
    badge: 'bg-emerald-100 text-emerald-800',
  },
  {
    category: 'Cardiology',
    name: 'Dr. Priya Patel',
    email: 'doctor.cardio@adyapan.com',
    room: 'Room 102',
    code: 'CARD',
    icon: Heart,
    color: 'border-rose-300 text-rose-900 bg-rose-50/80 hover:bg-rose-100/70',
    badge: 'bg-rose-100 text-rose-800',
  },
  {
    category: 'Pediatrics',
    name: 'Dr. Vikram Rao',
    email: 'doctor.pediatric@adyapan.com',
    room: 'Room 103',
    code: 'PED',
    icon: Baby,
    color: 'border-amber-300 text-amber-900 bg-amber-50/80 hover:bg-amber-100/70',
    badge: 'bg-amber-100 text-amber-800',
  },
  {
    category: 'Orthopedics',
    name: 'Dr. Suresh Menon',
    email: 'doctor.ortho@adyapan.com',
    room: 'Room 104',
    code: 'ORTH',
    icon: Bone,
    color: 'border-blue-300 text-blue-900 bg-blue-50/80 hover:bg-blue-100/70',
    badge: 'bg-blue-100 text-blue-800',
  },
  {
    category: 'Dental Care',
    name: 'Dr. Neha Kapoor',
    email: 'doctor.dental@adyapan.com',
    room: 'Room 105',
    code: 'DENT',
    icon: Smile,
    color: 'border-teal-300 text-teal-900 bg-teal-50/80 hover:bg-teal-100/70',
    badge: 'bg-teal-100 text-teal-800',
  },
  {
    category: 'Neurology',
    name: 'Dr. Arvind Joshi',
    email: 'doctor.neuro@adyapan.com',
    room: 'Room 106',
    code: 'NEU',
    icon: Brain,
    color: 'border-purple-300 text-purple-900 bg-purple-50/80 hover:bg-purple-100/70',
    badge: 'bg-purple-100 text-purple-800',
  },
];

export const Login = () => {
  const [email, setEmail] = useState('admin@adyapan.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quickTab, setQuickTab] = useState('doctors'); // 'doctors' | 'staff'
  const [doctorsList, setDoctorsList] = useState(DOCTOR_CATEGORIES);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Dynamically load active doctors from the hospital database
  useEffect(() => {
    const fetchQuickDoctors = async () => {
      try {
        const res = await api.get('/auth/quick-doctors');
        const docs = res.data?.data || res.data || [];
        if (Array.isArray(docs) && docs.length > 0) {
          const mapped = docs.map((doc) => {
            const cat = (doc.category || '').toUpperCase();
            let icon = Stethoscope;
            let color = 'border-emerald-300 text-emerald-900 bg-emerald-50/80 hover:bg-emerald-100/70';
            let badge = 'bg-emerald-100 text-emerald-800';

            if (cat.includes('CARD')) {
              icon = Heart;
              color = 'border-rose-300 text-rose-900 bg-rose-50/80 hover:bg-rose-100/70';
              badge = 'bg-rose-100 text-rose-800';
            } else if (cat.includes('PED')) {
              icon = Baby;
              color = 'border-amber-300 text-amber-900 bg-amber-50/80 hover:bg-amber-100/70';
              badge = 'bg-amber-100 text-amber-800';
            } else if (cat.includes('ORTH')) {
              icon = Bone;
              color = 'border-blue-300 text-blue-900 bg-blue-50/80 hover:bg-blue-100/70';
              badge = 'bg-blue-100 text-blue-800';
            } else if (cat.includes('DENT')) {
              icon = Smile;
              color = 'border-teal-300 text-teal-900 bg-teal-50/80 hover:bg-teal-100/70';
              badge = 'bg-teal-100 text-teal-800';
            } else if (cat.includes('NEU')) {
              icon = Brain;
              color = 'border-purple-300 text-purple-900 bg-purple-50/80 hover:bg-purple-100/70';
              badge = 'bg-purple-100 text-purple-800';
            }

            return {
              category: doc.category,
              name: doc.name,
              email: doc.email,
              room: doc.room,
              code: doc.code,
              icon,
              color,
              badge,
            };
          });
          setDoctorsList(mapped);
        }
      } catch (err) {
        console.warn('Using seeded doctor categories fallback:', err);
      }
    };
    fetchQuickDoctors();
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (accEmail) => {
    setEmail(accEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] bg-cyber-grid flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none animate-float"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-navy-700/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center relative z-10 px-2">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-gold-glow mb-3 animate-float">
          <Activity className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
          ADYAPAN HOSPITAL
        </h2>
        <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 flex items-center justify-center gap-1.5">
          <span>Queue & Appointment Management Platform</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-2 sm:px-0 relative z-10">
        <div className="glass-panel bg-white/95 backdrop-blur-md py-6 px-4 shadow-2xl rounded-2xl sm:rounded-3xl sm:py-7 sm:px-9 border border-brand-200/60 relative">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-rose-50 p-3.5 border border-rose-200 flex items-start space-x-3 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-rose-800 font-medium leading-relaxed">
                  {error}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-medium text-slate-800"
                  placeholder="staff@adyapan.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-xl shadow-gold-glow text-sm font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In to Hospital Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Categorized Quick Role Sign-In Section */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <div className="flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Quick Role Sign-In
                </span>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setQuickTab('doctors')}
                  className={`px-2 py-1 rounded-md font-bold transition-all text-center text-[11px] sm:text-xs truncate ${
                    quickTab === 'doctors'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Doctors ({doctorsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTab('staff')}
                  className={`px-2 py-1 rounded-md font-bold transition-all text-center text-[11px] sm:text-xs truncate ${
                    quickTab === 'staff'
                      ? 'bg-white text-navy-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Staff Roles ({STAFF_ACCOUNTS.length})
                </button>
              </div>
            </div>

            {/* TAB 1: DOCTORS BY SPECIALTY */}
            {quickTab === 'doctors' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-200">
                {doctorsList.map((doc) => {
                  const IconComp = doc.icon;
                  const isSelected = email === doc.email;
                  return (
                    <button
                      key={doc.email}
                      type="button"
                      onClick={() => handleQuickFill(doc.email)}
                      className={`text-left p-2.5 rounded-xl border text-xs transition-all hover:scale-[1.01] sm:hover:scale-[1.02] interactive-card relative ${
                        doc.color
                      } ${isSelected ? 'ring-2 ring-amber-500 shadow-md font-bold' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${doc.badge}`}>
                          {doc.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">
                          {doc.room}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <IconComp className="w-3.5 h-3.5 text-navy-800 flex-shrink-0" />
                        <div className="font-bold text-navy-900 truncate text-[11px]">{doc.name}</div>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                        {doc.email}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* TAB 2: STAFF ROLES */}
            {quickTab === 'staff' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-200">
                {STAFF_ACCOUNTS.map((acc) => {
                  const isSelected = email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      type="button"
                      onClick={() => handleQuickFill(acc.email)}
                      className={`text-left p-2.5 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.01] sm:hover:scale-[1.02] interactive-card ${
                        acc.color
                      } ${isSelected ? 'ring-2 ring-amber-500 shadow-md' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy-900 text-xs">{acc.role}</span>
                        <span className="text-[10px] opacity-75 font-normal">{acc.desc}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                        {acc.email}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-[11px] text-slate-400 text-center mt-3">
              Default password for all accounts: <span className="font-mono text-navy-900 font-bold">Password123!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

