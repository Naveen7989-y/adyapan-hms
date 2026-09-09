import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Pill,
  PackageCheck,
  History,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  Printer,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  User,
  Stethoscope,
  Filter,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DispenseModal from './DispenseModal';
import PharmacyReceiptModal from './PharmacyReceiptModal';
import AddMedicineModal from './AddMedicineModal';
import AddBatchModal from './AddBatchModal';

export default function PharmacyDashboard() {
  const { user } = useAuth();

  // Active Tab: 'dispense' | 'inventory' | 'history' | 'alerts'
  const [tab, setTab] = useState('dispense');

  // Data States
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [dispenses, setDispenses] = useState([]);
  const [alerts, setAlerts] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');

  // Modals
  const [dispensePrescriptionId, setDispensePrescriptionId] = useState(null);
  const [receiptDispenseId, setReceiptDispenseId] = useState(null);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [selectedMedicineForBatch, setSelectedMedicineForBatch] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // 1. Fetch Pending Prescriptions
  const fetchPending = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy/pending-prescriptions', {
        params: { search: search.trim() || undefined },
      });
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : res.data?.prescriptions || [];
      setPendingPrescriptions(list);
    } catch (err) {
      console.error('Failed to load pending prescriptions:', err);
    }
  }, [search]);

  // 2. Fetch Medicines Inventory
  const fetchMedicines = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy/medicines', {
        params: {
          search: search.trim() || undefined,
          stockStatus: stockStatusFilter !== 'ALL' ? stockStatusFilter : undefined,
        },
      });
      const payload = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
      const medList = payload?.medicines || (Array.isArray(payload) ? payload : []);
      setMedicines(medList);
    } catch (err) {
      console.error('Failed to load inventory medicines:', err);
    }
  }, [search, stockStatusFilter]);

  // 3. Fetch Dispense History
  const fetchDispenses = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy/dispenses', {
        params: { search: search.trim() || undefined },
      });
      const payload = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
      const dispList = payload?.dispenses || (Array.isArray(payload) ? payload : []);
      setDispenses(dispList);
    } catch (err) {
      console.error('Failed to load dispense logs:', err);
    }
  }, [search]);

  // 4. Fetch Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy/alerts');
      const alertData = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);
      setAlerts(alertData || null);
    } catch (err) {
      console.error('Failed to load inventory alerts:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([fetchPending(), fetchMedicines(), fetchDispenses(), fetchAlerts()]);
    } catch (err) {
      setError('Failed to refresh pharmacy data');
    } finally {
      setLoading(false);
    }
  }, [fetchPending, fetchMedicines, fetchDispenses, fetchAlerts]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const canManageInventory = ['SUPER_ADMIN', 'HOSPITAL_ADMIN', 'PHARMACIST'].includes(user?.role);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Phase 12 — In-House Pharmacy Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pharmacy & Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            FEFO-driven drug dispensing, batch tracking, inventory audit alerts, and official medical cash memos.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshAll}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh
          </button>

          {canManageInventory && (
            <button
              onClick={() => setShowAddMedicine(true)}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              New Medicine
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 2. Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-blue-600 text-xs font-medium flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Pending Dispenses
          </div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{pendingPrescriptions.length}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-slate-600 text-xs font-medium flex items-center">
            <Pill className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Catalog Medicines
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{medicines.length}</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-amber-600 text-xs font-medium flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            Stock & Expiry Alerts
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {(alerts?.lowStockCount || 0) + (alerts?.outOfStockCount || 0) + (alerts?.expiredBatchesCount || 0)}
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-emerald-600 text-xs font-medium flex items-center">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Total Dispenses Logged
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{dispenses.length}</div>
        </div>
      </div>

      {/* 3. Main Workspace with Tab Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 border-b border-slate-200 bg-slate-50/50 gap-3">
          <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setTab('dispense')}
              className={`py-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
                tab === 'dispense'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>Dispense Desk</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-800 font-mono">
                {pendingPrescriptions.length}
              </span>
            </button>

            <button
              onClick={() => setTab('inventory')}
              className={`py-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
                tab === 'inventory'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Pill className="w-4 h-4" />
              <span>Inventory Catalog</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                {medicines.length}
              </span>
            </button>

            <button
              onClick={() => setTab('history')}
              className={`py-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
                tab === 'history'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Dispense History</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700 font-mono">
                {dispenses.length}
              </span>
            </button>

            <button
              onClick={() => setTab('alerts')}
              className={`py-3.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center space-x-2 whitespace-nowrap ${
                tab === 'alerts'
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Stock Alerts</span>
              {((alerts?.lowStockCount || 0) + (alerts?.outOfStockCount || 0)) > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                  {(alerts?.lowStockCount || 0) + (alerts?.outOfStockCount || 0)}
                </span>
              )}
            </button>
          </div>

          {/* Search bar inside tab ribbon */}
          <div className="relative w-full sm:w-64 pb-2 sm:pb-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Rx, drug, batch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* TAB 1: DISPENSE DESK */}
        {tab === 'dispense' && (
          <div>
            {pendingPrescriptions.length === 0 ? (
              <div className="p-16 text-center">
                <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-800">All prescriptions fulfilled!</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  No pending prescriptions in queue. When physicians finalize consultations, prescriptions appear here for FEFO dispensing.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50/75 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Rx Code</th>
                      <th className="py-3.5 px-4">Patient Information</th>
                      <th className="py-3.5 px-4">Prescribing Doctor</th>
                      <th className="py-3.5 px-4">Medications to Dispense</th>
                      <th className="py-3.5 px-4">Date Issued</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Desk Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingPrescriptions.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-700 text-xs">
                          {p.prescriptionCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{p.patient?.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            UHID: {p.patient?.uhid} | {p.patient?.phone}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{p.doctor?.user?.name}</div>
                          <div className="text-[11px] text-slate-400">{p.doctor?.department?.name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {p.items?.map((it) => (
                              <span
                                key={it.id}
                                className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                              >
                                {it.medicine?.name} ({it.quantityPrescribed - it.quantityDispensed} rem)
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold text-[10px]">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setDispensePrescriptionId(p.id)}
                            className="inline-flex items-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                          >
                            <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
                            Dispense Drugs
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY CATALOG */}
        {tab === 'inventory' && (
          <div>
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-semibold text-slate-600">Stock Status:</span>
                <select
                  value={stockStatusFilter}
                  onChange={(e) => setStockStatusFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                >
                  <option value="ALL">All Stocks</option>
                  <option value="IN_STOCK">In Stock</option>
                  <option value="LOW_STOCK">Low Stock</option>
                  <option value="OUT_OF_STOCK">Out of Stock</option>
                </select>
              </div>

              <span className="text-xs text-slate-400 font-mono">
                Showing {medicines.length} formulations
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Medicine Brand & Formulation</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Dosage Unit</th>
                    <th className="py-3 px-4 text-right">Available Stock</th>
                    <th className="py-3 px-4">Active Batches (FEFO)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Batch Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {medicines.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{m.name}</div>
                        {m.genericName && (
                          <div className="text-[11px] text-slate-400 italic">{m.genericName}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">
                        {m.category?.name || 'General'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{m.unit}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                        <span
                          className={
                            m.stockStatus === 'OUT_OF_STOCK'
                              ? 'text-red-600'
                              : m.stockStatus === 'LOW_STOCK'
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }
                        >
                          {m.availableStock}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {m.batches?.map((b) => (
                            <span
                              key={b.id}
                              className={`px-2 py-0.5 rounded font-mono text-[10px] border ${
                                new Date(b.expiryDate) < new Date()
                                  ? 'bg-red-50 text-red-600 border-red-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                              title={`Expires: ${new Date(b.expiryDate).toLocaleDateString()} | Qty: ${b.quantity}`}
                            >
                              {b.batchNumber} ({b.quantity}u)
                            </span>
                          ))}
                          {m.batches?.length === 0 && (
                            <span className="text-slate-400 text-[11px] italic">No batches yet</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            m.stockStatus === 'OUT_OF_STOCK'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : m.stockStatus === 'LOW_STOCK'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {m.stockStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {canManageInventory && (
                          <button
                            onClick={() => setSelectedMedicineForBatch(m)}
                            className="inline-flex items-center px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
                          >
                            <Plus className="w-3 h-3 mr-1 text-emerald-600" />
                            Add Batch
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DISPENSE HISTORY */}
        {tab === 'history' && (
          <div>
            {dispenses.length === 0 ? (
              <div className="p-16 text-center text-slate-400 text-xs">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                No medication dispenses logged yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Receipt ID</th>
                      <th className="py-3.5 px-4">Prescription</th>
                      <th className="py-3.5 px-4">Patient</th>
                      <th className="py-3.5 px-4">Pharmacist</th>
                      <th className="py-3.5 px-4">Items Dispensed</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4 text-right">Total Billed</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dispenses.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          DISP-{d.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                          {d.prescription?.prescriptionCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {d.prescription?.patient?.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {d.prescription?.patient?.uhid}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {d.pharmacist?.name || 'Staff Pharmacist'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800">{d.items?.length} items</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(d.createdAt).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                          ₹{d.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => setReceiptDispenseId(d.id)}
                            className="inline-flex items-center px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Print Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STOCK & EXPIRY ALERTS */}
        {tab === 'alerts' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Low Stock Card */}
              <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Low & Out-of-Stock Medicines</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-xs rounded-full font-mono">
                    {(alerts?.lowStockMedicines?.length || 0) + (alerts?.outOfStockMedicines?.length || 0)}
                  </span>
                </div>

                <div className="space-y-2">
                  {[...(alerts?.outOfStockMedicines || []), ...(alerts?.lowStockMedicines || [])].map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-[11px] text-slate-400">Min Alert: {m.minStockAlert} units</div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-mono font-bold ${
                            m.availableStock === 0 ? 'text-red-600' : 'text-amber-600'
                          }`}
                        >
                          {m.availableStock} in stock
                        </span>
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">{m.stockStatus}</div>
                      </div>
                    </div>
                  ))}

                  {alerts?.lowStockMedicines?.length === 0 && alerts?.outOfStockMedicines?.length === 0 && (
                    <div className="text-xs text-amber-800 text-center py-4 font-medium">
                      ✓ All medicines have healthy stock above minimum alert levels.
                    </div>
                  )}
                </div>
              </div>

              {/* Expiring Batches Card */}
              <div className="p-5 bg-red-50/50 rounded-2xl border border-red-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-red-800 font-bold text-sm">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Expired & Expiring Soon Batches</span>
                  </div>
                  <span className="px-2 py-0.5 bg-red-200 text-red-900 font-bold text-xs rounded-full font-mono">
                    {(alerts?.expiredBatches?.length || 0) + (alerts?.expiringSoonBatches?.length || 0)}
                  </span>
                </div>

                <div className="space-y-2">
                  {[...(alerts?.expiredBatches || []), ...(alerts?.expiringSoonBatches || [])].map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-white rounded-xl border border-red-200/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{b.medicine?.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          Batch: {b.batchNumber} • {b.quantity} units
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-red-600 font-bold">
                          Exp: {new Date(b.expiryDate).toLocaleDateString('en-GB')}
                        </div>
                        <span className="text-[10px] text-red-700 uppercase font-semibold">
                          {new Date(b.expiryDate) < new Date() ? 'EXPIRED' : 'EXPIRING SOON'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {alerts?.expiredBatches?.length === 0 && alerts?.expiringSoonBatches?.length === 0 && (
                    <div className="text-xs text-emerald-800 text-center py-4 font-medium">
                      ✓ No batches currently expired or expiring within 30 days.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Dispense Prescriptions */}
      {dispensePrescriptionId && (
        <DispenseModal
          prescriptionId={dispensePrescriptionId}
          onClose={() => setDispensePrescriptionId(null)}
          onSuccess={(dispenseResult) => {
            setDispensePrescriptionId(null);
            showToast(`Medications successfully dispensed! Billed ₹${dispenseResult.totalAmount.toFixed(2)}`);
            refreshAll();
            setReceiptDispenseId(dispenseResult.id);
          }}
        />
      )}

      {/* MODAL 2: Print Cash Memo Receipt */}
      {receiptDispenseId && (
        <PharmacyReceiptModal
          dispenseId={receiptDispenseId}
          onClose={() => setReceiptDispenseId(null)}
        />
      )}

      {/* MODAL 3: Add Medicine to Catalog */}
      {showAddMedicine && (
        <AddMedicineModal
          onClose={() => setShowAddMedicine(false)}
          onSuccess={() => {
            setShowAddMedicine(false);
            showToast('Medicine added to pharmacy catalog');
            refreshAll();
          }}
        />
      )}

      {/* MODAL 4: Add Batch */}
      {selectedMedicineForBatch && (
        <AddBatchModal
          medicine={selectedMedicineForBatch}
          onClose={() => setSelectedMedicineForBatch(null)}
          onSuccess={(newBatch) => {
            setSelectedMedicineForBatch(null);
            showToast(`Batch ${newBatch.batchNumber} added with ${newBatch.quantity} units`);
            refreshAll();
          }}
        />
      )}
    </div>
  );
}
