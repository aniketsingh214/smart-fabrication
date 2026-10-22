import { cookies } from 'next/headers';
import type { Locale, TranslationDictionary } from './types';
import { hi } from './dictionaries/hi';
import { en } from './dictionaries/en';

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('sf_locale')?.value;
    if (cookie === 'en') return 'en';
    return 'hi';
  } catch {
    return 'hi';
  }
}

export async function getServerDictionary(): Promise<TranslationDictionary> {
  const locale = await getServerLocale();
  return locale === 'en' ? en : hi;
}
