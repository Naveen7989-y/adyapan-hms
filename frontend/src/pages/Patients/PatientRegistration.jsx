import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, ArrowLeft, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import api from '../../services/api';

export const PatientRegistration = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'MALE',
    dateOfBirth: '',
    bloodGroup: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
  });

  const handleSubmit = async (e, forceDuplicate = false) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setError(null);
    setDuplicateWarning(null);

    try {
      const payload = {
        ...formData,
        confirmDuplicate: forceDuplicate,
      };
      const res = await api.post('/patients', payload);
      navigate(`/patients/${res.data.id}`);
    } catch (err) {
      if (err.status === 409 || err.duplicateFound) {
        setDuplicateWarning(err);
      } else {
        setError(err.message || 'Failed to register patient');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/patients"
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <UserPlus className="w-6 h-6 text-sky-600" />
            <span>New Patient Full Registration</span>
          </h2>
          <p className="text-sm text-slate-500">
            Generate an official UHID and establish a permanent clinical record.
          </p>
        </div>
      </div>

      {/* Duplicate Warning Dialog */}
      {duplicateWarning && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-6 text-amber-900 shadow-sm">
          <div className="flex items-start space-x-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="text-sm font-bold">Duplicate Phone Number Detected</h3>
                <p className="text-xs text-amber-800 mt-1">
                  The phone number <span className="font-mono font-bold">{formData.phone}</span> is already
                  registered to the following patient(s):
                </p>
              </div>

              <div className="bg-white/80 rounded-lg p-3 border border-amber-200 text-xs divide-y divide-amber-100">
                {duplicateWarning.existingPatients?.map((p) => (
                  <div key={p.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">{p.fullName}</span> ({p.gender})
                      <span className="font-mono text-sky-700 ml-2">UHID: {p.uhid}</span>
                    </div>
                    <Link
                      to={`/patients/${p.id}`}
                      className="text-sky-600 font-semibold hover:underline"
                    >
                      View Existing Profile →
                    </Link>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSubmit(null, true)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors"
                >
                  Create Separate Patient Record Anyway
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateWarning(null)}
                  className="px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Edit Information
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center space-x-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            1. Personal Demographics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Meera S. Iyer"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Blood Group
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Unknown / Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="patient@example.com"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Emergency */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            2. Contact & Emergency Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Primary Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Emergency Contact (Name & Phone)
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                placeholder="e.g. Suresh Iyer (Spouse) +91 9876543219"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Residential Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House / Apartment, Street, City, Pincode"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Basic Medical History */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            3. Basic Medical History & Known Allergies
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Chronic Conditions, Past Surgeries, or Allergies
            </label>
            <textarea
              rows={3}
              value={formData.medicalHistory}
              onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
              placeholder="e.g. Type 2 Diabetes (5 yrs), Allergic to Penicillin..."
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Link
            to="/patients"
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            {submitting ? 'Generating UHID...' : 'Complete Patient Registration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientRegistration;
