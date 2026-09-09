import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  UserPlus,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Phone,
  Calendar,
  Zap,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const PatientsList = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkInSubmitting, setWalkInSubmitting] = useState(false);
  const [walkInError, setWalkInError] = useState(null);

  // Walk-in form state
  const [walkInData, setWalkInData] = useState({
    fullName: '',
    phone: '',
    gender: 'MALE',
    age: '',
  });

  const canRegister = ['RECEPTIONIST', 'NURSE_ASSISTANT', 'HOSPITAL_ADMIN', 'SUPER_ADMIN'].includes(
    user?.role
  );

  const fetchPatients = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/patients', {
        params: { search, page, limit: 15 },
      });
      setPatients(res.data.patients || []);
      setPagination(res.data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPatients(1);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setWalkInSubmitting(true);
    setWalkInError(null);

    try {
      const res = await api.post('/patients/quick', walkInData);
      setShowWalkInModal(false);
      setWalkInData({ fullName: '', phone: '', gender: 'MALE', age: '' });
      fetchPatients(1);
      alert(`Patient Registered! UHID: ${res.data.patient.uhid}`);
    } catch (err) {
      setWalkInError(err.message || 'Walk-in registration failed');
    } finally {
      setWalkInSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="w-6 h-6 text-sky-600" />
            <span>Patient Registry & Directory</span>
          </h2>
          <p className="text-sm text-slate-500">
            Search registered patients by UHID, mobile number, or name.
          </p>
        </div>

        {canRegister && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowWalkInModal(true)}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all shadow-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Fast Walk-In</span>
            </button>

            <Link
              to="/patients/new"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Full Registration</span>
            </Link>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by UHID (e.g. ADY-202609-0001), Phone, or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>

        <button
          onClick={() => fetchPatients(pagination.page)}
          className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 self-end sm:self-auto"
          title="Refresh Patients"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
            <span className="text-sm font-medium">Searching patient records...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium">No patients found matching your search.</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
              >
                Clear search query
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">UHID</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Patient Name</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Gender / Age</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Contact Phone</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Registered On</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => {
                  let ageDisplay = '—';
                  if (p.dateOfBirth) {
                    const birthYear = new Date(p.dateOfBirth).getFullYear();
                    const currentYear = new Date().getFullYear();
                    ageDisplay = `${currentYear - birthYear} yrs`;
                  }
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2 py-1 rounded border border-sky-200">
                          {p.uhid}
                        </span>
                      </td>
                      <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{p.fullName}</div>
                        {p.bloodGroup && (
                          <span className="inline-block text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 rounded border border-rose-100">
                            {p.bloodGroup}
                          </span>
                        )}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-slate-600 text-xs whitespace-nowrap">
                        <span className="font-medium">{p.gender}</span> • {ageDisplay}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-slate-600 text-xs font-mono whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.phone}</span>
                        </div>
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-right whitespace-nowrap">
                        <Link
                          to={`/patients/${p.id}`}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1.5 rounded-lg transition-colors border border-sky-200"
                        >
                          <span>Profile & History</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs text-slate-500">
              Showing page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
              <span className="font-semibold text-slate-800">{pagination.totalPages}</span> ({pagination.total} total patients)
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchPatients(pagination.page - 1)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchPatients(pagination.page + 1)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fast Walk-In Modal */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-xl border border-slate-200">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Fast Walk-In Registration</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Rapid intake for urgent OPD arrivals. Generates an instant UHID.
            </p>

            {walkInError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{walkInError}</span>
              </div>
            )}

            <form onSubmit={handleWalkInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={walkInData.fullName}
                  onChange={(e) => setWalkInData({ ...walkInData, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={walkInData.phone}
                  onChange={(e) => setWalkInData({ ...walkInData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Gender *
                  </label>
                  <select
                    value={walkInData.gender}
                    onChange={(e) => setWalkInData({ ...walkInData, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={walkInData.age}
                    onChange={(e) => setWalkInData({ ...walkInData, age: e.target.value })}
                    placeholder="e.g. 32"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walkInSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {walkInSubmitting ? 'Registering...' : 'Register Walk-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsList;
