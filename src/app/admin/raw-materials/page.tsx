'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MATERIAL_CATEGORIES,
  PRELOADED_MATERIAL_CATALOG,
  matchMaterialSearch,
  getMaterialThumbnail,
  type MaterialItem,
} from '@/features/materials/material-catalog-data';
import {
  convertPurchaseToStock,
  type PurchaseUnit,
} from '@/features/materials/multi-unit-converter';
import { MaterialQuickAddModal } from '@/features/materials/material-quick-add-modal';
import { notify } from '@/lib/notify';
import {
  Search,
  Plus,
  Calculator,
  Layers,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Pencil,
  Table,
  LayoutGrid,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/data-table-pagination';

export default function RawMaterialsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialItem[]>(PRELOADED_MATERIAL_CATALOG);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialItem | null>(null);

  // Pagination state (default 10 records per page as requested)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Multi-unit interactive calculator state
  const [calcMaterialCode, setCalcMaterialCode] = useState<string>('PIPE-SQ-25-18G');
  const [calcQty, setCalcQty] = useState<number>(10);
  const [calcUnit, setCalcUnit] = useState<PurchaseUnit>('bundle');

  // Reset to page 1 when search or category changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((item) => {
      if (activeCategory !== 'all' && item.category_id !== activeCategory) {
        return false;
      }
      return matchMaterialSearch(item, searchTerm);
    });
  }, [materials, activeCategory, searchTerm]);

  // Paginated materials for the current page
  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedMaterials = useMemo(() => {
    return filteredMaterials.slice(startIndex, startIndex + pageSize);
  }, [filteredMaterials, startIndex, pageSize]);

  // Selected calc material
  const currentCalcMaterial = useMemo(() => {
    return materials.find((m) => m.code === calcMaterialCode) ?? materials[0];
  }, [materials, calcMaterialCode]);

  // Live conversion result
  const conversionResult = useMemo(() => {
    return convertPurchaseToStock(calcQty, calcUnit, currentCalcMaterial);
  }, [calcQty, calcUnit, currentCalcMaterial]);

  // Load additional materials from DB on mount
  React.useEffect(() => {
    async function fetchDbMaterials() {
      try {
        const res = await fetch('/api/v1/admin/materials?limit=100');
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          const dbItems: MaterialItem[] = json.data
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
      } catch {
        // Offline fallback
      }
    }
    fetchDbMaterials();
  }, []);

  const handleMaterialCreated = (newItem: MaterialItem) => {
    setMaterials((prev) => [newItem, ...prev]);
    notify(`नया मटेरियल "${newItem.name}" सफलतापूर्वक जोड़ दिया गया!`, 'success');
  };

  const handleMaterialUpdated = (updatedItem: MaterialItem) => {
    setMaterials((prev) =>
      prev.map((item) => (item.code === updatedItem.code ? updatedItem : item))
    );
    notify(`मटेरियल "${updatedItem.name}" सफलतापूर्वक अपडेट हो गया!`, 'success');
  };

  const handleDeleteMaterial = (code: string, name: string) => {
    if (typeof window !== 'undefined' && window.confirm(`क्या आप "${name}" को मटेरियल लिस्ट से हटाना चाहते हैं?`)) {
      setMaterials((prev) => prev.filter((item) => item.code !== code));
      notify(`मटेरियल "${name}" हटा दिया गया।`, 'success');
    }
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
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              कच्चा माल मास्टर (Raw Material Master)
            </h1>
            <span className="rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-teal-800">
              कुल प्रकार: {materials.length} मटेरियल ({MATERIAL_CATEGORIES.length} श्रेणियां)
            </span>
          </div>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
            लोहा, पाइप, एंगल, चादर, फिटिंग व वेल्डिंग सामग्री का संपूर्ण कैटलॉग, बहु-इकाई खरीद व स्टॉक प्रबंधन।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button onClick={() => setIsQuickAddOpen(true)} className="gap-2 bg-teal-700 hover:bg-teal-800">
            <Plus size={16} />
            + नया मटेरियल जोड़ें
          </Button>

          <Button asChild variant="outline" className="gap-2">
            <Link href="/admin/materials">
              <Table size={16} />
              डेटाबेस टेबल लिस्ट देखें
            </Link>
          </Button>
        </div>
      </div>

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

              <div className="admin-unit-converter flex flex-wrap items-center gap-2 text-xs">
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

            {/* Search Bar & Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
              {/* Search input with live clear */}
              <div className="relative flex-1 min-w-[260px]">
                <Search size={16} className="royal-search-leading absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="मटेरियल खोजें: इंग्लिश, हिंदी नाम, साइज, गेज (उदा. 1 इंची पाइप, सवा इंची एंगल, 18 gauge, tata chadar)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded"
                    title="सर्च हटाएं"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* Rows per page selector & counts */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <label htmlFor="rawMaterialsPageSize" className="font-semibold whitespace-nowrap">
                    प्रति पेज:
                  </label>
                  <select
                    id="rawMaterialsPageSize"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-bold text-slate-800 shadow-xs focus:border-teal-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <span className="text-xs font-semibold text-slate-500 hidden sm:inline tabular-nums">
                  {filteredMaterials.length === 0
                    ? '0 रिकॉर्ड'
                    : `${startIndex + 1}–${Math.min(startIndex + pageSize, filteredMaterials.length)} (${filteredMaterials.length} में से)`}
                </span>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Table size={13} />
                    टेबल
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'cards'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid size={13} />
                    कार्ड
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 1. TABLE VIEW: S.No. -> Image -> Name -> Specs -> Category -> Unit -> Reorder -> Delete */}
          {viewMode === 'table' && paginatedMaterials.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">क्र.सं.</th>
                      <th className="py-3 px-3 w-16 text-center">फोटो (Image)</th>
                      <th className="py-3 px-4">मटेरियल का नाम (Material Name)</th>
                      <th className="py-3 px-3.5">साइज व मोटाई (Size / Gauge)</th>
                      <th className="py-3 px-3.5">श्रेणी (Category)</th>
                      <th className="py-3 px-3 text-center">इकाई (Unit)</th>
                      <th className="py-3 px-3.5">ब्रांड / ग्रेड</th>
                      <th className="py-3 px-3.5 text-right">स्टॉक अलर्ट</th>
                      <th className="py-3 px-4 text-center w-28">कार्रवाई (Action)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedMaterials.map((item, index) => {
                      const sNo = startIndex + index + 1;
                      return (
                        <tr key={item.code} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-400 tabular-nums">
                            {sNo}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="h-11 w-11 mx-auto rounded-xl border border-slate-200 overflow-hidden bg-white p-0.5 shadow-xs flex items-center justify-center">
                              <img
                                src={getMaterialThumbnail(item)}
                                alt={item.name}
                                className="h-full w-full object-cover rounded-lg"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">{item.name}</div>
                            <div className="text-[11px] font-semibold text-slate-500">{item.name_hi}</div>
                            {item.local_aliases.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {item.local_aliases.map((alias) => (
                                  <span
                                    key={alias}
                                    className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800 border border-amber-200"
                                  >
                                    {alias}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-800">{item.size}</div>
                            <div className="text-[11px] text-slate-500">
                              {item.gauge ? `${item.gauge} • ` : ''}{item.thickness_mm} mm
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            <span className="rounded-md bg-teal-50 border border-teal-200 px-2 py-0.5 text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                              {item.category_id.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold uppercase text-slate-700 bg-slate-100 px-2 py-1 rounded">
                              {item.unit}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 font-medium">
                            <div>{item.brand || 'Commercial'}</div>
                            <div className="text-[10px] text-slate-400">{item.grade || 'IS 2062'}</div>
                          </td>
                          <td className="py-3 px-3.5 text-right font-bold text-amber-800">
                            &lt; {item.reorder_level} {item.unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingMaterial(item)}
                                title={`एडिट करें (${item.name})`}
                                className="rounded-lg p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-900 transition-colors shadow-xs border border-teal-200"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMaterial(item.code, item.name)}
                                title={`हटाएं (${item.name})`}
                                className="rounded-lg p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-xs border border-rose-200"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Data Table Pagination */}
              <DataTablePagination
                ariaLabel="कच्चा माल टेबल पेजिनेशन"
                totalCount={filteredMaterials.length}
                currentCount={paginatedMaterials.length}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                hasPreviousPage={currentPage > 1}
                hasNextPage={currentPage < totalPages}
                onFirstPage={() => setCurrentPage(1)}
                onPreviousPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                onPageChange={(page) => setCurrentPage(page)}
                entityName="मटेरियल"
                nextPageLabel="अगला पेज"
                className="rounded-none border-0 border-t border-slate-200 bg-slate-50/70 shadow-none px-4 py-3 sm:px-6"
              />
            </div>
          )}

          {/* 2. CARDS VIEW (Visual Cards) */}
          {viewMode === 'cards' && paginatedMaterials.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {paginatedMaterials.map((item) => (
                  <div
                    key={item.code}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:border-teal-300 hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 overflow-hidden bg-white p-0.5 shadow-sm flex items-center justify-center">
                            <img
                              src={getMaterialThumbnail(item)}
                              alt={item.name}
                              className="h-full w-full object-cover rounded-lg"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                              {item.category_id.replace('_', ' ')}
                            </span>
                            <h3 className="mt-1 text-sm font-bold text-slate-900 leading-snug">
                              {item.name}
                            </h3>
                            <p className="text-xs font-semibold text-slate-600">{item.name_hi}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingMaterial(item)}
                            title={`एडिट करें (${item.name})`}
                            className="rounded-lg p-1.5 text-teal-700 bg-teal-50 hover:bg-teal-100 hover:text-teal-900 transition-colors shadow-xs border border-teal-200"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaterial(item.code, item.name)}
                            title={`हटाएं (${item.name})`}
                            className="rounded-lg p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-xs border border-rose-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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

              {/* Data Table Pagination for Cards */}
              <DataTablePagination
                ariaLabel="कच्चा माल कार्ड्स पेजिनेशन"
                totalCount={filteredMaterials.length}
                currentCount={paginatedMaterials.length}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                hasPreviousPage={currentPage > 1}
                hasNextPage={currentPage < totalPages}
                onFirstPage={() => setCurrentPage(1)}
                onPreviousPage={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNextPage={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                onPageChange={(page) => setCurrentPage(page)}
                entityName="मटेरियल"
                nextPageLabel="अगला पेज"
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              />
            </div>
          )}

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

      {/* Quick Add / Edit Material Modal */}
      <MaterialQuickAddModal
        isOpen={isQuickAddOpen || Boolean(editingMaterial)}
        initialItem={editingMaterial}
        onClose={() => {
          setIsQuickAddOpen(false);
          setEditingMaterial(null);
        }}
        onCreated={handleMaterialCreated}
        onUpdated={handleMaterialUpdated}
      />
    </div>
  );
}
