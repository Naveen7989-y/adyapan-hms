import React, { useState, useEffect } from 'react';
import {
  UserCog,
  Plus,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  RefreshCw,
  Stethoscope,
  Sparkles,
  Building2,
  Tag,
  Check,
} from 'lucide-react';
import api from '../services/api';

export const DOCTOR_SPECIALIZATION_CATEGORIES = [
  {
    id: 'Orthopedic',
    label: 'Orthopedic',
    subtitle: 'Joints & Bones',
    icon: '🦴',
    deptCode: 'ORTH',
    presets: [
      'Orthopedic Surgeon (MS Ortho)',
      'Senior Orthopedic Surgeon & Joint Replacement Specialist (MS Ortho)',
      'Spine Surgery & Spinal Deformity Specialist',
      'Sports Medicine & Arthroscopy Specialist',
      'Trauma, Fracture & Complex Reconstruction Surgeon',
    ],
  },
  {
    id: 'General Surgeon',
    label: 'General Surgeon',
    subtitle: 'General & Laparoscopic',
    icon: '🩺',
    deptCode: 'GEN',
    presets: [
      'Consultant General Surgeon (MS, FRCS)',
      'General & Laparoscopic Surgeon (MS Surgery)',
      'Trauma, Acute & Critical Care Surgeon',
      'Minimally Invasive & Gastrointestinal Surgeon',
      'Colorectal & Hernia Specialist Surgeon',
    ],
  },
  {
    id: 'Neurologist',
    label: 'Neurologist',
    subtitle: 'Brain & Spine',
    icon: '🧠',
    deptCode: 'NEU',
    presets: [
      'Senior Neurologist & Stroke Specialist (MD, DM Neurology)',
      'Epileptologist & Clinical Neurophysiologist',
      'Movement Disorders & Parkinson\'s Specialist',
      'Neuro-Immunology & Multiple Sclerosis Specialist',
      'Cognitive & Behavioral Neurologist',
    ],
  },
  {
    id: 'Cardio',
    label: 'Cardio',
    subtitle: 'Heart Care',
    icon: '❤️',
    deptCode: 'CARD',
    presets: [
      'Senior Interventional Cardiologist (MD, DM, FACC)',
      'Clinical & Non-Invasive Cardiologist',
      'Heart Failure & Transplant Cardiologist',
      'Cardiac Electrophysiologist & Arrhythmia Specialist',
      'Cardiothoracic & Vascular Surgeon (MCh)',
    ],
  },
  {
    id: 'Pediatrician',
    label: 'Pediatrician',
    subtitle: 'Child Health',
    icon: '👶',
    deptCode: 'PED',
    presets: [
      'Chief Pediatrician & Child Health Specialist (MD, DCH)',
      'Neonatologist & NICU Critical Care Specialist',
      'Pediatric Pulmonology & Asthma Specialist',
      'Pediatric Emergency & Critical Care Physician',
    ],
  },
  {
    id: 'Dental Care',
    label: 'Dental Care',
    subtitle: 'Dental & Oral',
    icon: '🦷',
    deptCode: 'DENT',
    presets: [
      'Dental Surgeon & Orthodontist (BDS, MDS Ortho)',
      'Endodontist & Root Canal Specialist (MDS)',
      'Periodontist & Dental Implantologist',
      'Oral & Maxillofacial Surgeon',
    ],
  },
  {
    id: 'General Physician',
    label: 'General Physician',
    subtitle: 'Internal Medicine',
    icon: '🏥',
    deptCode: 'GEN',
    presets: [
      'Consultant Physician (MBBS, MD Medicine)',
      'Internal Medicine & Critical Care Specialist',
      'Diabetologist & Metabolic Disorder Specialist',
      'Infectious Disease & Tropical Medicine Consultant',
    ],
  },
];

export const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Orthopedic');

  // New user form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'RECEPTIONIST',
    phone: '',
    specialization: 'Orthopedic Surgeon (MS Ortho)',
    departmentId: '',
    consultationFee: '500',
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      const res = await api.get('/users', { params });
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff users');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.warn('Could not load departments:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [roleFilter]);

  const handleRoleSelect = (newRole) => {
    if (newRole === 'DOCTOR') {
      const defaultCat = DOCTOR_SPECIALIZATION_CATEGORIES[0];
      const matchedDept =
        departments.find((d) => d.code === defaultCat.deptCode) ||
        departments.find((d) => d.name?.toLowerCase().includes('ortho')) ||
        departments[0];
      setFormData((prev) => ({
        ...prev,
        role: newRole,
        specialization: prev.specialization || defaultCat.presets[0],
        departmentId: prev.departmentId || (matchedDept ? matchedDept.id : ''),
        consultationFee: prev.consultationFee || '500',
      }));
    } else {
      setFormData((prev) => ({ ...prev, role: newRole }));
    }
  };

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat.id);
    const matchedDept =
      departments.find((d) => d.code === cat.deptCode) ||
      departments.find((d) => d.name?.toLowerCase().includes(cat.label.toLowerCase())) ||
      departments.find((d) => d.code === 'GEN') ||
      departments[0];
    setFormData((prev) => ({
      ...prev,
      specialization: cat.presets[0],
      departmentId: matchedDept ? matchedDept.id : prev.departmentId,
    }));
  };

  const handleSelectPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      specialization: preset,
    }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone.trim(),
      };

      if (formData.role === 'DOCTOR') {
        payload.specialization = (formData.specialization || 'Consultant Physician').trim();
        if (formData.departmentId) {
          payload.departmentId = formData.departmentId;
        }
        payload.consultationFee = parseFloat(formData.consultationFee) || 500;
      }

      await api.post('/users', payload);
      setShowAddModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'RECEPTIONIST',
        phone: '',
        specialization: 'Orthopedic Surgeon (MS Ortho)',
        departmentId: '',
        consultationFee: '500',
      });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/users/${user.id}/status`, { status: nextStatus });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      SUPER_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
      HOSPITAL_ADMIN: 'bg-sky-100 text-sky-800 border-sky-200',
      DOCTOR: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      RECEPTIONIST: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      PHARMACIST: 'bg-amber-100 text-amber-800 border-amber-200',
      ACCOUNTANT: 'bg-violet-100 text-violet-800 border-violet-200',
      NURSE_ASSISTANT: 'bg-teal-100 text-teal-800 border-teal-200',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-bold border uppercase tracking-wider ${
          styles[role] || 'bg-slate-100 text-slate-800'
        }`}
      >
        {role.replace('_', ' ')}
      </span>
    );
  };

  const activeCategory =
    DOCTOR_SPECIALIZATION_CATEGORIES.find((c) => c.id === selectedCategory) ||
    DOCTOR_SPECIALIZATION_CATEGORIES[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <UserCog className="w-6 h-6 text-sky-600" />
            <span>Hospital Staff & Role Management</span>
          </h2>
          <p className="text-sm text-slate-500">
            Create, assign clinical roles, and manage permissions for hospital staff.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            if (formData.role === 'DOCTOR' && !formData.departmentId && departments.length > 0) {
              const matched = departments.find((d) => d.code === 'ORTH') || departments[0];
              if (matched) setFormData((prev) => ({ ...prev, departmentId: matched.id }));
            }
          }}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Roles</option>
            <option value="HOSPITAL_ADMIN">Hospital Admin</option>
            <option value="RECEPTIONIST">Receptionist</option>
            <option value="DOCTOR">Doctor</option>
            <option value="NURSE_ASSISTANT">Nurse Assistant</option>
            <option value="PHARMACIST">Pharmacist</option>
            <option value="ACCOUNTANT">Accountant</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
            <span className="text-sm">Loading staff members...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 text-sm font-medium">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No staff accounts found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 whitespace-nowrap">
                <tr>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Staff Name & Specialization</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Email</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Assigned Role</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Contact</th>
                  <th className="px-5 sm:px-6 py-3.5 whitespace-nowrap">Status</th>
                  <th className="px-5 sm:px-6 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{u.name}</div>
                      {u.doctor ? (
                        <div className="flex items-center space-x-1.5 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-100">
                            <Stethoscope className="w-3 h-3 mr-1 text-sky-500" />
                            {u.doctor.specialization}
                          </span>
                          {u.doctor.department?.name && (
                            <span className="text-[11px] text-slate-500">
                              • {u.doctor.department.name}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-slate-600 font-mono text-xs whitespace-nowrap">{u.email}</td>
                    <td className="px-5 sm:px-6 py-4 whitespace-nowrap">{getRoleBadge(u.role)}</td>
                    <td className="px-5 sm:px-6 py-4 text-slate-600 text-xs whitespace-nowrap">{u.phone || '—'}</td>
                    <td className="px-5 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        <span>{u.status}</span>
                      </span>
                    </td>
                    <td className="px-5 sm:px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                          u.status === 'ACTIVE'
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Add Hospital Staff Account</h3>
                <p className="text-xs text-slate-500">
                  Provision clinical or administrative staff with instant credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={formData.role === 'DOCTOR' ? 'Dr. Vikram Sethi' : 'e.g. Anil Mehra'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Email Address (Login ID)
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="doctor@adyapan.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Staff Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleRoleSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold bg-white text-slate-800 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="DOCTOR">Doctor (Clinical Consultant)</option>
                    <option value="RECEPTIONIST">Receptionist</option>
                    <option value="NURSE_ASSISTANT">Nurse Assistant</option>
                    <option value="PHARMACIST">Pharmacist</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="HOSPITAL_ADMIN">Hospital Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Doctor Specialization & Clinical Profile Config */}
              {formData.role === 'DOCTOR' && (
                <div className="mt-4 p-4 rounded-xl bg-sky-50/60 border border-sky-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Stethoscope className="w-5 h-5 text-sky-600" />
                      <h4 className="text-sm font-bold text-slate-800">
                        Select Doctor Specialization Category
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                      Required for Doctor Role
                    </span>
                  </div>

                  {/* Category Selection Cards / Pills */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Specialization Domain (Click to select category):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DOCTOR_SPECIALIZATION_CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleSelectCategory(cat)}
                            className={`p-2.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? 'bg-white border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
                                : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-lg">{cat.icon}</span>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px]">
                                  ✓
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-800">{cat.label}</div>
                              <div className="text-[10px] text-slate-400">{cat.subtitle}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-Specialty Presets */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5 flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Recommended Presets for {activeCategory.label}:</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCategory.presets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            formData.specialization === preset
                              ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50 hover:border-sky-300'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Editable Specialization Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                      Clinical Specialization & Qualifications Title
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="e.g. Senior Orthopedic Surgeon (MS Ortho)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      This designation will appear on doctor queues, OPD consultation slips, and patient tokens.
                    </p>
                  </div>

                  {/* Department & Consultation Fee */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Assigned Department
                      </label>
                      <select
                        value={formData.departmentId}
                        onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      >
                        <option value="">Auto-Assign by Specialization</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                        Consultation Fee (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={formData.consultationFee}
                        onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                        placeholder="500"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-sky-800 bg-sky-100/70 p-2.5 rounded-lg border border-sky-200/60 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>
                      Adding this doctor automatically seeds a 7-day OPD operational schedule (08:00 – 20:00) so this doctor can immediately call patients and receive appointments.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm flex items-center space-x-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{submitting ? 'Creating...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersList;
