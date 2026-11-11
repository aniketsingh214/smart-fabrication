'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Paintbrush,
  Search,
  MapPin,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeroBannerSlider } from '@/components/hero-banner-slider';
import { BeforeAfterTransformation } from '@/components/before-after-transformation';
import { WorkshopVideoReels } from '@/components/workshop-video-reels';
import { FabricatorComparison } from '@/components/fabricator-comparison';
import { PortfolioShowcase } from './portfolio-showcase';
import { MobileStickyActionBar } from '@/components/mobile-sticky-action-bar';
import { useLocale } from '@/lib/i18n/locale-context';

interface HomeViewProps {
  totalDesigns: number;
  featuredSection?: React.ReactNode;
  categoriesSection?: React.ReactNode;
  customSections?: React.ReactNode;
  phone?: string;
  whatsapp?: string;
}

export function HomeView({
  totalDesigns,
  featuredSection,
  categoriesSection,
  customSections,
  phone = '+91 98765 43210',
  whatsapp = '+91 98765 43210'
}: HomeViewProps) {
  const { locale, dict } = useLocale();
  const isHi = locale === 'hi';

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanWa = whatsapp.replace(/[^0-9]/g, '');

  const whatsappUrl = `https://wa.me/${cleanWa || '919876543210'}?text=${encodeURIComponent(
    isHi
      ? 'नमस्ते Royal Gates! मुझे अपने घर के लिए गेट / रेलिंग / जाली का काम करवाना है। कृपया डिज़ाइन और कोटेशन शेयर करें।'
      : 'Hello Royal Gates! I am looking for custom fabrication work for my home. Please share designs and quotation.'
  )}`;

  // Quick estimator state
  const [calcCategory, setCalcCategory] = useState('main-gates');
  const [calcWidth, setCalcWidth] = useState('10');
  const [calcHeight, setCalcHeight] = useState('6');
  const [calcMaterial, setCalcMaterial] = useState('ms');

  const approxSqFt = (Number(calcWidth) || 0) * (Number(calcHeight) || 0);
  const approxRate = calcMaterial === 'ss' ? 1200 : calcMaterial === 'laser' ? 950 : 650;
  const approxPrice = approxSqFt > 0 ? approxSqFt * approxRate : 0;

  return (
    <div className="relative overflow-hidden bg-white">
      {/* 1. HERO SECTION WITH INDUSTRIAL WELDING WORKSHOP & ROYAL GATES ATMOSPHERE */}
      <section className="relative overflow-hidden bg-slate-950 py-12 text-white sm:py-18 lg:py-22">
        {/* Full-width Realistic Metal Fabrication Workshop Background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-no-repeat bg-[center_right] sm:bg-[center_right_12%] opacity-40 sm:opacity-55 lg:opacity-65 contrast-110"
          style={{
            backgroundImage: `url('https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'kz4iyauy'}/image/upload/f_auto,q_auto,w_1920/smart-fabrication/development/demo-stock/pexels-5846247.jpg')`
          }}
        />

        {/* Accessible Image tag and caption for screen readers & testing */}
        <img
          src="https://res.cloudinary.com/kz4iyauy/image/upload/f_auto,q_auto,w_1920/smart-fabrication/development/demo-stock/pexels-5846247.jpg"
          alt="Welder wearing protective equipment working on a metal piece"
          className="sr-only"
        />
        <span className="sr-only">Demo workshop photography</span>

        {/* Dark Navy-Blue Overlay / Gradient for Text Readability */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-r from-slate-950 via-slate-950/95 sm:via-slate-950/85 to-slate-950/35"
        />
        {/* Mobile vertical gradient to protect text on compact screens */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/70 sm:hidden"
        />

        {/* Ambient Gold Radial Lighting */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-amber-500/15 via-yellow-500/10 to-transparent blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            {/* Hero Left Content */}
            <div>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
                <Sparkles size={14} className="text-amber-400" />
                <span>{isHi ? 'शाही फैब्रिकेशन · 100% पक्की कारीगरी' : 'Royal Gates · Premium Steel Craftsmanship'}</span>
              </div>

              {/* Main Headline (preserves Strong steel for SEO & public test suites) */}
              <h1
                aria-label={
                  isHi
                    ? 'Strong steel fabrication — अपने घर को दें शाही पहचान'
                    : 'Strong steel and iron gates crafted for your home'
                }
                className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-[1.15]"
              >
                {isHi ? (
                  <>
                    अपने घर को दें
                    <br />
                    <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                      शाही पहचान
                    </span>
                  </>
                ) : (
                  <>
                    Give your home a
                    <br />
                    <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                      Royal Identity
                    </span>
                  </>
                )}
              </h1>

              {/* Supporting Text */}
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base sm:leading-7">
                {isHi
                  ? 'आधुनिक डिजाइन, मजबूत निर्माण और आपकी पसंद के अनुसार कस्टम फैब्रिकेशन।'
                  : 'Modern designs, robust fabrication and custom metal gates built to your exact measurements.'}
              </p>

              {/* 2 Main Action CTAs */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                {/* 1. Explore Designs */}
                <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-lg shadow-amber-600/30 border-0 text-sm rounded-xl px-6 py-6">
                  <Link href="/catalog" className="flex items-center gap-2">
                    {dict.hero.btnDesigns} ({totalDesigns}+) <ArrowRight size={16} />
                  </Link>
                </Button>

                {/* 2. Get Price on WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-950/50 px-5 py-3 text-xs sm:text-sm font-bold text-emerald-300 backdrop-blur-md transition hover:bg-emerald-900/60 hover:text-emerald-200 shadow-sm"
                >
                  <MessageCircle size={18} className="text-emerald-400" />
                  <span>{isHi ? 'व्हाट्सएप पर कीमत जानें' : 'Get Price on WhatsApp'}</span>
                </a>

                {/* 3. Call Us */}
                <a
                  href={`tel:${cleanPhone || '+919876543210'}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-xs sm:text-sm font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                >
                  <Phone size={15} className="text-amber-400" />
                  <span>{dict.hero.btnCall}</span>
                </a>
              </div>

              {/* Three Core Benefits Below Hero CTA */}
              <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 border-t border-slate-800/80 pt-5">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <ShieldCheck size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{isHi ? 'मजबूत निर्माण' : 'Strong & Durable'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{isHi ? 'असली भारी गेज' : 'Heavy steel'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <Ruler size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{isHi ? 'कस्टम डिज़ाइन' : 'Custom Design'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{isHi ? 'सटीक नाप पर' : 'Exact fit'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                    <Sparkle size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{isHi ? 'प्रीमियम फिनिश' : 'Premium Finish'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{isHi ? 'जंग-रोधी कोटिंग' : 'Anti-rust'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Right Visual: Interactive 6-Slide Banner Carousel */}
            <div className="relative">
              <HeroBannerSlider />
            </div>
          </div>

          {/* Bottom Trust Metrics Strip */}
          <div className="mt-10 grid grid-cols-2 gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 sm:p-5 backdrop-blur-md sm:grid-cols-4">
            <div className="border-r border-slate-800/80 pr-4">
              <p className="text-2xl font-bold text-white sm:text-3xl">{totalDesigns}+</p>
              <p className="mt-1 text-xs text-slate-400">{dict.hero.badge3}</p>
            </div>
            <div className="border-r-0 sm:border-r border-slate-800/80 pr-4">
              <p className="text-2xl font-bold text-amber-400 sm:text-3xl">{isHi ? 'फीट & इंच' : 'Feet & Inch'}</p>
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

      <div className="home-below-hero">
        {/* 2. OUR CATEGORIES SECTION (Smooth horizontal scroll on mobile) */}
        {categoriesSection}

        {/* 3. PROMOTIONAL BANNER: 435+ PREMIUM DESIGNS */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-orange-50/60 p-6 sm:p-10 shadow-sm">
            <div className="grid items-center gap-6 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-800 mb-3">
                  <Award size={14} className="text-amber-700" />
                  <span>Royal Collection · {totalDesigns}+ Designs</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {isHi ? 'शाही गेट एवं रेलिंग के 435+ बेहतरीन मॉडल्स' : '435+ Premium Gate & Railing Designs'}
                </h2>
                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                  {isHi
                    ? 'हर घर और बजट के लिए विशेष रूप से तैयार किए गए डिज़ाइन्स। अपनी पसंद का गेट चुनें और सीधे कारखाने से ऑर्डर करें। संपूर्ण भारत में डिलीवरी एवं इंस्टॉलेशन उपलब्ध।'
                    : 'Architectural steel gates, modern laser cutting screens, and balcony railings engineered for durability and luxury.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md shadow-amber-600/20">
                    <Link href="/catalog" className="flex items-center gap-2">
                      {isHi ? 'सभी डिज़ाइन्स देखें (View All Designs)' : 'View All Designs'} <ArrowRight size={16} />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-amber-300 text-amber-900 hover:bg-amber-100/50 rounded-xl font-semibold">
                    <Link href="/estimate">
                      {isHi ? 'खर्च का अनुमान लगाएं' : 'Get Price Estimate'}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md border border-amber-200/60 bg-slate-900">
                <Image
                  src="https://res.cloudinary.com/kz4iyauy/image/upload/f_auto,q_auto,w_800/smart-fabrication/development/steel-gate-album/royal-ss-304-mirror-walnut-gate"
                  alt="435+ Premium Gate Designs by Royal Gates"
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold flex items-center justify-between">
                  <span>Custom Handcrafted</span>
                  <span className="text-amber-300 font-bold">435+ Models</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. POPULAR GATE DESIGNS (Responsive 2-column mobile grid) */}
        {featuredSection}

        {/* 5. BEFORE / AFTER TRANSFORMATION (Interactive Comparison Slider) */}
        <BeforeAfterTransformation whatsapp={cleanWa} />

        {/* 6. PRICE ESTIMATION SECTION (Mobile-Friendly Interactive Calculator Teaser) */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow text-amber-700 font-bold">Price Estimation · कीमत का सही अंदाज़ा</p>
                <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                  {isHi ? 'अपने गेट का तुरंत खर्च जानें' : 'Instant Project Price Estimator'}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
                  {isHi ? 'चौड़ाई, ऊंचाई और मटेरियल चुनकर तुरंत अनुमानित खर्च निकालें।' : 'Select dimensions and material to estimate starting fabrication cost.'}
                </p>
              </div>
              <Button asChild variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-50">
                <Link href="/estimate" className="flex items-center gap-1.5 text-xs font-bold">
                  <Calculator size={15} />
                  <span>{isHi ? 'विस्तृत कैलकुलेटर खोलें' : 'Open Full Calculator'}</span>
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isHi ? 'केटेगरी (Category)' : 'Category'}
                </label>
                <select
                  value={calcCategory}
                  onChange={e => setCalcCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800"
                >
                  <option value="main-gates">{isHi ? 'मुख्य गेट (Main Gate)' : 'Main Gate'}</option>
                  <option value="laser">{isHi ? 'लेज़र कटिंग गेट' : 'Laser Cut Gate'}</option>
                  <option value="railings">{isHi ? 'स्टील रेलिंग (Railing)' : 'Railing'}</option>
                  <option value="grills">{isHi ? 'खिड़की जाली (Grills)' : 'Window Grills'}</option>
                </select>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isHi ? 'नाप (चौड़ाई x ऊंचाई फीट)' : 'Dimensions (W x H ft)'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={calcWidth}
                    onChange={e => setCalcWidth(e.target.value)}
                    placeholder="चौड़ाई फीट"
                    className="w-1/2 rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 text-center"
                  />
                  <span className="text-slate-400 font-bold">x</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={calcHeight}
                    onChange={e => setCalcHeight(e.target.value)}
                    placeholder="ऊंचाई फीट"
                    className="w-1/2 rounded-xl border border-slate-300 bg-white p-2 text-xs font-medium text-slate-800 text-center"
                  />
                </div>
              </div>

              {/* Material */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {isHi ? 'मटेरियल (Material)' : 'Material'}
                </label>
                <select
                  value={calcMaterial}
                  onChange={e => setCalcMaterial(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-800"
                >
                  <option value="ms">{isHi ? 'माइल्ड स्टील (MS - Standard)' : 'Mild Steel (MS)'}</option>
                  <option value="laser">{isHi ? 'सीएनसी लेज़र शीट + एमएस' : 'CNC Laser Sheet + MS'}</option>
                  <option value="ss">{isHi ? 'स्टेनलेस स्टील (SS-304 Prime)' : 'Stainless Steel (SS 304)'}</option>
                </select>
              </div>

              {/* Calculated Result & CTA */}
              <div className="flex flex-col justify-between rounded-xl bg-white p-3 border border-amber-200">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">{isHi ? 'अनुमानित खर्च' : 'Estimated Price'}</p>
                  <p className="text-xl sm:text-2xl font-extrabold text-amber-700">
                    ₹{approxPrice.toLocaleString('en-IN')}*
                  </p>
                  <p className="text-[10px] text-slate-400">({approxSqFt} sq.ft @ ₹{approxRate}/sq.ft)</p>
                </div>
                <Button asChild size="sm" className="mt-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs">
                  <Link href={`/estimate?w=${calcWidth}&h=${calcHeight}`}>
                    {isHi ? 'पक्का कोटेशन लें' : 'Get Full Quote'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 7. WORKSHOP & CRAFTSMANSHIP REELS */}
        <WorkshopVideoReels />

        {/* 8. WORKSHOP STATS & CRAFTSMANSHIP DETAILS */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="eyebrow text-amber-700 font-bold">{isHi ? 'कारीगरी और भरोसा' : 'Workshop Excellence'}</p>
            <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {isHi ? 'रॉयल गेट्स क्यों चुनें?' : 'Why Choose Royal Gates?'}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm text-slate-500">
              {isHi
                ? 'कारखाने से सीधे बिना किसी बिचौलिए के सही वजन और पक्की फिनिशिंग के साथ गेट बनवाएं।'
                : 'Direct workshop fabrication, genuine gauge thickness, and weather-proof epoxy finish.'}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="card p-6 border border-slate-200 transition hover:border-amber-400 hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4 font-bold">
                <ShieldCheck size={22} />
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

            <div className="card p-6 border border-slate-200 transition hover:border-amber-400 hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4 font-bold">
                <Sparkle size={22} />
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

            <div className="card p-6 border border-slate-200 transition hover:border-amber-400 hover:shadow-md">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 mb-4 font-bold">
                <Paintbrush size={22} />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {isHi ? 'जंग-रोधी प्राइमर और पेंट' : 'Rust-Proof Primer & Paint'}
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {isHi
                  ? 'बारिश और धूप से बचाव के लिए पहले एंटी-रस्ट प्राइमर कोटिंग की जाती है, उसके बाद टिकाऊ वेदरप्रूफ पेंट किया जाता है।'
                  : 'Coated with corrosion-resistant primer and outdoor weather paint to protect against moisture and rust.'}
              </p>
            </div>
          </div>
        </section>

        {/* 9. PORTFOLIO: A LOOK AT OUR WORK */}
        <PortfolioShowcase />

        {/* 10. DIRECT CONTACT & WORKSHOP CONSULTATION SECTION */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="home-consultation relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white shadow-xl sm:px-10 sm:py-14 md:flex md:items-center md:justify-between border border-slate-800">
            <div className="relative max-w-xl">
              <span className="inline-block rounded-full border border-amber-500/30 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                {isHi ? 'कारीगर से सीधी सलाह · कारखाने से संपर्क' : 'Direct Workshop Consultation'}
              </span>
              <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl text-white">
                {isHi ? 'अपने प्रोजेक्ट के लिए आज ही बात करें' : 'Discuss Your Custom Gate Project Today'}
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                {isHi
                  ? 'गेट की डिज़ाइन, सटीक नाप या कोटेशन के लिए हमारी वर्कशॉप टीम से सीधे संपर्क करें। हम आपके घर आकर नाप लेने में भी मदद करते हैं।'
                  : 'Get expert guidance from master fabricators. Contact our workshop directly for design catalogues, site measurement and custom price estimates.'}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-amber-400"/> 9:00 AM – 8:00 PM (Mon-Sat)</span>
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-amber-400"/> Main Workshop & Digital Showroom</span>
              </div>
            </div>

            <div className="relative mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:mt-0">
              <a
                href={`tel:${cleanPhone || '+919876543210'}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-amber-600/25 transition"
              >
                <Phone size={16} />
                <span>{isHi ? `सीधे कॉल करें (${phone})` : `Call ${phone}`}</span>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-950/50 px-5 py-3.5 text-xs sm:text-sm font-bold text-emerald-300 hover:bg-emerald-900/60 transition"
              >
                <MessageCircle size={17} className="text-emerald-400" />
                <span>WhatsApp Enquiry</span>
              </a>
            </div>
          </div>

          {customSections}
        </section>
      </div>

      {/* Floating 4-Tab Mobile Navigation Bar */}
      <MobileStickyActionBar phone={cleanPhone} whatsapp={cleanWa} />
    </div>
  );
}
