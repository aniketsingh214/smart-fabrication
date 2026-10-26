'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle2, XCircle, ArrowLeftRight, Phone, MessageCircle } from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

interface BeforeAfterTransformationProps {
  whatsapp?: string;
}

export function BeforeAfterTransformation({
  whatsapp = '919876543210'
}: BeforeAfterTransformationProps = {}) {
  const { locale } = useLocale();
  const isHi = locale === 'hi';
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'kz4iyauy';

  // Slider position percentage (0 to 100). Default at 50%
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const beforeImage = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1200/smart-fabrication/development/transformation/old-rusted-gate-before.jpg`;
  const afterImage = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1200/smart-fabrication/development/steel-gate-album/royal-ss-304-mirror-walnut-gate.jpg`;

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pos);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const cleanWa = whatsapp.replace(/[^0-9]/g, '');

  const whatsappUrl =
    `https://wa.me/${cleanWa || '919876543210'}?text=` +
    encodeURIComponent(
      isHi
        ? 'नमस्ते GateWala! मुझे अपने पुराने गेट को बदलकर नया रॉयल एसएस 304 गेट बनवाना है। कृपया नाप और खर्च बताएं।'
        : 'Hello GateWala! I would like to upgrade my entrance gate to a Royal SS 304 gate. Please advise on measurement and quotation.'
    );

  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 sm:py-24 text-white">
      {/* Background radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-t from-orange-600/15 via-orange-500/5 to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-xs font-semibold text-orange-400 backdrop-blur-md">
            <Sparkles size={14} className="text-orange-400 animate-pulse" />
            <span>{isHi ? 'घर का कायाकल्प • असली बदलाव' : 'Home Transformation • Real Upgrade'}</span>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
            {isHi ? (
              <>
                पुराना जंग लगा गेट{' '}
                <span className="text-slate-500 font-normal">बदलिए</span>{' '}
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                  शाही SS 304 गेट में
                </span>
              </>
            ) : (
              <>
                Upgrade Old Rusted Iron to{' '}
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                  Royal SS 304 Architectural Gate
                </span>
              </>
            )}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {isHi
              ? 'स्लाइडर को बीच से उंगली या माउस से बाएँ-दाएँ खींचकर देखें कि नया गेट लगने के बाद मकान की शान और कीमत कैसे बदल जाती है।'
              : 'Drag the slider left and right to witness how a custom GateWala gate transforms the look and value of your entrance.'}
          </p>
        </div>

        {/* Interactive Comparison Slider */}
        <div className="mt-10 max-w-4xl mx-auto">
          <div
            ref={containerRef}
            className="group relative aspect-[16/9] w-full overflow-hidden rounded-2xl border-2 border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/90 select-none cursor-ew-resize touch-none"
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            {/* 1. AFTER Image (Full Layer underneath) */}
            <div className="absolute inset-0">
              <Image
                src={afterImage}
                alt={isHi ? 'नया शाही एसएस 304 गेट (स्मार्ट फैब्रिकेशन)' : 'New Royal SS 304 Gate (After)'}
                fill
                sizes="(min-width: 1024px) 80vw, 100vw"
                className="object-cover"
                priority
              />
              {/* After Badge */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-full border border-emerald-500/60 bg-slate-950/85 px-3.5 py-1 text-xs font-bold text-emerald-400 shadow-lg backdrop-blur-md">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>{isHi ? '✨ स्मार्ट फैब्रिकेशन के बाद' : '✨ After: Smart Fabrication'}</span>
              </div>

              {/* Bottom Right Details */}
              <div className="absolute bottom-4 right-4 z-20 hidden sm:block text-right">
                <span className="inline-block rounded-lg bg-black/70 px-3 py-1 text-[11px] font-semibold text-emerald-300 backdrop-blur-md border border-emerald-500/30">
                  {isHi ? '100% जंग-मुक्त SS 304 • 10 साल वारंटी' : '100% Rust-Proof SS 304 • 10-Yr Warranty'}
                </span>
              </div>
            </div>

            {/* 2. BEFORE Image (Clipped overlay on top) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <div
                className="relative h-full"
                style={{
                  width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100vw'
                }}
              >
                <Image
                  src={beforeImage}
                  alt={isHi ? 'पुराना जंग लगा गेट (पहले)' : 'Old Rusted Gate (Before)'}
                  fill
                  sizes="(min-width: 1024px) 80vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Before Badge */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-red-500/60 bg-slate-950/85 px-3.5 py-1 text-xs font-bold text-rose-400 shadow-lg backdrop-blur-md">
                <XCircle size={14} className="text-rose-400" />
                <span>{isHi ? '❌ पहले: पुराना जंग लगा गेट' : '❌ Before: Weathered Iron'}</span>
              </div>

              {/* Bottom Left Details */}
              <div className="absolute bottom-4 left-4 z-20 hidden sm:block">
                <span className="inline-block rounded-lg bg-black/70 px-3 py-1 text-[11px] font-semibold text-rose-300 backdrop-blur-md border border-rose-500/30">
                  {isHi ? 'उखड़ा पेंट • ढीले कब्जे • जंग की समस्या' : 'Peeling Paint • Rusted Slats • Sagging'}
                </span>
              </div>
            </div>

            {/* 3. Center Divider Handle */}
            <div
              className="absolute inset-y-0 z-30 flex items-center justify-center pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="h-full w-0.5 bg-gradient-to-b from-orange-400 via-white to-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
              <div className="absolute flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border-2 border-white bg-orange-600 text-white shadow-xl shadow-black/80 transition group-hover:scale-110">
                <ArrowLeftRight size={18} className="animate-pulse" />
              </div>
            </div>
          </div>

          {/* Quick preset buttons */}
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <button
              onClick={() => setSliderPos(0)}
              className="hover:text-emerald-400 font-semibold transition underline underline-offset-4"
            >
              {isHi ? 'पूरा नया लुक देखें (100% After) →' : 'View Full After →'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                {isHi ? 'उंगली या माउस से स्लाइड करें' : 'Swipe left/right to compare'}
              </span>
              <button
                onClick={() => setSliderPos(50)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white transition"
              >
                {isHi ? 'बीच में (50:50)' : 'Reset (50:50)'}
              </button>
            </div>
            <button
              onClick={() => setSliderPos(100)}
              className="hover:text-rose-400 font-semibold transition underline underline-offset-4"
            >
              {isHi ? '← पुराना लुक देखें (100% Before)' : '← View Full Before'}
            </button>
          </div>
        </div>

        {/* 3 Key Transformation Guarantees */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">
              {isHi ? '1. घर की शान 10x' : '1. Elevation Boost'}
            </p>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              {isHi
                ? 'नया आधुनिक गेट लगते ही पूरे मकान का मुख्य द्वार किसी महल जैसा लगने लगता है।'
                : 'Architectural mirror stainless steel instantly elevates the curbside presence of your property.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {isHi ? '2. जंग से पूरी मुक्ति' : '2. Zero Rust Assurance'}
            </p>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              {isHi
                ? 'जिंदल व टाटा का ओरिजिनल SS 304 ग्रेड स्टील जो बारिश, धूप और सीलन में भी सालों-साल चमकता रहता है।'
                : 'Certified prime SS 304 marine grade steel engineered never to rust, pit, or discolor.'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
            <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              {isHi ? '3. 7 दिनों में पक्का काम' : '3. Rapid 7-Day Turnaround'}
            </p>
            <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
              {isHi
                ? 'कारीगर खुद आकर नापेंगे, वर्कशॉप में कम्प्यूटर से सटीक कटिंग होगी और 7 दिनों में फिटिंग पूरी होगी।'
                : 'Free site measurement, precision automated fabrication, and clean same-day installation.'}
            </p>
          </div>
        </div>

        {/* CTA Bar */}
        <div className="mt-8 text-center flex flex-wrap items-center justify-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition"
          >
            <MessageCircle size={17} />
            <span>{isHi ? 'पुराना गेट बदलें — WhatsApp पर बात करें' : 'Replace Old Gate — WhatsApp Us'}</span>
          </a>

          <Link
            href="/estimate"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
          >
            <span>{isHi ? 'कीमत का अनुमान लगाएँ' : 'Calculate estimate'}</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
