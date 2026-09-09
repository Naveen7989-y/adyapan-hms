import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  FileText,
  Receipt,
  HeartPulse,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  Edit,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const PatientDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [updating, setUpdating] = useState(false);

  const fetchPatient = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/patients/${id}`);
      setPatient(res.data);
      setEditData({
        fullName: res.data.fullName,
        phone: res.data.phone,
        email: res.data.email || '',
        bloodGroup: res.data.bloodGroup || '',
        address: res.data.address || '',
        emergencyContact: res.data.emergencyContact || '',
        medicalHistory: res.data.medicalHistory || '',
      });
    } catch (err) {
      console.error('Failed to load patient:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put(`/patients/${id}`, editData);
      setShowEditModal(false);
      fetchPatient();
    } catch (err) {
      alert(err.message || 'Failed to update patient profile');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-600 mb-3" />
        <p className="text-sm font-semibold">Loading Patient Medical Record...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-16 text-center text-slate-500">
        <p className="text-base font-bold text-slate-700">Patient not found</p>
        <Link to="/patients" className="mt-3 inline-block text-xs font-semibold text-sky-600">
          ← Back to Patient Directory
        </Link>
      </div>
    );
  }

  let ageDisplay = '—';
  if (patient.dateOfBirth) {
    const birthYear = new Date(patient.dateOfBirth).getFullYear();
    const currentYear = new Date().getFullYear();
    ageDisplay = `${currentYear - birthYear} Years`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/patients"
          className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {patient.fullName}
              </h2>
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
                UHID: {patient.uhid}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered on {new Date(patient.createdAt).toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
          >
            <Edit className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Patient Key Bio Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Gender / Age
          </span>
          <span className="text-sm font-semibold text-slate-800 mt-1 block">
            {patient.gender} • {ageDisplay}
          </span>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Blood Group
          </span>
          <span className="text-sm font-bold text-rose-700 mt-1 block">
            {patient.bloodGroup || 'Not Recorded'}
          </span>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Contact Number
          </span>
          <span className="text-sm font-semibold text-slate-800 mt-1 block font-mono">
            {patient.phone}
          </span>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Emergency Contact
          </span>
          <span className="text-sm font-medium text-slate-700 mt-1 block">
            {patient.emergencyContact || '—'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 text-sm font-semibold">
          {[
            { id: 'overview', label: 'Clinical Overview', icon: HeartPulse },
            { id: 'appointments', label: `Appointments (${patient.appointments?.length || 0})`, icon: Calendar },
            { id: 'tokens', label: `Visits & Tokens (${patient.tokens?.length || 0})`, icon: Clock },
            { id: 'prescriptions', label: `Prescriptions (${patient.prescriptions?.length || 0})`, icon: FileText },
            { id: 'invoices', label: `Billing Invoices (${patient.invoices?.length || 0})`, icon: Receipt },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-sky-600 text-sky-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[300px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Medical History & Chronic Conditions
              </h4>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-700 leading-relaxed">
                {patient.medicalHistory || 'No historical medical allergies or conditions logged.'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500 uppercase block mb-1">Residential Address</span>
                <span className="text-slate-700 text-sm">{patient.address || 'No address recorded.'}</span>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500 uppercase block mb-1">Email Address</span>
                <span className="text-slate-700 text-sm font-mono">{patient.email || '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div>
            {patient.appointments?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No past or upcoming appointments recorded for this patient.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {patient.appointments.map((apt) => (
                  <div key={apt.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">
                        {apt.doctor?.user?.name} ({apt.department?.name})
                      </div>
                      <div className="text-xs text-slate-500">
                        Date: {new Date(apt.appointmentDate).toLocaleDateString()} at {apt.timeSlot}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tokens & Queue Tab */}
        {activeTab === 'tokens' && (
          <div>
            {patient.tokens?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No token queue visits recorded.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {patient.tokens.map((tok) => (
                  <div key={tok.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">
                        Token #{tok.tokenNumber} ({tok.tokenType})
                      </div>
                      <div className="text-xs text-slate-500">
                        {tok.doctor?.user?.name} • {new Date(tok.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {tok.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div>
            {patient.prescriptions?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No digital prescriptions issued yet.
              </div>
            ) : (
              <div className="space-y-4">
                {patient.prescriptions.map((rx) => (
                  <div key={rx.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-sky-700">
                        Rx Code: {rx.prescriptionCode}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(rx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-600 mb-3">
                      Prescribed by {rx.doctor?.user?.name}
                    </div>

                    <div className="space-y-1.5 border-t border-slate-200 pt-2">
                      {rx.items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">{item.medicine?.name}</span>
                          <span className="text-slate-500">
                            {item.dosage} • {item.frequency} ({item.duration})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'invoices' && (
          <div>
            {patient.invoices?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No invoices generated yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {patient.invoices.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 text-sm font-mono">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        Total: ₹{inv.totalAmount.toFixed(2)} • Paid: ₹{inv.paidAmount.toFixed(2)}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {inv.paymentStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Edit Patient Profile</h3>
            <p className="text-xs text-slate-500 mb-4">Update contact and medical records.</p>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  value={editData.fullName}
                  onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Blood Group
                  </label>
                  <input
                    type="text"
                    value={editData.bloodGroup}
                    onChange={(e) => setEditData({ ...editData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={editData.emergencyContact}
                  onChange={(e) => setEditData({ ...editData, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Medical History & Allergies
                </label>
                <textarea
                  rows={3}
                  value={editData.medicalHistory}
                  onChange={(e) => setEditData({ ...editData, medicalHistory: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetail;
