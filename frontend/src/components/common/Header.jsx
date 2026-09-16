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
        return 'bg-navy-900 text-amber-300 border-navy-700';
      case 'HOSPITAL_ADMIN':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'DOCTOR':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'RECEPTIONIST':
        return 'bg-navy-50 text-navy-800 border-navy-200';
      case 'PHARMACIST':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'ACCOUNTANT':
        return 'bg-beige-100 text-beige-800 border-beige-300';
      case 'NURSE_ASSISTANT':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      default:
        return 'bg-beige-50 text-slate-800 border-beige-200';
    }
  };

  return (
    <header className="h-16 bg-[#FFF9F0]/95 dark:bg-[#070D18]/90 backdrop-blur-md border-b border-[#E6D9C6] dark:border-navy-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-300">
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-[#526174] dark:text-slate-300 hover:text-[#14243A] dark:hover:text-white rounded-xl hover:bg-[#FFFCF7] dark:hover:bg-navy-800 transition-colors focus:outline-none focus:ring-2 focus:ring-[#D99A32]/30"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <HeartbeatLogo size="sm" />
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-black text-[#14243A] dark:text-white tracking-tight leading-tight truncate">
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
          <p className="text-[10px] sm:text-[11px] font-medium text-[#526174] dark:text-slate-400 truncate max-w-[130px] sm:max-w-none">
            {user?.hospital?.name || 'Central Hospital & Clinic'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
        {/* Theme Toggle Button */}
        <ThemeToggle size="sm" />

        <button
          type="button"
          className="p-1.5 sm:p-2 text-[#526174] hover:text-[#14243A] dark:text-slate-400 dark:hover:text-amber-300 rounded-full hover:bg-[#FFFCF7] dark:hover:bg-navy-800 transition-all duration-200 relative group"
          title="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform text-[#526174] dark:text-slate-400" />
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#D99A32] absolute top-1 right-1 sm:top-1.5 sm:right-1.5 ring-2 ring-[#FFF9F0] dark:ring-navy-900 animate-ping"></span>
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-[#D99A32] absolute top-1 right-1 sm:top-1.5 sm:right-1.5 ring-2 ring-[#FFF9F0] dark:ring-navy-900"></span>
        </button>

        <div className="h-5 sm:h-6 w-px bg-[#E6D9C6] dark:bg-navy-800 hidden xs:block" />

        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-[#14243A] dark:text-white leading-tight">
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
            <UserCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#526174] dark:text-slate-400" />
            <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#FFF9F0] dark:ring-navy-900"></span>
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
