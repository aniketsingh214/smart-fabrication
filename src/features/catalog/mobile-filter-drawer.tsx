'use client';

import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Check, ArrowRight, RotateCcw } from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';
import { getCategoryDisplayName } from '@/lib/i18n/catalog-bilingual';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface MobileFilterDrawerProps {
  categories: CategoryItem[];
  activeParentSlug?: string;
  activeSubSlug?: string;
  currentSearch?: string;
  currentMaterial?: string;
  currentBudget?: string;
  currentSort?: string;
  totalResultsCount: number;
}

export function MobileFilterDrawer({
  categories,
  activeParentSlug,
  activeSubSlug,
  currentSearch = '',
  currentMaterial = '',
  currentBudget = '',
  currentSort = 'recent',
  totalResultsCount
}: MobileFilterDrawerProps) {
  const { locale } = useLocale();
  const isHi = locale === 'hi';

  const [isOpen, setIsOpen] = useState(false);

  // Local draft states inside the drawer
  const [selectedParent, setSelectedParent] = useState<string>(activeParentSlug || '');
  const [selectedSub, setSelectedSub] = useState<string>(activeSubSlug || '');
  const [selectedMaterial, setSelectedMaterial] = useState<string>(currentMaterial);
  const [selectedBudget, setSelectedBudget] = useState<string>(currentBudget);
  const [selectedSort, setSelectedSort] = useState<string>(currentSort || 'recent');

  const handleOpen = () => {
    setSelectedParent(activeParentSlug || '');
    setSelectedSub(activeSubSlug || '');
    setSelectedMaterial(currentMaterial);
    setSelectedBudget(currentBudget);
    setSelectedSort(currentSort || 'recent');
    setIsOpen(true);
  };

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const parentCategories = categories.filter(c => !c.parent_id);
  const subcategoriesForParent = selectedParent
    ? categories.filter(c => {
        const parent = parentCategories.find(p => p.slug === selectedParent);
        return parent && c.parent_id === parent.id;
      })
    : [];

  // Count how many filters are active
  const activeCount = [
    Boolean(selectedParent),
    Boolean(selectedSub),
    Boolean(selectedMaterial),
    Boolean(selectedBudget),
    selectedSort !== 'recent'
  ].filter(Boolean).length;

  const handleReset = () => {
    setSelectedParent('');
    setSelectedSub('');
    setSelectedMaterial('');
    setSelectedBudget('');
    setSelectedSort('recent');
  };

  const materialPresets = [
    { label: isHi ? 'सभी मटीरियल' : 'All Materials', value: '' },
    { label: isHi ? 'माइल्ड स्टील (MS / लोहा)' : 'Mild Steel (MS)', value: 'Steel' },
    { label: isHi ? 'स्टेनलेस स्टील (SS 304)' : 'Stainless Steel (SS 304)', value: 'Stainless' },
    { label: isHi ? 'सीएनसी लेजर जाली' : 'Laser Cut Sheet', value: 'Laser' },
    { label: isHi ? 'रॉट आयरन' : 'Wrought Iron', value: 'Iron' }
  ];

  const budgetPresets = [
    { label: isHi ? 'सभी बजट' : 'Any Budget', value: '' },
    { label: isHi ? '₹15,000 से कम' : 'Under ₹15,000', value: '15000' },
    { label: isHi ? '₹30,000 से कम' : 'Under ₹30,000', value: '30000' },
    { label: isHi ? '₹50,000 से कम' : 'Under ₹50,000', value: '50000' },
    { label: isHi ? '₹1,00,000 से कम' : 'Under ₹1,00,000', value: '100000' }
  ];

  const sortPresets = [
    { label: isHi ? 'ताज़ा डिज़ाइन (Newest)' : 'Newest First', value: 'recent' },
    { label: isHi ? 'कम कीमत पहले (Low to High)' : 'Price: Low to High', value: 'price-low' },
    { label: isHi ? 'ज़्यादा कीमत पहले (High to Low)' : 'Price: High to Low', value: 'price-high' },
    { label: isHi ? 'नाम (A–Z)' : 'Name: A–Z', value: 'name' }
  ];

  return (
    <div className="md:hidden mb-4">
      {/* Trigger Button on Mobile */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Open filter and sort drawer"
        className="flex w-full items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-xs active:bg-slate-50 transition"
      >
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-orange-100/70 text-orange-600">
            <SlidersHorizontal size={14} />
          </div>
          <span className="text-xs font-bold text-slate-800">
            {isHi ? 'फ़िल्टर और क्रम (Filters & Sort)' : 'Filter & Sort Designs'}
          </span>
          {activeCount > 0 && (
            <span className="rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
              {activeCount}
            </span>
          )}
        </div>
        <span className="text-[11px] font-semibold text-orange-600">
          {totalResultsCount} {isHi ? 'डिज़ाइन' : 'designs'} →
        </span>
      </button>

      {/* Drawer Overlay & Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-Up Bottom Sheet Form */}
          <form
            action="/catalog"
            method="GET"
            className="relative z-10 flex max-h-[88vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl"
          >
            {/* Hidden Input parameters that are submitted with form */}
            {currentSearch && <input type="hidden" name="q" value={currentSearch} />}
            {selectedParent && <input type="hidden" name="category" value={selectedParent} />}
            {selectedSub && <input type="hidden" name="sub" value={selectedSub} />}
            {selectedMaterial && <input type="hidden" name="material" value={selectedMaterial} />}
            {selectedBudget && <input type="hidden" name="budget" value={selectedBudget} />}
            {selectedSort && selectedSort !== 'recent' && <input type="hidden" name="sort" value={selectedSort} />}

            {/* Grab handle */}
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300" />

            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={17} className="text-orange-600" />
                <h2 className="text-base font-bold text-slate-900">
                  {isHi ? 'फ़िल्टर और क्रम (Filters & Sort)' : 'Filter & Sort Designs'}
                </h2>
                {activeCount > 0 && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">
                    {activeCount}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 text-sm">
              {/* 1. Sort Section */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  {isHi ? 'दिखाने का क्रम (Sort Order):' : 'Sort By:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sortPresets.map(preset => {
                    const isSelected = selectedSort === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSelectedSort(preset.value)}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-left text-xs font-semibold transition ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-bold'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span>{preset.label}</span>
                        {isSelected && <Check size={14} className="text-orange-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Category Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  {isHi ? 'श्रेणी (Category):' : 'Category:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedParent('');
                      setSelectedSub('');
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      !selectedParent
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isHi ? 'सभी श्रेणियां' : 'All Categories'}
                  </button>
                  {parentCategories.map(cat => {
                    const isSelected = selectedParent === cat.slug;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedParent(cat.slug);
                          setSelectedSub('');
                        }}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-orange-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getCategoryDisplayName(cat.slug, cat.name, locale)}
                      </button>
                    );
                  })}
                </div>

                {/* Subcategories if parent selected */}
                {subcategoriesForParent.length > 0 && (
                  <div className="mt-3 rounded-xl border border-orange-200/80 bg-orange-50/50 p-3">
                    <p className="text-[11px] font-bold text-orange-900 uppercase tracking-wider mb-2">
                      {isHi ? 'सब-केटेगरी (Subcategories):' : 'Subcategories:'}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSub('')}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          !selectedSub
                            ? 'bg-orange-600 text-white'
                            : 'bg-white text-orange-900 border border-orange-200'
                        }`}
                      >
                        {isHi ? 'सभी सब-केटेगरी' : 'All Subcategories'}
                      </button>
                      {subcategoriesForParent.map(sub => {
                        const isSubSelected = selectedSub === sub.slug;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setSelectedSub(sub.slug)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              isSubSelected
                                ? 'bg-orange-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 border border-slate-200'
                            }`}
                          >
                            {getCategoryDisplayName(sub.slug, sub.name, locale)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Material Filter */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  {isHi ? 'धातु व मटीरियल (Material):' : 'Material:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {materialPresets.map(preset => {
                    const isSelected = selectedMaterial === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSelectedMaterial(preset.value)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Budget Filter */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                  {isHi ? 'अधिकतम बजट (Max Budget):' : 'Max Budget:'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {budgetPresets.map(preset => {
                    const isSelected = selectedBudget === preset.value;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSelectedBudget(preset.value)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-emerald-700 text-white font-bold'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Fixed Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <RotateCcw size={13} />
                <span>{isHi ? 'साफ़ करें (Reset)' : 'Reset All'}</span>
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-6 py-2.5 shadow-md active:scale-95 transition cursor-pointer"
              >
                <span>{isHi ? 'फ़िल्टर लागू करें' : 'Apply Filters'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
