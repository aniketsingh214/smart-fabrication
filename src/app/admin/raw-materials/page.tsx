'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MATERIAL_CATEGORIES,
  PRELOADED_MATERIAL_CATALOG,
  matchMaterialSearch,
  type MaterialItem,
} from '@/features/materials/material-catalog-data';
import {
  convertPurchaseToStock,
  reconcileKantaWeight,
  type PurchaseUnit,
} from '@/features/materials/multi-unit-converter';
import { exportMaterialsToCSV } from '@/features/materials/material-import-export';
import { MaterialQuickAddModal } from '@/features/materials/material-quick-add-modal';
import {
  Search,
  Plus,
  Download,
  Upload,
  Scale,
  Calculator,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RawMaterialsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialItem[]>(PRELOADED_MATERIAL_CATALOG);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'kanta'>('catalog');

  // Kanta Weighbridge State
  const [billedWeight, setBilledWeight] = useState<number>(500);
  const [actualWeight, setActualWeight] = useState<number>(496);
  const [tolerance, setTolerance] = useState<number>(2.0);

  // Multi-unit interactive calculator state
  const [calcMaterialCode, setCalcMaterialCode] = useState<string>('PIPE-SQ-25-18G');
  const [calcQty, setCalcQty] = useState<number>(10);
  const [calcUnit, setCalcUnit] = useState<PurchaseUnit>('bundle');

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      if (activeCategory !== 'all' && item.category_id !== activeCategory) {
        return false;
      }
      return matchMaterialSearch(item, searchTerm);
    });
  }, [materials, activeCategory, searchTerm]);

  // Selected calc material
  const currentCalcMaterial = useMemo(() => {
    return materials.find((m) => m.code === calcMaterialCode) ?? materials[0];
  }, [materials, calcMaterialCode]);

  // Live conversion result
  const conversionResult = useMemo(() => {
    return convertPurchaseToStock(calcQty, calcUnit, currentCalcMaterial);
  }, [calcQty, calcUnit, currentCalcMaterial]);

  // Live Kanta reconciliation
  const kantaResult = useMemo(() => {
    return reconcileKantaWeight(billedWeight, actualWeight, tolerance);
  }, [billedWeight, actualWeight, tolerance]);

  const handleExportCSV = () => {
    const csv = exportMaterialsToCSV(filteredMaterials);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GateWala_Raw_Materials_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMaterialCreated = (newItem: MaterialItem) => {
    setMaterials((prev) => [newItem, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-bold text-teal-800">
              इन्वेंट्री व खरीद (Procurement)
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">रॉ मटेरियल मास्टर</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            कच्चा माल मास्टर (Raw Material Master)
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            लोहा, पाइप, एंगल, चादर, फिटिंग व वेल्डिंग सामग्री का संपूर्ण कैटलॉग, बहु-इकाई खरीद व स्टॉक प्रबंधन।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={() => setIsQuickAddOpen(true)} className="gap-2">
            <Plus size={16} />
            नया मटेरियल जोड़ें
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/admin/raw-materials/import">
              <Upload size={16} />
              बल्क एक्सेल इम्पोर्ट
            </Link>
          </Button>

          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download size={16} />
            CSV एक्सपोर्ट ({filteredMaterials.length})
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={16} />
          मटेरियल कैटलॉग ({filteredMaterials.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kanta')}
          className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'kanta'
              ? 'border-teal-600 text-teal-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Scale size={16} />
          धर्म कांटा पर्ची मिलान (Weighbridge Reconciliation)
        </button>
      </div>

      {activeTab === 'catalog' && (
        <>
          {/* Quick Unit Conversion Bar */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm">
                  <Calculator size={17} />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    खरीद यूनिट से स्टॉक रूपांतरण (Multi-Unit Quick Calculator)
                  </h3>
                  <p className="text-[11px] text-slate-600">
                    बंडल, फीट या बॉक्स की खरीद को सीधे स्टॉक पीस व वजन (KG) में बदलें।
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <select
                  value={calcMaterialCode}
                  onChange={(e) => setCalcMaterialCode(e.target.value)}
                  className="rounded-lg border border-teal-300 bg-white px-2.5 py-1.5 font-medium text-slate-800"
                >
                  {materials.slice(0, 15).map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={calcQty}
                  onChange={(e) => setCalcQty(Number(e.target.value) || 1)}
                  className="w-16 rounded-lg border border-teal-300 bg-white px-2 py-1.5 font-bold text-slate-900 text-center"
                />

                <select
                  value={calcUnit}
                  onChange={(e) => setCalcUnit(e.target.value as any)}
                  className="rounded-lg border border-teal-300 bg-white px-2 py-1.5 font-medium text-slate-800"
                >
                  <option value="bundle">बंडल (Bundle)</option>
                  <option value="feet">फीट (Feet)</option>
                  <option value="piece">पीस (Piece)</option>
                  <option value="box">बॉक्स (Box)</option>
                  <option value="kg">किलो (KG)</option>
                </select>

                <ArrowRight size={15} className="text-teal-700" />

                <div className="rounded-lg bg-teal-700 px-3 py-1.5 font-bold text-white shadow-sm">
                  {conversionResult.conversionSummary}
                </div>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="मटेरियल खोजें: इंग्लिश नाम, हिंदी नाम, साइज, गेज (उदा. 1 इंची पाइप, सवा इंची एंगल, 18 gauge, tata chadar)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                सभी श्रेणियां ({materials.length})
              </button>

              {MATERIAL_CATEGORIES.map((cat) => {
                const count = materials.filter((m) => m.category_id === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`rounded-lg px-3 py-1.5 font-semibold transition-all whitespace-nowrap ${
                      activeCategory === cat.id
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name_hi.split('(')[0]} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Materials Grid / Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredMaterials.map((item) => (
              <div
                key={item.code}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-teal-300 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                        {item.category_id.replace('_', ' ')}
                      </span>
                      <h3 className="mt-1 text-sm font-bold text-slate-900 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xs font-semibold text-slate-600">{item.name_hi}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.code}
                    </span>
                  </div>

                  {/* Local Nicknames */}
                  {item.local_aliases.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {item.local_aliases.map((alias) => (
                        <span
                          key={alias}
                          className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200/60"
                        >
                          बोलचाल: {alias}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Specifications Grid */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-2.5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">साइज / माप:</span>
                      <span className="font-bold text-slate-800">{item.size}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">गेज व मोटाई:</span>
                      <span className="font-bold text-slate-800">
                        {item.gauge || '—'} ({item.thickness_mm} mm)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ब्रांड व ग्रेड:</span>
                      <span className="font-medium text-slate-700 truncate block">
                        {item.brand || 'Commercial'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">अनुमानित वजन:</span>
                      <span className="font-bold text-teal-900">
                        ~{item.weight_kg_per_unit} kg / {item.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">कम-स्टॉक अलर्ट:</span>
                    <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      &lt; {item.reorder_level} {item.unit}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-medium">
                    इकाइयां: {item.purchase_units.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMaterials.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center bg-white">
              <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-bold text-slate-800">कोई मटेरियल नहीं मिला</h3>
              <p className="mt-1 text-xs text-slate-500">
                "{searchTerm}" से मेल खाता कोई रिकॉर्ड उपलब्ध नहीं है। आप नया मटेरियल जोड़ सकते हैं।
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
              >
                सभी मटेरियल देखें
              </Button>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Dharam Kanta Weighbridge Slip Reconciliation */}
      {activeTab === 'kanta' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
              <Scale size={20} />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                धर्म कांटा वजन मिलान (Dharam Kanta Slip Reconciliation)
              </h2>
              <p className="text-xs text-slate-500">
                स्टील डीलर के बिल के वजन और वर्कशॉप में उतरे माल के वास्तविक कांटे के वजन का मिलान करें।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-xs font-bold text-slate-700 block">
                1. डीलर के बिल का वजन (Billed Weight in KG):
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={billedWeight}
                onChange={(e) => setBilledWeight(Number(e.target.value) || 0)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-bold text-lg text-slate-900 shadow-sm"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                बिल / चालान में दर्शाया गया वजन
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-xs font-bold text-slate-700 block">
                2. कांटे की पर्ची का वजन (Actual Received Weight in KG):
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={actualWeight}
                onChange={(e) => setActualWeight(Number(e.target.value) || 0)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-bold text-lg text-slate-900 shadow-sm"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                धर्म कांटे पर तौला गया वास्तविक वजन
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="text-xs font-bold text-slate-700 block">
                3. मान्य छूट सीमा (Tolerance %):
              </label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value) || 2.0)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 font-bold text-lg text-slate-900 shadow-sm"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                सामान्य स्टील ट्रेड छूट: 1.5% से 2.0%
              </span>
            </div>
          </div>

          {/* Reconciliation Result Card */}
          <div
            className={`mt-6 rounded-2xl border-2 p-5 ${
              kantaResult.isAcceptable
                ? 'border-emerald-300 bg-emerald-50/70'
                : 'border-red-300 bg-red-50/80'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {kantaResult.isAcceptable ? (
                  <CheckCircle2 size={32} className="text-emerald-700" />
                ) : (
                  <AlertTriangle size={32} className="text-red-600" />
                )}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{kantaResult.statusMessage}</h3>
                  <p className="text-xs text-slate-600">
                    अंतर (Variance):{' '}
                    <strong>
                      {kantaResult.varianceKg > 0 ? `+${kantaResult.varianceKg}` : kantaResult.varianceKg} kg
                    </strong>{' '}
                    ({kantaResult.variancePercent}%)
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">स्टॉक में दर्ज होने योग्य वजन:</span>
                <span className="text-xl font-extrabold text-slate-900">
                  {kantaResult.actualWeightKg} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      <MaterialQuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onCreated={handleMaterialCreated}
      />
    </div>
  );
}
