import React from 'react';
import {
  Hospital,
  Stethoscope,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export const HealthcareDiscoveryCTA = ({ onOpenDiscovery }) => {
  return (
    <section className="relative py-12 sm:py-16 bg-[#F8FAFC] dark:bg-navy-950 border-y border-slate-200 dark:border-navy-800 transition-colors duration-300 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#0D9488]/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 bg-[#334155]/10 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white/95 dark:bg-navy-900/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-navy-700/80 p-6 sm:p-10 lg:p-12 shadow-xl dark:shadow-2xl relative overflow-hidden">
          {/* Subtle Top Border Line Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#0D9488] to-transparent" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left side: Content & Value Proposition */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#0D9488]/20 dark:border-amber-700/60 bg-[#0D9488]/10 dark:bg-amber-950/70 text-[#0D9488] dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#0D9488] dark:text-amber-400" />
                <span>Nationwide Real-Time Discovery</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-4xl font-black text-[#334155] dark:text-white tracking-tight leading-tight">
                Find Healthcare Near You
              </h2>

              <p className="mt-3 text-sm sm:text-base text-[#64748B] dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Discover hospitals, doctors and healthcare specialists across India. Search by city,
                specialty, or find accredited emergency and OPD centers right around your location.
              </p>

              {/* Feature highlights */}
              <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs font-bold text-[#64748B] dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Real Hospital Data
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Verified Doctor Profiles
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Instant GPS Location Search
                </span>
              </div>
            </div>

            {/* Right side: Modern Interactive CTA Buttons Box */}
            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:flex-col gap-3.5 justify-center">
              {/* Button 1: Find Hospitals */}
              <button
                type="button"
                onClick={() => onOpenDiscovery('hospitals', false)}
                className="group w-full flex items-center justify-between p-4 rounded-2xl bg-[#0D9488] text-white hover:bg-[#0F766E] dark:bg-navy-800 dark:hover:bg-navy-700/90 border border-[#0D9488] dark:border-navy-600 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <Hospital className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-white transition-colors">
                      Find Hospitals
                    </h4>
                    <p className="text-xs text-white/90 dark:text-slate-400">
                      Search medical centers, ICU & trauma hubs
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white dark:text-amber-400 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
              </button>

              {/* Button 2: Find Doctors */}
              <button
                type="button"
                onClick={() => onOpenDiscovery('doctors', false)}
                className="group w-full flex items-center justify-between p-4 rounded-2xl bg-white hover:bg-[#F8FAFC] dark:bg-navy-950 dark:hover:bg-navy-900 border border-slate-300 hover:border-[#0D9488] dark:border-white/20 dark:hover:border-amber-400 text-[#334155] dark:text-white shadow-sm hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-11 h-11 rounded-xl bg-[#0D9488]/10 dark:bg-navy-800 border border-[#0D9488]/20 dark:border-navy-700 text-[#0D9488] dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-[#334155] dark:text-white group-hover:text-[#0D9488] dark:group-hover:text-amber-400 transition-colors">
                      Find Doctors
                    </h4>
                    <p className="text-xs text-[#64748B] dark:text-slate-400">
                      Cardiologists, Neurologists, Surgeons & more
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#64748B] dark:text-slate-400 group-hover:text-[#0D9488] dark:group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>

              {/* Optional Quick Action: Near Me */}
              <button
                type="button"
                onClick={() => onOpenDiscovery('hospitals', true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-[#64748B] dark:text-slate-300 hover:text-[#334155] dark:hover:text-white bg-transparent hover:bg-[#F8FAFC] dark:hover:bg-navy-800/60 border border-dashed border-slate-300 dark:border-navy-700 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5 text-[#0D9488] dark:text-amber-400" />
                <span>Quick Search: Healthcare Facilities Near My Location</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
