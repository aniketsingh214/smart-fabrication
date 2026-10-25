'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hammer, ArrowUpRight, LayoutGrid, Images, Calculator, UserRound, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderShopTriggers } from '@/features/shop/header-shop-triggers';
import { LanguageSwitcher } from '@/features/i18n/language-switcher';
import { useLocale } from '@/lib/i18n/locale-context';
import { GlobalSearchBar } from './global-search-bar';

export function PublicHeader() {
  const { dict, locale } = useLocale();
  const pathname = usePathname();
  const links = [
    { href: '/catalog', label: dict.nav.catalog, icon: LayoutGrid },
    { href: '/gallery', label: dict.nav.gallery, icon: Images },
    { href: '/estimate', label: dict.nav.estimate, icon: Calculator },
    { href: '/account', label: dict.nav.account, icon: UserRound }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-canvas/95 shadow-[0_4px_24px_#20252206] backdrop-blur-xl">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 items-center gap-x-4 gap-y-3 px-4 pb-2 pt-3 sm:px-6 lg:grid-cols-[auto_minmax(14rem,1fr)_auto] lg:py-3 2xl:grid-cols-[auto_minmax(14rem,1fr)_auto_auto] lg:gap-x-6">
        <Link href="/" aria-label="SmartFabrication home" className="group flex min-w-0 items-center gap-2.5 lg:gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-graphite text-sage shadow-sm ring-1 ring-white/20 ring-inset transition-transform group-hover:-rotate-6 lg:h-12 lg:w-12">
            <Hammer size={23} strokeWidth={1.7} aria-hidden="true"/>
          </span>
          <span className="min-w-0 text-[13px] font-bold tracking-tight text-graphite sm:text-base lg:text-lg">
            SmartFabrication
            <span className="mt-0.5 hidden text-[11px] font-normal tracking-normal text-slate-500 sm:block">
              {locale === 'hi' ? 'आपकी जगह, आपकी पसंद।' : 'Crafted in steel. Built to last.'}
            </span>
          </span>
        </Link>

        <div className="col-span-2 row-start-3 min-w-0 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <GlobalSearchBar/>
        </div>

        <nav aria-label="Main navigation" className="col-span-2 grid grid-cols-4 gap-1 border-t border-slate-200/70 pt-2 lg:col-span-3 lg:flex lg:justify-center lg:gap-2 2xl:col-span-1 2xl:col-start-3 2xl:row-start-1 2xl:border-0 2xl:p-0">
          {links.map(({href,label,icon:Icon})=>{
            const active=pathname===href||pathname.startsWith(href+'/');
            return <Link key={href} href={href} aria-current={active?'page':undefined} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center text-[10px] font-semibold transition-colors sm:flex-row sm:gap-2 sm:px-3 sm:text-xs lg:px-4 lg:py-2.5 2xl:px-2.5 ${active?'bg-orange-100 text-orange-800':'text-slate-600 hover:bg-white hover:text-graphite'}`}>
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" className={active?'text-orange-700':'text-slate-500'}/>
              <span className="leading-tight">{label}</span>
            </Link>;
          })}
        </nav>

        <div className="col-start-2 row-start-1 justify-self-end lg:col-start-3 2xl:col-start-4">
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden lg:block"><LanguageSwitcher/></div>
            <span aria-hidden="true" className="hidden h-7 w-px bg-slate-200 lg:block"/>
            <HeaderShopTriggers/>
            <Button asChild className="hidden h-11 gap-2 rounded-xl bg-graphite px-4 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 lg:inline-flex">
              <Link href="/contact" aria-label="Request a quote"><FileText size={16} aria-hidden="true"/><span>{dict.nav.quote}</span><ArrowUpRight size={15} aria-hidden="true"/></Link>
            </Button>
          </div>
        </div>

        <div className="col-span-2 row-start-2 flex items-center justify-between gap-3 lg:hidden">
          <LanguageSwitcher/>
          <Button asChild size="sm" className="gap-2 rounded-xl bg-graphite px-3 text-xs text-white hover:bg-slate-800">
            <Link href="/contact" aria-label="Request a quote"><FileText size={15} aria-hidden="true"/><span>{dict.nav.quote}</span><ArrowUpRight size={14} aria-hidden="true"/></Link>
          </Button>
        </div>
      </div>
    </header>
  );
}