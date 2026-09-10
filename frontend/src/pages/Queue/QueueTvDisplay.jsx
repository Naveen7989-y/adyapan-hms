import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Tv,
  Clock,
  HeartPulse,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';

export default function QueueTvDisplay() {
  const [displayData, setDisplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastSpokenTokenRef = useRef(null);

  // Live Digital Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch TV Display data
  const fetchDisplay = async () => {
    try {
      const res = await api.get('/queue/public-display');
      const data = res?.data || res;
      setDisplayData(data);

      // Check if there's an announcement to speak
      if (audioEnabled && data?.recentAnnouncement) {
        const ann = data.recentAnnouncement;
        if (lastSpokenTokenRef.current !== ann.tokenNumber) {
          lastSpokenTokenRef.current = ann.tokenNumber;
          speakAnnouncement(ann.speechText);
        }
      }
    } catch (err) {
      console.error('Failed to load public queue display:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisplay();

    // Socket.IO real-time public display subscription
    const socket = getSocket({ isPublicDisplay: true, onReconnect: fetchDisplay });

    const handlePublicCalled = (ann) => {
      fetchDisplay();
      if (audioEnabled && ann?.speechText) {
        if (lastSpokenTokenRef.current !== ann.tokenNumber) {
          lastSpokenTokenRef.current = ann.tokenNumber;
          speakAnnouncement(ann.speechText);
        }
      }
    };

    const handlePublicUpdate = () => {
      fetchDisplay();
    };

    socket.on('public:queue:called', handlePublicCalled);
    socket.on('public:queue:update', handlePublicUpdate);

    // Fallback polling (10 seconds)
    const interval = setInterval(fetchDisplay, 10000);

    return () => {
      socket.off('public:queue:called', handlePublicCalled);
      socket.off('public:queue:update', handlePublicUpdate);
      clearInterval(interval);
    };
  }, [audioEnabled]);

  const speakAnnouncement = (text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.0;
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleAudio = () => {
    if (!audioEnabled) {
      setAudioEnabled(true);
      // Play a short welcome chime test
      speakAnnouncement('Audio announcements enabled for Adyapan Hospital Queue.');
    } else {
      setAudioEnabled(false);
      setIsSpeaking(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => console.log(e));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const nowServing = displayData?.nowServing || [];
  const upcomingWaiting = displayData?.upcomingWaiting || [];

  return (
    <div className="min-h-screen bg-[#080E18] text-slate-100 flex flex-col justify-between select-none font-sans overflow-hidden bg-cyber-grid-dark relative">
      {/* Ambient background glow orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-float"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* 1. TOP HEADER BAR */}
      <header className="px-8 py-4 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between backdrop-blur-md relative z-10">
        {/* Brand */}
        <div className="flex items-center space-x-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-gold animate-float">
            A
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider text-white uppercase">
              {displayData?.hospitalName || 'ADYAPAN HOSPITAL'}
            </h1>
            <p className="text-xs text-amber-400 font-bold tracking-widest uppercase flex items-center gap-2">
              <span>Central Outpatient Consultation Queue</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </p>
          </div>
        </div>

        {/* Live Digital Clock & Control Actions */}
        <div className="flex items-center space-x-6">
          {/* Active Speaking Indicator */}
          {isSpeaking && (
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/20 border border-amber-500/50 rounded-xl shadow-gold-glow animate-fade-in-scale">
              <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">ANNOUNCING</span>
              <div className="flex items-center space-x-0.5 h-3 ml-1">
                <span className="w-0.5 h-full bg-amber-400 animate-sound-wave-1 rounded-full"></span>
                <span className="w-0.5 h-full bg-amber-400 animate-sound-wave-2 rounded-full"></span>
                <span className="w-0.5 h-full bg-amber-400 animate-sound-wave-3 rounded-full"></span>
                <span className="w-0.5 h-full bg-amber-400 animate-sound-wave-4 rounded-full"></span>
              </div>
            </div>
          )}

          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-tight text-white">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          </div>

          <div className="flex items-center space-x-2 pl-4 border-l border-slate-800">
            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={`p-2.5 rounded-xl border transition-all ${
                audioEnabled
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 ring-2 ring-amber-500/30 shadow-gold-glow'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={audioEnabled ? 'Mute Audio Announcements' : 'Enable Audio Voice Announcements'}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN SPLIT BOARD */}
      <main className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* LEFT COLUMN: NOW CALLING HERO BOARD (7 Cols) */}
        <section className="lg:col-span-7 flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
              <h2 className="text-lg font-black tracking-widest uppercase text-white">
                Now Calling / In Room
              </h2>
            </div>
            <div className="flex items-center text-xs text-slate-400 space-x-1">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Patient Privacy Masked</span>
            </div>
          </div>

          {nowServing.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <Tv className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <div className="text-xl font-bold text-slate-300">All Consultation Desks Ready</div>
              <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                Physicians are preparing for the next consultation. Please wait for your token to be called.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {nowServing.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-6 rounded-3xl border transition-all duration-500 relative overflow-hidden ${
                    idx === 0
                      ? 'neon-border-gold bg-gradient-to-r from-slate-900/95 via-slate-900/90 to-amber-950/40 border-amber-500/80 shadow-gold-glow-lg ring-1 ring-amber-500/40'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                    {/* Token Number */}
                    <div className="text-center sm:text-left">
                      <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          item.tokenType === 'EMERGENCY'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                            : item.tokenType === 'PRIORITY'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}>
                          {item.tokenType}
                        </span>
                        <span className="text-xs text-slate-400 uppercase font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {item.status}
                        </span>
                      </div>

                      <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-white filter drop-shadow-[0_4px_16px_rgba(249,208,84,0.35)]">
                        {item.formattedToken}
                      </div>

                      <div className="text-lg font-semibold text-slate-300 mt-1">
                        {item.maskedPatientName}
                      </div>
                    </div>

                    {/* Room & Doctor Box */}
                    <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-center sm:text-right min-w-[240px] shadow-sm backdrop-blur-sm">
                      <span className="text-xs uppercase tracking-widest text-amber-400 font-bold flex items-center justify-center sm:justify-end gap-1">
                        <span>Please Proceed To</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <div className="text-3xl font-black text-amber-300 my-1 font-mono tracking-tight">
                        {item.roomNumber || 'Room 101'}
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {item.doctorName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.departmentName}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* RIGHT COLUMN: UPCOMING QUEUE (5 Cols) */}
        <section className="lg:col-span-5 flex flex-col space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-lg font-black tracking-widest uppercase text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-amber-400" />
              Upcoming in Queue ({upcomingWaiting.length})
            </h2>
            <span className="text-xs font-mono text-slate-500">NEXT IN LINE</span>
          </div>

          {upcomingWaiting.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80">
              <Clock className="w-10 h-10 text-slate-700 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-400">No waiting patients in queue</div>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingWaiting.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/90 flex items-center justify-between hover:bg-slate-900 hover:border-amber-500/30 transition-all duration-200 interactive-card"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-mono font-bold text-slate-500 w-5">
                      #{index + 1}
                    </span>
                    <div className="text-2xl font-black font-mono text-amber-400">
                      {item.formattedToken}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {item.maskedPatientName}
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.doctorName} ({item.departmentName})
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.tokenType === 'EMERGENCY'
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                      : item.tokenType === 'PRIORITY'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {item.tokenType}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* 3. BOTTOM TICKER NOTICE */}
      <footer className="bg-slate-900/90 border-t border-slate-800 py-3.5 px-8 flex items-center overflow-hidden">
        <div className="flex items-center space-x-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex-shrink-0 mr-4 border border-amber-500/30">
          <HeartPulse className="w-4 h-4 mr-1 text-amber-400 animate-pulse" />
          NOTICE
        </div>

        {/* Running Marquee Text */}
        <div className="whitespace-nowrap overflow-hidden flex-1">
          <p className="text-xs text-slate-300 font-medium tracking-wide animate-marquee">
            Please listen for the audio chime and proceed promptly to the assigned consultation room when your token is called. • Keep your printed token slip with you. • Emergency patients report immediately to triage reception desk. • Thank you for your cooperation and patience.
          </p>
        </div>
      </footer>
    </div>
  );
}
