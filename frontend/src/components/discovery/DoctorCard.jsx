import React from 'react';
import {
  Stethoscope,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DoctorCard = ({ doctor, onBookAppointment, onViewProfile }) => {
  if (!doctor) return null;

  const isAvailable = doctor.status === 'AVAILABLE';

  return (
    <div className="group relative bg-white dark:bg-navy-900/90 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-navy-700/80 hover:border-[#0D9488] dark:hover:border-amber-400 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Top Badges: Department & Availability */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0D9488]/10 dark:bg-amber-950/80 text-[#0D9488] dark:text-amber-300 border border-[#0D9488]/20 dark:border-amber-700/60">
            <Stethoscope className="w-3 h-3 text-[#0D9488] dark:text-amber-400" />
            {doctor.department}
          </span>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              isAvailable
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isAvailable ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Available Today</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-slate-400" />
                <span>{doctor.availabilityText || 'Availability not currently available'}</span>
              </>
            )}
          </span>
        </div>

        {/* Doctor Identity */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#0D9488] dark:bg-navy-800 text-white dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0 border border-[#0D9488]/30 shadow-xs">
            {doctor.name ? doctor.name.replace(/^Dr\.\s*/, '').slice(0, 2).toUpperCase() : 'DR'}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-base font-black text-[#334155] dark:text-white tracking-tight group-hover:text-[#0D9488] dark:group-hover:text-amber-400 transition-colors truncate">
              {doctor.name}
            </h4>
            <p className="text-xs font-semibold text-[#64748B] dark:text-slate-300 mt-0.5 truncate">
              {doctor.specialization}
            </p>
          </div>
        </div>

        {/* Clinical Info & Hospital */}
        <div className="mt-3.5 space-y-1.5 text-xs text-[#64748B] dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#0D9488] dark:text-amber-400 shrink-0" />
            <span className="font-semibold text-[#334155] dark:text-slate-200 truncate">
              {doctor.hospitalName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 shrink-0" />
            <span className="truncate">{doctor.city || 'Hyderabad'}</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium">
              {doctor.experience || '12+ yrs experience'}
            </span>
          </div>

          {doctor.consultationFee !== undefined && doctor.consultationFee > 0 && (
            <div className="text-[11px] text-[#64748B] dark:text-slate-400 font-medium pt-1">
              Consultation Fee:{' '}
              <span className="font-bold text-[#334155] dark:text-white font-mono">
                ₹{doctor.consultationFee}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-navy-800 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewProfile && onViewProfile(doctor)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold text-[#334155] dark:text-white bg-[#F8FAFC] hover:bg-slate-100 dark:bg-navy-800 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-600 transition-all active:scale-98"
        >
          <User className="w-3.5 h-3.5 text-[#0D9488] dark:text-amber-400" />
          <span>View Profile</span>
        </button>

        <Link
          to={`/login?redirect=/appointments&doctorId=${doctor.id}`}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[#0D9488] hover:bg-[#0F766E] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-navy-950 transition-all shadow-xs active:scale-98 shrink-0"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Book Slot</span>
        </Link>
      </div>
    </div>
  );
};
