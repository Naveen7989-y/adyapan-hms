import React from 'react';
import { Users, UserPlus, Download, PieChart, Layers, Building2 } from 'lucide-react';
import { exportToCsv } from '../../utils/csvExport';

export default function DemographicsTab({ data }) {
  const summary = data?.summary || {};
  const gender = data?.genderBreakdown || {};
  const ageGroups = data?.ageGroups || {};
  const deptVisits = data?.departmentVisits || {};

  const totalPatients = summary.totalPatients || 0;

  const handleExport = () => {
    const rows = [
      { 'Metric Category': 'Gender', 'Group': 'Male', 'Count': gender.MALE || 0 },
      { 'Metric Category': 'Gender', 'Group': 'Female', 'Count': gender.FEMALE || 0 },
      { 'Metric Category': 'Gender', 'Group': 'Other', 'Count': gender.OTHER || 0 },
      ...Object.entries(ageGroups).map(([group, count]) => ({
        'Metric Category': 'Age Group',
        'Group': group,
        'Count': count,
      })),
      ...Object.entries(deptVisits).map(([dept, count]) => ({
        'Metric Category': 'Department Visits',
        'Group': dept,
        'Count': count,
      })),
    ];
    exportToCsv('Adyapan_Patient_Demographics_Report', rows);
  };

  return (
    <div className="space-y-6">
      {/* 2 Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Total Registered Patient Base
            </span>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1 block">
              {totalPatients}
            </span>
            <span className="text-[11px] text-slate-400">All active UHID records</span>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              New Registrations In Period
            </span>
            <span className="text-2xl font-extrabold text-emerald-600 tracking-tight mt-1 block">
              {summary.newRegistrationsInRange || 0}
            </span>
            <span className="text-[11px] text-slate-400">New patient intakes</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Gender & Age Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Gender Distribution
            </h3>
            <span className="text-xs font-bold text-slate-400">{totalPatients} total</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Male Patients</span>
                <span className="font-bold text-slate-900">
                  {gender.MALE || 0} ({totalPatients > 0 ? Math.round(((gender.MALE || 0) / totalPatients) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-brand-600 h-2.5 rounded-full"
                  style={{ width: `${totalPatients > 0 ? ((gender.MALE || 0) / totalPatients) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-pink-700">Female Patients</span>
                <span className="font-bold text-pink-900">
                  {gender.FEMALE || 0} ({totalPatients > 0 ? Math.round(((gender.FEMALE || 0) / totalPatients) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-pink-500 h-2.5 rounded-full"
                  style={{ width: `${totalPatients > 0 ? ((gender.FEMALE || 0) / totalPatients) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-purple-700">Other / Unspecified</span>
                <span className="font-bold text-purple-900">{gender.OTHER || 0}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-2.5 rounded-full"
                  style={{ width: `${totalPatients > 0 ? ((gender.OTHER || 0) / totalPatients) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Age Demographics */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Age Cohort Distribution
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(ageGroups).map(([group, count]) => (
              <div key={group} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[10px] uppercase font-bold truncate">
                  {group}
                </span>
                <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">{count}</span>
                <span className="text-[10px] text-slate-400">
                  {totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0}% of registry
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Visit Volumes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Department Visit Frequency</h3>
            <p className="text-[11px] text-slate-500">
              Distribution of patient consultations across clinical specialties
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {Object.keys(deptVisits).length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No appointment visits recorded in selected period.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(deptVisits).map(([dept, count]) => (
              <div
                key={dept}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-brand-100 text-brand-700 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{dept}</p>
                    <p className="text-[10px] text-slate-500">Clinical Department</p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-brand-700">{count} visits</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
