'use client';

import React, { useState } from 'react';
import {
  MATERIAL_CATEGORIES,
  PRELOADED_MATERIAL_CATALOG,
  normalizeMaterialSpecs,
  type MaterialItem,
} from './material-catalog-data';
import type { PurchaseUnit } from './multi-unit-converter';
import { X, Plus, AlertCircle, Check, Layers, Sparkles, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MaterialQuickAddModal({
  isOpen,
  onClose,
  onCreated,
  initialCategoryId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (item: MaterialItem) => void;
  initialCategoryId?: string;
}) {
  const [categoryId, setCategoryId] = useState<string>(
    initialCategoryId || MATERIAL_CATEGORIES[0].id
  );
  const [name, setName] = useState('');
  const [nameHi, setNameHi] = useState('');
  const [size, setSize] = useState('');
  const [gauge, setGauge] = useState('');
  const [thicknessMm, setThicknessMm] = useState<number>(1.2);
  const [brand, setBrand] = useState('Tata / APL Apollo');
  const [grade, setGrade] = useState('IS 2062');
  const [unit, setUnit] = useState<'kg' | 'piece' | 'sheet' | 'litre' | 'm'>('piece');
  const [weightKg, setWeightKg] = useState<number>(5.0);
  const [reorderLevel, setReorderLevel] = useState<number>(10);
  const [aliases, setAliases] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  // Live duplicate check
  const handleSizeOrGaugeChange = (newSize: string, newGauge: string, newThick: number) => {
    const norm = normalizeMaterialSpecs({
      name: name || newSize,
      size: newSize,
      thickness_mm: newThick,
      gauge: newGauge,
      category_id: categoryId,
    });

    const existing = PRELOADED_MATERIAL_CATALOG.find((m) => {
      return (
        normalizeMaterialSpecs({
          name: m.name,
          size: m.size,
          thickness_mm: m.thickness_mm,
          gauge: m.gauge,
          category_id: m.category_id,
        }) === norm
      );
    });

    if (existing) {
      setDuplicateWarning(
        `ध्यान दें: इसी स्पेसिफिकेशन का मटेरियल पहले से मौजूद है: "${existing.name}" (${existing.name_hi})।`
      );
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const code = `MAT-${categoryId.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-6)}`;
    const aliasList = aliases
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newItem: MaterialItem = {
      code,
      name: name.trim(),
      name_hi: nameHi.trim() || name.trim(),
      local_aliases: aliasList,
      category_id: categoryId,
      subcategory: categoryId,
      type: categoryId === 'ms_pipes' ? 'square_pipe' : categoryId === 'ms_angles' ? 'angle' : categoryId === 'sheets' ? 'sheet' : 'hardware',
      shape: categoryId === 'ms_pipes' ? 'square' : categoryId === 'ms_angles' ? 'l_shape' : 'accessory',
      size: size.trim() || name.trim(),
      gauge: gauge.trim() || undefined,
      thickness_mm: thicknessMm || 1.0,
      brand: brand.trim() || undefined,
      grade: grade.trim() || undefined,
      unit,
      purchase_units: [unit === 'm' ? 'meter' : unit, 'kg', 'bundle'],
      weight_kg_per_unit: weightKg || 1.0,
      reorder_level: reorderLevel || 5,
      image_url: imageUrl.trim() || undefined,
    };

    try {
      // POST to /api/v1/admin/materials
      await fetch('/api/v1/admin/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          name: newItem.name,
          code: newItem.code,
          type: newItem.type,
          size: newItem.size,
          thickness_mm: newItem.thickness_mm,
          unit: newItem.unit,
          weight_kg_per_unit: newItem.weight_kg_per_unit,
          reorder_level: newItem.reorder_level,
          active: true,
        }),
      });
    } catch {
      // Offline fallback
    }

    onCreated?.(newItem);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-7 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
              <Plus size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                नया मटेरियल जोड़ें (Quick Add Raw Material)
              </h2>
              <p className="text-xs text-slate-500">
                खरीद बिल बनाते समय किसी भी नई सामग्री का मास्टर रिकॉर्ड बिना फॉर्म खोए तैयार करें।
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {duplicateWarning && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertCircle size={16} className="shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">{duplicateWarning}</p>
              <p className="mt-0.5 text-amber-700">
                अगर यह वही मटेरियल है, तो डुप्लिकेट बनाने के बजाय मौजूदा नाम का ही इस्तेमाल करें।
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-700">मटेरियल श्रेणी (Category):</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-orange-500"
            >
              {MATERIAL_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.name_hi})
                </option>
              ))}
            </select>
          </div>

          {/* Names in English & Hindi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">
                मटेरियल नाम (English) <span className="text-red-500">*</span>:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MS Square Pipe 25x25 18G"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  handleSizeOrGaugeChange(size, gauge, thicknessMm);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">मटेरियल नाम (हिंदी):</label>
              <input
                type="text"
                placeholder="उदा. एम एस चौकोर पाइप 1 इंच (18 गेज)"
                value={nameHi}
                onChange={(e) => setNameHi(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
              />
            </div>
          </div>

          {/* Size, Gauge, Thickness */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">साइज / माप (Size):</label>
              <input
                type="text"
                placeholder="उदा. 25x25 mm / 1 inch"
                value={size}
                onChange={(e) => {
                  setSize(e.target.value);
                  handleSizeOrGaugeChange(e.target.value, gauge, thicknessMm);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">गेज (Gauge):</label>
              <input
                type="text"
                placeholder="उदा. 18G, 16G, 14G"
                value={gauge}
                onChange={(e) => {
                  setGauge(e.target.value);
                  handleSizeOrGaugeChange(size, e.target.value, thicknessMm);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">मोटाई (Thickness mm):</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                value={thicknessMm}
                onChange={(e) => {
                  const t = Number(e.target.value) || 1.0;
                  setThicknessMm(t);
                  handleSizeOrGaugeChange(size, gauge, t);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
              />
            </div>
          </div>

          {/* Brand & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">ब्रांड / कंपनी (Brand):</label>
              <input
                type="text"
                placeholder="उदा. Tata, APL Apollo, Jindal"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">ग्रेड (Grade / Quality):</label>
              <input
                type="text"
                placeholder="उदा. IS 2062, YSt 210, SS 304"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
              />
            </div>
          </div>

          {/* Unit, Weight, Reorder Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700">स्टॉक इकाई (Unit):</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-orange-500"
              >
                <option value="piece">पीस (Piece)</option>
                <option value="kg">किलो (KG)</option>
                <option value="sheet">शीट (Sheet)</option>
                <option value="m">मीटर (Meter)</option>
                <option value="litre">लीटर (Litre)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">अनुमानित वजन प्रति यूनिट (kg):</label>
              <input
                type="number"
                step="0.01"
                min="0.001"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value) || 1.0)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700">कम-स्टॉक अलर्ट स्तर (Reorder):</label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value) || 0)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
              />
            </div>
          </div>

          {/* Local Nicknames / Aliases */}
          <div>
            <label className="text-xs font-bold text-slate-700">
              दुकान के बोलचाल वाले नाम (Local Aliases - कॉमा से अलग करें):
            </label>
            <input
              type="text"
              placeholder="उदा. 1 इंची पाइप, चौकोर पाइप, 25mm box pipe"
              value={aliases}
              onChange={(e) => setAliases(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 shadow-sm focus:border-orange-500"
            />
          </div>

          {/* Material Photo (Admin Only) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">
                मटेरियल की फोटो (Admin Only Image):
              </label>
              <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                केवल एडमिन में दिखेगा • वेबसाइट पर नहीं
              </span>
            </div>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="relative h-16 w-16 shrink-0 rounded-xl border-2 border-slate-300 overflow-hidden bg-white shadow-sm">
                  <img src={imageUrl} alt="Material preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute top-1 right-1 rounded-full bg-red-600 text-white p-0.5 shadow hover:bg-red-700"
                    title="फोटो हटाएं"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="flex h-16 w-16 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white hover:border-orange-500 hover:bg-orange-50/30 transition-all shadow-sm">
                  <Camera size={20} className="text-slate-400" />
                  <span className="text-[10px] text-slate-600 font-bold mt-1">फोटो चुनें</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
              <div className="text-[11px] text-slate-500">
                <p className="font-semibold text-slate-800">मोबाइल या कंप्यूटर से फोटो अपलोड करें</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  पाइप, एंगल, पत्ती या कब्ज़ा पहचानने के लिए छोटा फोटो जोड़ें। यह टेबल में S.No. के बाद दिखेगा।
                </p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              रद्द करें (Cancel)
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'सहेज रहे हैं...' : 'मटेरियल जोड़ें (Save Material)'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
