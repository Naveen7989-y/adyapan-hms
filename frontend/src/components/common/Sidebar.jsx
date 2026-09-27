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
import AdyapanLogo from './AdyapanLogo';

const navigationItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['*'] },
  { name: 'API Health Check', path: '/health-check', icon: Server, roles: ['*'] },
  {
    name: 'Staff Users',
    path: '/users',
    icon: UserCog,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN'],
  },
  {
    name: 'Patients',
    path: '/patients',
    icon: Users,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'],
  },
  {
    name: 'Departments',
    path: '/departments',
    icon: Layers,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
  },
  {
    name: 'Appointments',
    path: '/appointments',
    icon: Calendar,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'],
  },
  {
    name: 'Notifications',
    path: '/notifications',
    icon: Bell,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST'],
  },
  {
    name: 'Check-In & Tokens',
    path: '/tokens',
    icon: Ticket,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'],
  },
  {
    name: 'Live Queue',
    path: '/queue',
    icon: Stethoscope,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'],
  },
  {
    name: 'Consultations',
    path: '/consultations',
    icon: Activity,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'NURSE_ASSISTANT'],
  },
  {
    name: 'Prescriptions',
    path: '/prescriptions',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE_ASSISTANT', 'RECEPTIONIST'],
  },
  {
    name: 'Pharmacy',
    path: '/pharmacy',
    icon: Package,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'],
  },
  {
    name: 'Billing',
    path: '/billing',
    icon: Receipt,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'],
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'PHARMACIST', 'DOCTOR', 'RECEPTIONIST'],
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
                  ? 'bg-[#05775A] text-white shadow-xs translate-x-1 dark:bg-gradient-to-r dark:from-[#05775A] dark:via-[#078F6D] dark:to-[#05775A] dark:text-white dark:shadow-[0_0_20px_2px_rgba(5,119,90,0.45)]'
                  : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#05775A] hover:translate-x-1 dark:text-slate-300 dark:hover:bg-slate-900/90 dark:hover:text-[#2DD4BF]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white dark:bg-white rounded-r-full shadow-xs" />
                )}
                <div className="flex items-center space-x-3 z-10">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${
                      isActive ? 'scale-110 text-white dark:text-white' : 'group-hover:scale-110 group-hover:text-[#05775A]'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-mono border transition-colors z-10 ${
                      isActive
                        ? 'bg-black/10 text-white border-black/10 dark:bg-white/20 dark:text-white dark:border-white/20'
                        : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0] group-hover:border-[#05775A]/40 dark:bg-slate-900 dark:text-emerald-400/90 dark:border-slate-800'
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
    <div className="p-4 border-t border-[#E2E8F0] dark:border-slate-800/80 text-xs text-[#64748B] dark:text-slate-400 bg-[#F8FAFC] dark:bg-slate-900/30">
      <div className="font-bold text-[#334155] dark:text-slate-200 tracking-tight">Adyapan Healthcare SaaS</div>
      <div className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] mt-1 flex items-center gap-1.5 font-semibold">
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
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#070D18] text-[#334155] dark:text-slate-300 min-h-screen flex-col flex-shrink-0 border-r border-[#E2E8F0] dark:border-navy-800 relative select-none transition-colors duration-300">
        <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800/80 flex items-center justify-between bg-[#F8FAFC]/90 dark:bg-slate-900/40">
          <div className="flex items-center space-x-2.5">
            <AdyapanLogo size="xs" glow={false} />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-[#334155] dark:text-[#2DD4BF] font-mono leading-tight">
                ADYAPAN HUD
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-medium leading-none">
                Hospital Queue OS
              </span>
            </div>
          </div>
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
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white dark:bg-[#070D18] text-[#334155] dark:text-slate-300 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden border-r border-[#E2E8F0] dark:border-slate-800/80 select-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800/80 flex items-center justify-between bg-[#F8FAFC]/90 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <AdyapanLogo size="xs" glow={false} />
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-wider text-[#334155] dark:text-[#2DD4BF] font-mono leading-tight">
                ADYAPAN HUD
              </span>
              <span className="text-[10px] text-[#64748B] dark:text-slate-400 font-medium leading-none">
                Hospital Queue OS
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 text-[#64748B] hover:text-[#334155] dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-slate-800/80 transition-colors"
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
