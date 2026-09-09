import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  RefreshCw,
  Edit,
  Shield,
  Layers,
  Tag,
  UserPlus,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DoctorScheduleModal from './DoctorScheduleModal';

export const SPECIALIZATION_TAXONOMY = {
  'General Medicine': {
    category: 'Internal & General Medicine',
    presets: [
      'Senior Consultant Physician (MBBS, MD)',
      'Internal Medicine & Critical Care Specialist',
      'Diabetologist & Metabolic Disorder Specialist',
      'Infectious Disease & Tropical Medicine Consultant',
      'Geriatric Medicine & Chronic Care Specialist',
      'Preventive & Lifestyle Medicine Physician',
    ],
  },
  'Cardiology': {
    category: 'Cardiovascular Sciences',
    presets: [
      'Senior Interventional Cardiologist (MD, DM, FACC)',
      'Clinical & Non-Invasive Cardiologist',
      'Cardiac Electrophysiologist & Arrhythmia Specialist',
      'Heart Failure & Transplant Cardiologist',
      'Pediatric & Congenital Heart Disease Specialist',
      'Cardiothoracic & Vascular Surgeon (MCh)',
    ],
  },
  'Pediatrics': {
    category: 'Pediatrics & Child Health',
    presets: [
      'Chief Pediatrician & Child Health Specialist (MD, DCH)',
      'Neonatologist & NICU Critical Care Specialist',
      'Pediatric Pulmonology & Asthma Specialist',
      'Pediatric Neurologist & Developmental Specialist',
      'Pediatric Gastroenterologist & Nutritionist',
      'Pediatric Emergency & Critical Care Physician',
    ],
  },
  'Orthopedics': {
    category: 'Orthopedics & Joint Surgery',
    presets: [
      'Senior Orthopedic Surgeon & Joint Replacement Specialist (MS Ortho)',
      'Spine Surgery & Spinal Deformity Specialist',
      'Sports Medicine & Arthroscopy Specialist',
      'Trauma, Fracture & Complex Reconstruction Surgeon',
      'Pediatric Orthopedic Surgeon',
      'Hand & Microvascular Reconstructive Surgeon',
    ],
  },
  'Dental Care': {
    category: 'Dental & Oral Maxillofacial Surgery',
    presets: [
      'Dental Surgeon & Orthodontist (BDS, MDS Ortho)',
      'Endodontist & Root Canal Specialist (MDS)',
      'Periodontist & Dental Implantologist',
      'Oral & Maxillofacial Surgeon',
      'Prosthodontist & Cosmetic Restorative Dentist',
      'Pediatric Dentist (Pedodontist)',
    ],
  },
  'Neurology': {
    category: 'Neurology & Brain Sciences',
    presets: [
      'Senior Neurologist & Stroke Specialist (MD, DM Neurology)',
      'Epileptologist & Clinical Neurophysiologist',
      'Movement Disorders & Parkinson\'s Specialist',
      'Neuro-Immunology & Multiple Sclerosis Specialist',
      'Cognitive & Behavioral Neurologist',
      'Interventional Neuro-Radiologist',
    ],
  },
  'ENT': {
    category: 'ENT & Head-Neck Surgery',
    presets: [
      'Senior ENT & Head-Neck Surgeon (MS ENT)',
      'Endoscopic Sinus & Skull Base Surgeon',
      'Otologist & Cochlear Implant Surgeon',
      'Voice & Laryngology Specialist',
      'Pediatric Otolaryngologist',
    ],
  },
  'Dermatology': {
    category: 'Dermatology & Cosmetology',
    presets: [
      'Consultant Dermatologist & Venereologist (MD)',
      'Cosmetic Dermatologist & Laser Surgeon',
      'Trichologist & Hair Restoration Specialist',
      'Pediatric Dermatologist',
      'Dermatosurgeon & Skin Oncologist',
    ],
  },
  'Gynecology': {
    category: 'Obstetrics & Gynecology',
    presets: [
      'Consultant Obstetrician & Gynecologist (MS, DGO)',
      'High-Risk Pregnancy & Maternal-Fetal Specialist',
      'Infertility & Reproductive Medicine Specialist (IVF)',
      'Laparoscopic & Robotic Gynecological Surgeon',
      'Gynecological Oncologist',
    ],
  },
  'Ophthalmology': {
    category: 'Ophthalmology & Vision Care',
    presets: [
      'Consultant Eye Surgeon & Phaco Specialist (MS Opht)',
      'Vitreo-Retinal Surgeon & Retinal Specialist',
      'Cornea, Cataract & Refractive (LASIK) Surgeon',
      'Glaucoma Specialist',
      'Pediatric Ophthalmologist & Strabismus Surgeon',
    ],
  },
  'General': {
    category: 'General Clinical Specialties',
    presets: [
      'General Practitioner (MBBS)',
      'Emergency Medicine Specialist (MD)',
      'General & Laparoscopic Surgeon (MS)',
      'Anesthesiologist & Pain Management Specialist',
      'Clinical Pathologist & Laboratory Director',
    ],
  },
};

export const getDepartmentTaxonomy = (deptNameOrCode) => {
  if (!deptNameOrCode) return SPECIALIZATION_TAXONOMY['General'];
  const name = deptNameOrCode.toUpperCase();
  for (const [key, val] of Object.entries(SPECIALIZATION_TAXONOMY)) {
    if (name.includes(key.toUpperCase())) return val;
  }
  return SPECIALIZATION_TAXONOMY['General'];
};

export const DoctorsList = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [usersWithoutDocProfile, setUsersWithoutDocProfile] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctorForSchedule, setSelectedDoctorForSchedule] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Account creation mode: 'new' (direct user + doctor) or 'link' (link existing staff user)
  const [accountMode, setAccountMode] = useState('new');

  const [formData, setFormData] = useState({
    // New Doctor Account fields:
    name: '',
    email: '',
    password: 'Password123!',
    phone: '',
    // Existing link field:
    userId: '',
    departmentId: '',
    specialization: '',
    consultationFee: '500',
    status: 'AVAILABLE',
  });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HOSPITAL_ADMIN';

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedDept) params.departmentId = selectedDept;

      const [docRes, deptRes] = await Promise.all([
        api.get('/doctors', { params }),
        api.get('/departments', { params: { isActive: true } }),
      ]);
      const docs = docRes.data?.data?.doctors || docRes.data?.doctors || docRes.data?.data || docRes.data || [];
      const depts = deptRes.data?.data || deptRes.data || [];
      setDoctors(docs);
      setDepartments(depts);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [search, selectedDept]);

  const loadUnlinkedDoctors = async () => {
    if (!isAdmin) return;
    try {
      const res = await api.get('/users', { params: { role: 'DOCTOR' } });
      const users = res.data?.data || res.data || [];
      const unlinked = users.filter((u) => !u.doctor);
      setUsersWithoutDocProfile(unlinked);
      if (unlinked.length > 0 && !formData.userId) {
        setFormData((prev) => ({ ...prev, userId: unlinked[0].id }));
      }
    } catch (err) {
      console.error('Failed to fetch unlinked doctor accounts:', err);
    }
  };

  const handleOpenAddModal = () => {
    loadUnlinkedDoctors();
    const initialDept = departments[0]?.id || '';
    const initialDeptObj = departments[0];
    const taxonomy = getDepartmentTaxonomy(initialDeptObj?.name || initialDeptObj?.code);

    setFormData({
      name: '',
      email: '',
      password: 'Password123!',
      phone: '',
      userId: usersWithoutDocProfile[0]?.id || '',
      departmentId: initialDept,
      specialization: taxonomy?.presets[0] || '',
      consultationFee: '500',
      status: 'AVAILABLE',
    });
    setAccountMode(usersWithoutDocProfile.length > 0 ? 'link' : 'new');
    setShowAddModal(true);
  };

  const handleDepartmentChange = (deptId) => {
    const deptObj = departments.find((d) => d.id === deptId);
    const taxonomy = getDepartmentTaxonomy(deptObj?.name || deptObj?.code);
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      specialization: taxonomy?.presets[0] || prev.specialization,
    }));
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        departmentId: formData.departmentId,
        specialization: formData.specialization,
        consultationFee: formData.consultationFee,
        status: formData.status,
      };

      if (accountMode === 'new') {
        payload.name = formData.name;
        payload.email = formData.email;
        payload.password = formData.password;
        payload.phone = formData.phone;
      } else {
        payload.userId = formData.userId;
      }

      await api.post('/doctors', payload);
      setShowAddModal(false);
      fetchDoctors();
    } catch (err) {
      alert(err.message || 'Failed to create doctor profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (doctor, newStatus) => {
    try {
      await api.patch(`/doctors/${doctor.id}/status`, { status: newStatus });
      fetchDoctors();
    } catch (err) {
      alert(err.message || 'Failed to update availability status');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'BUSY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ON_LEAVE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'OFFLINE':
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const currentDeptObj = departments.find((d) => d.id === formData.departmentId);
  const currentTaxonomy = getDepartmentTaxonomy(currentDeptObj?.name || currentDeptObj?.code);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Stethoscope className="w-6 h-6 text-brand-600" />
            <span>Doctors & Clinical Schedules</span>
          </h2>
          <p className="text-sm text-slate-500">
            Consultant profiles, medical specialization categories, and live OPD slot configurations.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-amber-600 hover:from-brand-700 hover:to-amber-700 text-white font-bold text-xs shadow-gold-glow transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Doctor Profile</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by doctor name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          <button
            onClick={fetchDoctors}
            className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
            title="Refresh Doctors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
          <span className="text-sm font-medium">Loading clinical physicians...</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
          <Stethoscope className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-medium">No doctors found matching filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {doctors.map((doc) => {
            const hasAccess = canEditDoctor(doc);
            const deptTaxonomy = getDepartmentTaxonomy(doc.department?.name || doc.department?.code);
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-200">
                        {doc.department?.name}
                      </span>
                      {deptTaxonomy && (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {deptTaxonomy.category}
                        </span>
                      )}
                    </div>

                    {/* Availability Selector or Badge */}
                    {hasAccess ? (
                      <select
                        value={doc.status}
                        onChange={(e) => handleStatusChange(doc, e.target.value)}
                        className={`text-xs font-bold px-2 py-0.5 rounded border cursor-pointer focus:outline-none ${getStatusBadge(
                          doc.status
                        )}`}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="BUSY">BUSY</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                        <option value="OFFLINE">OFFLINE</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusBadge(
                          doc.status
                        )}`}
                      >
                        {doc.status}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-1">{doc.user?.name}</h3>
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-brand-600 mt-0.5">
                    <Tag className="w-3 h-3 flex-shrink-0" />
                    <p className="truncate">{doc.specialization}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{doc.user?.email}</p>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                        Consultation Fee
                      </span>
                      <span className="font-extrabold text-slate-900">₹{(doc.consultationFee || 0).toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">
                        Active OPD Shifts
                      </span>
                      <span className="font-extrabold text-brand-700">
                        {doc.schedules?.length || 0} Days / Wk
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {doc.schedules?.length > 0 ? (
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        OPD Live
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">○ No Schedule Set</span>
                    )}
                  </div>

                  {hasAccess && (
                    <button
                      onClick={() => setSelectedDoctorForSchedule(doc)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold transition-colors border border-brand-200"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Configure Schedule</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Configuration Modal */}
      {selectedDoctorForSchedule && (
        <DoctorScheduleModal
          doctor={selectedDoctorForSchedule}
          onClose={() => setSelectedDoctorForSchedule(null)}
          onUpdated={fetchDoctors}
        />
      )}

      {/* Enhanced Add Doctor Modal with Specialization Category */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-brand-200/80 my-8">
            <div className="flex items-center space-x-2 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
              <Stethoscope className="w-4 h-4" />
              <span>Doctor Onboarding</span>
            </div>
            <h3 className="text-xl font-black text-navy-900 mb-1">
              Add Doctor Clinical Profile
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Select medical department, choose a specialized category preset, and configure consultation details.
            </p>

            {/* Account Mode Toggle: Create New vs Link Existing */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAccountMode('new')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  accountMode === 'new'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-brand-600" />
                <span>Create New Doctor</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountMode('link')}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
                  accountMode === 'link'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>Link Existing User ({usersWithoutDocProfile.length})</span>
              </button>
            </div>

            <form onSubmit={handleCreateDoctor} className="space-y-4">
              {/* MODE 1: Create New Doctor Account */}
              {accountMode === 'new' && (
                <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold block">
                    Doctor Account Credentials
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Dr. Ananya Sen"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="doctor.sen@adyapan.com"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Password123!"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 9900000020"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 2: Link Existing Unlinked DOCTOR User */}
              {accountMode === 'link' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Select Unlinked Doctor Account *
                  </label>
                  {usersWithoutDocProfile.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      No unlinked user accounts found. Switch to "Create New Doctor" above to register a new account on the fly.
                    </div>
                  ) : (
                    <select
                      required
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      {usersWithoutDocProfile.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Department Selection */}
              <div>
                <label className="block text-xs font-bold text-navy-900 uppercase tracking-wider mb-1">
                  Department / Clinical Division *
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-xs text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialization Category & Presets */}
              <div className="space-y-2.5 bg-gradient-to-br from-amber-50/50 via-slate-50 to-brand-50/30 p-4 rounded-2xl border border-brand-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span>Specialization Category</span>
                  </label>
                  {currentTaxonomy && (
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {currentTaxonomy.category}
                    </span>
                  )}
                </div>

                {/* Sub-Specialization Quick Presets */}
                <div>
                  <div className="text-[11px] text-slate-500 font-medium mb-1.5">
                    Quick-select from categorized specializations:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {currentTaxonomy?.presets.map((preset) => {
                      const isSelected = formData.specialization === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, specialization: preset }))}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all text-left truncate max-w-full ${
                            isSelected
                              ? 'bg-amber-500 border-amber-600 text-white font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Editable Specialization Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 mt-2">
                    Specialization Title & Qualifications *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Senior Consultant Physician (MBBS, MD)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-navy-900 bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    You can pick a preset above or type custom credentials (e.g. MBBS, MD, DM, FRCP).
                  </p>
                </div>
              </div>

              {/* Consultation Fee & Initial Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Consultation Fee (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="50"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="ON_LEAVE">ON LEAVE</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 font-medium flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>
                  Automatic 7-day OPD schedule (08:00 - 20:00) will be configured immediately for queue calling and appointment booking.
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || (accountMode === 'link' && usersWithoutDocProfile.length === 0)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold shadow-gold-glow disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                >
                  {submitting ? 'Creating Profile...' : 'Save Doctor Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
