'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Pause,
  Play
} from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

export interface HeroSlide {
  id: string;
  publicId: string;
  badgeHi: string;
  badgeEn: string;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
  categorySlug: string;
  link: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'gate-slide',
    publicId: 'smart-fabrication/development/steel-gate-album/royal-ss-304-mirror-walnut-gate',
    badgeHi: '🚪 शाही मुख्य गेट',
    badgeEn: '🚪 Royal Main Gates',
    titleHi: 'शाही एसएस 304 व लेज़र कट गेट',
    titleEn: 'Royal SS 304 & Laser Cut Main Gate',
    descHi: 'घर के सटीक नाप (फीट/इंच) पर 100% जंग-मुक्त प्रीमियम फैब्रिकेशन।',
    descEn: 'Rust-free architectural steel gates built to exact feet & inches.',
    categorySlug: 'main-gates',
    link: '/catalog?category=main-gates'
  },
  {
    id: 'railing-slide',
    publicId: 'smart-fabrication/development/demo-stock/ss-glass-railing',
    badgeHi: '🪜 टफन्ड ग्लास रेलिंग',
    badgeEn: '🪜 Glass & SS Railings',
    titleHi: '12mm टफन्ड ग्लास व एसएस बालकनी रेलिंग',
    titleEn: '12mm Toughened Glass & SS 304 Balcony Railing',
    descHi: 'बालकनी व सीढ़ियों के लिए 10-वर्षीय मजबूती गारंटी के साथ आधुनिक डिज़ाइन।',
    descEn: 'Luxury architectural glass balustrade with 10-year durability assurance.',
    categorySlug: 'railings',
    link: '/catalog?category=railings'
  },
  {
    id: 'shutter-slide',
    publicId: 'smart-fabrication/development/user-shutters/pin-1140466305672357403',
    badgeHi: '🏬 मोटराइज्ड रोलिंग शटर',
    badgeEn: '🏬 Motorized Rolling Shutters',
    titleHi: 'रिमोट कंट्रोल कमर्शियल रोलिंग शटर',
    titleEn: 'High-Security Motorized Storefront Shutter',
    descHi: 'रिमोट कंट्रोल व इमरजेंसी मैनुअल चेन ओवरराइड के साथ दुकानों की पूरी सुरक्षा।',
    descEn: 'High-torque AC tubular motor with dual wireless remotes and manual override.',
    categorySlug: 'rolling-shutters',
    link: '/catalog?category=rolling-shutters'
  },
  {
    id: 'grill-slide',
    publicId: 'smart-fabrication/development/demo-stock/window-safety-grill',
    badgeHi: '🪟 मजबूत खिड़की जाली',
    badgeEn: '🪟 Safety Window Grills',
    titleHi: 'मॉडर्न बॉक्स व सीएनसी लेज़र विंडो ग्रिल',
    titleEn: 'Modern Box & CNC Laser Window Safety Grill',
    descHi: 'चोरी से पुख्ता सुरक्षा और ताजी हवा व रोशनी के लिए बेस्ट वेंटिलेशन।',
    descEn: 'Burglary-resistant heavy gauge steel with anti-corrosion primer coating.',
    categorySlug: 'window-grills',
    link: '/catalog?category=window-grills'
  },
  {
    id: 'shed-slide',
    publicId: 'smart-fabrication/development/demo-stock/peb-warehouse-shed',
    badgeHi: '🏭 इंडस्ट्रियल शेड व वेयरहाउस',
    badgeEn: '🏭 Industrial PEB Sheds',
    titleHi: 'हेवी स्ट्रक्चरल स्टील वेयरहाउस शेड',
    titleEn: 'Heavy PEB Factory Sheds & Warehouse Roofing',
    descHi: 'फैक्ट्री, गोदाम व वर्कशॉप के लिए वाटरप्रूफ और टिकाऊ भारी स्टील शेड।',
    descEn: 'High-span engineered trusses with color-coated heavy galvanized roofing.',
    categorySlug: 'sheds-roofing',
    link: '/catalog?category=sheds-roofing'
  },
  {
    id: 'door-slide',
    publicId: 'smart-fabrication/development/demo-stock/steel-security-door',
    badgeHi: '🛡️ मुख्य सुरक्षा द्वार',
    badgeEn: '🛡️ Security Front Doors',
    titleHi: 'सॉलिड रॉट आयरन सिक्योरिटी फ्रंट डोर',
    titleEn: 'Handcrafted Solid Iron Security Front Door',
    descHi: 'मल्टी-लॉक सिस्टम व मजबूत सुरक्षा दरवाजे जो घर को दें शाही लुक।',
    descEn: 'Multi-point locking entry doors crafted for lifetime protection and elegance.',
    categorySlug: 'metal-doors',
    link: '/catalog?category=metal-doors'
  }
];

export function HeroBannerSlider() {
  const { locale } = useLocale();
  const isHi = locale === 'hi';
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'kz4iyauy';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const totalSlides = HERO_SLIDES.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-slide effect
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const current = HERO_SLIDES[currentIndex];
  const imageUrl = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1200/${current.publicId}.jpg`;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={isHi ? 'मुख्य फैब्रिकेशन बैनर स्लाइडर' : 'Hero Fabrication Banners'}
      aria-live="polite"
      className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900 shadow-2xl shadow-black/80"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide Image with Smooth Fade */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950 sm:aspect-[16/11]">
        {HERO_SLIDES.map((slide, idx) => {
          const slideUrl = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1200/${slide.publicId}.jpg`;
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={slideUrl}
                alt={isHi ? slide.titleHi : slide.titleEn}
                fill
                priority={idx === 0}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              {/* Cinematic Vignette & Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
            </div>
          );
        })}

        {/* Top Floating Badge Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-slate-950/85 px-3.5 py-1 text-xs font-bold text-blue-300 backdrop-blur-md shadow-lg">
            <Sparkles size={13} className="text-blue-400 animate-pulse" />
            <span>{isHi ? current.badgeHi : current.badgeEn}</span>
          </div>

          {/* Slide Counter & Pause/Play Control */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-950/80 px-3 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur-md">
            <span>
              {currentIndex + 1} / {totalSlides}
            </span>
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
              className="ml-1 text-slate-400 hover:text-white transition"
              title={isPaused ? 'Play' : 'Pause'}
            >
              {isPaused ? <Play size={11} className="fill-current" /> : <Pause size={11} className="fill-current" />}
            </button>
          </div>
        </div>

        {/* Bottom Slide Information Banner */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-5 sm:p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400">
            {isHi ? 'रॉयल गेट्स विशेष' : 'Royal Gates Workshop'}
          </p>
          <h2 className="mt-1 text-lg font-extrabold sm:text-2xl text-white line-clamp-1 drop-shadow-md">
            {isHi ? current.titleHi : current.titleEn}
          </h2>
          <p className="mt-1 text-xs text-slate-300 line-clamp-2 sm:text-sm drop-shadow">
            {isHi ? current.descHi : current.descEn}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <Link
              href={current.link}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-blue-600/40 transition hover:bg-blue-500"
            >
              <span>{isHi ? 'डिज़ाइन देखें' : 'View Designs'}</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              href="/estimate"
              className="text-xs font-semibold text-slate-300 underline underline-offset-4 hover:text-blue-300 transition"
            >
              {isHi ? 'कीमत का अनुमान लगाएँ →' : 'Calculate price →'}
            </Link>
          </div>
        </div>
      </div>

      {/* Left Navigation Arrow */}
      <button
        onClick={prevSlide}
        aria-label="Previous Hero Slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:scale-110 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-80 group-hover:opacity-100"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Right Navigation Arrow */}
      <button
        onClick={nextSlide}
        aria-label="Next Hero Slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md transition hover:scale-110 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-80 group-hover:opacity-100"
      >
        <ChevronRight size={20} />
      </button>

      {/* Bottom Dot Indicators */}
      <div className="absolute bottom-2 inset-x-0 z-30 flex justify-center gap-1.5 pointer-events-auto">
        {HERO_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <button
              key={slide.id}
              onClick={() => goToSlide(idx)}
              aria-label={`Go to slide ${idx + 1}: ${isHi ? slide.titleHi : slide.titleEn}`}
              aria-current={isActive ? 'true' : 'false'}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                isActive ? 'w-6 bg-blue-500 ring-2 ring-blue-500/50' : 'w-1.5 bg-slate-500/60 hover:bg-slate-400'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
