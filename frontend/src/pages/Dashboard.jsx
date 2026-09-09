import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Activity,
  RefreshCw,
  Clock,
  Building2,
  UserCheck,
  ShieldCheck,
  Layers,
  Sparkles,
} from 'lucide-react';

import AdminDashboardView from './Dashboard/AdminDashboardView';
import DoctorDashboardView from './Dashboard/DoctorDashboardView';
import ReceptionistDashboardView from './Dashboard/ReceptionistDashboardView';
import NurseDashboardView from './Dashboard/NurseDashboardView';
import PharmacistDashboardView from './Dashboard/PharmacistDashboardView';
import AccountantDashboardView from './Dashboard/AccountantDashboardView';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock tick every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard/stats');
      const payload = res.data?.data !== undefined ? res.data.data : res.data;
      setStats(payload);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const currentRole = user?.role || 'GUEST';

  const renderRoleDashboard = () => {
    switch (currentRole) {
      case 'SUPER_ADMIN':
      case 'HOSPITAL_ADMIN':
        return <AdminDashboardView stats={stats} />;
      case 'DOCTOR':
        return <DoctorDashboardView stats={stats} onRefresh={fetchStats} />;
      case 'RECEPTIONIST':
        return <ReceptionistDashboardView stats={stats} />;
      case 'NURSE_ASSISTANT':
        return <NurseDashboardView stats={stats} />;
      case 'PHARMACIST':
        return <PharmacistDashboardView stats={stats} />;
      case 'ACCOUNTANT':
        return <AccountantDashboardView stats={stats} />;
      default:
        return <AdminDashboardView stats={stats} />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Universal Operational Header */}
      <div className="bg-white/90 glass-panel rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-sm relative overflow-hidden">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Staff Member'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200 uppercase font-mono shadow-xs">
              {currentRole.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <span>Adyapan Central Hospital & Clinic</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Operational Engine Live
            </span>
          </p>
        </div>

        {/* Live Date, Time & Refresh */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div className="px-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-600 font-mono flex items-center space-x-2 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>

          <button
            onClick={fetchStats}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all hover:scale-105 active:scale-95 border border-slate-200 bg-white shadow-xs"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 bg-slate-100 rounded-2xl animate-pulse border border-slate-200"
              />
            ))}
          </div>
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse border border-slate-200" />
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between">
          <span>Failed to load live metrics: {error}</span>
          <button
            onClick={fetchStats}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
          >
            Retry
          </button>
        </div>
      ) : (
        /* Role View Component */
        renderRoleDashboard()
      )}

      {/* Hospital Journey Pipeline Ribbon */}
      <div className="bg-white/90 glass-panel rounded-2xl p-5 border border-slate-200/80 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-brand-600 animate-pulse" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Adyapan End-to-End Patient Journey Architecture
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">10 Connected Clinical Stages</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {[
            'Patient Registration',
            'Appointment Booking',
            'Reminders',
            'Check-In & Triage',
            'Digital Tokens',
            'Live Calling Queue',
            'Doctor Consultation',
            'Digital Prescription',
            'Pharmacy Dispense',
            'Billing & Cashier',
          ].map((stage, idx, arr) => (
            <React.Fragment key={stage}>
              <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-medium transition-all hover:scale-[1.03] hover:border-brand-400/50 hover:bg-brand-50/40 interactive-card cursor-default">
                {stage}
              </span>
              {idx < arr.length - 1 && (
                <span className="text-brand-400 font-bold text-xs">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
