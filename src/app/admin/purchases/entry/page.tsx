'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  PRELOADED_MATERIAL_CATALOG,
  MATERIAL_CATEGORIES,
  matchMaterialSearch,
  getMaterialThumbnail,
  type MaterialItem,
} from '@/features/materials/material-catalog-data';
import { MaterialQuickAddModal } from '@/features/materials/material-quick-add-modal';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Search,
  Building2,
  Calendar,
  FileText,
  CreditCard,
  PackageCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notify } from '@/lib/notify';
import { money } from '@/lib/utils';

type SupplierChoice = {
  id: string;
  name: string;
  phone?: string;
  balance_minor?: number;
};

type DraftBillItem = {
  id: string; // temporary client uuid
  material_id?: string;
  material_code?: string;
  material_name: string;
  size_gauge?: string;
  unit: 'kg' | 'm' | 'piece' | 'litre' | 'sheet';
  quantity: number;
  rate: number; // in rupees
  subtotal: number; // quantity * rate in rupees
};

export default function NewPurchaseEntryPage() {
  const router = useRouter();

  // Suppliers state
  const [suppliers, setSuppliers] = useState<SupplierChoice[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  // Bill header state
  const [billNumber, setBillNumber] = useState<string>('');
  const [billDate, setBillDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');

  // Material selection & catalog state
  const [materials, setMaterials] = useState<MaterialItem[]>(PRELOADED_MATERIAL_CATALOG);
  const [materialSearch, setMaterialSearch] = useState<string>('');
  const [selectedMaterialCode, setSelectedMaterialCode] = useState<string>(PRELOADED_MATERIAL_CATALOG[0].code);
  const [isQuickAddMaterialOpen, setIsQuickAddMaterialOpen] = useState(false);
  const [isQuickAddSupplierOpen, setIsQuickAddSupplierOpen] = useState(false);

  // Line item input state
  const [lineUnit, setLineUnit] = useState<'kg' | 'm' | 'piece' | 'litre' | 'sheet'>('kg');
  const [lineQty, setLineQty] = useState<number | ''>(50);
  const [lineRate, setLineRate] = useState<number | ''>(72); // ₹ per unit

  // Draft bill items list
  const [billItems, setBillItems] = useState<DraftBillItem[]>([]);

  // Payment & receiving state
  const [paidAmount, setPaidAmount] = useState<number | ''>(0);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'bank' | 'upi' | 'cheque'>('cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [autoReceive, setAutoReceive] = useState<boolean>(true);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [successSaved, setSuccessSaved] = useState<{ id: string; billNumber: string; total: number } | null>(null);

  // Quick Add Supplier form state
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierAddress, setNewSupplierAddress] = useState('');
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Load suppliers and custom materials from DB on mount
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [supRes, matRes] = await Promise.all([
          fetch('/api/v1/admin/suppliers?limit=100'),
          fetch('/api/v1/admin/materials?limit=100').catch(() => null),
        ]);

        const supJson = await supRes.json();
        if (supJson.data && Array.isArray(supJson.data)) {
          setSuppliers(supJson.data);
          if (supJson.data.length > 0) {
            setSelectedSupplierId(supJson.data[0].id);
          }
        }

        if (matRes) {
          const matJson = await matRes.json();
          if (matJson.data && Array.isArray(matJson.data)) {
            const dbItems: MaterialItem[] = matJson.data
              .filter((dbItem: any) => !PRELOADED_MATERIAL_CATALOG.some((p) => p.code === dbItem.code))
              .map((dbItem: any) => ({
                code: dbItem.code,
                name: dbItem.name,
                name_hi: dbItem.name,
                local_aliases: [],
                category_id: ['square_pipe', 'rectangular_pipe', 'round_pipe'].includes(dbItem.type)
                  ? 'ms_pipes'
                  : dbItem.type === 'angle'
                  ? 'ms_angles'
                  : dbItem.type === 'sheet'
                  ? 'sheets'
                  : 'hardware',
                subcategory: dbItem.type,
                type: dbItem.type || 'hardware',
                shape: 'accessory',
                size: dbItem.size || dbItem.name,
                thickness_mm: Number(dbItem.thickness_mm) || 1.0,
                unit: dbItem.unit || 'kg',
                purchase_units: [dbItem.unit === 'm' ? 'meter' : dbItem.unit || 'kg', 'kg'],
                weight_kg_per_unit: Number(dbItem.weight_kg_per_unit) || 1.0,
                reorder_level: Number(dbItem.reorder_level) || 5,
              }));
            if (dbItems.length > 0) {
              setMaterials((prev) => [...dbItems, ...prev]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load initial purchase entry data:', err);
      } finally {
        setLoadingSuppliers(false);
      }
    }
    fetchInitialData();
  }, []);

  // Filter materials based on search term
  const searchedMaterials = useMemo(() => {
    if (!materialSearch.trim()) return materials.slice(0, 40);
    return materials.filter((m) => matchMaterialSearch(m, materialSearch)).slice(0, 40);
  }, [materials, materialSearch]);

  // Currently selected material spec
  const currentMaterial = useMemo(() => {
    return materials.find((m) => m.code === selectedMaterialCode) || materials[0];
  }, [materials, selectedMaterialCode]);

  // Sync unit when material changes
  useEffect(() => {
    if (currentMaterial) {
      setLineUnit(currentMaterial.unit);
    }
  }, [currentMaterial]);

  // Current item subtotal
  const currentItemSubtotal = useMemo(() => {
    return Math.round((Number(lineQty) || 0) * (Number(lineRate) || 0) * 100) / 100;
  }, [lineQty, lineRate]);

  // Grand total of the bill
  const billTotal = useMemo(() => {
    return billItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [billItems]);

  // Remaining due balance
  const remainingDue = useMemo(() => {
    return Math.max(0, billTotal - (Number(paidAmount) || 0));
  }, [billTotal, paidAmount]);

  // Handle adding a line item to the bill
  const handleAddItemToBill = () => {
    if (!currentMaterial) return;
    const finalQty = typeof lineQty === 'number' ? lineQty : Number(lineQty) || 0;
    const finalRate = typeof lineRate === 'number' ? lineRate : Number(lineRate) || 0;
    if (finalQty <= 0) {
      notify('कृपया मान्य मात्रा (Quantity) दर्ज करें।', 'error');
      return;
    }
    if (finalRate < 0) {
      notify('कृपया मान्य खरीद दर (Rate) दर्ज करें।', 'error');
      return;
    }

    const newItem: DraftBillItem = {
      id: crypto.randomUUID(),
      material_id: (currentMaterial as any).id,
      material_code: currentMaterial.code,
      material_name: `${currentMaterial.name} (${currentMaterial.name_hi})`,
      size_gauge: `${currentMaterial.size} ${currentMaterial.gauge ? `(${currentMaterial.gauge})` : ''}`,
      unit: lineUnit,
      quantity: finalQty,
      rate: finalRate,
      subtotal: currentItemSubtotal,
    };

    setBillItems((prev) => [...prev, newItem]);
    notify(`सामान "${currentMaterial.name}" बिल में जोड़ दिया गया।`, 'success');

    // Reset line quantity and rate for next item
    setLineQty(10);
    setLineRate(0);
  };

  // Handle removing a line item
  const handleRemoveItem = (id: string) => {
    setBillItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle new material created via Quick Add
  const handleMaterialCreated = (newItem: MaterialItem) => {
    setMaterials((prev) => [newItem, ...prev]);
    setSelectedMaterialCode(newItem.code);
    setLineUnit(newItem.unit);
    setIsQuickAddMaterialOpen(false);
    notify(`नया मटेरियल "${newItem.name}" तुरंत चुन लिया गया!`, 'success');
  };

  // Handle saving new supplier via Quick Add
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) {
      notify('कृपया दुकानदार / सप्लायर का नाम दर्ज करें।', 'error');
      return;
    }

    setSavingSupplier(true);
    try {
      const res = await fetch('/api/v1/admin/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSupplierName.trim(),
          phone: newSupplierPhone.trim() || '+91 99999 99999',
          address: newSupplierAddress.trim() || 'Local Market',
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'दुकानदार सेव नहीं हो सका');

      const createdSup: SupplierChoice = {
        id: json.data.id,
        name: json.data.name,
        phone: json.data.phone,
      };

      setSuppliers((prev) => [createdSup, ...prev]);
      setSelectedSupplierId(createdSup.id);
      setIsQuickAddSupplierOpen(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
      setNewSupplierAddress('');
      notify(`नया सप्लायर "${createdSup.name}" तुरंत जोड़ दिया गया!`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'त्रुटि हुई', 'error');
    } finally {
      setSavingSupplier(false);
    }
  };

  // Final submission: Save entire purchase bill to Supabase
  const handleSaveFullBill = async () => {
    if (!selectedSupplierId) {
      notify('कृपया सप्लायर / दुकानदार का चयन करें।', 'error');
      return;
    }
    if (!billNumber.trim()) {
      notify('कृपया सप्लायर का बिल नंबर दर्ज करें।', 'error');
      return;
    }
    if (billItems.length === 0) {
      notify('कृपया बिल में कम से कम एक सामान जोड़ें।', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        supplier_id: selectedSupplierId,
        bill_number: billNumber.trim(),
        bill_date: billDate,
        notes: notes.trim() || undefined,
        items: billItems.map((item) => ({
          material_id: item.material_id,
          material_code: item.material_code,
          material_name: item.material_name,
          unit: item.unit,
          quantity: item.quantity,
          rate_minor: Math.round(item.rate * 100),
          subtotal_minor: Math.round(item.subtotal * 100),
        })),
        paid_minor: Math.round((Number(paidAmount) || 0) * 100),
        payment_mode: paymentMode,
        payment_reference: paymentRef.trim() || undefined,
        auto_receive: autoReceive,
      };

      const res = await fetch('/api/v1/purchases/bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || 'खरीदारी बिल सेव नहीं हो सका।');
      }

      setSuccessSaved({
        id: result.data.id,
        billNumber: result.data.bill_number,
        total: billTotal,
      });

      notify(`बिल #${result.data.bill_number} (₹${billTotal.toLocaleString('en-IN')}) सफलतापूर्वक सहेज लिया गया!`, 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'बिल सेव करने में त्रुटि हुई।', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-operational-page space-y-6 pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/workspaces/inventory"
              className="text-xs font-semibold text-slate-500 hover:text-teal-700"
            >
              इन्वेंट्री व खरीद (Inventory)
            </Link>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
              Page 2 — नई खरीदारी
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            नई खरीदारी दर्ज करें (New Purchase Bill)
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            लोहा, पाइप, एंगल, चादर व हार्डवेयर के बिल की प्रविष्टि करें और सप्लायर बहीखाता अपडेट करें।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/admin/purchases">
              <ArrowLeft size={14} />
              सभी खरीदारी (Purchase Register)
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link href="/admin/raw-materials">कच्चा माल कैटलॉग</Link>
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successSaved && (
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <CheckCircle2 size={24} />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  बिल #{successSaved.billNumber} सफलतापूर्वक दर्ज हो गया!
                </h3>
                <p className="text-xs text-slate-600">
                  कुल बिल रकम: <strong>₹{successSaved.total.toLocaleString('en-IN')}</strong>। स्टॉक व
                  दुकानदार का खाता अपडेट हो चुका है।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuccessSaved(null);
                  setBillItems([]);
                  setBillNumber('');
                  setPaidAmount(0);
                  setPaymentRef('');
                }}
              >
                + अगला नया बिल बनाएं
              </Button>
              <Button asChild size="sm" className="bg-teal-700 hover:bg-teal-800">
                <Link href={`/admin/purchases?record=${successSaved.id}`}>बिल का विवरण देखें</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: BILL HEADER (सप्लायर, तारीख व बिल नंबर) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Building2 size={18} className="text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">
            1. सप्लायर व बिल की सामान्य जानकारी (Bill Header)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Supplier Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                दुकानदार / सप्लायर चुनें *
              </label>
              <button
                type="button"
                onClick={() => setIsQuickAddSupplierOpen(true)}
                className="text-[11px] font-semibold text-teal-700 hover:underline flex items-center gap-1"
              >
                <Plus size={12} />
                + नया सप्लायर
              </button>
            </div>
            {loadingSuppliers ? (
              <div className="text-xs text-slate-400 py-2">सप्लायर्स लोड हो रहे हैं...</div>
            ) : (
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-slate-900 shadow-sm focus:border-teal-600"
              >
                {suppliers.length === 0 && <option value="">कोई सप्लायर नहीं मिला</option>}
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Bill Date */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              खरीदारी की तारीख (Bill Date) *
            </label>
            <div className="relative">
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-slate-900 shadow-sm focus:border-teal-600"
              />
            </div>
          </div>

          {/* Supplier Bill / Challan No */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              सप्लायर बिल नंबर (Bill / Invoice No) *
            </label>
            <input
              type="text"
              placeholder="उदा. INV-101, Challan #58"
              value={billNumber}
              onChange={(e) => setBillNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs sm:text-sm font-medium text-slate-900 shadow-sm focus:border-teal-600"
            />
          </div>
        </div>
      </div>

      {/* STEP 2: ADD MATERIAL LINE ITEM (सामान खोजें व बिल में जोड़ें) */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-teal-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 text-white">
              <Plus size={16} />
            </span>
            <h2 className="text-sm font-bold text-slate-900">
              2. सामान खोजें व बिल में जोड़ें (Add Material Line Item)
            </h2>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsQuickAddMaterialOpen(true)}
            className="text-xs border-teal-300 bg-white text-teal-800 hover:bg-teal-50 gap-1.5 h-8"
          >
            <Plus size={13} />
            + नया साइज / मटेरियल जोड़ें
          </Button>
        </div>

        {/* Search & Select Material */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Quick Search filter input */}
            <div className="sm:col-span-5">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                सामान खोजें (Search English/Hindi/Size):
              </label>
              <div className="relative">
                <Search size={15} className="royal-search-leading absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="उदा. 1 इंची पाइप, सवा इंची एंगल, 18 gauge, tata chadar..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-sm"
                />
              </div>
            </div>

            {/* Material Dropdown */}
            <div className="sm:col-span-7">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                सामान व साइज चुनें (Select Material)*:
              </label>
              <select
                value={selectedMaterialCode}
                onChange={(e) => setSelectedMaterialCode(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs sm:text-sm font-medium text-slate-900 shadow-sm"
              >
                {searchedMaterials.map((m) => (
                  <option key={m.code} value={m.code}>
                    {m.name} — {m.name_hi} ({m.size} {m.gauge ? `· ${m.gauge}` : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Material Visual Badge with Image Thumbnail */}
          {currentMaterial && (
            <div className="flex items-center gap-3 rounded-xl border border-teal-200 bg-white p-2.5 shadow-xs">
              <div className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center shadow-xs">
                <img
                  src={getMaterialThumbnail(currentMaterial)}
                  alt={currentMaterial.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-bold text-slate-900 truncate">
                  {currentMaterial.name} ({currentMaterial.name_hi})
                </div>
                <div className="text-[11px] text-slate-500">
                  साइज: <strong>{currentMaterial.size}</strong> • मोटाई: <strong>{currentMaterial.gauge || `${currentMaterial.thickness_mm} mm`}</strong> • ब्रांड: {currentMaterial.brand || 'Commercial'}
                </div>
              </div>
            </div>
          )}

          {/* Unit, Qty, Rate & Add Button */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {/* Unit */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">इकाई (Unit):</label>
              <select
                value={lineUnit}
                onChange={(e) => setLineUnit(e.target.value as any)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-bold uppercase text-slate-800 shadow-sm"
              >
                <option value="kg">किलो (KG)</option>
                <option value="piece">पीस (Piece)</option>
                <option value="sheet">शीट (Sheet)</option>
                <option value="m">मीटर (Meter)</option>
                <option value="litre">लीटर (Litre)</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                मात्रा (Quantity) *:
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="उदा. 10"
                value={lineQty}
                onChange={(e) => setLineQty(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs sm:text-sm font-bold text-slate-900 shadow-sm text-center"
              />
            </div>

            {/* Rate (₹) */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                खरीद दर (Rate ₹) *:
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="उदा. 70"
                value={lineRate}
                onChange={(e) => setLineRate(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs sm:text-sm font-bold text-slate-900 shadow-sm text-center"
              />
            </div>

            {/* Item Total Preview */}
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">सामान का Total:</label>
              <div className="rounded-xl border border-slate-200 bg-white p-2 text-xs sm:text-sm font-extrabold text-teal-800 text-center shadow-inner">
                ₹{currentItemSubtotal.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Add to Bill Button */}
            <div className="col-span-2 sm:col-span-1 flex items-end">
              <Button
                type="button"
                onClick={handleAddItemToBill}
                className="w-full gap-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold h-9"
              >
                <Plus size={16} />
                Bill में जोड़ें
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 3: CURRENT BILL LINE ITEMS TABLE (इस बिल में जोड़े गए सामान) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-teal-700" />
            <h2 className="text-sm font-bold text-slate-900">
              3. इस बिल में जोड़े गए सामान ({billItems.length} सामान)
            </h2>
          </div>
          {billItems.length > 0 && (
            <span className="text-xs font-extrabold text-teal-900 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
              कुल बिल: ₹{billTotal.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {billItems.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
            <p className="text-xs sm:text-sm font-medium text-slate-500">
              अभी तक कोई सामान नहीं जोड़ा गया है।
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              ऊपर बॉक्स में से पाइप, एंगल या चादर चुनें, Quantity व Rate डालें और <strong>"Bill में जोड़ें"</strong> दबाएं।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">क्र.सं.</th>
                  <th className="px-2 py-2.5 w-14 text-center">फोटो</th>
                  <th className="px-3 py-2.5">सामान का नाम व माप (Material)</th>
                  <th className="px-3 py-2.5 text-center">इकाई</th>
                  <th className="px-3 py-2.5 text-center">मात्रा (Qty)</th>
                  <th className="px-3 py-2.5 text-right">दर (Rate ₹)</th>
                  <th className="px-3 py-2.5 text-right">रकम (Total ₹)</th>
                  <th className="px-3 py-2.5 text-center">एक्शन</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 font-mono text-slate-400 text-center">#{idx + 1}</td>
                    <td className="px-2 py-2 text-center">
                      <div className="h-9 w-9 mx-auto rounded-lg border border-slate-200 overflow-hidden bg-white p-0.5 shadow-xs flex items-center justify-center">
                        <img
                          src={getMaterialThumbnail(
                            materials.find((m) => m.code === item.material_code) || {
                              name: item.material_name,
                            }
                          )}
                          alt={item.material_name}
                          className="h-full w-full object-cover rounded-sm"
                        />
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-900">{item.material_name}</div>
                      {item.size_gauge && (
                        <div className="text-[11px] text-slate-500">{item.size_gauge}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-bold uppercase text-slate-700 text-center">
                      {item.unit}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-900 text-center">
                      {item.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-800">
                      ₹{item.rate.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right font-extrabold text-teal-900 text-sm">
                      ₹{item.subtotal.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                        title="हटाएँ"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STEP 4: BILL SUMMARY & PAYMENT (बिल का कुल हिसाब, भुगतान व स्टॉक) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <CreditCard size={18} className="text-teal-700" />
          <h2 className="text-sm font-bold text-slate-900">
            4. बिल का कुल हिसाब, भुगतान व बहीखाता (Payment & Settlement)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Summary Box */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>कुल सामान (Total Items):</span>
              <span className="font-bold text-slate-800">{billItems.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-600 border-t border-slate-200 pt-2">
              <span>कुल बिल रकम (Grand Total):</span>
              <span className="text-lg font-black text-slate-900">
                ₹{billTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2">
              <span className="font-bold text-emerald-800">दिया गया भुगतान (Paid):</span>
              <span className="font-bold text-emerald-700">
                ₹{(Number(paidAmount) || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-200 pt-2">
              <span className="font-bold text-amber-900">दुकानदार का बकाया (Due):</span>
              <span className="text-base font-extrabold text-amber-700">
                ₹{remainingDue.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment Input Controls */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                अभी किया गया भुगतान (Paid Amount ₹):
              </label>
              <input
                type="number"
                min="0"
                max={billTotal || undefined}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 shadow-sm"
                placeholder="0 (पूरा उधार हो तो 0 रहने दें)"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                पूरा उधार रखने के लिए 0 छोड़ें, या जितनी रकम दी हो वह दर्ज करें।
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">माध्यम (Mode):</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 shadow-sm"
                >
                  <option value="cash">नकद (Cash)</option>
                  <option value="upi">UPI (GPay/PhonePe)</option>
                  <option value="bank">बैंक (NEFT / RTGS)</option>
                  <option value="cheque">चेक (Cheque)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">रेफरेंस / नोट:</label>
                <input
                  type="text"
                  placeholder="उदा. UPI No / Cash"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Stock auto-receive check & Notes */}
          <div className="space-y-3">
            <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-3.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReceive}
                  onChange={(e) => setAutoReceive(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    सामान वर्कशॉप में आ चुका है (स्टॉक तुरंत अपडेट करें)
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-0.5">
                    चेक रखने पर गोदाम में माल की मात्रा तुरंत बढ़ जाएगी।
                  </span>
                </div>
              </label>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                आंतरिक टिप्पणी (Internal Note / Reminders):
              </label>
              <input
                type="text"
                placeholder="उदा. धर्म कांटा पर्ची साथ में है, माल शाम को उतरा"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs text-slate-800 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Final Save Action Bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (confirm('क्या आप सचमुच यह बिल रद्द करना चाहते हैं?')) {
                setBillItems([]);
                setBillNumber('');
              }
            }}
          >
            फ़ॉर्म रीसेट करें
          </Button>

          <Button
            type="button"
            onClick={handleSaveFullBill}
            disabled={saving || billItems.length === 0}
            className="gap-2 bg-teal-700 hover:bg-teal-800 text-white font-bold px-6 py-2.5 text-sm"
          >
            {saving ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                बिल सेव कर रहे हैं...
              </>
            ) : (
              <>
                <PackageCheck size={18} />
                खरीदारी बिल सेव करें (Save Bill & Ledger)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Add Material Modal */}
      <MaterialQuickAddModal
        isOpen={isQuickAddMaterialOpen}
        onClose={() => setIsQuickAddMaterialOpen(false)}
        onCreated={handleMaterialCreated}
      />

      {/* Quick Add Supplier Dialog */}
      {isQuickAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                + नया दुकानदार / सप्लायर जोड़ें
              </h3>
              <button
                type="button"
                onClick={() => setIsQuickAddSupplierOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  दुकान / व्यापारी का नाम *:
                </label>
                <input
                  type="text"
                  required
                  placeholder="उदा. रमेश स्टील ट्रेडर्स, APL डिस्ट्रीब्यूटर"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  मोबाइल नंबर *:
                </label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  दुकान का पता (Address):
                </label>
                <input
                  type="text"
                  placeholder="उदा. लोहा मंडी, सेक्टर 14"
                  value={newSupplierAddress}
                  onChange={(e) => setNewSupplierAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuickAddSupplierOpen(false)}
                  disabled={savingSupplier}
                >
                  रद्द करें
                </Button>
                <Button
                  type="submit"
                  disabled={savingSupplier}
                  className="bg-teal-700 hover:bg-teal-800"
                >
                  {savingSupplier ? 'सहेज रहे हैं...' : 'सप्लायर जोड़ें'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
