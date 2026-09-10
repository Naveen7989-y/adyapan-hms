import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Layers,
  Stethoscope,
  FileText,
  Package,
  Receipt,
  BarChart3,
  Server,
  UserCog,
  Bell,
  Ticket,
  Activity,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['*'] },
  { name: 'API Health Check', path: '/health-check', icon: Server, roles: ['*'] },
  {
    name: 'Staff Users',
    path: '/users',
    icon: UserCog,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'],
    badge: 'Phase 3',
  },
  {
    name: 'Patients',
    path: '/patients',
    icon: Users,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'],
    badge: 'Phase 4',
  },
  {
    name: 'Departments',
    path: '/departments',
    icon: Layers,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
    badge: 'Phase 5',
  },
  {
    name: 'Appointments',
    path: '/appointments',
    icon: Calendar,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'],
    badge: 'Phase 6',
  },
  {
    name: 'Notifications',
    path: '/notifications',
    icon: Bell,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
    badge: 'Phase 7',
  },
  {
    name: 'Check-In & Tokens',
    path: '/tokens',
    icon: Ticket,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'],
    badge: 'Phase 8',
  },
  {
    name: 'Live Queue',
    path: '/queue',
    icon: Stethoscope,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'],
    badge: 'Phase 9',
  },
  {
    name: 'Consultations',
    path: '/consultations',
    icon: Activity,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT'],
    badge: 'Phase 10',
  },
  {
    name: 'Prescriptions',
    path: '/prescriptions',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE_ASSISTANT', 'RECEPTIONIST'],
    badge: 'Phase 11',
  },
  {
    name: 'Pharmacy',
    path: '/pharmacy',
    icon: Package,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'],
    badge: 'Phase 12',
  },
  {
    name: 'Billing',
    path: '/billing',
    icon: Receipt,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'],
    badge: 'Phase 13',
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'PHARMACIST', 'DOCTOR', 'RECEPTIONIST'],
    badge: 'Phase 15',
  },
];

export const Sidebar = ({ mobileMenuOpen = false, setMobileMenuOpen = () => {} }) => {
  const { user } = useAuth();
  const currentRole = user?.role || 'GUEST';

  const visibleNav = navigationItems.filter((item) => {
    if (item.roles.includes('*')) return true;
    if (currentRole === 'SUPER_ADMIN') return true;
    return item.roles.includes(currentRole);
  });

  const renderNavList = (isMobile = false) => (
    <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              if (isMobile) setMobileMenuOpen(false);
            }}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 ${isMobile ? 'py-3 min-h-[44px]' : 'py-2.5'} rounded-xl text-xs font-bold transition-all duration-200 group relative overflow-hidden ${
                isActive
                  ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-gold-glow translate-x-1'
                  : 'text-slate-300 hover:bg-slate-900/90 hover:text-amber-300 hover:translate-x-1'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-sm" />
                )}
                <div className="flex items-center space-x-3 z-10">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:text-amber-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition-colors z-10 ${
                      isActive
                        ? 'bg-black/20 text-white border-white/20'
                        : 'bg-slate-900 text-amber-300/80 border-slate-800 group-hover:border-amber-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  const footerContent = (
    <div className="p-4 border-t border-slate-800/80 text-xs text-slate-400 bg-slate-900/30">
      <div className="font-bold text-slate-200 tracking-tight">Adyapan Healthcare SaaS</div>
      <div className="text-emerald-400 font-mono text-[11px] mt-1 flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>Core Telemetry Active</span>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (Hidden on <1024px) */}
      <aside className="hidden lg:flex w-64 bg-slate-950 text-slate-300 min-h-screen flex-col flex-shrink-0 border-r border-slate-800/80 relative select-none">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-gold" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono">
              COMMAND HUD
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono shadow-sm">
            v1.0 PROD
          </span>
        </div>

        {renderNavList(false)}
        {footerContent}
      </aside>

      {/* 2. Mobile Slide-Over Drawer (Visible only on <1024px when toggled) */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-slate-950 text-slate-300 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden border-r border-slate-800/80 select-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-gold" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono">
              COMMAND HUD
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
              v1.0
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              title="Close Navigation Menu"
              aria-label="Close Navigation Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {renderNavList(true)}
        {footerContent}
      </div>
    </>
  );
};

export default Sidebar;
