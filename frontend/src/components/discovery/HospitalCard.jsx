import React from 'react';
import {
  Hospital,
  MapPin,
  Star,
  Clock,
  Navigation,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const HospitalCard = ({ hospital, onViewDetails }) => {
  if (!hospital) return null;

  const isOperational = hospital.businessStatus === 'OPERATIONAL';

  return (
    <div className="group relative bg-white dark:bg-navy-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-navy-700/80 hover:border-[#0D9488] dark:hover:border-amber-400 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      {/* Top Header & Badges */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isOperational
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isOperational ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isOperational ? 'Operational' : (hospital.businessStatus || 'Active')}
            </span>

            {hospital.distanceKm !== null && hospital.distanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F8FAFC] dark:bg-navy-800 text-[#64748B] dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                <Navigation className="w-3 h-3 text-[#0D9488] dark:text-amber-400" />
                {hospital.distanceKm} km away
              </span>
            )}
          </div>

          {/* Rating */}
          {hospital.rating && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-300 text-xs font-black shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{hospital.rating.toFixed(1)}</span>
              {hospital.reviewCount && (
                <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-normal">
                  ({hospital.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Hospital Name */}
        <h4 className="text-base sm:text-lg font-black text-[#334155] dark:text-white tracking-tight group-hover:text-[#0D9488] dark:group-hover:text-amber-400 transition-colors line-clamp-1">
          {hospital.name}
        </h4>

        {/* Address */}
        <p className="mt-1 text-xs text-[#64748B] dark:text-slate-300 flex items-start gap-1.5 line-clamp-2 leading-relaxed">
          <MapPin className="w-3.5 h-3.5 text-[#0D9488] dark:text-amber-400 shrink-0 mt-0.5" />
          <span>{hospital.address}</span>
        </p>

        {/* Opening Hours preview */}
        {hospital.openingHours && hospital.openingHours.length > 0 && (
          <div className="mt-2 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{hospital.openingHours[0]}</span>
          </div>
        )}

        {/* Specialty tags if available */}
        {hospital.specialties && hospital.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {hospital.specialties.slice(0, 3).map((spec, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#F8FAFC] dark:bg-navy-800/80 text-[#334155] dark:text-slate-300 border border-slate-200 dark:border-navy-700"
              >
                {spec}
              </span>
            ))}
            {hospital.specialties.length > 3 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold text-[#64748B] dark:text-slate-400">
                +{hospital.specialties.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-navy-800 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewDetails(hospital)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-[#334155] dark:text-white bg-[#F8FAFC] hover:bg-slate-100 dark:bg-navy-800 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-600 transition-all active:scale-98"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#0D9488] dark:text-amber-400" />
        </button>

        <a
          href={hospital.directionsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospital.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0D9488] hover:bg-[#0F766E] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-navy-950 transition-all shadow-xs active:scale-98 shrink-0"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Directions</span>
        </a>
      </div>
    </div>
  );
};
