'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Ruler,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Calculator,
  Phone,
  MessageCircle,
  ChevronRight,
  Wrench,
  Layers,
  Sparkle,
  Paintbrush
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoHeroPhoto } from '@/components/demo-photography';
import { useLocale } from '@/lib/i18n/locale-context';

interface HomeViewProps {
  totalDesigns: number;
  featuredSection?: React.ReactNode;
  categoriesSection?: React.ReactNode;
  customSections?: React.ReactNode;
}

export function HomeView({
  totalDesigns,
  featuredSection,
  categoriesSection,
  customSections
}: HomeViewProps) {
  const { locale, dict } = useLocale();

  const isHi = locale === 'hi';

  const whatsappUrl = `https://wa.me/919876543210?text=${encodeURIComponent(
    isHi
      ? 'नमस्ते SmartFabrication! मुझे अपने घर के लिए गेट / रेलिंग / जाली का काम करवाना है। कृपया डिज़ाइन और कोटेशन शेयर करें।'
      : 'Hello SmartFabrication! I am looking for fabrication work for my home. Please share designs and quotation.'
  )}`;

  return (
    <div className="relative overflow-hidden bg-slate-50/50">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-950 py-14 text-white sm:py-20 lg:py-24">
        {/* Subtle Ambient Radial Lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[900px] rounded-full bg-gradient-to-b from-orange-600/25 via-orange-500/10 to-transparent blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:32px_32px]"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            {/* Hero Left Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3.5 py-1 text-xs font-semibold text-orange-400 backdrop-blur-md">
                <Sparkles size={14} className="text-orange-400" />
                <span>{dict.hero.badge}</span>
              </div>

              {/* Main Headline (with Strong steel accessible name for SEO & compatibility) */}
              <h1
                aria-label={
                  isHi
                    ? 'Strong steel fabrication — अपने घर के लिए मजबूत और सुंदर गेट बनवाएँ'
                    : 'Strong steel and iron gates crafted for your home'
                }
                className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-[1.15]"
              >
                {isHi ? (
                  <>
                    अपने घर के लिए
                    <br />
                    मजबूत और सुंदर
                    <br />
                    <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                      गेट बनवाएँ
                    </span>
                  </>
                ) : (
                  <>
                    Strong steel & iron
                    <br />
                    Crafted for your home.
                    <br />
                    <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                      Built to exact measure.
                    </span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base sm:leading-7">
                {dict.hero.subtitle}
              </p>

              {/* 4 Main Action Buttons (Section 4 Requirement) */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {/* 1. Explore Designs */}
                <Button asChild size="lg" className="bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg shadow-orange-600/30 border-0 text-sm">
                  <Link href="/catalog" className="flex items-center gap-2">
                    {dict.hero.btnDesigns} ({totalDesigns}+) <ArrowRight size={16} />
                  </Link>
                </Button>

                {/* 2. Price Estimate */}
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:text-white text-sm font-semibold"
                >
                  <Link href="/estimate" className="flex items-center gap-2">
                    <Calculator size={16} className="text-orange-400" />
                    {dict.hero.btnEstimate}
                  </Link>
                </Button>

                {/* 3. WhatsApp Us */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-300 backdrop-blur-md transition hover:bg-emerald-900/50 hover:text-emerald-200 shadow-sm"
                >
                  <MessageCircle size={16} className="text-emerald-400" />
                  <span>{dict.hero.btnWhatsApp}</span>
                </a>

                {/* 4. Call Us */}
                <a
                  href="tel:+919876543210"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <Phone size={15} className="text-orange-400" />
                  <span>{dict.hero.btnCall}</span>
                </a>
              </div>

              {/* Quick Category Chips */}
              <div className="mt-8 border-t border-slate-800/80 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  {isHi ? 'सीधे केटेगरी चुनें:' : 'Quick categories:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/catalog?category=main-gates"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-orange-500/50 hover:bg-slate-800 hover:text-white"
                  >
                    <span>🚪 {isHi ? 'मुख्य गेट' : 'Main Gates'} (88+)</span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </Link>
                  <Link
                    href="/catalog?category=railings"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-orange-500/50 hover:bg-slate-800 hover:text-white"
                  >
                    <span>🪜 {isHi ? 'स्टील रेलिंग' : 'Railings'} (175+)</span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </Link>
                  <Link
                    href="/catalog?category=window-grills"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-orange-500/50 hover:bg-slate-800 hover:text-white"
                  >
                    <span>🪟 {isHi ? 'खिड़की जाली' : 'Window Grills'} (76+)</span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </Link>
                  <Link
                    href="/catalog?category=rolling-shutters"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-orange-500/50 hover:bg-slate-800 hover:text-white"
                  >
                    <span>🏬 {isHi ? 'दुकान के शटर' : 'Rolling Shutters'} (101+)</span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </Link>
                  <Link
                    href="/catalog?category=metal-doors"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-orange-500/50 hover:bg-slate-800 hover:text-white"
                  >
                    <span>🛡️ {isHi ? 'सेफ्टी डोर' : 'Security Doors'} (21+)</span>
                    <ChevronRight size={12} className="text-slate-500" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Hero Right Visual */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl shadow-black/70">
                <DemoHeroPhoto />
              </div>

              {/* Floating Badge 1: Site Measurement */}
              <div className="absolute -top-3 -left-3 hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20 text-orange-400">
                  <Ruler size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{dict.hero.badge1}</p>
                  <p className="text-[10px] text-slate-400">{isHi ? 'कारीगर नापेंगे' : 'Free site verification'}</p>
                </div>
              </div>

              {/* Floating Badge 2: Genuine Materials */}
              <div className="absolute -bottom-4 -right-3 hidden sm:flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-xl backdrop-blur-md">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck size={18} />
                </span>
                <div>
                  <p className="text-xs font-bold text-white">{dict.hero.badge2}</p>
                  <p className="text-[10px] text-slate-400">{isHi ? 'मजबूती की गारंटी' : 'Quality tested'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Trust Metrics Strip */}
          <div className="mt-12 grid grid-cols-2 gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md sm:grid-cols-4 sm:p-6">
            <div className="border-r border-slate-800/80 pr-4">
              <p className="text-2xl font-bold text-white sm:text-3xl">{totalDesigns}+</p>
              <p className="mt-1 text-xs text-slate-400">{dict.hero.badge3}</p>
            </div>
            <div className="border-r-0 sm:border-r border-slate-800/80 pr-4">
              <p className="text-2xl font-bold text-orange-400 sm:text-3xl">{isHi ? 'फीट & इंच' : 'Feet & Inch'}</p>
              <p className="mt-1 text-xs text-slate-400">{dict.hero.badge4}</p>
            </div>
            <div className="border-r border-slate-800/80 pr-4">
              <p className="text-2xl font-bold text-white sm:text-3xl">{isHi ? 'पक्का काम' : 'Durable'}</p>
              <p className="mt-1 text-xs text-slate-400">{dict.hero.badge5}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400 sm:text-3xl">{isHi ? 'समय पर' : 'On-Time'}</p>
              <p className="mt-1 text-xs text-slate-400">{dict.hero.badge6}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INSTANT ESTIMATE TEASER BANNER */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/70 p-6 shadow-sm sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-md shadow-orange-600/20">
                <Calculator size={24} />
              </span>
              <div>
                <span className="inline-block rounded-md bg-orange-600/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-orange-700">
                  {isHi ? 'तुरंत खर्च जानें' : 'Fast Estimation'}
                </span>
                <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
                  {dict.home.teaserTitle}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
                  {dict.home.teaserSubtitle}
                </p>
              </div>
            </div>
            <Button asChild size="lg" className="shrink-0 bg-slate-900 text-white hover:bg-slate-800 shadow-md font-bold text-xs sm:text-sm">
              <Link href="/estimate" className="flex items-center gap-2">
                {dict.home.teaserAction} <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS (Verified by integration tests) */}
      {featuredSection}

      {/* 4. CATEGORIES EXPLORER (Verified by integration tests) */}
      {categoriesSection}

      {/* 5. 4-STEP WORKING ROADMAP (Rural-friendly & transparent) */}
      <section className="bg-slate-900 text-white py-14 sm:py-18">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="eyebrow text-orange-400">{isHi ? 'आसान प्रक्रिया' : 'Simple Process'}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {dict.home.processTitle}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              {dict.home.processSubtitle}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: dict.home.step1Title,
                desc: dict.home.step1Desc
              },
              {
                step: '02',
                title: dict.home.step2Title,
                desc: dict.home.step2Desc
              },
              {
                step: '03',
                title: dict.home.step3Title,
                desc: dict.home.step3Desc
              },
              {
                step: '04',
                title: dict.home.step4Title,
                desc: dict.home.step4Desc
              }
            ].map(item => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-slate-800 bg-slate-950/70 p-5 backdrop-blur-md transition hover:border-orange-500/50"
              >
                <span className="text-2xl font-extrabold text-orange-500/80">{item.step}</span>
                <h3 className="mt-2 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. CRAFTSMANSHIP & QUALITY ASSURANCE */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="eyebrow text-orange-600">{isHi ? 'मजबूती और भरोसा' : 'Quality Work'}</p>
          <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {dict.home.trustTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-500">
            {dict.home.trustSubtitle}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card p-6 transition hover:border-orange-300">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 mb-4">
              <ShieldCheck size={20} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {isHi ? 'मजबूत और असली लोहा / स्टील' : 'Prime Steel & SS 304'}
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {isHi
                ? 'हल्के या कमजोर पाइप का इस्तेमाल नहीं किया जाता। सही गेज (मोटाई) और वजन के हिसाब से मजबूत लोहा लगाया जाता है।'
                : 'Heavy-gauge steel and genuine stainless steel sections designed for weather resistance and long life.'}
            </p>
          </div>

          <div className="card p-6 transition hover:border-orange-300">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 mb-4">
              <Sparkle size={20} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {isHi ? 'साफ वेल्डिंग और पक्की फिनिशिंग' : 'Clean Welding & Finishing'}
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {isHi
                ? 'जोड़ों पर सफाई से आर्गन वेल्डिंग और ग्राइंडिंग की जाती है, जिससे गेट या रेलिंग में कोई दरार या खुरदरापन नहीं रहता।'
                : 'Smoothly ground joints and precision welding for an immaculate finish and structural integrity.'}
            </p>
          </div>

          <div className="card p-6 transition hover:border-orange-300">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 mb-4">
              <Paintbrush size={20} />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {isHi ? 'जंग-रोधी प्राइमर और पेंट' : 'Rust-Proof Primer & Paint'}
            </h3>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              {isHi
                ? 'बारिश और धूप से बचाव के लिए पहले एंटी-रस्ट प्राइमर कोटिंग की जाती है, उसके बाद टिकाऊ पेंट किया जाता है।'
                : 'Coated with corrosion-resistant primer and outdoor weather paint to protect against moisture and rust.'}
            </p>
          </div>
        </div>
      </section>

      {/* 7. HIGH-CONVERSION CONSULTATION CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14 md:flex md:items-center md:justify-between">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-600/20 blur-3xl"
          />

          <div className="relative max-w-xl">
            <span className="inline-block rounded-full bg-orange-500/20 px-3 py-1 text-xs font-semibold text-orange-400">
              {isHi ? 'कारीगर से सीधी सलाह' : 'Direct Workshop Consultation'}
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
              {dict.home.ctaHeading}
            </h2>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
              {dict.home.ctaSubheading}
            </p>
          </div>

          <div className="relative mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:mt-0">
            <a
              href="tel:+919876543210"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-md transition"
            >
              <Phone size={15} />
              <span>{isHi ? 'सीधे कॉल करें (+91 98765 43210)' : 'Call +91 98765 43210'}</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/40 px-5 py-3 text-xs sm:text-sm font-bold text-emerald-300 hover:bg-emerald-900/50 transition"
            >
              <MessageCircle size={16} className="text-emerald-400" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {customSections}
      </section>
    </div>
  );
}
