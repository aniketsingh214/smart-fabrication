'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale-context';

export interface PortfolioCategory {
  id: string;
  titleEn: string;
  titleHi: string;
  tagEn: string;
  tagHi: string;
  categorySlug: string;
  publicId: string;
  sampleAspect: string;
}

export const PORTFOLIO_ITEMS: PortfolioCategory[] = [
  {
    id: 'modern-main-gates',
    titleEn: 'Modern Main Gates',
    titleHi: 'मॉडर्न मेन गेट्स',
    tagEn: 'Architectural SS 304 & Steel',
    tagHi: 'एसएस 304 व प्राइम स्टील',
    categorySlug: 'main-gates',
    publicId: 'smart-fabrication/development/steel-gate-album/royal-ss-304-mirror-walnut-gate',
    sampleAspect: 'col-span-1 md:col-span-2 row-span-2'
  },
  {
    id: 'cnc-laser-cut',
    titleEn: 'CNC Laser Cut Designs',
    titleHi: 'सीएनसी लेज़र कट डिज़ाइन्स',
    tagEn: '0.1mm Precision Fiber Cutting',
    tagHi: 'हाई प्रिसिजन फाइबर लेज़र',
    categorySlug: 'laser-cutting-gates',
    publicId: 'smart-fabrication/development/steel-gate-album/luxury-champagne-gold-laser-cut-ss-gate',
    sampleAspect: 'col-span-1'
  },
  {
    id: 'luxury-sliding-gates',
    titleEn: 'Luxury Sliding Gates',
    titleHi: 'लक्ज़री स्लाइडिंग गेट्स',
    tagEn: 'Smooth Driveway Track System',
    tagHi: 'हैवी रोलर बियरिंग ट्रैक',
    categorySlug: 'main-gates',
    publicId: 'smart-fabrication/development/demo-stock/sliding-driveway-gate',
    sampleAspect: 'col-span-1'
  },
  {
    id: 'steel-gate-fabrication',
    titleEn: 'Steel Gate Fabrication',
    titleHi: 'स्टील गेट फैब्रिकेशन',
    tagEn: 'Heavy Structural Integrity',
    tagHi: 'ठोस मजबूती व टिकाऊ वेल्डिंग',
    categorySlug: 'steel-doors',
    publicId: 'smart-fabrication/development/demo-stock/steel-security-door',
    sampleAspect: 'col-span-1'
  },
  {
    id: 'balcony-railings',
    titleEn: 'Balcony Railings',
    titleHi: 'बालकनी व सीढ़ी रेलिंग',
    tagEn: 'Toughened Glass & SS 304',
    tagHi: 'टफन्ड ग्लास व स्टील फिनिश',
    categorySlug: 'railings',
    publicId: 'smart-fabrication/development/demo-stock/ss-glass-railing',
    sampleAspect: 'col-span-1'
  },
  {
    id: 'custom-metal-designs',
    titleEn: 'Custom Metal Designs',
    titleHi: 'कस्टम मेटल डिज़ाइन्स',
    tagEn: 'Handcrafted Bespoke Work',
    tagHi: 'कस्टम साइज व मनपसंद डिजाइन',
    categorySlug: 'custom-metal',
    publicId: 'smart-fabrication/development/demo-stock/pexels-13278911',
    sampleAspect: 'col-span-1 md:col-span-2'
  }
];

export function PortfolioShowcase() {
  const { locale } = useLocale();
  const isHi = locale === 'hi';
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'kz4iyauy';

  return (
    <section className="relative overflow-hidden bg-slate-50/70 py-16 sm:py-20 border-y border-slate-200/70">
      {/* Subtle Ice Blue & Soft Grey Ambient Background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[380px] w-[900px] rounded-full bg-gradient-to-b from-sky-100/50 via-slate-100/40 to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Block */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-semibold text-slate-800 shadow-sm">
            <Sparkles size={13} className="text-sky-600" />
            <span>{isHi ? 'रॉयल गेट पोर्टफोलियो' : 'ROYAL GATE Portfolio'}</span>
          </div>

          <h2 className="mt-3.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {isHi ? 'हमारे काम की एक झलक' : 'A Look at Our Work'}
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            {isHi
              ? 'हर गेट का अपना डिज़ाइन, उद्देश्य और पहचान होती है। हमारे काम को देखें और अपने घर के लिए प्रेरणा पाएं।'
              : 'Every gate has its own design, purpose and personality. Explore our work and find inspiration for your space.'}
          </p>
        </div>

        <p className="home-reference-note">Catalogue design references; these images are not presented as verified completed customer projects.</p>
        {/* Minimal Asymmetric Showcase Grid */}
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PORTFOLIO_ITEMS.map((item) => {
            const imageUrl = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_900/${item.publicId}.jpg`;
            const title = isHi ? item.titleHi : item.titleEn;
            const tag = isHi ? item.tagHi : item.tagEn;

            return (
              <Link
                key={item.id}
                href={`/catalog?category=${item.categorySlug}`}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              >
                {/* Image Container with Subtle Zoom */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                  {/* Subtle Gradient Overlay on Hover for Text Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-75" />

                  {/* Top Category Tag Badge */}
                  <div className="absolute left-3.5 top-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md shadow-sm">
                      <Layers size={11} className="text-sky-300" />
                      {tag}
                    </span>
                  </div>

                  {/* Title Placed Over Lower Portion of Image for Premium Editorial Aesthetic */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white drop-shadow-sm sm:text-lg">
                        {title}
                      </h3>
                      <p className="text-xs font-medium text-slate-200">
                        {isHi ? 'डिज़ाइन देखें' : 'View Designs'}
                      </p>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow transition-transform duration-300 group-hover:scale-110 group-hover:bg-white">
                      <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Action Button: Explore Our Designs -> /catalog */}
        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            className="rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 hover:shadow-lg"
          >
            <Link href="/catalog" className="inline-flex items-center gap-2">
              <span>{isHi ? 'हमारे सभी डिज़ाइन देखें' : 'Explore Our Designs'}</span>
              <ArrowRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
