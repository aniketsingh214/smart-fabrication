'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ANGLE_OPTIONS,
  SHEET_OPTIONS,
  SUPPORT_OPTIONS,
  STANDARD_GATE_SIZES,
  calculateFabricationWeight,
  calculateFabricationPrice,
} from './fabrication-calculator';
import { Scale, Sparkles, Check, ChevronDown, ChevronUp, Layers, Info, Plus, Trash2, X } from 'lucide-react';
import { notify } from '@/lib/notify';

export interface UserPreset {
  id: string;
  name: string;
  angleId: string;
  sheetId: string;
  supportId: string;
  badge?: string;
  ratePerKg?: number;
}

interface PresetOption {
  key: string;
  label: string;
  shortName: string;
  sheetDesc: string;
  angleDesc: string;
  supportDesc: string;
  badge: string;
  badgeClass: string;
  isCustom?: boolean;
}

const STORAGE_KEY = 'gatewala_custom_fabrication_presets';

const PRESET_OPTIONS: PresetOption[] = [
  {
    key: 'sada-std',
    label: '1. सादा दरवाजा (18G) — 18 गेज टाटा चादर + 1¼" एंगल (★ सबसे ज्यादा बिकने वाला)',
    shortName: 'सादा दरवाजा (18G)',
    sheetDesc: '18 गेज टाटा चादर',
    angleDesc: '1¼" एंगल (3mm)',
    supportDesc: '10mm सरिया',
    badge: '★ सबसे ज्यादा बिकने वाला',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    key: 'sada-heavy',
    label: '2. हेवी सादा दरवाजा (16G - भारी वजन) — 16 गेज भारी चादर + 1½" एंगल (मजबूत व सुरक्षित)',
    shortName: 'हेवी सादा दरवाजा (16G)',
    sheetDesc: '16 गेज भारी चादर',
    angleDesc: '1½" एंगल (3mm)',
    supportDesc: '12mm सरिया',
    badge: 'मजबूत व सुरक्षित',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200'
  },
  {
    key: 'sada-light',
    label: '3. किफायती सादा दरवाजा (20G - कम वजन) — 20 गेज चादर + 1¼" एंगल (कम बजट / छत के लिए)',
    shortName: 'किफायती सादा दरवाजा (20G)',
    sheetDesc: '20 गेज चादर',
    angleDesc: '1¼" एंगल (3mm)',
    supportDesc: 'पत्ती सपोर्ट',
    badge: 'कम बजट / छत के लिए',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    key: 'sada-grill',
    label: '4. सादा ग्रिल दरवाजा — 10mm गोल सरिया + 1¼" एंगल (हवादार व मजबूत)',
    shortName: 'सादा ग्रिल दरवाजा',
    sheetDesc: '18 गेज चादर बॉर्डर',
    angleDesc: '1¼" एंगल (3mm)',
    supportDesc: '10mm गोल सरिया',
    badge: 'हवादार व मजबूत',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    key: 'custom',
    label: '5. कस्टम दरवाजा — अपनी पसंद से नाम, साइज व मेटल भरें (Custom)',
    shortName: 'कस्टम नया दरवाजा',
    sheetDesc: 'कस्टम चादर',
    angleDesc: 'कस्टम फ्रेम',
    supportDesc: 'कस्टम सपोर्ट',
    badge: 'मैन्युअल एंट्री',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200'
  }
];

// Common Hindi to English transliteration map for fabrication terms
function transliterateHindi(text: string): string {
  const dictionary: Record<string, string> = {
    'सादा': 'sada',
    'दरवाजा': 'darwaza',
    'दरवाज़ा': 'darwaza',
    'गेट': 'gate',
    'लोहा': 'loha',
    'लोहे': 'lohe',
    'का': 'ka',
    'की': 'ki',
    'के': 'ke',
    'ग्रिल': 'grill',
    'रेलिंग': 'railing',
    'खिड़की': 'khidki',
    'पाइप': 'pipe',
    'चादर': 'chadar',
    'एंगल': 'angle',
    'सरिया': 'sariya',
    'बाउंड्री': 'boundary',
    'शटर': 'shutter',
    'मेन': 'main',
    'छोटा': 'chhota',
    'बड़ा': 'bada',
    'भारी': 'heavy',
    'मजबूत': 'majboot',
    'डिजाइन': 'design',
    'डबल': 'double',
    'सिंगल': 'single',
    'पल्ला': 'palla',
  };

  let clean = text.trim();
  for (const [hindi, eng] of Object.entries(dictionary)) {
    clean = clean.replaceAll(hindi, eng);
  }

  // Remove any remaining non-alphanumeric characters except spaces/hyphens
  const slugified = clean
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slugified || `gate-${Date.now().toString().slice(-4)}`;
}

export function ProductQuickFabrication() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pricingModel, setPricingModel] = useState<'per_kg' | 'fixed'>('per_kg');
  const [rateInput, setRateInput] = useState<string>('110');
  const ratePerKg = parseFloat(rateInput) || 0;
  const [selectedAngleId, setSelectedAngleId] = useState<string>(ANGLE_OPTIONS[0].id);
  const [selectedSheetId, setSelectedSheetId] = useState<string>(SHEET_OPTIONS[0].id);
  const [selectedSupportId, setSelectedSupportId] = useState<string>(SUPPORT_OPTIONS[0].id);
  const [activePreset, setActivePreset] = useState<string>('sada-std');

  // Custom presets created by the user / staff
  const [customPresets, setCustomPresets] = useState<UserPreset[]>([]);
  const [showAddPresetModal, setShowAddPresetModal] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetAngleId, setNewPresetAngleId] = useState<string>(ANGLE_OPTIONS[0].id);
  const [newPresetSheetId, setNewPresetSheetId] = useState<string>(SHEET_OPTIONS[0].id);
  const [newPresetSupportId, setNewPresetSupportId] = useState<string>(SUPPORT_OPTIONS[0].id);
  const [newPresetBadge, setNewPresetBadge] = useState('');
  const [newPresetRate, setNewPresetRate] = useState('110');

  // Load custom presets from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCustomPresets(parsed);
        }
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  const saveCustomPresetsToStorage = (updated: UserPreset[]) => {
    setCustomPresets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage access errors
    }
  };

  const handleRateChange = (raw: string) => {
    if (raw === '') {
      setRateInput('');
      applyPreset(activePreset, 0);
      return;
    }
    let clean = raw.replace(/[^0-9]/g, '');
    if (/^0+[1-9]/.test(clean)) {
      clean = clean.replace(/^0+/, '');
    } else if (/^0{2,}$/.test(clean)) {
      clean = '0';
    }
    setRateInput(clean);
    const num = clean === '' ? 0 : parseFloat(clean);
    applyPreset(activePreset, isNaN(num) ? 0 : num);
  };

  const angle = ANGLE_OPTIONS.find((a) => a.id === selectedAngleId) ?? ANGLE_OPTIONS[0];
  const sheet = SHEET_OPTIONS.find((s) => s.id === selectedSheetId) ?? SHEET_OPTIONS[0];
  const support = SUPPORT_OPTIONS.find((sp) => sp.id === selectedSupportId) ?? SUPPORT_OPTIONS[0];

  // Helper to safely set an input value and trigger synthetic events
  const setInputValue = (input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null, value: string) => {
    if (!input) return;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };

  // Apply a custom user preset
  const applyUserPreset = (cp: UserPreset, form: HTMLFormElement, rate: number) => {
    setSelectedAngleId(cp.angleId);
    setSelectedSheetId(cp.sheetId);
    setSelectedSupportId(cp.supportId);

    const aObj = ANGLE_OPTIONS.find((a) => a.id === cp.angleId) ?? ANGLE_OPTIONS[0];
    const sObj = SHEET_OPTIONS.find((s) => s.id === cp.sheetId) ?? SHEET_OPTIONS[0];
    const spObj = SUPPORT_OPTIONS.find((sp) => sp.id === cp.supportId) ?? SUPPORT_OPTIONS[0];

    const pName = cp.name;
    const slug = transliterateHindi(pName);
    const sku = `GATE-${slug.toUpperCase().slice(0, 14)}`;

    const effectiveRate = cp.ratePerKg || rate || 110;
    const baseWeight = calculateFabricationWeight(7.0, 3.0, aObj, sObj, spObj);
    const maxWeight = calculateFabricationWeight(8.0, 3.5, aObj, sObj, spObj);

    const basePrice = calculateFabricationPrice(baseWeight.totalWeightKg, pricingModel, effectiveRate);
    const maxPrice = calculateFabricationPrice(maxWeight.totalWeightKg, pricingModel, effectiveRate);

    setInputValue(form.querySelector('input[name="name"]'), pName);
    setInputValue(form.querySelector('input[name="sku"]'), sku);
    setInputValue(form.querySelector('input[name="slug"]'), slug);
    setInputValue(form.querySelector('input[name="material"]'), `माइल्ड स्टील (${sObj.gauge} चादर + ${aObj.label.split(' ')[0]} एंगल + सरिया)`);
    setInputValue(form.querySelector('input[name="finish"]'), 'रेड ऑक्साइड प्राइमर + इनेमल पेंट');
    setInputValue(form.querySelector('input[name="weight_kg"]'), String(baseWeight.totalWeightKg));
    setInputValue(form.querySelector('input[name="price_min_minor"]'), String(basePrice.priceInr));
    setInputValue(form.querySelector('input[name="price_max_minor"]'), String(maxPrice.priceInr));
    setInputValue(
      form.querySelector('textarea[name="description"]'),
      `कस्टम लोहे का उत्पाद (${cp.name})। ${sObj.label}, ${aObj.label} और मजबूत सपोर्ट के साथ। वेल्डिंग व प्राइमर कोटिंग सहित।`
    );
    setInputValue(
      form.querySelector('textarea[name="design_details"]'),
      `फ्रेम: ${aObj.label}\nचादर: ${sObj.label}\nसपोर्ट: ${spObj.label}\nस्टैंडर्ड साइज: 6x3, 7x3, 8x3, 8x3.4, 8x3.5`
    );

    // Check custom_size checkbox
    const customSizeCheckbox = form.querySelector<HTMLInputElement>('input[name="custom_size"]');
    if (customSizeCheckbox && !customSizeCheckbox.checked) {
      customSizeCheckbox.checked = true;
      customSizeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Design code
    const designCodeInput = form.querySelector<HTMLInputElement>('input[name="design_code"]');
    if (designCodeInput && !designCodeInput.value) {
      setInputValue(designCodeInput, `CUST-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // Apply a full preset to form fields
  const applyPreset = (presetKey: string, rate = ratePerKg) => {
    setActivePreset(presetKey);
    if (presetKey === 'custom') return;

    const form = containerRef.current?.closest('form');
    if (!form) return;

    // Check if it's a custom preset created by the user
    const customMatch = customPresets.find((cp) => cp.id === presetKey);
    if (customMatch) {
      applyUserPreset(customMatch, form, rate);
      return;
    }

    let pName = 'सादा लोहे का दरवाजा (18 गेज)';
    let pAngleId = 'angle-32-3'; // 1¼" × 3mm
    let pSheetId = 'sheet-18g'; // 18G
    let pSupportId = 'bar-10mm'; // 10mm Bar
    let pDesc = 'मजबूत लोहे का सादा दरवाजा। 18 गेज टाटा शीट, 1¼" एंगल फ्रेम और मजबूत सरिया सपोर्ट के साथ। वेल्डिंग व रेड ऑक्साइड प्राइमर कोटिंग सहित।';

    if (presetKey === 'sada-heavy') {
      pName = 'हेवी सादा लोहे का दरवाजा (16 गेज)';
      pAngleId = 'angle-40-3'; // 1½" × 3mm
      pSheetId = 'sheet-16g'; // 16G
      pSupportId = 'bar-12mm'; // 12mm Bar
      pDesc = 'अत्यधिक मजबूत लोहे का सादा दरवाजा। 16 गेज हेवी शीट, 1½" एंगल फ्रेम और 12mm सरिया सपोर्ट। सुरक्षा व मजबूती के लिए सर्वोत्तम।';
    } else if (presetKey === 'sada-light') {
      pName = 'किफायती सादा दरवाजा (20 गेज)';
      pAngleId = 'angle-32-3'; // 1¼" × 3mm
      pSheetId = 'sheet-20g'; // 20G
      pSupportId = 'patti-25-3'; // Flat Patti
      pDesc = 'कम बजट व हल्की जगहों (छत, स्टोर रूम) के लिए किफायती 20 गेज सादा दरवाजा, 1¼" एंगल फ्रेम सहित।';
    } else if (presetKey === 'sada-grill') {
      pName = 'सादा लोहे का ग्रिल दरवाजा (सरिया + एंगल)';
      pAngleId = 'angle-32-3';
      pSheetId = 'sheet-18g';
      pSupportId = 'bar-10mm';
      pDesc = 'हवादार व मजबूत सादा ग्रिल दरवाजा, 1¼" एंगल व 10mm गोल सरिया के साथ मजबूत कब्जा और कुंडी फिटिंग सहित।';
    }

    setSelectedAngleId(pAngleId);
    setSelectedSheetId(pSheetId);
    setSelectedSupportId(pSupportId);

    const aObj = ANGLE_OPTIONS.find((a) => a.id === pAngleId) ?? ANGLE_OPTIONS[0];
    const sObj = SHEET_OPTIONS.find((s) => s.id === pSheetId) ?? SHEET_OPTIONS[0];
    const spObj = SUPPORT_OPTIONS.find((sp) => sp.id === pSupportId) ?? SUPPORT_OPTIONS[0];

    const slug = transliterateHindi(pName);
    const sku = `GATE-${slug.toUpperCase().slice(0, 14)}`;

    const baseWeight = calculateFabricationWeight(7.0, 3.0, aObj, sObj, spObj);
    const maxWeight = calculateFabricationWeight(8.0, 3.5, aObj, sObj, spObj);

    const basePrice = calculateFabricationPrice(baseWeight.totalWeightKg, pricingModel, rate);
    const maxPrice = calculateFabricationPrice(maxWeight.totalWeightKg, pricingModel, rate);

    setInputValue(form.querySelector('input[name="name"]'), pName);
    setInputValue(form.querySelector('input[name="sku"]'), sku);
    setInputValue(form.querySelector('input[name="slug"]'), slug);
    setInputValue(form.querySelector('input[name="material"]'), `माइल्ड स्टील (${sObj.gauge} चादर + ${aObj.label.split(' ')[0]} एंगल + सरिया)`);
    setInputValue(form.querySelector('input[name="finish"]'), 'रेड ऑक्साइड प्राइमर + इनेमल पेंट');
    setInputValue(form.querySelector('input[name="weight_kg"]'), String(baseWeight.totalWeightKg));
    setInputValue(form.querySelector('input[name="price_min_minor"]'), String(basePrice.priceInr));
    setInputValue(form.querySelector('input[name="price_max_minor"]'), String(maxPrice.priceInr));
    setInputValue(form.querySelector('textarea[name="description"]'), pDesc);
    setInputValue(form.querySelector('textarea[name="design_details"]'), `फ्रेम: ${aObj.label}\nचादर: ${sObj.label}\nसपोर्ट: ${spObj.label}\nस्टैंडर्ड साइज: 6x3, 7x3, 8x3, 8x3.4, 8x3.5`);

    // Check custom_size checkbox
    const customSizeCheckbox = form.querySelector<HTMLInputElement>('input[name="custom_size"]');
    if (customSizeCheckbox && !customSizeCheckbox.checked) {
      customSizeCheckbox.checked = true;
      customSizeCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Design code
    const designCodeInput = form.querySelector<HTMLInputElement>('input[name="design_code"]');
    if (designCodeInput && !designCodeInput.value) {
      setInputValue(designCodeInput, `SD-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const handleSaveNewPreset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newPresetName.trim();
    if (!trimmedName) {
      notify('कृपया टेम्पलेट का नाम दर्ज करें (Please enter template name)');
      return;
    }

    const newPreset: UserPreset = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      angleId: newPresetAngleId,
      sheetId: newPresetSheetId,
      supportId: newPresetSupportId,
      badge: newPresetBadge.trim() || 'कस्टम मॉडल',
      ratePerKg: parseFloat(newPresetRate) || ratePerKg || 110,
    };

    const updated = [...customPresets, newPreset];
    saveCustomPresetsToStorage(updated);

    // Reset modal form
    setNewPresetName('');
    setNewPresetBadge('');
    setShowAddPresetModal(false);

    notify(`नया टेम्पलेट "${trimmedName}" सेव हो गया!`);

    // Apply the newly created preset right away
    setTimeout(() => {
      applyPreset(newPreset.id);
    }, 50);
  };

  const handleDeletePreset = (idToDelete: string) => {
    const target = customPresets.find((cp) => cp.id === idToDelete);
    const confirmName = target ? target.name : 'यह टेम्पलेट';
    if (!window.confirm(`क्या आप सचमुच "${confirmName}" टेम्पलेट हटाना चाहते हैं?`)) {
      return;
    }

    const updated = customPresets.filter((cp) => cp.id !== idToDelete);
    saveCustomPresetsToStorage(updated);
    notify(`टेम्पलेट "${confirmName}" हटा दिया गया`);

    // Revert to standard preset
    applyPreset('sada-std');
  };

  // Sync with form inputs on mount & listen to name input changes
  useEffect(() => {
    const form = containerRef.current?.closest('form');
    if (!form) return;

    const nameInput = form.querySelector<HTMLInputElement>('input[name="name"]');
    const skuInput = form.querySelector<HTMLInputElement>('input[name="sku"]');
    const slugInput = form.querySelector<HTMLInputElement>('input[name="slug"]');

    if (!nameInput) return;

    const handleNameInput = () => {
      const val = nameInput.value.trim();
      if (!val) return;

      const slug = transliterateHindi(val);
      if (slugInput && (!slugInput.value || slugInput.value.startsWith('sada-') || slugInput.value.startsWith('gate-'))) {
        setInputValue(slugInput, slug);
      }

      if (skuInput && (!skuInput.value || skuInput.value.startsWith('GATE-'))) {
        const skuSlug = slug.toUpperCase().slice(0, 14);
        setInputValue(skuInput, `GATE-${skuSlug}`);
      }
    };

    nameInput.addEventListener('input', handleNameInput);
    nameInput.addEventListener('blur', handleNameInput);

    return () => {
      nameInput.removeEventListener('input', handleNameInput);
      nameInput.removeEventListener('blur', handleNameInput);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="mb-6 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/50 p-4 sm:p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm">
            <Scale size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                ⚡ गेटवाला फैब्रिकेशन क्विक मोड (Auto-Fill Fabrication)
              </h3>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                सुझाव
              </span>
            </div>
            <p className="text-xs text-slate-600">
              नीचे किसी भी रेडीमेड विकल्प पर क्लिक करें — नाम, SKU, URL Slug, वजन, मटेरियल व कीमतें अपने आप भर जाएंगी!
            </p>
          </div>
        </div>
      </div>

      {/* Preset Single Dropdown Selector Box */}
      <div className="mt-4 rounded-xl border border-emerald-300/80 bg-white p-3.5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <label htmlFor="quick-door-preset-select" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-600" />
            <span>रेडीमेड दरवाजा मॉडल चुनें (Select Door Model):</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-slate-500 font-medium">
              चुनते ही नाम, SKU, वजन व 5 साइज अपने आप भर जाएंगे
            </span>
            <button
              type="button"
              onClick={() => setShowAddPresetModal(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 hover:text-emerald-950 shadow-xs cursor-pointer"
            >
              <Plus size={13} className="text-emerald-700" />
              <span>+ नया टेम्पलेट बनाएं</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <select
              id="quick-door-preset-select"
              aria-label="रेडीमेड दरवाजा मॉडल चुनें"
              value={activePreset}
              onChange={(e) => applyPreset(e.target.value)}
              className="w-full appearance-none rounded-xl border-2 border-emerald-600/40 bg-emerald-50/60 px-3.5 py-2.5 pr-10 text-xs sm:text-sm font-bold text-slate-900 transition hover:border-emerald-600 focus:border-emerald-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <optgroup label="✨ रेडीमेड स्टैंडर्ड टेम्पलेट्स (Standard Presets)">
                {PRESET_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key} className="py-1 font-semibold text-slate-800">
                    {opt.label}
                  </option>
                ))}
              </optgroup>

              {customPresets.length > 0 && (
                <optgroup label="⭐ आपके बनाए टेम्पलेट्स (Your Custom Templates)">
                  {customPresets.map((cp) => {
                    const a = ANGLE_OPTIONS.find((ao) => ao.id === cp.angleId);
                    const s = SHEET_OPTIONS.find((so) => so.id === cp.sheetId);
                    return (
                      <option key={cp.id} value={cp.id} className="py-1 font-semibold text-slate-800">
                        ⭐ {cp.name} — {s?.gauge || 'चादर'} + {a?.label.split(' ')[0] || 'एंगल'} ({cp.badge || 'कस्टम'})
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-800">
              <ChevronDown size={18} />
            </div>
          </div>

          {/* Delete button if current preset is user custom preset */}
          {activePreset.startsWith('custom-') && (
            <button
              type="button"
              onClick={() => handleDeletePreset(activePreset)}
              title="इस कस्टम टेम्पलेट को डिलीट करें"
              className="inline-flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 hover:border-rose-400 shrink-0 cursor-pointer"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">हटाएं</span>
            </button>
          )}
        </div>

        {/* Dynamic Spec Pills below dropdown */}
        {(() => {
          const customMatch = customPresets.find((cp) => cp.id === activePreset);
          if (customMatch) {
            const a = ANGLE_OPTIONS.find((ao) => ao.id === customMatch.angleId) || ANGLE_OPTIONS[0];
            const s = SHEET_OPTIONS.find((so) => so.id === customMatch.sheetId) || SHEET_OPTIONS[0];
            const sp = SUPPORT_OPTIONS.find((spo) => spo.id === customMatch.supportId) || SUPPORT_OPTIONS[0];
            return (
              <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <span className="font-semibold text-slate-500">शामिल मटेरियल:</span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                  चादर: <strong>{s.label.split('(')[0].trim()}</strong>
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                  फ्रेम: <strong>{a.label.split('(')[0].trim()}</strong>
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                  सपोर्ट: <strong>{sp.label.split('(')[0].trim()}</strong>
                </span>
                <span className="rounded-md border border-amber-300 bg-amber-100 px-2 py-0.5 font-bold text-amber-900">
                  ⭐ {customMatch.badge || 'आपका कस्टम मॉडल'}
                </span>
              </div>
            );
          }

          const current = PRESET_OPTIONS.find((p) => p.key === activePreset) || PRESET_OPTIONS[0];
          return (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
              <span className="font-semibold text-slate-500">शामिल मटेरियल:</span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                चादर: <strong>{current.sheetDesc}</strong>
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                फ्रेम: <strong>{current.angleDesc}</strong>
              </span>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium text-slate-700">
                सपोर्ट: <strong>{current.supportDesc}</strong>
              </span>
              <span className={`rounded-md border px-2 py-0.5 font-bold ${current.badgeClass}`}>
                {current.badge}
              </span>
            </div>
          );
        })()}

        {/* Inline Create New Template Form Modal / Panel */}
        {showAddPresetModal && (
          <div className="mt-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/40 p-3.5 sm:p-4 shadow-sm transition-all">
            <div className="flex items-center justify-between pb-2.5 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-700 text-white text-xs font-bold">
                  +
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  नया फैब्रिकेशन टेम्पलेट बनाएं (Create Custom Fabrication Template)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddPresetModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-emerald-100 hover:text-slate-800 transition"
                title="बंद करें"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  टेम्पलेट का नाम (Product / Door Name) *
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="उदा. डबल पल्ला सादा गेट, स्टोर रूम दरवाजा, बाउंड्री ग्रिल"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  autoFocus
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  यह नाम ड्रॉपडाउन में दिखाई देगा और चुनते ही प्रोडक्ट फॉर्म में भर जाएगा।
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  फ्रेम एंगल (Angle Frame)
                </label>
                <select
                  value={newPresetAngleId}
                  onChange={(e) => setNewPresetAngleId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                >
                  {ANGLE_OPTIONS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  चादर मोटाई (Sheet Gauge)
                </label>
                <select
                  value={newPresetSheetId}
                  onChange={(e) => setNewPresetSheetId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                >
                  {SHEET_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  सपोर्ट सरिया / पत्ती (Support)
                </label>
                <select
                  value={newPresetSupportId}
                  onChange={(e) => setNewPresetSupportId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                >
                  {SUPPORT_OPTIONS.map((sp) => (
                    <option key={sp.id} value={sp.id}>
                      {sp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  टैग या बैज (Badge/Tag, Optional)
                </label>
                <input
                  type="text"
                  value={newPresetBadge}
                  onChange={(e) => setNewPresetBadge(e.target.value)}
                  placeholder="उदा. स्पेशल कस्टम, सबसे मजबूत, दुकान के लिए"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  डिफ़ॉल्ट रेट (₹/kg)
                </label>
                <input
                  type="number"
                  value={newPresetRate}
                  onChange={(e) => setNewPresetRate(e.target.value)}
                  placeholder="110"
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3.5 flex items-center justify-end gap-2 border-t border-emerald-200 pt-3">
              <button
                type="button"
                onClick={() => setShowAddPresetModal(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={() => handleSaveNewPreset()}
                className="rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition cursor-pointer"
              >
                ✓ टेम्पलेट सेव करें (Save Template)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pricing & Material Customization Strip */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 border-t border-slate-200/80 pt-4">
        {/* Rate selection */}
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <label className="text-xs font-bold text-slate-700">भाव का तरीका (Pricing Model):</label>
          <div className="mt-2 flex gap-4 text-xs font-semibold">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="quick_pricing_mode"
                checked={pricingModel === 'per_kg'}
                onChange={() => setPricingModel('per_kg')}
                className="accent-emerald-700"
              />
              विकल्प A: प्रति किलो भाव (Per Kg)
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="quick_pricing_mode"
                checked={pricingModel === 'fixed'}
                onChange={() => setPricingModel('fixed')}
                className="accent-emerald-700"
              />
              विकल्प C: फिक्स रेट (Fixed)
            </label>
          </div>

          {pricingModel === 'per_kg' && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="text-slate-500">रेट (₹/kg):</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rateInput}
                onFocus={(e) => {
                  e.target.select();
                }}
                onChange={(e) => handleRateChange(e.target.value)}
                onBlur={() => {
                  if (rateInput === '' || isNaN(parseFloat(rateInput))) {
                    setRateInput('0');
                    applyPreset(activePreset, 0);
                  }
                }}
                placeholder="0"
                className="w-20 rounded border border-emerald-300 px-2 py-1 font-bold text-emerald-950 focus:border-emerald-600 focus:outline-none"
              />
              <span className="text-slate-500">रुपये प्रति किलो (डिफ़ॉल्ट ₹110)</span>
            </div>
          )}
        </div>

        {/* Material Selection */}
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <label className="text-xs font-bold text-slate-700">कस्टम मटेरियल बदलाव:</label>
          <div className="mt-2 grid grid-cols-3 gap-1.5 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">एंगल</span>
              <select
                value={selectedAngleId}
                onChange={(e) => {
                  setSelectedAngleId(e.target.value);
                  setTimeout(() => applyPreset(activePreset), 50);
                }}
                className="w-full rounded border border-slate-200 p-1 text-[11px]"
              >
                {ANGLE_OPTIONS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label.split('(')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">चादर</span>
              <select
                value={selectedSheetId}
                onChange={(e) => {
                  setSelectedSheetId(e.target.value);
                  setTimeout(() => applyPreset(activePreset), 50);
                }}
                className="w-full rounded border border-slate-200 p-1 text-[11px]"
              >
                {SHEET_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label.split('(')[0]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block mb-0.5">सपोर्ट</span>
              <select
                value={selectedSupportId}
                onChange={(e) => {
                  setSelectedSupportId(e.target.value);
                  setTimeout(() => applyPreset(activePreset), 50);
                }}
                className="w-full rounded border border-slate-200 p-1 text-[11px]"
              >
                {SUPPORT_OPTIONS.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Standard Sizes Table */}
      <div className="mt-3 rounded-xl border border-emerald-200 bg-white p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Layers size={14} className="text-emerald-700" />
            स्वतः बनने वाले 5 स्टैंडर्ड साइज (अनुमानित वजन व भाव @ ₹{ratePerKg}/kg):
          </span>
          <span className="text-[11px] text-emerald-800 font-medium">
            5 वेरिएंट्स ऑटो-क्रिएट होंगे
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STANDARD_GATE_SIZES.map((preset) => {
            const breakdown = calculateFabricationWeight(
              preset.heightFeet,
              preset.widthFeet,
              angle,
              sheet,
              support
            );
            const pricing = calculateFabricationPrice(
              breakdown.totalWeightKg,
              pricingModel,
              ratePerKg
            );
            return (
              <div
                key={preset.id}
                className="flex flex-col justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-2 text-center"
              >
                <div className="font-bold text-slate-900">{preset.label.split(' ')[0]} ft</div>
                <div className="text-[11px] text-slate-500">~{breakdown.totalWeightKg} kg</div>
                <div className="mt-1 font-bold text-emerald-800">₹{pricing.priceInr.toLocaleString('en-IN')}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Info size={13} className="shrink-0 text-slate-400" />
          <span>
            जैसे ही आप नीचे <strong>"Save record"</strong> दबाएंगे, यह प्रोडक्ट और इसके सभी 5 साइज वेबसाइट पर एक्टिव हो जाएंगे।
          </span>
        </div>
      </div>
    </div>
  );
}
