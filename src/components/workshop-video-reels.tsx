'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Sparkles, X, Volume2, VolumeX, Eye, ArrowRight, ShieldCheck, Flame, Cpu, Gauge, Award } from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

interface ReelCard {
  id: string;
  badgeHi: string;
  badgeEn: string;
  titleHi: string;
  titleEn: string;
  taglineHi: string;
  taglineEn: string;
  descHi: string;
  descEn: string;
  publicId: string;
  duration: string;
  views: string;
  icon: typeof Cpu;
}

export const WORKSHOP_REELS: ReelCard[] = [
  {
    id: 'laser-cutting',
    badgeHi: '⚡ 4K फाइबर लेज़र',
    badgeEn: '⚡ 4K Fiber Laser',
    titleHi: 'कम्प्यूटरीकृत सीएनसी लेज़र कटिंग',
    titleEn: 'Computerized CNC Laser Cutting',
    taglineHi: '0.1mm शुद्धता के साथ कटिंग',
    taglineEn: '0.1mm High-Precision Cutting',
    descHi: 'भारी स्टील व लोहे की चादर पर बिना किसी टेढ़ेपन के खूबसूरत फ्लोरल व मॉडर्न ज्यामितीय पैटर्न की कटिंग।',
    descEn: 'High-power fiber laser cuts intricate geometric and floral patterns with zero edge warping or roughness.',
    publicId: 'smart-fabrication/development/steel-gate-album/luxury-champagne-gold-laser-cut-ss-gate',
    duration: '0:35',
    views: '4.8k',
    icon: Cpu
  },
  {
    id: 'argon-welding',
    badgeHi: '🔥 आर्गन वेल्डिंग',
    badgeEn: '🔥 Argon TIG Welding',
    titleHi: 'मिरर ग्राइंडिंग व सीमलेस जोड़',
    titleEn: 'Mirror Finish Argon TIG Welding',
    taglineHi: 'शीशे जैसी फिनिश, कोई कालापन नहीं',
    taglineEn: 'Glass-Smooth Seamless Joints',
    descHi: 'साधारण वेल्डिंग की तरह गड्ढे या कालापन नहीं। आर्गन गैस से मजबूत वेल्डिंग और 3-स्टेज बफिंग द्वारा दर्पण जैसी चमक।',
    descEn: 'Argon shielded TIG welding prevents oxidation, followed by 3-stage diamond compound mirror polishing.',
    publicId: 'smart-fabrication/development/steel-gate-album/royal-ss-304-mirror-walnut-gate',
    duration: '0:42',
    views: '6.2k',
    icon: Flame
  },
  {
    id: 'shutter-testing',
    badgeHi: '🏬 लोड टेस्टिंग',
    badgeEn: '🏬 Shutter Testing',
    titleHi: 'मोटराइज्ड शटर 100x रोलिंग टेस्ट',
    titleEn: 'Motorized Storefront Shutter Rigor Test',
    taglineHi: 'रिमोट व मैनुअल चेन ओवरराइड टेस्ट',
    taglineEn: 'Dual Remote & Manual Chain Rigor',
    descHi: 'दुकान या शोरूम पर लगाने से पहले वर्कशॉप में 100+ बार रिमोट और मोटर की स्मूथ रोलिंग और सेफ्टी लॉक की जांच।',
    descEn: 'Every commercial rolling shutter undergoes 100+ cycle remote automation tests before site dispatch.',
    publicId: 'smart-fabrication/development/user-shutters/pin-1140466305672357403',
    duration: '0:28',
    views: '5.1k',
    icon: Gauge
  },
  {
    id: 'protective-coating',
    badgeHi: '🛡️ 10 साल जंग-रोधी',
    badgeEn: '🛡️ 10-Yr Rust Barrier',
    titleHi: '2-लेयर एपॉक्सी जिंक प्राइमर व पीयू पेंट',
    titleEn: '2-Coat Epoxy Zinc Primer & PU Coat',
    taglineHi: 'बारिश, धूप व सीलन से पक्की सुरक्षा',
    taglineEn: 'Automotive Weatherproof Finish',
    descHi: 'लोहे के हर कोने और जोड़ पर पहले एंटी-रस्ट जिंक फॉस्फेट प्राइमर, उसके बाद टिकाऊ ऑटोमोटिव पीयू पेंटिंग।',
    descEn: 'Immersion treatment with zinc-rich epoxy primer followed by polyurethane exterior coating resistant to peeling.',
    publicId: 'smart-fabrication/development/demo-stock/steel-security-door',
    duration: '0:38',
    views: '3.9k',
    icon: Award
  }
];

export function WorkshopVideoReels() {
  const { locale } = useLocale();
  const isHi = locale === 'hi';
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'kz4iyauy';

  const [activeModalReel, setActiveModalReel] = useState<ReelCard | null>(null);

  return (
    <section className="relative overflow-hidden bg-slate-900 py-16 sm:py-24 text-white">
      {/* Decorative ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-10 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-10 left-10 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-300 backdrop-blur-md">
              <Sparkles size={14} className="text-blue-400 animate-pulse" />
              <span>{isHi ? 'लाइव वर्कशॉप रील्स' : 'Live Workshop Craftsmanship'}</span>
            </div>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
              {isHi ? (
                <>
                  देखें हमारी वर्कशॉप में{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                    काम कैसे होता है
                  </span>
                </>
              ) : (
                <>
                  Experience Architectural Metalwork{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                    Behind the Scenes
                  </span>
                </>
              )}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl">
              {isHi
                ? 'कम्प्यूटर नियंत्रित मशीनों, आर्गन वेल्डिंग और अनुभवी फैब्रिकेटर्स द्वारा आपका गेट तैयार किया जाता है।'
                : 'Real footage of our automated cutting, precision welding, and quality testing inside the workshop.'}
            </p>
          </div>

          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-200 hover:border-blue-500 hover:text-white transition w-fit"
          >
            <span>{isHi ? 'सभी 398+ प्रोजेक्ट्स देखें' : 'Explore All 398+ Projects'}</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* 4 Video Reel Cards Grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WORKSHOP_REELS.map(reel => {
            const Icon = reel.icon;
            const imageUrl = `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_800/${reel.publicId}.jpg`;

            return (
              <div
                key={reel.id}
                onClick={() => setActiveModalReel(reel)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveModalReel(reel);
                  }
                }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer"
              >
                {/* Visual Image Card with 16:11 Aspect */}
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-900">
                  <Image
                    src={imageUrl}
                    alt={isHi ? reel.titleHi : reel.titleEn}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="rounded-full bg-slate-950/80 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 backdrop-blur-md border border-blue-500/30">
                      {isHi ? reel.badgeHi : reel.badgeEn}
                    </span>
                    <span className="rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-semibold text-slate-300 backdrop-blur-md">
                      {reel.duration}
                    </span>
                  </div>

                  {/* Center Play Button with Pulsing Ring */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/50 transition-transform duration-300 group-hover:scale-125">
                      <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-40" />
                      <Play size={18} className="ml-0.5 fill-current" />
                    </div>
                  </div>

                  {/* Bottom overlay views indicator */}
                  <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[11px] font-medium text-slate-300 drop-shadow">
                    <Eye size={12} className="text-slate-400" />
                    <span>{reel.views} {isHi ? 'देखा गया' : 'views'}</span>
                  </div>
                </div>

                {/* Text Description */}
                <div className="mt-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                      <Icon size={14} className="text-blue-400" />
                      <span>{isHi ? reel.taglineHi : reel.taglineEn}</span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-white line-clamp-1 group-hover:text-blue-300 transition">
                      {isHi ? reel.titleHi : reel.titleEn}
                    </h3>
                    <p className="mt-1.5 text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {isHi ? reel.descHi : reel.descEn}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400 group-hover:text-blue-300">
                    <span>{isHi ? 'रील्स वीडियो देखें' : 'Watch Footage'}</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Modal Video Viewer */}
      {activeModalReel && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setActiveModalReel(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveModalReel(null)}
              aria-label="Close modal"
              className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            >
              <X size={18} />
            </button>

            {/* Modal Image/Video Preview */}
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-800">
              <Image
                src={`https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_1000/${activeModalReel.publicId}.jpg`}
                alt={isHi ? activeModalReel.titleHi : activeModalReel.titleEn}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

              {/* Status pill */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-orange-600/90 px-3 py-1 text-xs font-bold text-white shadow-md">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                <span>{isHi ? 'वर्कशॉप लाइव फुटेज' : 'Workshop Footage'}</span>
              </div>
            </div>

            {/* Modal Content */}
            <div className="mt-5">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                {isHi ? activeModalReel.badgeHi : activeModalReel.badgeEn}
              </span>
              <h3 className="mt-1 text-xl font-extrabold text-white">
                {isHi ? activeModalReel.titleHi : activeModalReel.titleEn}
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {isHi ? activeModalReel.descHi : activeModalReel.descEn}
              </p>

              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-300 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  {isHi
                    ? 'हमारी वर्कशॉप में हर गेट को 5-पॉइंट क्वालिटी चेक के बाद ही ग्राहक के घर भेजा जाता है।'
                    : 'Certified 5-point craftsmanship inspection carried out before dispatch.'}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-blue-500 transition shadow-md shadow-blue-600/30"
                >
                  <span>{isHi ? 'कारीगर से बात करें' : 'Talk with Master Craftsman'}</span>
                  <ArrowRight size={15} />
                </Link>

                <button
                  onClick={() => setActiveModalReel(null)}
                  className="rounded-xl border border-slate-700 bg-slate-850 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  {isHi ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
