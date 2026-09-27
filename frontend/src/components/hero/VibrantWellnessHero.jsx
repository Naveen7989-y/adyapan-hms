import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Activity } from 'lucide-react';

export default function VibrantWellnessApp({ onBeginJourney }) {
  const videoRef = useRef(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

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

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/4 left-10 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none animate-ambient-glow" />
      <div className="absolute bottom-10 right-10 w-[30rem] h-[30rem] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-ambient-glow" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Video Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-heart-bg.jpg"
          className="absolute inset-0 h-full w-full object-cover scale-105 filter brightness-95 contrast-105 transition-opacity duration-1000"
          style={{ opacity: isVideoPlaying ? 0.9 : 0.6 }}
        >
          <source src="/videos/hero-wellness.mp4" type="video/mp4" />
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260715_082433_69699cf8-444b-4484-93cc-053e57896dfd.mp4"
            type="video/mp4"
          />
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
                className="h-6 w-6 rounded-full border-2 border-white/20 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <img
                src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Doctor 2"
                className="h-6 w-6 rounded-full border-2 border-white/20 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <img
                src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Doctor 3"
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
          <p className="mt-5 text-base sm:text-lg md:text-xl font-light text-slate-200 max-w-xl leading-relaxed">
            Holistic wellness. Transformative results. Reconnect your mind, body, and spirit with our clinically backed natural healing pathways.
          </p>

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

            <a
              href="#token-tracker"
              className="rounded-full px-6 py-3.5 text-sm sm:text-base font-medium text-slate-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-teal-400" />
              <span>Track Live Token</span>
            </a>
          </div>

        </div>

      </main>

    </div>
  );
}

export { VibrantWellnessApp as VibrantWellnessHero };
