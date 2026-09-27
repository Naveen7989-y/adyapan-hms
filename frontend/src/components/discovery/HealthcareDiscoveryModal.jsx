import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Hospital,
  Stethoscope,
  MapPin,
  Search,
  Navigation,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Building2,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { HospitalCard } from './HospitalCard';
import { DoctorCard } from './DoctorCard';
import { HospitalDetailModal } from './HospitalDetailModal';

const HOSPITAL_SPECIALTIES = [
  'All Specialties',
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Oncology',
  'Pediatrics',
  'Dermatology',
  'Gynecology',
  'Gastroenterology',
  'ENT',
  'General Medicine',
  'General Surgery',
];

const DOCTOR_SPECIALTIES = [
  'All Specialties',
  'Cardiologist',
  'Neurologist',
  'Orthopedic Doctor',
  'Oncologist',
  'Pediatrician',
  'Dermatologist',
  'Gynecologist',
  'Gastroenterologist',
  'ENT Specialist',
  'General Physician',
  'General Surgeon',
];

const POPULAR_CITIES = ['Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Pune'];

export const HealthcareDiscoveryModal = ({
  isOpen,
  onClose,
  initialTab = 'hospitals',
  autoLocate = false,
}) => {
  const [activeTab, setActiveTab] = useState(initialTab); // 'hospitals' | 'doctors'
  const [city, setCity] = useState('Hyderabad');
  const [searchQuery, setSearchQuery] = useState('');
  const [specialty, setSpecialty] = useState('All Specialties');
  const [coords, setCoords] = useState(null); // { lat, lng }

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locating, setLocating] = useState(false);

  // Selected hospital for detail view inside modal
  const [selectedHospital, setSelectedHospital] = useState(null);

  // Sync initial tab when changed by caller
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSelectedHospital(null);
      setErrorMessage(null);
      setLocationError(null);
    }
  }, [isOpen, initialTab]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedHospital) {
          setSelectedHospital(null);
        } else {
          onClose();
        }
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
  }, [isOpen, onClose, selectedHospital]);

  // Auto trigger location if requested
  useEffect(() => {
    if (isOpen && autoLocate) {
      handleUseMyLocation();
    } else if (isOpen && !hasSearched) {
      // Execute initial search for default city upon opening
      performSearch(activeTab, city, searchQuery, specialty, coords);
    }
  }, [isOpen, autoLocate]);

  const performSearch = async (tab, searchCity, queryText, searchSpec, searchCoords = null) => {
    setLoading(true);
    setErrorMessage(null);
    setLocationError(null);

    try {
      if (tab === 'hospitals') {
        const params = new URLSearchParams();
        if (searchCoords?.lat && searchCoords?.lng) {
          params.append('lat', searchCoords.lat);
          params.append('lng', searchCoords.lng);
          params.append('radius', '15000');
        } else if (searchCity) {
          params.append('city', searchCity);
        }

        if (queryText?.trim()) {
          params.append('query', queryText.trim());
        }

        if (searchSpec && searchSpec !== 'All Specialties') {
          params.append('specialty', searchSpec);
        }

        const res = await api.get(`/search/hospitals?${params.toString()}`);
        setResults(res.data || []);
      } else {
        // Doctors search
        const params = new URLSearchParams();
        if (searchCity) {
          params.append('city', searchCity);
        }
        if (queryText?.trim()) {
          params.append('query', queryText.trim());
        }
        if (searchSpec && searchSpec !== 'All Specialties') {
          // Normalize e.g. "Cardiologist" -> "Cardio"
          const cleanSpec = searchSpec.replace(/ (Doctor|Specialist|Physician|Surgeon)/i, '');
          params.append('specialty', cleanSpec);
        }

        const res = await api.get(`/search/doctors?${params.toString()}`);
        setResults(res.data || []);
      }
      setHasSearched(true);
    } catch (err) {
      console.error('Discovery search error:', err);
      setErrorMessage(
        err?.message || "We couldn't retrieve healthcare information right now. Please try again."
      );
      setResults([]);
      setHasSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    performSearch(activeTab, city, searchQuery, specialty, coords);
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSelectedHospital(null);
    setSpecialty('All Specialties');
    performSearch(newTab, city, searchQuery, 'All Specialties', coords);
  };

  const handleCitySelect = (selectedCity) => {
    setCity(selectedCity);
    setCoords(null);
    performSearch(activeTab, selectedCity, searchQuery, specialty, null);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoords(newCoords);
        setCity('Near Me (GPS)');
        setLocating(false);
        performSearch(activeTab, '', searchQuery, specialty, newCoords);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation denied or failed:', err);
        setLocationError('Location permission was not granted. Please enter your city manually.');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[9990] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Soft Backdrop Blur */}
        <div
          className="fixed inset-0 bg-navy-950/75 backdrop-blur-md transition-opacity animate-in fade-in"
          onClick={onClose}
        />

        {/* Centered Modal Card */}
        <div
          className="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-white dark:bg-navy-950 rounded-3xl border border-slate-200 dark:border-navy-700 shadow-2xl z-10 animate-fade-in-scale overflow-hidden transition-colors duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#0D9488]/10 dark:bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-28 -mt-28" />

          {/* MODAL HEADER */}
          <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-slate-200 dark:border-navy-800 bg-[#F8FAFC]/90 dark:bg-navy-900/90 backdrop-blur-md shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#0D9488] dark:bg-navy-800 text-white dark:text-amber-400 flex items-center justify-center shadow-sm border border-[#0D9488]/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0D9488] dark:text-amber-300">
                      ADYAPAN HEALTHCARE DISCOVERY
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#334155] dark:text-white tracking-tight">
                    {activeTab === 'hospitals' ? 'Find Hospitals & Medical Centers' : 'Find Specialists & Verified Doctors'}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl text-[#64748B] hover:text-[#334155] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-navy-800 transition-colors"
                title="Close search popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="mt-4 flex items-center gap-2 bg-[#F8FAFC] dark:bg-navy-950 p-1 rounded-2xl border border-slate-200 dark:border-navy-800 max-w-xs">
              <button
                type="button"
                onClick={() => handleTabChange('hospitals')}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                  activeTab === 'hospitals'
                    ? 'bg-[#0D9488] text-white dark:bg-amber-500 dark:text-navy-950 shadow-sm'
                    : 'text-[#64748B] dark:text-slate-300 hover:text-[#334155] dark:hover:text-white'
                }`}
              >
                <Hospital className="w-4 h-4" />
                <span>Hospitals</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange('doctors')}
                className={`flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 ${
                  activeTab === 'doctors'
                    ? 'bg-[#0D9488] text-white dark:bg-amber-500 dark:text-navy-950 shadow-sm'
                    : 'text-[#64748B] dark:text-slate-300 hover:text-[#334155] dark:hover:text-white'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Doctors</span>
              </button>
            </div>
          </div>

          {/* SEARCH CONTROLS FORM */}
          <div className="px-5 sm:px-7 py-4 bg-white dark:bg-navy-950 border-b border-slate-200 dark:border-navy-800/80 shrink-0">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Location / City Input */}
                <div className="sm:col-span-4 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-[#0D9488] dark:text-amber-400" />
                  </div>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setCoords(null);
                    }}
                    placeholder="Enter city or location"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#F8FAFC] dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-[#334155] dark:text-white placeholder-[#64748B]/70 dark:placeholder-slate-400 focus:outline-hidden focus:border-[#0D9488] dark:focus:border-amber-400 shadow-2xs transition-colors"
                  />
                </div>

                {/* Name / Keyword Search */}
                <div className="sm:col-span-5 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab === 'hospitals'
                        ? 'Search hospital name (e.g. Apollo, KIMS)'
                        : 'Search doctor name (e.g. Sharma, Patel)'
                    }
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#F8FAFC] dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-[#334155] dark:text-white placeholder-[#64748B]/70 dark:placeholder-slate-400 focus:outline-hidden focus:border-[#0D9488] dark:focus:border-amber-400 shadow-2xs transition-colors"
                  />
                </div>

                {/* Specialty Select */}
                <div className="sm:col-span-3 relative">
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold bg-[#F8FAFC] dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-[#334155] dark:text-white focus:outline-hidden focus:border-[#0D9488] dark:focus:border-amber-400 shadow-2xs cursor-pointer transition-colors"
                  >
                    {(activeTab === 'hospitals' ? HOSPITAL_SPECIALTIES : DOCTOR_SPECIALTIES).map(
                      (spec) => (
                        <option key={spec} value={spec} className="bg-white dark:bg-navy-900">
                          {spec}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Quick City Filters & Search Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-[#64748B] dark:text-slate-400 mr-1">
                    Popular:
                  </span>
                  {POPULAR_CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleCitySelect(c)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        city.toLowerCase() === c.toLowerCase() && !coords
                          ? 'bg-[#0D9488] text-white dark:bg-amber-400 dark:text-navy-950 shadow-2xs'
                          : 'bg-[#F8FAFC] dark:bg-navy-900/80 text-[#64748B] dark:text-slate-300 hover:text-[#334155] dark:hover:text-white border border-slate-200 dark:border-navy-700'
                      }`}
                    >
                      {c}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F8FAFC] dark:bg-navy-800 text-[#334155] dark:text-amber-300 border border-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700 transition-all shadow-2xs disabled:opacity-50"
                  >
                    {locating ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#0D9488]" />
                    ) : (
                      <Navigation className="w-3 h-3 text-[#0D9488] dark:text-amber-400" />
                    )}
                    <span>Near Me</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-[#0D9488] hover:bg-[#0F766E] dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-navy-950 shadow-md hover:shadow-lg transition-all active:scale-98 disabled:opacity-50 shrink-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>{activeTab === 'hospitals' ? 'Search Hospitals' : 'Search Doctors'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Location Error alert if permission denied */}
              {locationError && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-300 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{locationError}</span>
                </div>
              )}
            </form>
          </div>

          {/* RESULTS CONTENT AREA */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            {/* Loading State: Skeleton Cards */}
            {loading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] dark:text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0D9488] dark:text-amber-400" />
                  <span>Finding healthcare near you...</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-navy-900/40 border border-slate-200 dark:border-navy-800 animate-pulse space-y-3"
                    >
                      <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded-md w-1/3" />
                      <div className="h-5 bg-slate-200 dark:bg-navy-800 rounded-md w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-navy-800 rounded-md w-full" />
                      <div className="h-8 bg-slate-200 dark:bg-navy-800 rounded-xl w-full mt-4" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {!loading && errorMessage && (
              <div className="py-12 px-4 text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3 border border-rose-200 dark:border-rose-800">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#334155] dark:text-white">
                  Unable to Load Healthcare Results
                </h4>
                <p className="text-xs text-[#64748B] dark:text-slate-300 mt-1.5 leading-relaxed">
                  {errorMessage}
                </p>
                <button
                  type="button"
                  onClick={() => performSearch(activeTab, city, searchQuery, specialty, coords)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#0D9488] hover:bg-[#0F766E] dark:bg-amber-500 dark:text-navy-950 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !errorMessage && hasSearched && results.length === 0 && (
              <div className="py-12 px-4 text-center max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-[#0D9488]/10 dark:bg-navy-900 text-[#0D9488] dark:text-amber-400 flex items-center justify-center mx-auto mb-3 border border-[#0D9488]/20 dark:border-navy-700">
                  <Hospital className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[#334155] dark:text-white">
                  No healthcare facilities found in this area.
                </h4>
                <p className="text-xs text-[#64748B] dark:text-slate-300 mt-1.5 leading-relaxed">
                  Try searching for a different city (e.g. Hyderabad, Bangalore, Mumbai), clear your
                  specialty filter, or use "Near Me" to locate facilities close to you.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCity('Hyderabad');
                    setSearchQuery('');
                    setSpecialty('All Specialties');
                    performSearch(activeTab, 'Hyderabad', '', 'All Specialties', null);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#334155] bg-[#F8FAFC] dark:bg-navy-800 hover:bg-slate-100 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700 transition-all"
                >
                  <span>Reset Search</span>
                </button>
              </div>
            )}

            {/* Results Grid */}
            {!loading && !errorMessage && results.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-[#64748B] dark:text-slate-400">
                    Showing <span className="font-black text-[#334155] dark:text-white font-mono">{results.length}</span>{' '}
                    {activeTab === 'hospitals' ? 'hospitals & medical centers' : 'specialists & doctors'}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Live Verified Data
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTab === 'hospitals'
                    ? results.map((hosp) => (
                        <HospitalCard
                          key={hosp.placeId || hosp.name}
                          hospital={hosp}
                          onViewDetails={(h) => setSelectedHospital(h)}
                        />
                      ))
                    : results.map((doc) => (
                        <DoctorCard
                          key={doc.id || doc.name}
                          doctor={doc}
                          onViewProfile={() => {
                            // View profile handler
                          }}
                        />
                      ))}
                </div>
              </div>
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className="px-5 sm:px-7 py-3 border-t border-slate-200 dark:border-navy-800 bg-[#F8FAFC]/90 dark:bg-navy-900/80 backdrop-blur-md flex items-center justify-between text-xs text-[#64748B] dark:text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Adyapan Connected Healthcare Network
            </span>
            <button
              type="button"
              onClick={onClose}
              className="font-bold text-[#334155] dark:text-slate-200 hover:text-[#0D9488] dark:hover:text-amber-400 transition-colors"
            >
              Close [ESC]
            </button>
          </div>
        </div>
      </div>

      {/* Hospital Detail Modal View overlay inside discovery */}
      {selectedHospital && (
        <HospitalDetailModal
          hospital={selectedHospital}
          isOpen={Boolean(selectedHospital)}
          onClose={() => setSelectedHospital(null)}
          onBack={() => setSelectedHospital(null)}
        />
      )}
    </>
  );
};
