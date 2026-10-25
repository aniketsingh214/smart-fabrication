'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/lib/i18n/locale-context';
import type { Locale } from '@/lib/i18n/types';
import { Languages } from 'lucide-react';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const router = useRouter();

  const handleSwitch = (next: Locale) => {
    setLocale(next);
    router.refresh();
  };

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-sm ${className}`}
    >
      <Languages size={15} aria-hidden="true" className="mx-1 text-slate-500"/>
      <button
        type="button"
        onClick={() => handleSwitch('hi')}
        aria-pressed={locale === 'hi'}
        aria-label="हिंदी भाषा चुनें"
        className={`rounded-full px-2.5 py-1 transition-all duration-150 ${
          locale === 'hi'
            ? 'bg-orange-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        हिंदी
      </button>

      <button
        type="button"
        onClick={() => handleSwitch('en')}
        aria-pressed={locale === 'en'}
        aria-label="Switch to English"
        className={`rounded-full px-2.5 py-1 transition-all duration-150 ${
          locale === 'en'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        English
      </button>
    </div>
  );
}

export function CompactLanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const router = useRouter();

  const toggle = () => {
    const next = locale === 'hi' ? 'en' : 'hi';
    setLocale(next);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={locale === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
      title={locale === 'hi' ? 'Switch to English' : 'हिंदी में बदलें'}
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold shadow-2xs transition hover:border-orange-300 hover:bg-orange-50/50 ${className}`}
    >
      <Languages size={15} className="text-orange-600" />
      <span>{locale === 'hi' ? 'English' : 'हिंदी'}</span>
    </button>
  );
}
