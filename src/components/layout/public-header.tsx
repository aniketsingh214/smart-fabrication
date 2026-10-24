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
      <div className="mx-auto max-w-7xl px-3.5 py-2.5 sm:px-6 lg:px-8">
        {/* Top Bar: Brand, Desktop Search, Actions */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo & Tagline */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-orange-600 text-white shadow-sm transition group-hover:scale-105">
              <Hammer size={20} className="sm:hidden" />
              <Hammer size={22} className="hidden sm:block" />
            </span>
            <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 leading-tight">
              SmartFabrication
              <span className="block text-[10px] font-medium tracking-normal text-slate-500 hidden sm:block">
                {locale === 'hi' ? 'मजबूत लोहा और स्टील • सालों-साल चले' : 'Crafted in steel. Built to last.'}
              </span>
            </span>
          </Link>

          {/* Desktop Global Search Bar (Centered, visible md and up) */}
          <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md xl:max-w-lg mx-3">
            <GlobalSearchBar />
          </div>

          {/* Desktop Nav Links */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600 shrink-0"
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

          {/* Right Action Bar: Language Switcher, Cart/Wishlist, Quote Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <LanguageSwitcher />
            <HeaderShopTriggers />
            <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 shadow-sm text-xs font-bold px-2.5 sm:px-3">
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

        {/* Mobile Full-Width Search Bar (Permanently visible & sticky on mobile) */}
        <div className="block md:hidden mt-2 pt-0.5">
          <GlobalSearchBar />
        </div>

        {/* Mobile / Tablet Nav Links (Visible below md or lg) */}
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden mt-2 pt-1.5 border-t border-slate-100 flex w-full justify-around text-xs font-semibold text-slate-600"
        >
          <Link href="/catalog" className="hover:text-orange-600 transition py-0.5">
            {dict.nav.catalog}
          </Link>
          <Link href="/gallery" className="hover:text-orange-600 transition py-0.5">
            {dict.nav.gallery}
          </Link>
          <Link href="/estimate" className="hover:text-orange-600 transition py-0.5">
            {dict.nav.estimate}
          </Link>
          <Link href="/account" className="hover:text-orange-600 transition py-0.5">
            {dict.nav.account}
          </Link>
        </nav>
      </div>
    </header>
  );
}
