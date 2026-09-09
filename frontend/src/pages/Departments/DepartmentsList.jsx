import React, { useState, useEffect } from 'react';
import { Layers, Plus, Search, CheckCircle, XCircle, RefreshCw, Stethoscope } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const DepartmentsList = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN';

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments', { params: { search } });
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/departments', formData);
      setShowAddModal(false);
      setFormData({ name: '', code: '', description: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    try {
      await api.patch(`/departments/${dept.id}/status`, { isActive: !dept.isActive });
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Layers className="w-6 h-6 text-sky-600" />
            <span>Clinical Departments</span>
          </h2>
          <p className="text-sm text-slate-500">
            Medical specializations, OPD clinic units, and assigned physician teams.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search departments by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <button
          onClick={fetchDepartments}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
          title="Refresh Departments"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Grid of Department Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
          <span className="text-sm font-medium">Loading clinical departments...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-sky-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded border border-sky-200">
                    {dept.code}
                  </span>
                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold ${
                      dept.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {dept.isActive ? (
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{dept.isActive ? 'Active' : 'Inactive'}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-1">{dept.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed min-h-[36px]">
                  {dept.description || 'General outpatient and consultation services.'}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-slate-600 font-medium">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  <span>{dept._count?.doctors || 0} Physicians</span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleToggleStatus(dept)}
                    className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                      dept.isActive
                        ? 'text-rose-600 hover:bg-rose-50'
                        : 'text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {dept.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Add Medical Department</h3>
            <p className="text-xs text-slate-500 mb-4">Create a clinical OPD specialty unit.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dermatology & Skin Care"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Department Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. DERM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Clinical scope, diagnostic capabilities..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentsList;
