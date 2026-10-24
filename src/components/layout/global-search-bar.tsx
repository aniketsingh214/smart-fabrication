'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

const POPULAR_SEARCHES = [
  { labelEn: 'Laser Cutting Gates', labelHi: 'लेज़र कटिंग गेट', query: 'laser', href: '/catalog?category=laser-cutting-gates', tag: '⚡ Popular' },
  { labelEn: 'Main Entrance Gates', labelHi: 'मुख्य गेट', query: 'gate', href: '/catalog?category=main-gates', tag: '🚪 88+ Designs' },
  { labelEn: 'Commercial Rolling Shutters', labelHi: 'कमर्शियल रोलिंग शटर', query: 'shutter', href: '/catalog?category=rolling-shutters', tag: '🏪 19+ Designs' },
  { labelEn: 'SS Balcony Railings', labelHi: 'स्टील व ग्लास रेलिंग', query: 'railing', href: '/catalog?category=railings', tag: '🪜 175+ Designs' },
  { labelEn: 'Window Safety Grills', labelHi: 'विंडो सेफ्टी जाली', query: 'grill', href: '/catalog?category=window-grills', tag: '🪟 76+ Designs' },
];

export function GlobalSearchBar({ className = '' }: { className?: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const isHi = locale === 'hi';

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize search box value with URL parameter ?q=
  useEffect(() => {
    function syncFromUrl() {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlQ = params.get('q');
        if (urlQ) {
          setQuery(urlQ);
        }
      } catch {
        // ignore
      }
    }
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(term?: string) {
    const finalTerm = (term !== undefined ? term : query).trim();
    setIsOpen(false);
    if (finalTerm) {
      setQuery(finalTerm); // Keep the searched text visible in the search box
      router.push(`/catalog?q=${encodeURIComponent(finalTerm)}`);
    } else {
      setQuery('');
      router.push('/catalog');
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleSearch();
  }

  function handleClear() {
    setQuery('');
    inputRef.current?.focus();
    if (typeof window !== 'undefined' && window.location.pathname === '/catalog') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('q')) {
        params.delete('q');
        params.delete('page');
        params.delete('cursor');
        const nextUrl = `/catalog${params.size ? '?' + params.toString() : ''}`;
        router.push(nextUrl);
      }
    }
  }

  const matchingCategories = query.trim()
    ? POPULAR_SEARCHES.filter(
        (item) =>
          item.labelEn.toLowerCase().includes(query.toLowerCase()) ||
          item.labelHi.includes(query) ||
          item.query.includes(query.toLowerCase())
      )
    : [];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center relative w-full rounded-xl sm:rounded-full border border-slate-300 sm:border-slate-200 bg-slate-50 hover:bg-white hover:border-orange-500/50 focus-within:bg-white focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all shadow-xs"
      >
        <div className="pl-3 sm:pl-3.5 text-slate-400 shrink-0">
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={isHi ? '430+ गेट, रेलिंग, लेज़र या शटर खोजें...' : 'Search 430+ gates, railings, shutters…'}
          className="w-full bg-transparent px-2.5 sm:px-3 py-2 sm:py-2 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 mr-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition shrink-0"
            aria-label="Clear search"
            title={isHi ? 'सर्च हटाएं' : 'Clear search'}
          >
            <X size={15} />
          </button>
        )}
        <button
          type="submit"
          className="mr-1 sm:mr-1.5 px-3.5 sm:px-4 py-1.5 sm:py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg sm:rounded-full text-xs font-semibold transition shadow-xs shrink-0"
        >
          {isHi ? 'खोजें' : 'Search'}
        </button>
      </form>

      {/* Search Suggestions Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {query.trim() ? (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleSearch()}
                className="flex w-full items-center justify-between rounded-xl p-2.5 text-left text-xs font-semibold text-slate-800 hover:bg-orange-50 hover:text-orange-600 transition"
              >
                <div className="flex items-center gap-2">
                  <Search size={14} className="text-orange-500" />
                  <span>
                    {isHi ? 'सर्च करें:' : 'Search for:'}{' '}
                    <span className="text-orange-600 font-bold">&quot;{query}&quot;</span>
                  </span>
                </div>
                <ArrowRight size={14} className="text-slate-400" />
              </button>

              {matchingCategories.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isHi ? 'संबंधित केटेगरी' : 'Matching Categories'}
                  </p>
                  {matchingCategories.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        const term = isHi ? item.labelHi : item.labelEn;
                        setQuery(term);
                        setIsOpen(false);
                        router.push(item.href);
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition"
                    >
                      <span className="font-medium">{isHi ? item.labelHi : item.labelEn}</span>
                      <span className="text-[10px] rounded bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">
                        {item.tag}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-1.5 px-2 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <Sparkles size={12} className="text-orange-500" />
                <span>{isHi ? 'लोकप्रिय श्रेणियां व डिज़ाइन' : 'Popular Categories & Searches'}</span>
              </div>
              <div className="mt-2 space-y-1">
                {POPULAR_SEARCHES.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      const term = isHi ? item.labelHi : item.labelEn;
                      setQuery(term);
                      setIsOpen(false);
                      router.push(item.href);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition group"
                  >
                    <span className="font-medium group-hover:font-semibold">
                      {isHi ? item.labelHi : item.labelEn}
                    </span>
                    <span className="text-[10px] rounded-md bg-slate-100 px-2 py-0.5 text-slate-500 font-semibold group-hover:bg-orange-100 group-hover:text-orange-700 transition">
                      {item.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
