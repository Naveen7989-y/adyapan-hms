import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function VibrantWellnessApp({ onBeginJourney }) {
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
    <div id="home" className="relative min-h-[92vh] sm:min-h-screen w-full overflow-x-hidden bg-stone-950 font-['Inter',sans-serif] text-white selection:bg-emerald-500/30 selection:text-white">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .liquid-glass {
          background: rgba(255, 255, 255, 0.01);
          background-blend-mode: luminosity;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
        }

        .liquid-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1.4px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.45) 0%,
            rgba(255, 255, 255, 0.15) 20%,
            transparent 40%,
            transparent 60%,
            rgba(255, 255, 255, 0.15) 80%,
            rgba(255, 255, 255, 0.45) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        .tracking-tight-custom {
          letter-spacing: -0.05em;
        }
      `}</style>

      {/* Video Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover scale-105 filter brightness-90 contrast-105"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260715_082433_69699cf8-444b-4484-93cc-053e57896dfd.mp4"
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
        {/* Subtle cinematic gradient overlay for perfect readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/20 to-stone-950/70 pointer-events-none" />
      </div>

      {/* Main Hero Content */}
      <main className="relative z-10 flex flex-col justify-center min-h-[85vh] sm:min-h-[calc(100vh-80px)] px-5 pt-12 pb-10 sm:px-8 sm:pt-16 sm:pb-12 md:px-16 md:pt-20 md:pb-14 lg:px-20">
        
        {/* Top Block */}
        <div className="max-w-3xl">
          
          {/* Badge */}
          <div className="liquid-glass rounded-full inline-flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 sm:px-4 sm:py-2 mb-5 sm:mb-6">
            <div className="flex -space-x-2">
              <img
                src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Avatar 1"
                className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white/20 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <img
                src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Avatar 2"
                className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white/20 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <img
                src="https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Avatar 3"
                className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white/20 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <img
                src="https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=100"
                alt="Avatar 4"
                className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-white/20 object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <span className="text-xs sm:text-sm font-light text-white/80 tracking-wide">
              our path to natural wellness
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[1.05] text-white tracking-tight-custom">
            Heal Your Body
          </h1>

          {/* Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base md:text-lg font-light text-white/70 max-w-xl leading-relaxed">
            Holistic wellness. Transformative results. Reconnect your mind, body, and spirit with our clinically backed natural healing pathways.
          </p>

          {/* CTA Button */}
          <button
            type="button"
            onClick={handleCtaClick}
            className="liquid-glass rounded-full px-6 py-3 sm:px-7 sm:py-3.5 mt-6 sm:mt-8 text-sm font-medium text-white transition-all duration-300 hover:bg-white/10 hover:scale-[1.02] flex items-center gap-2 group shadow-lg cursor-pointer"
          >
            <span>Begin Your Journey</span>
            <ArrowRight className="w-4 h-4 text-white/80 transition-transform duration-300 group-hover:translate-x-1" />
          </button>

        </div>

      </main>

    </div>
  );
}

export { VibrantWellnessApp as VibrantWellnessHero };
