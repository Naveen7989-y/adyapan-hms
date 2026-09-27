import React, { useEffect, useState } from 'react';
import {
  X,
  Hospital,
  MapPin,
  Phone,
  Globe,
  Clock,
  Star,
  ExternalLink,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import api from '../../services/api';

export const HospitalDetailModal = ({ hospital, isOpen, onClose, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(hospital || null);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!hospital) return;
    setDetails(hospital);

    // If details don't have phone or website, fetch full place details
    if (hospital.placeId && (!hospital.phoneNumber || !hospital.website)) {
      setLoading(true);
      api
        .get(`/search/hospitals/${hospital.placeId}`)
        .then((res) => {
          if (res.data) {
            setDetails((prev) => ({ ...prev, ...res.data }));
          }
        })
        .catch((err) => {
          console.warn('Could not fetch extra hospital details:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [hospital]);

  if (!isOpen || !hospital) return null;

  const h = details || hospital;
  const isOperational = h.businessStatus === 'OPERATIONAL';

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/75 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-navy-950 rounded-3xl border border-slate-200 dark:border-navy-700 shadow-2xl z-10 animate-fade-in-scale overflow-hidden transition-colors duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0D9488]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-200 dark:border-navy-800 bg-[#F8FAFC]/90 dark:bg-navy-900/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#334155] dark:text-slate-200 bg-white dark:bg-navy-800 hover:bg-[#F8FAFC] dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 transition-all shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#0D9488] dark:text-amber-400" />
                <span>Back to Results</span>
              </button>
            )}

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0D9488]/10 dark:bg-amber-950/80 text-[#0D9488] dark:text-amber-300 border border-[#0D9488]/20 dark:border-amber-700/60">
              <Hospital className="w-3 h-3 text-[#0D9488] dark:text-amber-400" />
              Verified Healthcare Facility
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#64748B] hover:text-[#334155] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-navy-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Main Title & Rating */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  isOperational
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOperational ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {isOperational ? 'Operational' : (h.businessStatus || 'Active')}
              </span>

              {h.source && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F8FAFC] dark:bg-navy-800 text-[#64748B] dark:text-slate-300 border border-slate-200 dark:border-navy-700">
                  Source: {h.source}
                </span>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-[#334155] dark:text-white tracking-tight leading-snug">
              {h.name}
            </h3>

            {/* Rating Stars and Count */}
            {h.rating && (
              <div className="mt-2.5 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-300 text-xs font-black">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span className="text-sm">{h.rating.toFixed(1)}</span>
                </div>
                {h.reviewCount && (
                  <span className="text-xs font-semibold text-[#64748B] dark:text-slate-300">
                    Based on {h.reviewCount.toLocaleString()} patient reviews
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Key Clinical & Facility Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Address */}
            <div className="sm:col-span-2 p-4 rounded-2xl bg-[#F8FAFC] dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0D9488] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                    Location & Full Address
                  </h5>
                  <p className="text-sm font-medium text-[#334155] dark:text-slate-200 mt-1 leading-relaxed">
                    {h.address}
                  </p>
                  {h.distanceKm !== null && h.distanceKm !== undefined && (
                    <p className="text-xs font-bold text-[#0D9488] dark:text-amber-400 mt-1 flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      Approx. {h.distanceKm} km from your selected search location
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Telephone Contact */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                    Phone / Reception
                  </h5>
                  {h.phoneNumber ? (
                    <a
                      href={`tel:${h.phoneNumber.replace(/\s+/g, '')}`}
                      className="text-sm font-bold text-[#334155] dark:text-white hover:text-[#0D9488] dark:hover:text-amber-400 truncate block mt-0.5"
                    >
                      {h.phoneNumber}
                    </a>
                  ) : (
                    <span className="text-xs text-[#64748B] dark:text-slate-400 block mt-0.5">
                      Available on location
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Official Website */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0D9488] text-white flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                    Official Website
                  </h5>
                  {h.website ? (
                    <a
                      href={h.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-bold text-[#0D9488] dark:text-blue-400 hover:underline truncate mt-0.5 max-w-full"
                    >
                      <span className="truncate">Visit Portal</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#64748B] dark:text-slate-400 block mt-0.5">
                      Website link unavailable
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Opening Hours Schedule */}
          {h.openingHours && h.openingHours.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#F8FAFC] dark:bg-navy-900 border border-slate-200 dark:border-navy-800">
              <div className="flex items-center gap-2 mb-2.5">
                <Clock className="w-4 h-4 text-[#0D9488] dark:text-amber-400" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400">
                  Operating Hours & Clinical Timing
                </h5>
              </div>
              <ul className="space-y-1">
                {h.openingHours.map((hour, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-[#334155] dark:text-slate-200 font-medium flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{hour}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specialties / Departments */}
          {h.specialties && h.specialties.length > 0 && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 mb-2">
                Specialized Clinical Departments
              </h5>
              <div className="flex flex-wrap gap-2">
                {h.specialties.map((spec, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 text-xs font-bold rounded-xl bg-[#F8FAFC] dark:bg-navy-800 text-[#334155] dark:text-slate-200 border border-slate-200 dark:border-navy-700"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-7 py-4 border-t border-slate-200 dark:border-navy-800 bg-[#F8FAFC]/90 dark:bg-navy-900/90 backdrop-blur-md flex items-center justify-between gap-3 shrink-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#334155] dark:text-white bg-white dark:bg-navy-800 hover:bg-[#F8FAFC] dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 transition-all active:scale-98"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to Results</span>
            </button>
          ) : (
            <div />
          )}

          <a
            href={h.directionsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-[#0D9488] hover:bg-[#0F766E] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-navy-950 transition-all shadow-md active:scale-98"
          >
            <Navigation className="w-4 h-4" />
            <span>Get Directions</span>
          </a>
        </div>
      </div>
    </div>
  );
};
