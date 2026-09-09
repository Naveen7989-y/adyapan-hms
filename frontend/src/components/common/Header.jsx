import React from 'react';
import { Activity, Bell, UserCircle, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    <header className="h-16 glass-panel border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm neon-border-gold">
      <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-navy-900 rounded-xl hover:bg-slate-100/80 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 flex items-center justify-center text-white shadow-gold animate-float flex-shrink-0">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <h1 className="text-sm sm:text-base font-black text-navy-900 tracking-tight leading-tight truncate">
              ADYAPAN HOSPITAL
            </h1>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[10px] font-bold text-emerald-700 font-mono flex-shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE HUD</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 truncate max-w-[130px] sm:max-w-none">
            {user?.hospital?.name || 'Central Hospital & Clinic'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        <button
          type="button"
          className="p-1.5 sm:p-2 text-slate-400 hover:text-navy-900 rounded-full hover:bg-beige-100/80 transition-all duration-200 relative group"
          title="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500 absolute top-1 right-1 sm:top-1.5 sm:right-1.5 ring-2 ring-white animate-ping"></span>
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-500 absolute top-1 right-1 sm:top-1.5 sm:right-1.5 ring-2 ring-white"></span>
        </button>

        <div className="h-5 sm:h-6 w-px bg-slate-200 hidden xs:block" />

        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-navy-900 leading-tight">
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
            <UserCircle className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
            <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
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
