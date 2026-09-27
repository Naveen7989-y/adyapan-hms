import React from 'react';

/**
 * WaterFlowTransition Component
 * 
 * Creates an organic, ultra-smooth liquid water wave animation that flows from the
 * top of the screen to the bottom when toggling between light and dark themes.
 * 
 * Features:
 * - Multi-layer fluid SVG sinusoidal waves with opposing phase oscillations
 * - Translucent caustic water sheen, droplets, and glowing liquid foam crest
 * - Hardware-accelerated GPU translation (60/120 FPS compositor thread)
 * - Harmonized with #05775A Pine Emerald and Hospital Teal brand accents
 */
export const WaterFlowTransition = ({ isFlowing, toTheme }) => {
  if (!isFlowing) return null;

  const isGoingDark = toTheme === 'dark';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-[9999999]"
    >
      {/* Cascading Water Wave traveling from top to bottom */}
      <div className="absolute inset-x-0 top-0 animate-water-curtain-flow">
        {/* Upper Fluid Water Body Trail */}
        <div
          className={`w-full h-[80vh] -top-[80vh] absolute transition-opacity ${
            isGoingDark
              ? 'bg-gradient-to-b from-[#070D18]/90 via-[#05775A]/40 to-[#05775A]/70'
              : 'bg-gradient-to-b from-[#F8FAFC]/90 via-[#CCFBF1]/40 to-[#0D9488]/50'
          }`}
        />

        {/* Liquid Waves & Crest Region */}
        <div className="relative w-full h-36 flex-shrink-0 -mb-1">
          {/* Back Wave (Subsurface water swell) */}
          <svg
            className="absolute inset-0 w-full h-full opacity-60 animate-water-wave-back"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
          >
            <path
              d="M0,50 C320,120 440,-20 720,55 C1000,120 1140,-10 1440,60 L1440,160 L0,160 Z"
              fill={isGoingDark ? '#05775A' : '#14B8A6'}
            />
          </svg>

          {/* Front Wave (Surface water crest) */}
          <svg
            className="absolute inset-0 w-full h-full opacity-90 animate-water-wave-front"
            viewBox="0 0 1440 160"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="waterFlowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isGoingDark ? '#0E946E' : '#2DD4BF'} stopOpacity="0.4" />
                <stop offset="60%" stopColor={isGoingDark ? '#05775A' : '#0D9488'} stopOpacity="0.8" />
                <stop offset="100%" stopColor={isGoingDark ? '#070D18' : '#F8FAFC'} stopOpacity="0.98" />
              </linearGradient>
            </defs>
            <path
              d="M0,70 C240,-15 480,110 720,40 C960,-30 1200,100 1440,50 L1440,160 L0,160 Z"
              fill="url(#waterFlowGrad)"
            />
          </svg>

          {/* Leading Sparkling Foam & Water Crest Highlight Line */}
          <div
            className={`absolute bottom-0 inset-x-0 h-2.5 blur-[1px] ${
              isGoingDark
                ? 'bg-gradient-to-r from-emerald-300 via-teal-100 to-emerald-400 shadow-[0_0_28px_6px_rgba(45,212,191,0.95)]'
                : 'bg-gradient-to-r from-teal-400 via-white to-teal-300 shadow-[0_0_28px_6px_rgba(13,148,136,0.9)]'
            }`}
          />

          {/* Micro Water Drops / Bubble Glows */}
          <div className="absolute bottom-3 left-[18%] w-2 h-2 rounded-full bg-white/90 blur-[0.5px] animate-ping" />
          <div className="absolute bottom-4 left-[42%] w-2.5 h-2.5 rounded-full bg-teal-200/90 blur-[0.5px] animate-pulse" />
          <div className="absolute bottom-2 left-[68%] w-2 h-2 rounded-full bg-emerald-200/90 blur-[0.5px]" />
          <div className="absolute bottom-5 left-[84%] w-1.5 h-1.5 rounded-full bg-white/80 blur-[0.5px] animate-ping" />
        </div>
      </div>
    </div>
  );
};

export default WaterFlowTransition;
