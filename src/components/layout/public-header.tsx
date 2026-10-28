'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand-logo';
import { FaIcon } from '@/components/fa-icon';
import { HeaderShopTriggers } from '@/features/shop/header-shop-triggers';
import { LanguageSwitcher } from '@/features/i18n/language-switcher';
import { useLocale } from '@/lib/i18n/locale-context';
import { GlobalSearchBar } from './global-search-bar';
export function PublicHeader(){const {dict}=useLocale(),pathname=usePathname();const links=[{href:'/catalog',label:dict.nav.catalog,icon:'border-all'},{href:'/gallery',label:dict.nav.gallery,icon:'images'},{href:'/estimate',label:dict.nav.estimate,icon:'calculator'},{href:'/account',label:dict.nav.account,icon:'user'}];return <header className="royal-public-header"><div className="royal-header-inner"><Link href="/" aria-label="Royal Gates home" className="royal-header-brand"><BrandLogo/></Link><div className="royal-header-search"><GlobalSearchBar/><div className="royal-language-mobile"><LanguageSwitcher/></div></div><div className="royal-header-tools"><div className="royal-language-desktop"><LanguageSwitcher/></div><HeaderShopTriggers/><Link href="/contact" aria-label="Request a quote" className="royal-header-quote"><FaIcon name="file-lines"/>{dict.nav.quote}<FaIcon name="arrow-up-right-from-square"/></Link></div><nav aria-label="Main navigation" className="royal-public-nav">{links.map(({href,label,icon})=><Link key={href} href={href} aria-current={pathname===href||pathname.startsWith(href+'/')?'page':undefined}><FaIcon name={icon}/><span>{label}</span></Link>)}<Link href="/contact" className="royal-nav-quote" aria-label="Request a quote"><FaIcon name="file-lines"/><span>{dict.nav.quote}</span></Link></nav></div></header>;}
