import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  BarChart3,
  Calendar,
  Banknote,
  Stethoscope,
  Clock,
  Package,
  Users,
  RefreshCw,
  Filter,
} from 'lucide-react';

import FinancialReportTab from './FinancialReportTab';
import DoctorWorkloadTab from './DoctorWorkloadTab';
import QueueAnalyticsTab from './QueueAnalyticsTab';
import PharmacyReportTab from './PharmacyReportTab';
import DemographicsTab from './DemographicsTab';

export default function ReportsDashboard() {
  const { user } = useAuth();
  const currentRole = user?.role || 'GUEST';

  // Available tabs depending on role
  const getInitialTab = () => {
    if (['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'].includes(currentRole)) return 'financial';
    if (['DOCTOR'].includes(currentRole)) return 'doctorWorkload';
    if (['PHARMACIST'].includes(currentRole)) return 'pharmacy';
    if (['RECEPTIONIST', 'NURSE_ASSISTANT'].includes(currentRole)) return 'queue';
    return 'financial';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Date Range State (Defaults to first of current month through today)
  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = now.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [preset, setPreset] = useState('THIS_MONTH');

  // Report Data
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Apply Quick Preset
  const handlePresetChange = (p) => {
    setPreset(p);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (p === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (p === 'LAST_7_DAYS') {
      const past = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (p === 'THIS_MONTH') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (p === 'LAST_30_DAYS') {
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  // Fetch Report Data based on activeTab
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/reports/financial';
      if (activeTab === 'doctorWorkload') endpoint = '/reports/doctor-workload';
      else if (activeTab === 'queue') endpoint = '/reports/queue-analytics';
      else if (activeTab === 'pharmacy') endpoint = '/reports/pharmacy';
      else if (activeTab === 'demographics') endpoint = '/reports/patient-demographics';

      const res = await api.get(endpoint, {
        params: {
          startDate,
          endDate,
        },
      });

      const payload = res.data?.data !== undefined ? res.data.data : res.data;
      setReportData(payload);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Tab Definitions with RBAC
  const tabs = [
    {
      id: 'financial',
      label: 'Financial & Revenue',
      icon: Banknote,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT'],
    },
    {
      id: 'doctorWorkload',
      label: 'Doctor Workload',
      icon: Stethoscope,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'],
    },
    {
      id: 'queue',
      label: 'Queue Flow Analytics',
      icon: Clock,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE_ASSISTANT'],
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy & Dispense',
      icon: Package,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'],
    },
    {
      id: 'demographics',
      label: 'Patient Demographics',
      icon: Users,
      roles: ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'],
    },
  ];

  const visibleTabs = tabs.filter(
    (t) => currentRole === 'SUPER_ADMIN' || t.roles.includes(currentRole)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Reports & Hospital Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audited financial ledgers, clinical workload metrics, patient flow analytics, and CSV exports.
          </p>
        </div>

        <button
          onClick={fetchReport}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white self-start sm:self-auto"
          title="Refresh Report Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date Range Controller Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Presets */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'TODAY', label: 'Today' },
            { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
            { id: 'THIS_MONTH', label: 'This Month' },
            { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
            { id: 'CUSTOM', label: 'Custom' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handlePresetChange(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                preset === p.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date Inputs */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPreset('CUSTOM');
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <span className="text-slate-400 text-xs font-bold">to</span>
          <div className="relative flex-1 sm:flex-none">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPreset('CUSTOM');
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-1">
        {visibleTabs.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
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
          <span>Failed to load report: {error}</span>
          <button
            onClick={fetchReport}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg font-bold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div>
          {activeTab === 'financial' && <FinancialReportTab data={reportData} />}
          {activeTab === 'doctorWorkload' && <DoctorWorkloadTab data={reportData} />}
          {activeTab === 'queue' && <QueueAnalyticsTab data={reportData} />}
          {activeTab === 'pharmacy' && <PharmacyReportTab data={reportData} />}
          {activeTab === 'demographics' && <DemographicsTab data={reportData} />}
        </div>
      )}
    </div>
  );
}
