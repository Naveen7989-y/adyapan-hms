import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, X, Stethoscope, Smile, Footprints, FileText, CheckCircle2, MessageCircle } from 'lucide-react';
import walkFrame1 from '../../assets/dr-junior-walk-f1.png';
import walkFrame2 from '../../assets/dr-junior-walk-f2.png';
import walkFrame3 from '../../assets/dr-junior-walk-f3.png';
import walkFrame4 from '../../assets/dr-junior-walk-f4.png';
import standing3DImg from '../../assets/dr-junior-standing-transparent.png';
import prescription3DImg from '../../assets/dr-junior-prescription-transparent.png';
import DrJuniorChatbot from './DrJuniorChatbot';

const WALK_CYCLE_FRAMES = [walkFrame1, walkFrame2, walkFrame3, walkFrame4];

const HOSPITAL_ACTIVITIES = [
  {
    text: 'On Ward Patrol: Checking in on room 101-105! 🚶‍♂️🩺',
    activity: 'Hospital Rounds Patrol',
    badge: 'Ward Patrol',
  },
  {
    text: 'Checking Patient Chart: Vitals Normal & Ready! 📋',
    activity: 'Checking Prescription Chart',
    badge: 'OPD Triage',
  },
  {
    text: 'Rx Review: 1 spoon after meals with warm water! 🥛',
    activity: 'Inspecting E-Prescription',
    badge: 'Pharmacy Review',
  },
  {
    text: 'Stethoscope test: Heart rhythm is perfectly healthy! 💓',
    activity: 'Cardiac Checkup',
    badge: 'Clinical Vitals',
  },
  {
    text: 'First-Aid Kit stocked with trauma care essentials! 🩹',
    activity: 'Emergency Kit Ready',
    badge: '24/7 Emergency',
  },
  {
    text: 'Adyapan Queue Engine: Next token calling now! 🚀',
    activity: 'Live Queue Calling',
    badge: 'Smart Queue',
  },
];

export const PediatricBuddy = () => {
  const [activityIndex, setActivityIndex] = useState(0);
  const [isBouncing, setIsBouncing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showHearts, setShowHearts] = useState(false);
  const [pose, setPose] = useState('walking'); // 'walking' | 'reading' | 'standing'
  const [frameIndex, setFrameIndex] = useState(0); // 0, 1, 2, 3 sequential footsteps
  const [isPaused, setIsPaused] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Automatically cycle activities
  useEffect(() => {
    const timer = setInterval(() => {
      setActivityIndex((prev) => (prev + 1) % HOSPITAL_ACTIVITIES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // 4-frame sequential walk cycle: relaxed, slow footstep transition (550ms per frame)
  useEffect(() => {
    if (pose !== 'walking' || isPaused) return;
    const walkTimer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % WALK_CYCLE_FRAMES.length);
    }, 550);
    return () => clearInterval(walkTimer);
  }, [pose, isPaused]);

  const handleCharacterClick = () => {
    setIsBouncing(true);
    setShowHearts(true);
    setIsChatOpen((prev) => !prev);
    setActivityIndex((prev) => (prev + 1) % HOSPITAL_ACTIVITIES.length);

    // Toggle between walking patrol and inspecting prescription chart
    setPose((prev) => (prev === 'walking' ? 'reading' : 'walking'));

    setTimeout(() => setIsBouncing(false), 500);
    setTimeout(() => setShowHearts(false), 1200);
  };

  const currentActivity = HOSPITAL_ACTIVITIES[activityIndex];

  if (isMinimized) {
    return (
      <>
        {/* Chatbot Window even when mascot icon is docked */}
        <DrJuniorChatbot
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
        <div className="fixed bottom-4 left-4 z-[980] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#0D9488] hover:bg-[#0F766E] text-white font-black text-xs shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95"
            title="Chat with Dr. Junior AI"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat with Dr. Junior</span>
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-full bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border border-slate-200 dark:border-amber-500/50 shadow-xs text-xs font-bold text-[#334155] dark:text-white hover:bg-[#F8FAFC] dark:hover:bg-navy-800 transition-all transform hover:scale-105 active:scale-95"
            title="Restore Dr. Junior 3D Hospital Mascot"
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#0D9488] dark:text-amber-400 animate-bounce" />
            <span className="font-extrabold text-[#334155] dark:text-white">Mascot</span>
          </button>
        </div>
      </>
    );
  }

  const isWalkingActive = pose === 'walking' && !isPaused;

  return (
    <>
      {/* Dr. Junior ChatGPT-style AI Hospital Chatbot Modal */}
      <DrJuniorChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      <div
        className="fixed bottom-2 left-2 sm:bottom-4 sm:left-5 z-[980] flex flex-col items-start select-none pointer-events-auto group"
      >
        {/* Floating Dynamic Thought/Speech Bubble with Activity Badge & Chat Launcher */}
        <div className="relative mb-1 ml-4 max-w-[240px] sm:max-w-[280px] animate-fade-in-scale pointer-events-auto">
          <div className="relative bg-white dark:bg-navy-900/95 backdrop-blur-xl text-[#334155] dark:text-white text-xs font-bold py-2.5 px-3.5 rounded-2xl border border-[#E2E8F0] dark:border-amber-500/40 shadow-sm dark:shadow-xl transition-colors duration-300">
            <div className="flex items-center justify-between gap-1.5 pb-1 mb-1 border-b border-[#E2E8F0] dark:border-navy-800 text-[10px]">
              <span className="inline-flex items-center gap-1 font-black text-[#0D9488] dark:text-amber-300 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {currentActivity.badge}
              </span>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="text-[#64748B] hover:text-[#334155] dark:text-slate-400 dark:hover:text-white p-0.5 rounded transition-colors"
                title="Minimize mascot"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="leading-snug text-[11px] sm:text-xs text-[#334155] dark:text-slate-100 font-semibold flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0D9488] dark:text-amber-400 flex-shrink-0 mt-0.5 animate-spin" />
              <span className="text-[#334155] dark:text-slate-100">{currentActivity.text}</span>
            </p>

            {/* Quick Ask Dr. Junior Chat Launcher Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsChatOpen(true);
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#0D9488] hover:bg-[#0F766E] text-white font-extrabold text-[10px] uppercase tracking-wider shadow-2xs transition-all transform hover:scale-[1.02] active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 text-white" />
              <span className="text-white">Ask Dr. Junior (AI Chat)</span>
            </button>

            {/* Speech bubble pointer pointing down towards Dr. Junior */}
            <div className="absolute -bottom-1.5 left-8 w-3 h-3 bg-white dark:bg-navy-900 border-b border-r border-[#E2E8F0] dark:border-amber-500/40 transform rotate-45" />
          </div>
        </div>

        {/* 3D Character Container standing directly on the page */}
        <div
          className="relative cursor-pointer"
          onClick={handleCharacterClick}
          title="Click Dr. Junior to chat or toggle rounds patrol!"
        >
        {/* Floating Heart / Sparkle Burst on Tap */}
        {showHearts && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none animate-bounce z-40">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-ping" />
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
          </div>
        )}

        {/* Ambient Warm Golden Aura Behind Character */}
        <div className="absolute inset-0 -top-4 w-40 h-48 sm:w-48 sm:h-56 bg-amber-400/15 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-400/25 transition-all" />

        {/* Walking Stride & Bob Wrapper */}
        <div>
          {/* 3D Character with Infinite Stride Bobbing */}
          <div
            className={`relative transition-all duration-300 ease-out transform ${
              isWalkingActive ? 'animate-junior-stride group-hover:[animation-play-state:paused]' : ''
            } ${
              isBouncing
                ? 'scale-110 -translate-y-3'
                : 'hover:-translate-y-1.5 hover:scale-105'
            }`}
          >
            {pose === 'walking' ? (
              /* 4-Frame Sequential Walk Cycle with Smooth Cross-Fade */
              <div className="relative w-36 h-36 sm:w-48 sm:h-48">
                {WALK_CYCLE_FRAMES.map((frameImg, idx) => (
                  <img
                    key={idx}
                    src={frameImg}
                    alt={`3D Dr Junior Walking Step ${idx + 1}`}
                    className={`absolute inset-0 w-full h-full object-contain filter drop-shadow-[0_12px_20px_rgba(11,21,36,0.16)] transition-opacity duration-300 ease-in-out ${
                      frameIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                    loading="eager"
                  />
                ))}
              </div>
            ) : (
              <div className="relative w-36 h-36 sm:w-48 sm:h-48">
                <img
                  src={pose === 'reading' ? prescription3DImg : standing3DImg}
                  alt="3D Dr Junior Hospital Mascot"
                  className="w-full h-full object-contain filter drop-shadow-[0_12px_20px_rgba(11,21,36,0.16)]"
                  loading="eager"
                />
              </div>
            )}

            {/* Realistic 3D Ground Contact Shadow Pulsing with Walking Footsteps */}
            <div
              className={`w-28 sm:w-36 h-3 bg-navy-950/25 rounded-full filter blur-[3px] mx-auto -mt-3 transform scale-y-75 pointer-events-none ${
                isWalkingActive ? 'animate-junior-shadow group-hover:[animation-play-state:paused]' : ''
              }`}
            />
          </div>
        </div>

        {/* Mini Ground Status Pill */}
        <div className="text-center mt-1.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 dark:bg-navy-900/95 backdrop-blur-md border border-amber-300 dark:border-amber-500/50 text-[10px] font-black text-navy-950 dark:text-amber-300 shadow-sm dark:shadow-md opacity-90 group-hover:opacity-100 group-hover:border-amber-400 dark:group-hover:border-amber-400 transition-all">
            {pose === 'walking' ? (
              <>
                <Footprints className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-bounce" />
                <span className="text-navy-950 dark:text-amber-200">Dr. Junior • Walking Rounds</span>
              </>
            ) : (
              <>
                <FileText className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span className="text-navy-950 dark:text-amber-200">Dr. Junior • Checking Rx</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  </>
);
};

export default PediatricBuddy;
