'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  SlidersHorizontal,
  Sparkles,
  DoorClosed,
  Zap,
  Columns,
  Grid,
  Store,
  Home,
  Shield,
  Wrench,
  Check,
  ChevronRight,
} from 'lucide-react';
import { getCategoryDisplayName } from '@/lib/i18n/catalog-bilingual';
import type { Locale } from '@/lib/i18n/types';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  sort_order?: number;
  media_assets?: {
    public_id?: string;
    resource_type?: string;
    visibility?: string;
  } | Array<{
    public_id?: string;
    resource_type?: string;
    visibility?: string;
  }> | null;
}

export interface CatalogCategorySelectorProps {
  parentCategories: CategoryItem[];
  activeParent: CategoryItem | null;
  activeSub: CategoryItem | null;
  availableSubcategories: CategoryItem[];
  currentSearch?: string;
  currentMaterial?: string;
  currentBudget?: string;
  currentSort?: string;
  locale?: Locale;
}

interface VisualConfig {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  hiSubtitle: string;
  enSubtitle: string;
  gradient: string;
  accentBg: string;
}

const CATEGORY_VISUALS: Record<string, VisualConfig> = {
  all: {
    Icon: Sparkles,
    hiSubtitle: '315+ नए मॉडल',
    enSubtitle: '315+ all designs',
    gradient: 'from-amber-600 via-amber-700 to-slate-900',
    accentBg: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  'main-gates': {
    Icon: DoorClosed,
    hiSubtitle: 'गेट व मेन एंट्रेंस',
    enSubtitle: 'Main & villa gates',
    gradient: 'from-slate-800 via-slate-900 to-amber-950',
    accentBg: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  'laser-cutting-gates': {
    Icon: Zap,
    hiSubtitle: 'CNC जाली व कटिंग',
    enSubtitle: 'CNC laser cut gates',
    gradient: 'from-amber-700 via-orange-800 to-slate-900',
    accentBg: 'bg-amber-100 text-amber-900 border-amber-200',
  },
  railings: {
    Icon: Columns,
    hiSubtitle: 'जीना व बालकनी रेलिंग',
    enSubtitle: 'Stair & balcony railings',
    gradient: 'from-sky-800 via-slate-800 to-slate-950',
    accentBg: 'bg-sky-100 text-sky-900 border-sky-200',
  },
  'window-grills': {
    Icon: Grid,
    hiSubtitle: 'खिड़की सुरक्षा जाली',
    enSubtitle: 'Safety window grills',
    gradient: 'from-blue-800 via-indigo-900 to-slate-950',
    accentBg: 'bg-blue-100 text-blue-900 border-blue-200',
  },
  'rolling-shutters': {
    Icon: Store,
    hiSubtitle: 'दुकान व शोरूम शटर',
    enSubtitle: 'Commercial shutters',
    gradient: 'from-emerald-800 via-teal-900 to-slate-950',
    accentBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
  'industrial-sheds': {
    Icon: Home,
    hiSubtitle: 'फैक्ट्री व पार्किंग शेड',
    enSubtitle: 'Sheds & roofing',
    gradient: 'from-orange-800 via-amber-900 to-slate-950',
    accentBg: 'bg-orange-100 text-orange-900 border-orange-200',
  },
  'metal-doors': {
    Icon: Shield,
    hiSubtitle: 'स्टील व सुरक्षा दरवाजे',
    enSubtitle: 'Security steel doors',
    gradient: 'from-rose-800 via-red-900 to-slate-950',
    accentBg: 'bg-rose-100 text-rose-900 border-rose-200',
  },
  'custom-fabrication': {
    Icon: Wrench,
    hiSubtitle: 'ऑर्डर अनुसार काम',
    enSubtitle: 'Custom metal work',
    gradient: 'from-purple-800 via-indigo-900 to-slate-950',
    accentBg: 'bg-purple-100 text-purple-900 border-purple-200',
  },
};

function getVisual(slug: string): VisualConfig {
  const norm = slug.toLowerCase();
  for (const [key, conf] of Object.entries(CATEGORY_VISUALS)) {
    if (norm.includes(key)) return conf;
  }
  return {
    Icon: Sparkles,
    hiSubtitle: 'फैब्रिकेशन डिज़ाइन',
    enSubtitle: 'Fabrication designs',
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    accentBg: 'bg-slate-100 text-slate-800 border-slate-200',
  };
}

const STORAGE_VIEW_KEY = 'gatewala_catalog_category_view';

export function CatalogCategorySelector({
  parentCategories,
  activeParent,
  activeSub,
  availableSubcategories,
  currentSearch = '',
  currentMaterial = '',
  currentBudget = '',
  currentSort = 'recent',
  locale = 'en',
}: CatalogCategorySelectorProps) {
  const isHi = locale === 'hi';
  const [viewMode, setViewMode] = useState<'cards' | 'tabs'>('cards');
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  const getCategoryHref = (catSlug?: string, subSlug?: string) => {
    const params = new URLSearchParams();
    if (currentMaterial) params.set('material', currentMaterial);
    if (currentBudget) params.set('budget', currentBudget);
    if (currentSort && currentSort !== 'recent') params.set('sort', currentSort);
    if (currentSearch) params.set('q', currentSearch);
    if (catSlug) params.set('category', catSlug);
    if (subSlug) params.set('sub', subSlug);
    const qStr = params.toString();
    return `/catalog${qStr ? '?' + qStr : ''}`;
  };

  // Restore saved view preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VIEW_KEY);
      if (saved === 'cards' || saved === 'tabs') {
        setViewMode(saved);
      }
    } catch {
      // ignore storage access errors
    }
  }, []);

  const handleModeChange = (mode: 'cards' | 'tabs') => {
    setViewMode(mode);
    try {
      localStorage.setItem(STORAGE_VIEW_KEY, mode);
    } catch {
      // ignore
    }
  };

  const isAllSelected = !activeParent && !activeSub;

  return (
    <section className="mb-6" aria-label="Product categories">
      {/* Top Header with Interactive View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 sm:text-[13px] flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span>
            {isHi ? 'डिज़ाइन श्रेणी (Select Category):' : 'Browse Categories:'}
          </span>
          <span className="hidden sm:inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {parentCategories.length} {isHi ? 'कैटलॉग्स' : 'Categories'}
          </span>
        </div>

        {/* Both Styles View Switcher */}
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => handleModeChange('cards')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title={isHi ? 'विकल्प 1: फोटो कार्ड्स (बड़ा व प्रीमियम)' : 'Option 1: Visual Photo Cards'}
          >
            <LayoutGrid size={13} className={viewMode === 'cards' ? 'text-amber-600' : 'text-slate-400'} />
            <span>{isHi ? 'फोटो कार्ड्स (Cards)' : 'Photo Cards'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('tabs')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
              viewMode === 'tabs'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title={isHi ? 'विकल्प 3: स्लीक टैब्स (कम जगह व साफ)' : 'Option 3: Sleek Icon Tabs'}
          >
            <SlidersHorizontal size={13} className={viewMode === 'tabs' ? 'text-amber-600' : 'text-slate-400'} />
            <span>{isHi ? 'स्लीक टैब्स (Tabs)' : 'Sleek Tabs'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PREMIUM PHOTO CARDS (विकल्प 1) */}
      {viewMode === 'cards' && (
        <div className="relative">
          <div className="flex gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin scroll-smooth sm:grid sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 sm:overflow-visible">
            {/* Card: All Categories */}
            <Link
              href={getCategoryHref(undefined, undefined)}
              className={`group relative flex h-[135px] w-[130px] sm:w-auto shrink-0 flex-col justify-between overflow-hidden rounded-2xl border transition duration-200 ${
                isAllSelected
                  ? 'border-amber-600 bg-amber-50/70 shadow-md ring-2 ring-amber-500/30'
                  : 'border-slate-200 bg-white shadow-2xs hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              {/* Image / Graphic Area */}
              <div className="relative h-[72px] w-full overflow-hidden bg-gradient-to-br from-amber-600 via-orange-600 to-slate-900 p-2.5 flex items-center justify-center">
                <Sparkles size={28} className="text-white/90 drop-shadow-md transition duration-200 group-hover:scale-110" />
                {isAllSelected && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-amber-700 shadow-xs">
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </div>
              {/* Label Area */}
              <div className="p-2 text-center flex-1 flex flex-col justify-center">
                <div className={`text-xs font-bold leading-tight ${isAllSelected ? 'text-amber-950 font-extrabold' : 'text-slate-900'}`}>
                  {isHi ? 'सभी डिज़ाइन' : 'All Designs'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-medium truncate">
                  {isHi ? '315+ नए मॉडल' : 'Complete 315+'}
                </div>
              </div>
            </Link>

            {/* Parent Category Cards */}
            {parentCategories.map((cat) => {
              const isSelected = activeParent?.id === cat.id;
              const visual = getVisual(cat.slug);
              const { Icon } = visual;
              const displayName = getCategoryDisplayName(cat.slug, cat.name, locale);

              const asset = Array.isArray(cat.media_assets) ? cat.media_assets[0] : cat.media_assets;
              const imgUrl = asset?.public_id && cloud
                ? `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_300,h_200,c_fill/${asset.public_id}`
                : null;

              return (
                <Link
                  key={cat.id}
                  href={getCategoryHref(cat.slug, undefined)}
                  className={`group relative flex h-[135px] w-[130px] sm:w-auto shrink-0 flex-col justify-between overflow-hidden rounded-2xl border transition duration-200 ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/70 shadow-md ring-2 ring-amber-500/30'
                      : 'border-slate-200 bg-white shadow-2xs hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Top Image / Illustration */}
                  <div className={`relative h-[72px] w-full overflow-hidden bg-gradient-to-br ${visual.gradient}`}>
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={cat.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-108"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-2 text-white/90">
                        <Icon size={26} className="drop-shadow-md transition duration-200 group-hover:scale-110" />
                      </div>
                    )}
                    {/* Floating mini icon badge */}
                    <span className="absolute bottom-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur-xs">
                      <Icon size={12} />
                    </span>
                    {/* Active check pill */}
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                        <Check size={11} strokeWidth={3} />
                      </span>
                    )}
                  </div>

                  {/* Label Details */}
                  <div className="p-2 text-center flex-1 flex flex-col justify-center">
                    <div
                      className={`text-xs font-bold leading-tight line-clamp-1 ${
                        isSelected ? 'text-amber-950 font-extrabold' : 'text-slate-800'
                      }`}
                      title={displayName}
                    >
                      {displayName}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium truncate">
                      {isHi ? visual.hiSubtitle : visual.enSubtitle}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: SLEEK ICON TABS (विकल्प 3) */}
      {viewMode === 'tabs' && (
        <div className="flex flex-wrap gap-2">
          {/* All Designs Tab */}
          <Link
            href={getCategoryHref(undefined, undefined)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
              isAllSelected
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-amber-500/40'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <Sparkles size={14} className={isAllSelected ? 'text-amber-400' : 'text-amber-600'} />
            <span>{isHi ? 'सभी डिज़ाइन (All)' : 'All Categories'}</span>
          </Link>

          {/* Individual Category Tabs */}
          {parentCategories.map((cat) => {
            const isSelected = activeParent?.id === cat.id;
            const visual = getVisual(cat.slug);
            const { Icon } = visual;
            const displayName = getCategoryDisplayName(cat.slug, cat.name, locale);

            return (
              <Link
                key={cat.id}
                href={getCategoryHref(cat.slug, undefined)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-700 text-white shadow-sm ring-2 ring-amber-500/30'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <Icon size={14} className={isSelected ? 'text-amber-200' : 'text-slate-500'} />
                <span>{displayName}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Subcategory Ribbon (when active parent has subcategories) */}
      {availableSubcategories.length > 0 && activeParent && (
        <div className="mt-3.5 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/50 p-3 sm:p-4 shadow-2xs">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <ChevronRight size={14} className="text-amber-600" />
              <span>
                {getCategoryDisplayName(activeParent.slug, activeParent.name, locale)} —{' '}
                <span className="text-amber-700 font-semibold">{isHi ? 'सब-केटेगरी' : 'Subcategories'}</span>
              </span>
            </span>
            <span className="text-[11px] font-medium text-amber-800">
              {isHi ? 'विशिष्ट डिज़ाइन चुनने के लिए क्लिक करें' : 'Click a subcategory to filter'}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {/* All Subcategories Option */}
            <Link
              href={getCategoryHref(activeParent.slug, undefined)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                !activeSub
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'border border-amber-200/80 bg-white text-amber-950 hover:bg-amber-100/60'
              }`}
            >
              {isHi ? 'सभी सब-कैटेगरी' : `All ${activeParent.name}`}
            </Link>

            {availableSubcategories.map((sub) => {
              const isSelected = activeSub?.id === sub.id;
              const subDisplayName = getCategoryDisplayName(sub.slug, sub.name, locale);
              return (
                <Link
                  key={sub.id}
                  href={getCategoryHref(activeParent.slug, sub.slug)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    isSelected
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'border border-amber-200/80 bg-white text-amber-950 hover:bg-amber-100/60'
                  }`}
                >
                  {subDisplayName}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

