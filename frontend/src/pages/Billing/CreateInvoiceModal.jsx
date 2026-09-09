import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Receipt,
  User,
  Search,
  Sparkles,
  CreditCard,
  Banknote,
  Smartphone,
  Globe,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  Calendar,
  Pill,
  Stethoscope,
  ChevronDown,
  Building2,
  Tag,
} from 'lucide-react';
import api from '../../services/api';

export default function CreateInvoiceModal({ onClose, onSuccess, initialPatientId }) {
  // 1. Patients State
  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  // 2. Doctors State & Attending Doctor
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // 3. Pharmacy Medicines Catalog
  const [medicinesList, setMedicinesList] = useState([]);
  const [loadingMedicines, setLoadingMedicines] = useState(false);
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [medicineSearchQuery, setMedicineSearchQuery] = useState('');

  // 4. Encounter Preview State
  const [encounterLoading, setEncounterLoading] = useState(false);
  const [encounterPreview, setEncounterPreview] = useState(null);

  // 5. Fee Breakdown Inputs
  const [consultationFee, setConsultationFee] = useState('0');
  const [pharmacyFee, setPharmacyFee] = useState('0');
  const [otherCharges, setOtherCharges] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');

  // 6. Custom Line Items
  const [items, setItems] = useState([]);

  // 7. Immediate Payment Desk
  const [collectNow, setCollectNow] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initial Load: Fetch Doctors and Pharmacy Medicines Catalog
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const res = await api.get('/doctors');
        const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setDoctors(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load doctors list:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };

    const fetchMedicines = async () => {
      setLoadingMedicines(true);
      try {
        const res = await api.get('/pharmacy/medicines', { params: { limit: 100 } });
        const payload = res.data?.data !== undefined ? res.data.data : res.data;
        const list = payload?.medicines || (Array.isArray(payload) ? payload : []);
        setMedicinesList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load pharmacy medicines catalog:', err);
      } finally {
        setLoadingMedicines(false);
      }
    };

    fetchDoctors();
    fetchMedicines();
  }, []);

  // Search patients or preload recent on empty query
  useEffect(() => {
    const timer = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await api.get('/patients', {
          params: {
            search: patientSearch.trim() || undefined,
            limit: 10,
          },
        });
        const payload = res.data?.data !== undefined ? res.data.data : res.data;
        const list = payload?.patients || (Array.isArray(payload) ? payload : (res.data?.patients || []));
        setPatients(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to search patients', err);
      } finally {
        setSearchingPatients(false);
      }
    }, patientSearch.trim() ? 300 : 0);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  // If initialPatientId passed, fetch patient and auto-fill encounter
  useEffect(() => {
    if (initialPatientId) {
      const fetchInitial = async () => {
        try {
          const res = await api.get(`/patients/${initialPatientId}`);
          const p = res.data?.patient || res.data?.data || res.data;
          if (p) {
            setSelectedPatient(p);
            handleFetchEncounter(p.id);
          }
        } catch (err) {
          console.error('Failed to load initial patient', err);
        }
      };
      fetchInitial();
    }
  }, [initialPatientId]);

  // Fetch Encounter Preview (Doctor fee + Pharmacy fee + suggested line items)
  const handleFetchEncounter = async (patientId) => {
    if (!patientId) return;
    setEncounterLoading(true);
    setError('');
    try {
      const res = await api.get('/billing/encounter-preview', {
        params: { patientId },
      });
      const data = res.data?.data || res.data;
      setEncounterPreview(data);

      if (data) {
        const cFee = data.consultationFee || 0;
        const pFee = data.pharmacyFee || 0;
        setConsultationFee(cFee.toString());
        setPharmacyFee(pFee.toString());

        if (data.doctorId) {
          setSelectedDoctorId(data.doctorId);
        }

        if (data.suggestedItems && data.suggestedItems.length > 0) {
          // Tag items to maintain bi-directional sync
          const tagged = data.suggestedItems.map((item, idx) => {
            const isDoc = item.description?.toLowerCase().includes('consultation');
            const isMed = !isDoc;
            return {
              id: `suggested-${idx}-${Date.now()}`,
              ...item,
              isDoctorFee: isDoc,
              isMedicine: isMed,
            };
          });
          setItems(tagged);
        } else if (cFee > 0) {
          setItems([
            {
              id: `doc-${Date.now()}`,
              description: `Doctor Consultation Fee${data.doctorName ? ` (${data.doctorName})` : ''}`,
              quantity: 1,
              unitPrice: cFee,
              totalPrice: cFee,
              isDoctorFee: true,
            },
          ]);
        }
      }
    } catch (err) {
      console.error('Encounter preview error:', err);
    } finally {
      setEncounterLoading(false);
    }
  };

  // Handle Attending Doctor Change (Auto-updates Doctor Consultation Fee & Line Item)
  const handleDoctorChange = (doctorId) => {
    setSelectedDoctorId(doctorId);
    if (!doctorId) {
      // Clear doctor consultation fee
      setConsultationFee('0');
      setItems((prev) => prev.filter((it) => !it.isDoctorFee));
      return;
    }

    const doc = doctors.find((d) => d.id === doctorId);
    if (doc) {
      const fee = doc.consultationFee > 0 ? doc.consultationFee : 500;
      const feeStr = fee.toString();
      setConsultationFee(feeStr);

      const docName = doc.user?.name || 'Attending Doctor';
      const docDept = doc.department?.name ? ` - ${doc.department.name}` : '';
      const itemDesc = `Doctor Consultation Fee (${docName}${docDept})`;

      setItems((prev) => {
        const docItemIndex = prev.findIndex((it) => it.isDoctorFee || it.description.toLowerCase().includes('consultation'));
        if (docItemIndex >= 0) {
          const updated = [...prev];
          updated[docItemIndex] = {
            ...updated[docItemIndex],
            description: itemDesc,
            unitPrice: fee,
            totalPrice: fee * (updated[docItemIndex].quantity || 1),
            isDoctorFee: true,
          };
          return updated;
        } else {
          return [
            {
              id: `doc-${Date.now()}`,
              description: itemDesc,
              quantity: 1,
              unitPrice: fee,
              totalPrice: fee,
              isDoctorFee: true,
            },
            ...prev,
          ];
        }
      });
    }
  };

  // Handle Manual Doctor Fee Input Change (Syncs to Consultation Line Item)
  const handleConsultationFeeChange = (value) => {
    setConsultationFee(value);
    const num = Math.max(0, parseFloat(value) || 0);

    setItems((prev) => {
      const docIndex = prev.findIndex((it) => it.isDoctorFee || it.description.toLowerCase().includes('consultation'));
      if (docIndex >= 0) {
        if (num === 0 && !value) {
          return prev.filter((_, i) => i !== docIndex);
        }
        const updated = [...prev];
        const qty = updated[docIndex].quantity || 1;
        updated[docIndex] = {
          ...updated[docIndex],
          unitPrice: num,
          totalPrice: num * qty,
          isDoctorFee: true,
        };
        return updated;
      } else if (num > 0) {
        const selectedDoc = doctors.find((d) => d.id === selectedDoctorId);
        const docDesc = selectedDoc ? ` (${selectedDoc.user?.name})` : '';
        return [
          {
            id: `doc-${Date.now()}`,
            description: `Doctor Consultation Fee${docDesc}`,
            quantity: 1,
            unitPrice: num,
            totalPrice: num,
            isDoctorFee: true,
          },
          ...prev,
        ];
      }
      return prev;
    });
  };

  // Handle Manual Pharmacy Fee Input Change
  const handlePharmacyFeeChange = (value) => {
    setPharmacyFee(value);
    const num = Math.max(0, parseFloat(value) || 0);

    // If there are no itemized medicine lines, add or update a general pharmacy charge line
    setItems((prev) => {
      const medLines = prev.filter((it) => it.isMedicine);
      if (medLines.length <= 1) {
        const medIndex = prev.findIndex((it) => it.isMedicine || it.description.toLowerCase().includes('pharmacy') || it.description.toLowerCase().includes('medication'));
        if (medIndex >= 0) {
          if (num === 0 && !value) {
            return prev.filter((_, i) => i !== medIndex);
          }
          const updated = [...prev];
          updated[medIndex] = {
            ...updated[medIndex],
            unitPrice: num,
            totalPrice: num,
            isMedicine: true,
          };
          return updated;
        } else if (num > 0) {
          return [
            ...prev,
            {
              id: `med-${Date.now()}`,
              description: 'Pharmacy Medication Dispense Charges',
              quantity: 1,
              unitPrice: num,
              totalPrice: num,
              isMedicine: true,
            },
          ];
        }
      }
      return prev;
    });
  };

  // Quick Add Medicine from Pharmacy Catalog
  const handleQuickAddMedicine = (med) => {
    // Find active batch with stock
    const activeBatch = med.batches && med.batches.find((b) => b.quantity > 0);
    const unitPrice = activeBatch?.sellingPrice || (med.batches?.[0]?.sellingPrice) || 15.0;
    const batchInfo = activeBatch?.batchNumber ? ` [Batch: ${activeBatch.batchNumber}]` : '';
    const desc = `${med.name} (${med.unit || 'Unit'})${batchInfo}`;

    const newItem = {
      id: `med-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: desc,
      quantity: 1,
      unitPrice,
      totalPrice: unitPrice,
      isMedicine: true,
    };

    const newItems = [...items, newItem];
    setItems(newItems);

    // Recalculate pharmacy fee
    const newMedSum = newItems
      .filter((it) => it.isMedicine)
      .reduce((sum, it) => sum + (parseFloat(it.totalPrice) || 0), 0);
    setPharmacyFee(newMedSum.toFixed(2));

    setShowMedicineDropdown(false);
    setMedicineSearchQuery('');
  };

  // Filter medicines for quick-add dropdown
  const filteredMedicines = useMemo(() => {
    if (!medicineSearchQuery.trim()) return medicinesList.slice(0, 15);
    const q = medicineSearchQuery.toLowerCase();
    return medicinesList.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.genericName?.toLowerCase().includes(q) ||
        m.category?.name?.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [medicinesList, medicineSearchQuery]);

  // Custom Line Items Management
  const handleAddItem = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0, totalPrice: 0 },
    ]);
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseInt(field === 'quantity' ? value : item.quantity, 10) || 0;
      const unit = parseFloat(field === 'unitPrice' ? value : item.unitPrice) || 0;
      item.totalPrice = qty * unit;
    }

    updated[index] = item;
    setItems(updated);

    // Sync back to doctor consultation or pharmacy fee inputs if modified
    if (item.isDoctorFee) {
      setConsultationFee(item.totalPrice.toString());
    } else if (item.isMedicine) {
      const medSum = updated
        .filter((it) => it.isMedicine)
        .reduce((sum, it) => sum + (parseFloat(it.totalPrice) || 0), 0);
      setPharmacyFee(medSum.toFixed(2));
    }
  };

  const handleRemoveItem = (index) => {
    const itemToRemove = items[index];
    const remaining = items.filter((_, i) => i !== index);
    setItems(remaining);

    if (itemToRemove?.isDoctorFee) {
      setConsultationFee('0');
      setSelectedDoctorId('');
    } else if (itemToRemove?.isMedicine) {
      const medSum = remaining
        .filter((it) => it.isMedicine)
        .reduce((sum, it) => sum + (parseFloat(it.totalPrice) || 0), 0);
      setPharmacyFee(medSum > 0 ? medSum.toFixed(2) : '0');
    }
  };

  // Totals Calculation
  const cFeeNum = parseFloat(consultationFee) || 0;
  const pFeeNum = parseFloat(pharmacyFee) || 0;
  const oChargesNum = parseFloat(otherCharges) || 0;
  const discountNum = parseFloat(discount) || 0;
  const taxNum = parseFloat(tax) || 0;

  const itemsSum = items.reduce((acc, it) => acc + (parseFloat(it.totalPrice) || 0), 0);
  const subtotal = items.length > 0 ? itemsSum : cFeeNum + pFeeNum + oChargesNum;
  const netTotal = Math.max(0, subtotal - discountNum + taxNum);

  // Sync default collect now payment with netTotal if collectNow is true
  useEffect(() => {
    if (collectNow) {
      setPaymentAmount(netTotal.toFixed(2));
    }
  }, [netTotal, collectNow]);

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedPatient) {
      setError('Please select a patient for this invoice.');
      return;
    }

    if (netTotal <= 0) {
      setError('Invoice total must be greater than ₹0.00.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatient.id,
        appointmentId: encounterPreview?.appointmentId || undefined,
        consultationFee: cFeeNum,
        pharmacyFee: pFeeNum,
        otherCharges: oChargesNum,
        discount: discountNum,
        tax: taxNum,
        items: items.length > 0 ? items : undefined,
        payment: collectNow && parseFloat(paymentAmount) > 0
          ? {
              amount: parseFloat(paymentAmount),
              paymentMethod,
              transactionRef: transactionRef.trim() || undefined,
            }
          : undefined,
      };

      const res = await api.post('/billing/invoices', payload);
      const createdInvoice = res.data?.data !== undefined ? res.data.data : (res.data !== undefined ? res.data : res);

      if (onSuccess) {
        onSuccess(createdInvoice);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate invoice. Please check the inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[94vh] animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Generate Patient Invoice</h2>
              <p className="text-xs text-slate-400">Consultation, Pharmacy, & Clinical Billing Desk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Patient Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Patient <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Selecting a patient auto-fills consultation & pharmacy fees</span>
            </div>

            {!selectedPatient ? (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by patient name, UHID, or phone number..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-brand-500 focus:bg-white"
                  />
                  {searchingPatients && (
                    <div className="absolute right-3 top-2.5">
                      <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {patients.length > 0 && (
                  <div className="border border-slate-200 rounded-xl max-h-44 overflow-y-auto divide-y divide-slate-100 bg-white shadow-lg">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPatient(p);
                          setPatientSearch('');
                          setPatients([]);
                          handleFetchEncounter(p.id);
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-brand-50/60 flex items-center justify-between text-xs transition-colors group"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-brand-100 text-slate-700 group-hover:text-brand-700 font-bold flex items-center justify-center text-xs">
                            {p.fullName?.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 group-hover:text-brand-900">{p.fullName}</span>
                            <span className="text-slate-500 font-mono ml-2">({p.uhid})</span>
                          </div>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{p.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-brand-50/60 border border-brand-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {selectedPatient.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{selectedPatient.fullName}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-100 text-brand-800">
                        Active Encounter
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      UHID: {selectedPatient.uhid} • Phone: {selectedPatient.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleFetchEncounter(selectedPatient.id)}
                    disabled={encounterLoading}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-100 text-brand-700 border border-brand-200 rounded-lg flex items-center space-x-1 transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                    <span>{encounterLoading ? 'Auto-Filling...' : 'Re-sync Encounter'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setEncounterPreview(null);
                      setSelectedDoctorId('');
                      setConsultationFee('0');
                      setPharmacyFee('0');
                      setItems([]);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Change Patient"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Auto-fill Encounter Banner */}
          {selectedPatient && encounterPreview && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start space-x-2.5 animate-in fade-in duration-150">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold">
                  Encounter auto-filled for {selectedPatient.fullName}:
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                  {encounterPreview.doctorName && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      👨‍⚕️ Attending: {encounterPreview.doctorName} (₹{encounterPreview.consultationFee})
                    </span>
                  )}
                  {encounterPreview.pharmacyFee > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                      💊 Pharmacy: ₹{encounterPreview.pharmacyFee.toFixed(2)}
                    </span>
                  )}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-800 font-bold">
                    Est. Total: ₹{(encounterPreview.estimatedTotal || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Attending Doctor Selection */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-brand-600" />
                <span>Attending Doctor</span>
              </label>
              <span className="text-[11px] text-slate-400">Selecting a doctor auto-populates consultation fee</span>
            </div>
            <div className="relative">
              <select
                value={selectedDoctorId}
                onChange={(e) => handleDoctorChange(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:bg-white"
              >
                <option value="">-- Select Attending Doctor (Optional) --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.name || 'Doctor'} ({d.department?.name || d.specialization || 'OPD'}) - Standard Fee: ₹{d.consultationFee || 500}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Fee Breakdown Cards (Automatically Populated) */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Standard Service Fees (Auto-Filled)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Doctor Consultation Fee */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Doctor Consultation Fee
                  </label>
                  {cFeeNum > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-100 text-brand-700 font-semibold">
                      Auto-filled
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={consultationFee}
                    onChange={(e) => handleConsultationFeeChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Pharmacy Medications Fee */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Pharmacy Medications
                  </label>
                  {pFeeNum > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-semibold">
                      Auto-filled
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pharmacyFee}
                    onChange={(e) => handlePharmacyFeeChange(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Other Clinical Charges */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Other Clinical Charges
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold text-xs pointer-events-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={otherCharges}
                    onChange={(e) => setOtherCharges(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Itemized Bill Lines with Quick Add Pharmacy */}
          <div className="border-t border-slate-200 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Itemized Bill Lines
                </h3>
                <p className="text-[11px] text-slate-500">
                  Doctor fees, dispensed medications, tests, or clinical procedures
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {/* Quick Add Medicine Button & Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMedicineDropdown(!showMedicineDropdown)}
                    className="px-2.5 py-1 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg flex items-center space-x-1 transition-colors shadow-sm"
                  >
                    <Pill className="w-3.5 h-3.5 text-purple-600" />
                    <span>+ Quick Add Medicine</span>
                    <ChevronDown className="w-3 h-3 text-purple-500 ml-0.5" />
                  </button>

                  {/* Medicine Picker Popover */}
                  {showMedicineDropdown && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-2 animate-in fade-in duration-100">
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={medicineSearchQuery}
                          onChange={(e) => setMedicineSearchQuery(e.target.value)}
                          placeholder="Search pharmacy stock..."
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:ring-1 focus:ring-purple-500"
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {filteredMedicines.length > 0 ? (
                          filteredMedicines.map((m) => {
                            const activeBatch = m.batches?.find((b) => b.quantity > 0);
                            const price = activeBatch?.sellingPrice || m.batches?.[0]?.sellingPrice || 15.0;
                            const stock = m.batches?.reduce((acc, b) => acc + (b.quantity || 0), 0) || 0;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleQuickAddMedicine(m)}
                                className="w-full text-left px-2.5 py-1.5 hover:bg-purple-50/70 rounded-lg flex items-center justify-between text-xs transition-colors"
                              >
                                <div>
                                  <p className="font-bold text-slate-800">{m.name}</p>
                                  <p className="text-[10px] text-slate-500">
                                    {m.category?.name || 'Medicine'} • Stock: {stock} {m.unit || 'units'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="font-extrabold text-purple-700">₹{price.toFixed(2)}</span>
                                  <p className="text-[10px] text-slate-400">per {m.unit || 'unit'}</p>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="p-3 text-center text-xs text-slate-400">
                            No matching medicines found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            {items.length > 0 ? (
              <div className="space-y-2 mt-2">
                {items.map((it, idx) => (
                  <div
                    key={it.id || idx}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                      it.isDoctorFee
                        ? 'bg-brand-50/40 border-brand-200'
                        : it.isMedicine
                        ? 'bg-purple-50/40 border-purple-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Service / Medicine description"
                        value={it.description}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        required
                        className="w-full px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800"
                      />
                    </div>
                    <div className="w-16">
                      <input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={it.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 text-xs text-center bg-white border border-slate-300 rounded-lg font-medium"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        placeholder="Price ₹"
                        step="0.01"
                        min="0"
                        value={it.unitPrice}
                        onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 text-xs text-right bg-white border border-slate-300 rounded-lg font-semibold"
                      />
                    </div>
                    <div className="w-20 text-right text-xs font-bold text-slate-800 pr-1 font-mono">
                      ₹{(it.totalPrice || 0).toFixed(2)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove line"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                No custom item lines added yet. Standard fee breakdown will be billed.
              </div>
            )}
          </div>

          {/* 5. Discounts, Taxes & Net Total */}
          <div className="border-t border-slate-200 pt-4 bg-slate-50 p-4 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tax / GST (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500">
                  Subtotal: <span className="text-slate-800 font-bold">₹{subtotal.toFixed(2)}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase tracking-wider mr-2 font-bold">
                  Net Payable:
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  ₹{netTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* 6. Instant Payment Option */}
          <div className="border-t border-slate-200 pt-4">
            <label className="flex items-center space-x-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={collectNow}
                onChange={(e) => setCollectNow(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-800">
                Collect Payment Immediately at Counter
              </span>
            </label>

            {collectNow && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in duration-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Collected Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={netTotal}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-emerald-500"
                    >
                      <option value="CASH">Cash Desk</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="ONLINE">Online Portal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Transaction Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. UPI Ref / Card Last 4 / Receipt No."
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Footer */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedPatient || netTotal <= 0}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Invoice...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Generate Invoice (₹{netTotal.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
