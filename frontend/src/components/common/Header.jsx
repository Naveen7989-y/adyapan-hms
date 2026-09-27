import React from 'react';
import { Bell, UserCircle, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import HeartbeatLogo from './HeartbeatLogo';
import ThemeToggle from './ThemeToggle';

export const Header = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-600/60';
      case 'HOSPITAL_ADMIN':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-500/60';
      case 'DOCTOR':
        return 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-600/60';
      case 'RECEPTIONIST':
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-600/60';
      case 'PHARMACIST':
        return 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-600/60';
      case 'ACCOUNTANT':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-600/60';
      case 'NURSE_ASSISTANT':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-600/60';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    }
  };

  return (
    <header className="h-16 bg-white/95 dark:bg-[#070D18]/90 backdrop-blur-md border-b border-[#E2E8F0] dark:border-navy-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-300">
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-[#64748B] dark:text-slate-300 hover:text-[#334155] dark:hover:text-white rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <HeartbeatLogo size="sm" />
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-black text-[#334155] dark:text-white tracking-tight leading-tight truncate">
              ADYAPAN HOSPITAL
            </h1>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-mono flex-shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE HUD</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-[#64748B] dark:text-slate-400 truncate max-w-[130px] sm:max-w-none">
            {user?.hospital?.name || 'Central Hospital & Clinic'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        {/* Theme Toggle Button */}
        <ThemeToggle size="sm" />

        <button
          type="button"
          className="p-1.5 sm:p-2 text-[#64748B] hover:text-[#334155] dark:text-slate-400 dark:hover:text-amber-300 rounded-full hover:bg-[#F8FAFC] dark:hover:bg-navy-800 transition-all duration-200 relative group"
          title="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform text-[#64748B] dark:text-slate-400" />
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#0D9488] absolute top-1 right-1 sm:top-1.5 sm:right-1.5 ring-2 ring-white dark:ring-navy-900 animate-ping"></span>
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#0D9488] absolute top-1 right-1 sm:top-1.5 sm:right-1.5 ring-2 ring-white dark:ring-navy-900"></span>
        </button>

        <div className="h-5 sm:h-6 w-px bg-[#E2E8F0] dark:bg-navy-800 hidden xs:block" />

        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-[#334155] dark:text-white leading-tight">
              {user?.name || 'Staff User'}
            </div>
            <div className="mt-0.5">
              <span
                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider shadow-sm ${getRoleBadgeColor(
                  user?.role
                )}`}
              >
                {user?.role?.replace('_', ' ') || 'GUEST'}
              </span>
            </div>
          </div>
          <div className="relative">
            <UserCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#64748B] dark:text-slate-400" />
            <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-navy-900"></span>
          </div>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
