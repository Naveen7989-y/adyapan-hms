import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function VibrantWellnessApp({ onBeginJourney }) {
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    // Only attempt video playback on desktop/tablet devices where video element is rendered
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return;
    }
    const video = videoRef.current;
    if (video) {
      video.defaultMuted = true;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsVideoPlaying(true))
          .catch(() => {
            setIsVideoPlaying(false);
          });
      }
    }
  }, []);

  const handleCtaClick = () => {
    if (onBeginJourney) {
      onBeginJourney();
    } else {
      const tracker = document.getElementById('token-tracker') || document.getElementById('specialties');
      if (tracker) {
        tracker.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div id="home" className="relative min-h-[92vh] sm:min-h-screen w-full overflow-x-hidden bg-gradient-to-br from-[#06101E] via-[#0A1A2F] to-[#040A14] font-['Inter',sans-serif] text-white selection:bg-emerald-500/30 selection:text-white">
      
      <style>{`
        .liquid-glass {
          background: rgba(255, 255, 255, 0.04);
          background-blend-mode: luminosity;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .tracking-tight-custom {
          letter-spacing: -0.05em;
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }

        .animate-ambient-glow {
          animation: pulseGlow 8s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient Lighting Orbs - Hidden on mobile to prevent GPU composite lag */}
      <div className="hidden md:block absolute top-1/4 left-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none animate-ambient-glow" />
      <div className="hidden md:block absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-ambient-glow" style={{ animationDelay: '3s' }} />
      <div className="hidden md:block absolute top-1/2 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mobile-optimized high-performance cinematic backdrop (0 KB video transfer) */}
      <div className="md:hidden absolute inset-0 z-0 bg-gradient-to-b from-[#06101E] via-[#091526] to-[#06101E] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/30 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#06101E] to-transparent" />
      </div>

      {/* Desktop/Tablet Video Background Layer (Only rendered on screens >= 768px) */}
      <div className="hidden md:block absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full object-cover scale-105 filter brightness-95 contrast-105 transition-opacity duration-1000"
          style={{ opacity: isVideoPlaying ? 0.9 : 0.6 }}
        >
          <source src="/videos/hero-wellness.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Subtle cinematic gradient overlay for perfect readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06101E]/60 via-[#06101E]/30 to-[#06101E]/80 pointer-events-none" />
      </div>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col justify-center min-h-[85vh] sm:min-h-[calc(100vh-80px)] px-5 pt-16 pb-12 sm:px-8 sm:pt-20 sm:pb-16 md:px-16 lg:px-20 max-w-7xl mx-auto">
        
        {/* Hero Heading & CTAs */}
        <div className="max-w-3xl text-left">
          
          {/* Badge */}
          <div className="liquid-glass rounded-full inline-flex items-center gap-2.5 sm:gap-3 px-3.5 py-1.5 sm:px-4 sm:py-2 mb-6 shadow-md">
            <div className="flex -space-x-2">
              <img
                src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Doctor 1"
                loading="lazy"
                decoding="async"
                className="h-6 w-6 rounded-full border-2 border-white/20 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <img
                src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Doctor 2"
                loading="lazy"
                decoding="async"
                className="h-6 w-6 rounded-full border-2 border-white/20 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <img
                src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Doctor 3"
                loading="lazy"
                decoding="async"
                className="h-6 w-6 rounded-full border-2 border-white/20 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <span className="text-xs sm:text-sm font-medium text-emerald-300 tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              NABH Accredited Multi-Specialty Care
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-white tracking-tight-custom">
            Heal Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">Body</span>
          </h1>

          {/* Subtitle */}
          <div className="mt-6 max-w-xl">
            <div className="relative rounded-2xl liquid-glass px-5 py-4 border border-white/10 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 via-teal-400 to-amber-300" />
              <p className="text-base sm:text-lg leading-relaxed text-slate-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                <span className="font-semibold text-white tracking-wide">
                  Holistic wellness.
                </span>{' '}
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
                  Transformative results.
                </span>{' '}
                <span className="text-slate-300">
                  Reconnect your{' '}
                  <span className="text-white font-medium">mind, body, and spirit</span> with our{' '}
                  <span className="text-emerald-300 font-medium underline decoration-emerald-400/40 decoration-2 underline-offset-4">
                    clinically backed healing pathways
                  </span>.
                </span>
              </p>
            </div>
          </div>

          {/* CTA Button Row */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleCtaClick}
              className="liquid-glass rounded-full px-7 py-3.5 text-sm sm:text-base font-semibold text-white transition-all duration-300 hover:bg-emerald-500/20 hover:scale-[1.02] flex items-center gap-2 group shadow-xl cursor-pointer border border-emerald-400/40"
            >
              <span>Begin Your Journey</span>
              <ArrowRight className="w-4 h-4 text-emerald-300 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>

        </div>

      </main>

    </div>
  );
}

export { VibrantWellnessApp as VibrantWellnessHero };
