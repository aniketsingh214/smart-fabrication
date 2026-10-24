'use client';

import Link from 'next/link';
import { Hammer, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderShopTriggers } from '@/features/shop/header-shop-triggers';
import { LanguageSwitcher } from '@/features/i18n/language-switcher';
import { useLocale } from '@/lib/i18n/locale-context';

import { GlobalSearchBar } from './global-search-bar';

export function PublicHeader() {
  const { dict, locale } = useLocale();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 backdrop-blur-md bg-white/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2.5 sm:gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-600 text-white shadow-sm transition group-hover:scale-105">
            <Hammer size={22} />
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900">
            SmartFabrication
            <span className="block text-[10px] font-medium tracking-normal text-slate-500">
              {locale === 'hi' ? 'मजबूत लोहा और स्टील • सालों-साल चले' : 'Crafted in steel. Built to last.'}
            </span>
          </span>
        </Link>

        {/* Global Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm xl:max-w-md mx-3">
          <GlobalSearchBar />
        </div>

        {/* Main Nav Links */}
        <nav
          aria-label="Main navigation"
          className="order-3 flex w-full justify-center gap-5 text-xs font-semibold text-slate-600 sm:order-none sm:w-auto sm:gap-5"
        >
          <Link href="/catalog" className="hover:text-orange-600 transition py-1">
            {dict.nav.catalog}
          </Link>
          <Link href="/gallery" className="hover:text-orange-600 transition py-1">
            {dict.nav.gallery}
          </Link>
          <Link href="/estimate" className="hover:text-orange-600 transition py-1">
            {dict.nav.estimate}
          </Link>
          <Link href="/account" className="hover:text-orange-600 transition py-1">
            {dict.nav.account}
          </Link>
        </nav>

        {/* Right Action Bar: Mobile Search Icon, Language Switcher, Cart/Wishlist, Quote Button */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          <div className="md:hidden">
            <GlobalSearchBar />
          </div>
          <LanguageSwitcher />
          <HeaderShopTriggers />
          <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 shadow-sm text-xs font-bold">
            <Link
              href="/contact"
              aria-label="Request a quote"
              title={locale === 'hi' ? 'कीमत पूछें / Request a quote' : 'Request a quote'}
            >
              <span>{dict.nav.quote}</span>
              <ArrowUpRight size={14} />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
