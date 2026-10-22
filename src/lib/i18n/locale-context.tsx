'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { Locale, TranslationDictionary } from './types';
import { hi } from './dictionaries/hi';
import { en } from './dictionaries/en';

interface LocaleContextType {
  locale: Locale;
  setLocale: (next: Locale) => void;
  dict: TranslationDictionary;
  t: (path: string, fallback?: string) => string;
}

const dictionaries: Record<Locale, TranslationDictionary> = {
  hi,
  en
};

const defaultContext: LocaleContextType = {
  locale: 'hi',
  setLocale: () => {},
  dict: hi,
  t: (path: string, fallback?: string) => fallback ?? path
};

const LocaleContext = createContext<LocaleContextType>(defaultContext);

const COOKIE_NAME = 'sf_locale';
const STORAGE_KEY = 'sf_locale_v1';

export function LocaleProvider({
  children,
  initialLocale = 'hi'
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Sync from cookie or storage after client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored === 'hi' || stored === 'en') {
        setLocaleState(stored);
        document.documentElement.lang = stored;
        return;
      }
      const match = document.cookie.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
      if (match && (match[2] === 'hi' || match[2] === 'en')) {
        const cLocale = match[2] as Locale;
        setLocaleState(cLocale);
        document.documentElement.lang = cLocale;
        return;
      }
    } catch {
      // Storage read fallback
    }
    // Set default Hindi in document
    document.documentElement.lang = 'hi';
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      document.cookie = `${COOKIE_NAME}=${next};path=/;max-age=31536000;SameSite=Lax`;
      document.documentElement.lang = next;
    } catch {
      // Storage write fallback
    }
  }, []);

  const dict = useMemo(() => dictionaries[locale] ?? hi, [locale]);

  const t = useCallback(
    (path: string, fallback?: string): string => {
      const keys = path.split('.');
      let current: unknown = dict;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = (current as Record<string, unknown>)[key];
        } else {
          return fallback ?? path;
        }
      }
      return typeof current === 'string' ? current : fallback ?? path;
    },
    [dict]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      dict,
      t
    }),
    [locale, setLocale, dict, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext) ?? defaultContext;
}
