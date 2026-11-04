'use client';

import React, { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Camera,
  Image as ImageIcon,
  X,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Eye,
  Layers,
  Upload,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';
import {
  extractImageFeatures,
  cosineSimilarity,
  computeTextRelevance,
  DEFAULT_CATALOG_ITEMS,
  type CatalogSearchItem,
  type VisualFeatureVector
} from './visual-engine';

export interface UnifiedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const FEATURED_CATEGORIES = [
  { id: 'all', nameEn: 'All Designs', nameHi: 'सभी डिज़ाइन', filterTerm: '' },
  { id: 'main-steel-gates', nameEn: '1. Main Steel Gates', nameHi: 'मुख्य स्टील गेट', filterTerm: 'main steel gates' },
  { id: 'laser-cut-gates', nameEn: '2. Laser Cut Gates', nameHi: 'लेज़र कट गेट', filterTerm: 'laser cut' },
  { id: 'double-door-gates', nameEn: '3. Double Door Gates', nameHi: 'डबल डोर गेट', filterTerm: 'double' },
  { id: 'sliding-gates', nameEn: '4. Sliding Gates', nameHi: 'स्लाइडिंग गेट', filterTerm: 'sliding' },
  { id: 'modern-gate-designs', nameEn: '5. Modern Gate Designs', nameHi: 'आधुनिक गेट डिज़ाइन', filterTerm: 'modern' },
  { id: 'balcony-railings', nameEn: '6. Balcony Railings', nameHi: 'बालकनी रेलिंग', filterTerm: 'balcony' },
  { id: 'ss-railings', nameEn: '7. Stainless Steel Railings', nameHi: 'स्टेनलेस स्टील रेलिंग', filterTerm: 'stainless' },
  { id: 'window-grills', nameEn: '8. Window Grills', nameHi: 'विंडो सेफ्टी ग्रिल', filterTerm: 'window' },
  { id: 'metal-doors', nameEn: '9. Metal Doors', nameHi: 'मेटल दरवाजे', filterTerm: 'door' },
  { id: 'decorative-metal', nameEn: '10. Decorative Metal Designs', nameHi: 'कलात्मक मेटल डिज़ाइन', filterTerm: 'decorative' }
];

export function UnifiedSearchModal({ isOpen, onClose, initialQuery = '' }: UnifiedSearchModalProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const isHi = locale === 'hi';
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'kz4iyauy';

  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageFeatures, setImageFeatures] = useState<VisualFeatureVector | null>(null);
  const [filteredResults, setFilteredResults] = useState<{ item: CatalogSearchItem; score: number }[]>(() =>
    DEFAULT_CATALOG_ITEMS.map((item) => ({ item, score: 1.0 }))
  );
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Sync initial query
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, initialQuery]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Extract visual features whenever an image is uploaded or captured
  const processImage = useCallback((dataUrl: string, name: string) => {
    setImagePreview(dataUrl);
    setImageName(name);
    setIsAnalyzing(true);

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const features = extractImageFeatures(img);
        setImageFeatures(features);
      } catch (err) {
        console.error('Visual feature extraction error:', err);
      } finally {
        setTimeout(() => setIsAnalyzing(false), 350);
      }
    };
    img.onerror = () => setIsAnalyzing(false);
    img.src = dataUrl;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      processImage(dataUrl, file.name);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageName('');
    setImageFeatures(null);
    setIsAnalyzing(false);
  };

  // Unified Search Ranking: Text + Visual Features + Category Filter
  useEffect(() => {
    startTransition(() => {
      const q = query.trim().toLowerCase();
      const catObj = FEATURED_CATEGORIES.find((c) => c.id === selectedCategory);
      const categoryFilter = catObj && catObj.id !== 'all' ? catObj.filterTerm.toLowerCase() : '';

      const scored = DEFAULT_CATALOG_ITEMS.map((item) => {
        let score = 0;

        // 1. Visual Similarity (if image uploaded)
        if (imageFeatures) {
          const sim = cosineSimilarity(imageFeatures.vector, item.visualEmbedding);
          score += sim * 0.7;
        }

        // 2. Text Query Relevance
        if (q) {
          const textScore = computeTextRelevance(q, item);
          score += (imageFeatures ? 0.3 : 1.0) * textScore;
        }

        // 3. Category Chip Filter
        if (categoryFilter) {
          const matchesCat =
            item.category.toLowerCase().includes(categoryFilter) ||
            item.tags.some((t) => t.toLowerCase().includes(categoryFilter));
          if (!matchesCat) {
            score -= 0.5; // Demote non-matching categories
          } else {
            score += 0.25;
          }
        }

        // Baseline score if search is empty
        if (!imageFeatures && !q && !categoryFilter) {
          score = 1.0;
        }

        return { item, score };
      });

      // Filter out heavily negative scores when category or text is specified
      const filtered = scored
        .filter((s) => (q || categoryFilter ? s.score > 0.05 : true))
        .sort((a, b) => b.score - a.score);

      setFilteredResults(filtered);
    });
  }, [query, imageFeatures, selectedCategory]);

  if (!isOpen) return null;

  const whatsappPhone = '919876543210';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isHi ? 'रॉयल गेट खोज एवं दृश्य खोज' : 'ROYAL GATE Unified Search'}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 p-3 pt-6 sm:p-6 sm:pt-12 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl transition-all">
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Input Box */}
            <div className="relative flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50/90 px-3.5 py-2.5 shadow-inner transition focus-within:border-sky-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-100">
              <Search size={18} className="text-slate-400 shrink-0 mr-2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  imagePreview
                    ? isHi
                      ? 'फोटो के साथ कुछ और लिखें (उदा. ब्लैक लेज़र कट)…'
                      : 'Add description to your photo (e.g., Black laser cut main gate)…'
                    : isHi
                    ? 'गेट, रेलिंग, डिज़ाइन खोजें या फोटो से सर्च करें…'
                    : 'Search gates, railings, laser cut designs…'
                }
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />

              {/* Clear Text Button */}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 mr-1"
                  title="Clear text"
                >
                  <X size={15} />
                </button>
              )}

              {/* Camera Trigger */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="group relative flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm border border-slate-200/80 transition hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300 ml-1"
                title={isHi ? 'कैमरे से फोटो लें' : 'Snap photo with camera'}
                aria-label="Camera visual search"
              >
                <Camera size={16} />
              </button>

              {/* Gallery Trigger */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="group relative flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm border border-slate-200/80 transition hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300 ml-1"
                title={isHi ? 'गैलरी से फोटो अपलोड करें' : 'Upload photo from gallery'}
                aria-label="Gallery visual search"
              >
                <ImageIcon size={16} />
              </button>
            </div>

            {/* Hidden Input Elements */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close search"
            >
              <X size={18} />
            </button>
          </div>

          {/* AI Visual Search Reference Banner (When Image Uploaded) */}
          {imagePreview && (
            <div className="mt-3 flex items-center justify-between rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-sky-50 p-3 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-sky-300 bg-slate-900 shadow">
                  <Image
                    src={imagePreview}
                    alt="Search reference"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      <Sparkles size={11} />
                      {isAnalyzing
                        ? isHi
                          ? 'एआई स्कैनिंग चालू है…'
                          : 'AI Scanning Patterns…'
                        : isHi
                        ? 'विजुअल सिमिलैरिटी एक्टिव'
                        : 'Visual Search Active'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-xs">
                      {imageName || 'Reference Photo'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {isAnalyzing
                      ? isHi
                        ? 'गेट के पैटर्न, कटिंग डेंसिटी व फिनिश का विश्लेषण हो रहा है…'
                        : 'Analyzing geometry, CNC cut density & metal finish…'
                      : isHi
                      ? 'फोटो के आधार पर मिलते-जुलते गेट और रेलिंग नीचे दिखाए गए हैं।'
                      : 'Displaying matching designs ranked by visual similarity.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="rounded-xl border border-sky-300 bg-white px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50 transition shadow-xs"
                >
                  {isHi ? 'फोटो बदलें' : 'Change Photo'}
                </button>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                  title={isHi ? 'फोटो हटाएं' : 'Remove photo'}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {/* 10 Zepto-Style Featured Categories Carousel / Chips */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {FEATURED_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex shrink-0 items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {isHi ? cat.nameHi : cat.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body: Results Grid */}
        <div className="max-h-[65vh] overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* Section Heading */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {imagePreview ? (
                <>
                  <Sparkles size={16} className="text-sky-600" />
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {isHi ? 'आपकी पसंद के मिलते-जुलते डिज़ाइन' : 'Similar Designs You May Like'}
                  </h3>
                </>
              ) : query ? (
                <>
                  <Search size={16} className="text-slate-600" />
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {isHi ? `सर्च परिणाम: "${query}"` : `Results for "${query}"`}
                  </h3>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-orange-500" />
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    {isHi ? 'लोकप्रिय व फीचर्ड फैब्रिकेशन डिज़ाइन' : 'Popular & Featured Fabrication Designs'}
                  </h3>
                </>
              )}
            </div>

            <span className="text-xs font-medium text-slate-500">
              {filteredResults.length} {isHi ? 'डिज़ाइन उपलब्ध' : 'designs found'}
            </span>
          </div>

          {/* Product Grid */}
          {filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search size={24} />
              </div>
              <h4 className="mt-3 text-sm font-bold text-slate-800">
                {isHi ? 'कोई मेल नहीं मिला' : 'No matching designs found'}
              </h4>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                {isHi
                  ? 'कृपया दूसरा शब्द खोजें या अपनी पसंद के गेट की कोई अन्य फोटो अपलोड करें।'
                  : 'Try searching with different keywords or upload a clearer photo of the metal gate.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('all');
                  handleClearImage();
                }}
                className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
              >
                {isHi ? 'सभी डिज़ाइन देखें' : 'View All Designs'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResults.map(({ item, score }) => {
                const imageUrl = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_600/${item.publicId}.jpg`;
                const matchPercent = Math.min(99, Math.round(score * 100));

                const quoteWaUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                  isHi
                    ? `नमस्ते! मुझे रॉयल गेट की इस डिज़ाइन में रुचि है: "${item.nameHi}". कृपया कोटेशन व नाप साझा करें।`
                    : `Hello Royal Gate! I am interested in this fabrication design: "${item.name}". Please share estimate and details.`
                )}`;

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition duration-200 hover:border-slate-300 hover:shadow-md"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <Image
                        src={imageUrl}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />

                      {/* Visual Similarity Match Badge (When Image Uploaded) */}
                      {imagePreview && (
                        <div className="absolute left-2.5 top-2.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs shadow-xs">
                            <CheckCircle2 size={10} />
                            {matchPercent}% Match
                          </span>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute right-2.5 top-2.5">
                        <span className="rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold text-slate-100 backdrop-blur-xs">
                          {isHi ? item.categoryHi : item.category}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex flex-1 flex-col p-3.5">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-sky-700 transition">
                        {isHi ? item.nameHi : item.name}
                      </h4>

                      <p className="mt-1 text-[11px] text-slate-500 line-clamp-1">
                        {item.material}
                      </p>

                      <div className="mt-2.5 flex items-baseline justify-between border-t border-slate-100 pt-2.5">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {isHi ? 'अनुमानित कीमत' : 'Indicative Price'}
                          </span>
                          <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                            {item.priceFormatted}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* View Details */}
                          <Link
                            href={`/catalog/${item.slug}`}
                            onClick={onClose}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Eye size={12} />
                            <span>{isHi ? 'विवरण' : 'Details'}</span>
                          </Link>

                          {/* Get a Quote */}
                          <a
                            href={quoteWaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition shadow-xs"
                          >
                            <MessageCircle size={12} />
                            <span>{isHi ? 'कोटेशन' : 'Quote'}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info size={13} className="text-slate-400" />
            <span>
              {isHi
                ? 'साइट नाप (फीट/इंच) व वजन के आधार पर अंतिम कोटेशन वर्कशॉप से दिया जाता है।'
                : 'Final price is confirmed after on-site measurement & exact gauge verification.'}
            </span>
          </div>

          <Link
            href="/catalog"
            onClick={onClose}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-sky-600 transition"
          >
            <span>{isHi ? 'पूरा कैटलॉग देखें' : 'Explore Full Catalog'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
