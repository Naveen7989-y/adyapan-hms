import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import HeartbeatLogo from '../components/common/HeartbeatLogo';
import ThemeToggle from '../components/common/ThemeToggle';
import stethoscopeFamilyImg from '../assets/login-stethoscope-family.png';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Stethoscope,
  Heart,
  ShieldCheck,
  Check,
  Sparkles,
  Activity,
} from 'lucide-react';

export const Login = () => {
  // mode: 'doctor' (image on RIGHT) | 'quick-role' (image on LEFT)
  const [mode, setMode] = useState('doctor');
  const [email, setEmail] = useState('doctor.sharma@adyapan.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [splitParting, setSplitParting] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Mode change handler:
  // - Doctor mode -> Image moves to RIGHT
  // - Quick Role Sign mode -> Image moves to LEFT
  const handleSelectMode = (newMode) => {
    setMode(newMode);
    setError(null);
    if (newMode === 'doctor') {
      setEmail('doctor.sharma@adyapan.com');
      setPassword('Password123!');
    } else {
      setEmail('admin@adyapan.com');
      setPassword('Password123!');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      setAuthenticatedUser(user);

      // Trigger the true vertical middle-split and smooth entrance animation!
      setSplitParting(true);

      // Allow the cinematic vertical split, entrance animation, and welcome reveal to play
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 2400);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
      setLoading(false);
    }
  };

  const isImageLeft = mode === 'quick-role';

  // Helper to determine display greetings
  const displayName =
    authenticatedUser?.name ||
    (mode === 'doctor' ? 'Dr. Sharma' : 'Administrator');

  const displayRole =
    authenticatedUser?.role?.toUpperCase() ||
    (mode === 'doctor' ? 'CHIEF PEDIATRICIAN' : 'CLINICAL OPERATIONS HQ');

  // =========================================================================
  // BASE LOGIN PAGE UI (Rendered interactive or inside split shutters)
  // =========================================================================
  const renderLoginContent = (isStatic = false) => (
    <div
      className={`w-full h-full min-h-screen bg-[#F8FAFC] dark:bg-[#070D18] bg-cyber-grid flex flex-col justify-between p-3 sm:p-5 lg:p-6 relative overflow-hidden transition-colors duration-300 select-none ${
        isStatic ? 'pointer-events-none' : ''
      }`}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] bg-teal-400/15 dark:bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-float"></div>
      <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] bg-blue-500/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>

      {/* Top Navigation Bar */}
      <div className="w-full max-w-5xl mx-auto relative z-10 px-2 flex justify-between items-center flex-shrink-0">
        <Link
          to="/"
          tabIndex={isStatic ? -1 : 0}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#334155] dark:text-slate-200 hover:text-teal-600 dark:hover:text-amber-400 transition-colors bg-white/90 dark:bg-navy-900/80 backdrop-blur-sm px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-navy-700 shadow-2xs group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-teal-600 dark:text-amber-400" />
          <span>← Back to Public Home</span>
        </Link>
        <ThemeToggle size="sm" showLabel />
      </div>

      {/* Main Two-Column Card Container */}
      <div className="w-full max-w-lg lg:max-w-5xl mx-auto relative z-10 flex-1 flex items-center justify-center my-auto min-h-0 py-2 sm:py-4">
        <div className="w-full h-full max-h-none lg:max-h-[580px] flex flex-col lg:flex-row relative">
          {/* ========================================================================= */}
          {/* IMAGE PANEL (Full Cover Background) - Visible ONLY in Laptop / Desktop mode */}
          {/* ========================================================================= */}
          <div
            className={`hidden lg:flex w-full lg:w-1/2 relative overflow-hidden flex-col justify-between p-6 sm:p-8 min-h-[220px] lg:min-h-0 shadow-2xl border border-slate-200/90 dark:border-navy-700 rounded-3xl lg:rounded-none transition-all duration-500 ${
              isImageLeft
                ? 'lg:order-1 lg:rounded-l-3xl lg:border-r-0'
                : 'lg:order-2 lg:rounded-r-3xl lg:border-l-0'
            }`}
          >
            {/* The Stethoscope & Family Image as Full Cover Background */}
            <img
              src={stethoscopeFamilyImg}
              alt="Adyapan Hospital Healthcare"
              className="absolute inset-0 w-full h-full object-cover object-center transform transition-transform duration-1000 hover:scale-105 select-none pointer-events-none"
            />
            {/* Soft Ambient Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-slate-950/40 pointer-events-none"></div>

            {/* Top Branding inside Image Hero */}
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 bg-slate-950/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 shadow-md">
                <HeartbeatLogo size="sm" glow />
                <div>
                  <div className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                    <span>Adyapan Hospital</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-200">
                    Smart Queue & OPD Operations
                  </div>
                </div>
              </div>

              {/* Dynamic Mode Badge */}
              <span
                className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full border shadow-md backdrop-blur-md flex items-center gap-1.5 text-white ${
                  mode === 'doctor'
                    ? 'bg-emerald-600/80 border-emerald-400/40'
                    : 'bg-amber-600/80 border-amber-400/40'
                }`}
              >
                {mode === 'doctor' ? (
                  <>
                    <Stethoscope className="w-3.5 h-3.5 text-white" />
                    <span>Doctor Portal</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-white" />
                    <span>Staff Portal</span>
                  </>
                )}
              </span>
            </div>

            {/* Bottom Glass Caption on Image */}
            <div className="relative z-10 mt-auto">
              <div className="inline-flex items-center gap-2 bg-slate-950/50 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-white text-xs font-semibold shadow-lg">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
                <span>Caring for Every Family • 24/7 Digital OPD</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FORM PANEL                                                                */}
          {/* ========================================================================= */}
          <div
            className={`w-full lg:w-1/2 p-6 sm:p-8 lg:p-10 flex flex-col justify-between overflow-y-auto bg-white/95 dark:bg-[#0B1524]/95 backdrop-blur-xl shadow-2xl border border-slate-200/90 dark:border-navy-700 rounded-3xl lg:rounded-none transition-all duration-500 ${
              isImageLeft
                ? 'lg:order-2 lg:rounded-r-3xl lg:border-l-0'
                : 'lg:order-1 lg:rounded-l-3xl lg:border-r-0'
            }`}
          >
            <div>
              {/* Mobile/Tablet Hospital Brand Header (Visible only when image hero is hidden on other devices) */}
              <div className="lg:hidden flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-navy-800">
                <div className="flex items-center gap-2">
                  <HeartbeatLogo size="sm" glow />
                  <div>
                    <div className="text-xs font-black tracking-wider text-slate-800 dark:text-white uppercase flex items-center gap-1.5">
                      <span>Adyapan Hospital</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                      Smart Queue & OPD Operations
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border shadow-2xs flex items-center gap-1 ${
                    mode === 'doctor'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                  }`}
                >
                  {mode === 'doctor' ? (
                    <>
                      <Stethoscope className="w-3 h-3" />
                      <span>Doctor</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3 h-3" />
                      <span>Staff</span>
                    </>
                  )}
                </span>
              </div>

              {/* Header Title */}
              <div className="mb-4 sm:mb-5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                  Hospital Portal Sign In
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Select your role mode to access your medical workstation
                </p>
              </div>

              {/* Mode Toggle Bar: Doctor vs Quick Role */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-navy-900 rounded-2xl mb-4 sm:mb-5 border border-slate-200 dark:border-navy-700 shadow-inner">
                <button
                  type="button"
                  tabIndex={isStatic ? -1 : 0}
                  onClick={() => handleSelectMode('doctor')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                    mode === 'doctor'
                      ? 'bg-white dark:bg-emerald-700 text-emerald-800 dark:text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-300 flex-shrink-0" />
                  <span>Doctor Login</span>
                </button>

                <button
                  type="button"
                  tabIndex={isStatic ? -1 : 0}
                  onClick={() => handleSelectMode('quick-role')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                    mode === 'quick-role'
                      ? 'bg-white dark:bg-amber-600 text-amber-900 dark:text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-300 flex-shrink-0" />
                  <span>Quick Role Sign</span>
                </button>
              </div>

              {/* Login Form */}
              <form className="space-y-3.5 sm:space-y-4" onSubmit={handleSubmit} autoComplete="off">
                {error && (
                  <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 border border-rose-200 dark:border-rose-800 flex items-start space-x-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-800 dark:text-rose-200 font-medium leading-relaxed">
                      {error}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      tabIndex={isStatic ? -1 : 0}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="off"
                      className="hms-input has-left-icon block w-full !pl-11 pr-3 py-2.5 text-sm font-medium relative z-0 rounded-xl"
                      placeholder={mode === 'doctor' ? 'doctor.sharma@adyapan.com' : 'admin@adyapan.com'}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      tabIndex={isStatic ? -1 : 0}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="hms-input has-left-icon block w-full !pl-11 pr-3 py-2.5 text-sm font-mono relative z-0 rounded-xl"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  tabIndex={isStatic ? -1 : 0}
                  disabled={loading || splitParting}
                  className={`w-full py-2.5 sm:py-3 px-4 rounded-xl shadow-md font-extrabold text-sm transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 flex items-center justify-center gap-2 text-white ${
                    mode === 'doctor'
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-500/20'
                      : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-amber-500/20'
                  }`}
                >
                  {loading || splitParting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>{mode === 'doctor' ? 'Sign In as Doctor' : 'Sign In to Hospital Portal'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Clean Bottom Security Notice */}
            <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-navy-800 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              <span>Protected by Adyapan RBAC & Secure JWT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // =========================================================================
  // PORTAL & WELCOME SEQUENCE (Revealed behind the splitting login page)
  // Features a staged smooth entrance animation BEFORE showing Welcome card
  // =========================================================================
  const renderPortalAndWelcome = () => (
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#040A14] via-[#071324] to-[#040912] select-none">
      {/* Background Cyber Grid & Medical Ambient Glow */}
      <div className="absolute inset-0 bg-cyber-grid opacity-30 dark:opacity-40 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-[36rem] h-[36rem] bg-teal-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-[36rem] h-[36rem] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* ========================================================================= */}
      {/* 1. SMOOTH ENTRANCE ANIMATION (Shockwaves, Iris Aperture, Beacon Rings)     */}
      {/* ========================================================================= */}

      {/* Primary Expanding Sonic/Light Shockwave Ring */}
      <motion.div
        initial={{ scale: 0.05, opacity: 0 }}
        animate={{ scale: [0.05, 1.6, 3.2], opacity: [0, 0.85, 0] }}
        transition={{ duration: 1.15, delay: 0.08, ease: 'easeOut' }}
        className="absolute w-64 h-64 rounded-full border-2 border-teal-400/80 shadow-[0_0_60px_rgba(45,212,191,0.6)] pointer-events-none"
      />

      {/* Secondary Harmonic Ring with Cyan Aura */}
      <motion.div
        initial={{ scale: 0.05, opacity: 0 }}
        animate={{ scale: [0.05, 1.4, 2.6], opacity: [0, 0.7, 0] }}
        transition={{ duration: 1.25, delay: 0.22, ease: 'easeOut' }}
        className="absolute w-80 h-80 rounded-full border border-cyan-400/50 shadow-[0_0_50px_rgba(34,211,238,0.5)] pointer-events-none"
      />

      {/* Third Deep Medical Emerald Wave */}
      <motion.div
        initial={{ scale: 0.05, opacity: 0 }}
        animate={{ scale: [0.05, 1.2, 2.0], opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.35, delay: 0.35, ease: 'easeOut' }}
        className="absolute w-96 h-96 rounded-full border border-emerald-400/40 shadow-[0_0_40px_rgba(52,211,153,0.4)] pointer-events-none"
      />

      {/* Central Illuminated Aperture Burst */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.6, 1.1], opacity: [0, 0.9, 0.45] }}
        transition={{ duration: 1.0, delay: 0.12, ease: 'easeOut' }}
        className="absolute w-88 h-88 rounded-full bg-gradient-to-r from-teal-500/25 via-emerald-400/30 to-cyan-500/25 blur-3xl pointer-events-none"
      />

      {/* Outer Gyroscope Rotating Beacon Ring */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotate: 0 }}
        animate={{ scale: 1, opacity: [0, 0.75, 0.5], rotate: 180 }}
        transition={{ duration: 1.6, delay: 0.18, ease: 'easeOut' }}
        className="absolute w-[440px] h-[440px] rounded-full border border-dashed border-teal-400/40 pointer-events-none"
      />

      {/* Inner Counter-Rotating Gyroscope Beacon */}
      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: 0 }}
        animate={{ scale: 1, opacity: [0, 0.65, 0.35], rotate: -180 }}
        transition={{ duration: 1.8, delay: 0.25, ease: 'easeOut' }}
        className="absolute w-[360px] h-[360px] rounded-full border border-dotted border-emerald-400/40 pointer-events-none"
      />

      {/* Horizontal Telemetry Light Flares */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1.5, 1], opacity: [0, 0.8, 0.3] }}
        transition={{ duration: 0.9, delay: 0.28, ease: 'easeOut' }}
        className="absolute w-[600px] h-[1px] bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_25px_#2dd4bf] pointer-events-none"
      />

      {/* ========================================================================= */}
      {/* 2. GRAND ENTRANCE: "Welcome to Adyapan HMS" CARD                           */}
      {/* Staged entrance emerges smoothly from aperture after entrance sequence   */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ scale: 0.76, opacity: 0, y: 38, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{
          delay: 0.55,
          duration: 0.75,
          type: 'spring',
          damping: 22,
          stiffness: 165,
        }}
        className="relative z-20 p-8 sm:p-10 rounded-3xl bg-slate-900/90 border-2 border-teal-400/60 backdrop-blur-2xl shadow-[0_0_90px_rgba(13,148,136,0.5),0_25px_60px_rgba(0,0,0,0.7)] text-center max-w-lg mx-4 overflow-hidden"
      >
        {/* Interior Accent Flare Orbs */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-teal-500/25 rounded-full blur-2xl animate-pulse pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-44 h-44 bg-emerald-500/20 rounded-full blur-2xl animate-pulse pointer-events-none"></div>

        {/* Central Heartbeat Emblem with Active Ping */}
        <div className="mb-4 flex justify-center relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.65, type: 'spring', damping: 15 }}
            className="relative"
          >
            <HeartbeatLogo size="xl" glow withPing />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="absolute -inset-3.5 rounded-full border-2 border-dashed border-teal-400/50 pointer-events-none"
            />
          </motion.div>
        </div>

        {/* Authentication Verified Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-extrabold border border-emerald-400/40 mb-3 tracking-widest uppercase shadow-[0_0_15px_rgba(52,211,153,0.3)]"
        >
          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
          <span>AUTHENTICATION VERIFIED</span>
        </motion.div>

        {/* Welcoming Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.45 }}
          className="text-2xl sm:text-3xl font-black text-white tracking-tight"
        >
          <span>Welcome to </span>
          <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-cyan-200 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(45,212,191,0.4)]">
            Adyapan HMS
          </span>
        </motion.h2>

        {/* Personalized User & Role Telemetry */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.4 }}
          className="mt-2 text-xs sm:text-sm text-teal-200/90 font-medium tracking-wide flex items-center justify-center gap-2 flex-wrap"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
          <span className="font-semibold text-white">{displayName}</span>
          <span className="text-teal-400/60">•</span>
          <span className="font-mono text-teal-300 text-xs px-2 py-0.5 rounded-md bg-teal-950/50 border border-teal-500/30">
            {displayRole}
          </span>
        </motion.div>

        {/* Dynamic Holographic Progress Bar */}
        <div className="w-64 sm:w-72 h-2.5 bg-slate-800/90 rounded-full mt-6 mx-auto overflow-hidden border border-teal-500/40 p-0.5 shadow-inner">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.25, delay: 0.85, ease: [0.4, 0, 0.2, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-300 shadow-[0_0_18px_#34d399]"
          />
        </div>

        {/* Initializing Subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="text-[11px] font-mono text-slate-400 mt-2.5 tracking-wider uppercase flex items-center justify-center gap-2"
        >
          <Activity className="w-3 h-3 text-teal-400 animate-pulse" />
          <span>Synchronizing Clinical Workstation...</span>
        </motion.div>
      </motion.div>
    </div>
  );

  // =========================================================================
  // MAIN RENDER WITH TRUE VERTICAL SPLIT DOWN THE MIDDLE
  // =========================================================================
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {!splitParting ? (
        // Normal interactive view before login
        renderLoginContent(false)
      ) : (
        // Cinematic vertical middle-split + smooth entrance portal
        <div className="fixed inset-0 overflow-hidden select-none">
          {/* 1. Underlying Portal Room with Smooth Entrance & Welcome Reveal */}
          {renderPortalAndWelcome()}

          {/* 2. Left Half of the Login Page (Splits to the Left) */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: '-105%' }}
            transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-y-0 left-0 w-[50vw] overflow-hidden z-30 pointer-events-none border-r-2 border-teal-400/80 shadow-[6px_0_35px_rgba(45,212,191,0.6)]"
          >
            {/* Anchored to Left Edge to display the exact left 50% */}
            <div className="absolute top-0 left-0 w-screen h-screen">
              {renderLoginContent(true)}
            </div>
            {/* Darkening depth shadow on door parting */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0 bg-slate-950 pointer-events-none"
            />
          </motion.div>

          {/* 3. Right Half of the Login Page (Splits to the Right) */}
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: '105%' }}
            transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1] }}
            className="fixed inset-y-0 right-0 w-[50vw] overflow-hidden z-30 pointer-events-none border-l-2 border-teal-400/80 shadow-[-6px_0_35px_rgba(45,212,191,0.6)]"
          >
            {/* Anchored to Right Edge to display the exact right 50% */}
            <div className="absolute top-0 right-0 w-screen h-screen">
              {renderLoginContent(true)}
            </div>
            {/* Darkening depth shadow on door parting */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              transition={{ duration: 0.7 }}
              className="absolute inset-0 bg-slate-950 pointer-events-none"
            />
          </motion.div>

          {/* 4. Vertical Center Seam Laser Burst (Flashes down the middle split line) */}
          <motion.div
            initial={{ scaleY: 0, opacity: 0, scaleX: 1 }}
            animate={{
              scaleY: [0, 1, 1],
              opacity: [0, 1, 0.95, 0],
              scaleX: [1, 2.5, 4, 0],
            }}
            transition={{ duration: 0.85, ease: 'easeOut' }}
            className="fixed inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-gradient-to-b from-teal-300 via-emerald-300 to-cyan-300 shadow-[0_0_35px_#2dd4bf,0_0_15px_#fff] z-40 pointer-events-none"
          />
        </div>
      )}
    </div>
  );
};

export default Login;
