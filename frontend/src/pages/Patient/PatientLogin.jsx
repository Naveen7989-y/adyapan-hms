import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Phone,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
  HeartPulse,
  Sparkles,
  ArrowLeft,
  KeyRound,
  FileText,
  Calendar,
} from 'lucide-react';
import { usePatientAuth } from '../../context/PatientAuthContext';
import HeartbeatLogo from '../../components/common/HeartbeatLogo';
import ThemeToggle from '../../components/common/ThemeToggle';

export default function PatientLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, requestOtp, loginWithOtp, logout } = usePatientAuth();

  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('PHONE'); // 'PHONE' | 'OTP'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [demoOtp, setDemoOtp] = useState('');
  const [profiles, setProfiles] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const inputRefs = useRef([]);

  // If already authenticated, redirect straight to patient portal
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/patient/portal', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handlePhoneSubmit = async (e) => {
    e?.preventDefault();
    if (!phone || phone.trim().length < 6) {
      setError('Please enter a valid mobile number');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await requestOtp(phone.trim());
      setDemoOtp(res.demoOtp || '');
      setProfiles(res.profiles || []);
      if (res.profiles && res.profiles.length > 0) {
        setSelectedPatientId(res.profiles[0].id);
      }
      setCountdown(60);
      setStep('OTP');
      setSuccessMsg(`Verification code generated for ${phone}`);
      // Focus first digit box after transition
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check your phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    // Only accept numeric inputs
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1); // Only keep single digit
    setOtpDigits(newDigits);
    setError('');

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value) {
      const fullOtp = newDigits.join('');
      if (fullOtp.length === 6) {
        verifyCode(fullOtp);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newDigits = pastedData.split('');
      setOtpDigits(newDigits);
      verifyCode(pastedData);
    }
  };

  const handleAutoFillDemoOtp = () => {
    if (!demoOtp) return;
    const digits = demoOtp.split('');
    setOtpDigits(digits);
    verifyCode(demoOtp);
  };

  const verifyCode = async (codeToVerify) => {
    const otp = codeToVerify || otpDigits.join('');
    if (otp.length !== 6) {
      setError('Please enter all 6 digits of the verification code');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await loginWithOtp(phone.trim(), otp, selectedPatientId);
      navigate('/patient/portal', { replace: true });
    } catch (err) {
      setError(err.message || 'Incorrect verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#F8FAFC] dark:bg-[#070D18] bg-cyber-grid text-slate-800 dark:text-slate-100 transition-colors duration-300 font-['Inter',sans-serif] relative overflow-hidden select-none">
      
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -right-20 w-[30rem] h-[30rem] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" onClick={logout} className="flex items-center gap-3 group">
          <HeartbeatLogo size="sm" />
          <div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white block group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              ADYAPAN HOSPITAL
            </span>
            <span className="text-[10px] uppercase tracking-widest text-teal-600 dark:text-teal-400 font-bold block -mt-0.5">
              Patient Health Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle size="md" />
          <Link
            to="/login"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all px-3 py-2 rounded-xl bg-white/70 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 shadow-xs"
          >
            Staff Login →
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          
          {/* Card Container */}
          <div className="rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl p-6 sm:p-8 relative overflow-hidden transition-colors duration-300">
            
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />

            {/* Title & Badge */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/20 mb-3 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>100% Secure Patient Health Records</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {step === 'PHONE' ? 'Access Your Health Records' : 'Verify One-Time Passcode'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {step === 'PHONE'
                  ? 'Enter your registered mobile number to view appointments, prescriptions, and live token status.'
                  : `Enter the 6-digit OTP code sent to +91 ${phone}`}
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs leading-relaxed animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: PHONE INPUT */}
            {step === 'PHONE' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Mobile Number
                  </label>
                  <div className="relative flex rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/15 focus-within:border-teal-500 dark:focus-within:border-teal-400 focus-within:ring-2 focus-within:ring-teal-500/20 dark:focus-within:ring-teal-400/20 transition-all overflow-hidden shadow-xs">
                    <span className="inline-flex items-center px-4 bg-slate-100 dark:bg-white/[0.02] border-r border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-sm font-semibold select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setError('');
                      }}
                      placeholder="e.g. 7989653922"
                      className="w-full px-4 py-3.5 bg-transparent text-slate-900 dark:text-white text-base placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-mono"
                      autoFocus
                    />
                    <div className="flex items-center pr-4">
                      <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Quick Test Demo Chips */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1.5">
                    Quick Demo Patients:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Naveen Kumar', phone: '7989653922' },
                      { name: 'Sri ram', phone: '79797979797' },
                      { name: 'meers iyer', phone: '1234567890' },
                    ].map((demo) => (
                      <button
                        key={demo.phone}
                        type="button"
                        onClick={() => {
                          setPhone(demo.phone);
                          setError('');
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 dark:bg-white/[0.05] dark:hover:bg-teal-500/20 text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300 border border-slate-200 hover:border-teal-300 dark:border-white/10 dark:hover:border-teal-400/30 transition-all font-mono shadow-2xs"
                      >
                        {demo.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !phone}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 dark:from-teal-500 dark:to-emerald-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-teal-600/25 dark:shadow-teal-500/20 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: OTP VERIFICATION & PROFILE SELECTION */}
            {step === 'OTP' && (
              <div className="space-y-5">
                
                {/* Change Phone Banner */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">+91 {phone}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('PHONE');
                      setOtpDigits(['', '', '', '', '', '']);
                      setError('');
                    }}
                    className="text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                  >
                    Change Number
                  </button>
                </div>

                {/* Instant Demo OTP Chip Banner */}
                {demoOtp && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-amber-800 dark:text-amber-300 block">Demo Verification OTP:</span>
                      <span className="font-mono text-lg font-extrabold text-amber-900 dark:text-white tracking-widest">
                        {demoOtp}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFillDemoOtp}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs shadow-sm transition-all"
                    >
                      Auto-fill & Login
                    </button>
                  </div>
                )}

                {/* Profile Selector if multiple patients share the phone number */}
                {profiles.length > 1 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Select Patient Profile ({profiles.length} found)
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {profiles.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPatientId(p.id)}
                          className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                            selectedPatientId === p.id
                              ? 'bg-teal-50 dark:bg-teal-500/15 border-teal-500 dark:border-teal-400 text-slate-900 dark:text-white shadow-xs'
                              : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-sm flex items-center gap-2">
                              <span>{p.fullName}</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold">
                                {p.uhid}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {p.gender} • {p.bloodGroup || 'Blood group not set'}
                            </div>
                          </div>
                          <input
                            type="radio"
                            name="selectedProfile"
                            checked={selectedPatientId === p.id}
                            onChange={() => setSelectedPatientId(p.id)}
                            className="accent-teal-600 dark:accent-teal-500 w-4 h-4 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6 Digit OTP Inputs */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Enter 6-Digit Passcode
                  </label>
                  <div className="flex gap-2 sm:gap-2.5 justify-between" onPaste={handlePaste}>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (inputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        className="w-11 sm:w-12 h-14 text-center text-xl font-bold font-mono bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/15 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 dark:focus:ring-teal-400/20 rounded-2xl text-slate-900 dark:text-white outline-none transition-all shadow-2xs"
                      />
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="button"
                  onClick={() => verifyCode()}
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 dark:from-teal-500 dark:to-emerald-500 dark:hover:from-teal-400 dark:hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-teal-600/25 dark:shadow-teal-500/20 transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Security Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Access Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Resend Link */}
                <div className="text-center pt-2">
                  {countdown > 0 ? (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Resend code in <strong className="text-teal-600 dark:text-teal-400 font-mono">{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePhoneSubmit()}
                      disabled={loading}
                      className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-semibold hover:underline"
                    >
                      Resend OTP Code
                    </button>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* Footer Assistance info */}
          <div className="text-center mt-6 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            <p>
              Need assistance? Call Adyapan 24/7 Helpline:{' '}
              <a href="tel:+918000000000" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                +91 8000 000 000
              </a>
            </p>
            <p>
              <Link to="/" onClick={logout} className="text-slate-600 hover:text-teal-600 dark:text-slate-400 dark:hover:text-white underline">
                ← Back to Hospital Homepage
              </Link>
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-white/5">
        &copy; {new Date().getFullYear()} Adyapan Hospital Queue & Appointment System. All rights reserved.
      </footer>

    </div>
  );
}
