'use client';

import React from 'react';
import Link from 'next/link';
import { Check, X, ShieldAlert, Sparkles, ArrowRight, Phone, MessageCircle, Award, CheckCircle2 } from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

export function FabricatorComparison() {
  const { locale } = useLocale();
  const isHi = locale === 'hi';

  const COMPARISON_ROWS = [
    {
      featureHi: '1. कच्चा लोहा व स्टील की क्वालिटी',
      featureEn: '1. Prime Material Quality',
      smartHi: '100% टाटा / जिंदल प्राइम ग्रेड SS 304 व हेवी-गेज पाइप (वजन सर्टिफिकेट सहित)',
      smartEn: '100% Certified Tata / Jindal Prime SS 304 & heavy-gauge pipes with weight verification',
      localHi: 'हल्का लोकल पाइप, रिसाइकिल किया हुआ स्क्रैप लोहा (कम वजन व पतली दीवार)',
      localEn: 'Unbranded commercial thin pipes, scrap iron mixture that dents easily'
    },
    {
      featureHi: '2. डिज़ाइन व कटिंग टेक्नोलॉजी',
      featureEn: '2. Precision Design & Cutting',
      smartHi: 'कम्प्यूटरीकृत सीएनसी फाइबर लेज़र मशीन (0.1mm सटीक कट, बिना किसी टेढ़ेपन के)',
      smartEn: 'Computerized CNC Fiber Laser Cutting with 0.1mm surgical accuracy and smooth edges',
      localHi: 'हाथ से ग्राइंडर कटिंग (टेढ़े-मेढ़े जोड़, नुकीले किनारे जो हाथ में चुभते हैं)',
      localEn: 'Hand-held manual grinder cutting resulting in jagged, uneven lines and rough burrs'
    },
    {
      featureHi: '3. वेल्डिंग मजबूती व फिनिशिंग',
      featureEn: '3. Welding Strength & Finish',
      smartHi: 'आर्गन टीआईजी व एमआईजी वेल्डिंग + 3-स्टेज मिरर ग्राइंडिंग (शीशे जैसी स्मूथ फिनिश)',
      smartEn: 'Argon shielded TIG & MIG welding + diamond compound buffing for seamless finish',
      localHi: 'साधारण कच्ची इलेक्ट्रिक वेल्डिंग (जोड़ों पर काले गड्ढे और 6 महीने में दरार)',
      localEn: 'Basic arc welding with visible splatter, slag cavities and joints that crack under load'
    },
    {
      featureHi: '4. जंग से बचाव (Rust Protection)',
      featureEn: '4. Weather & Rust Protection',
      smartHi: '2-लेयर एपॉक्सी जिंक प्राइमर + ऑटोमोटिव पीयू पेंट (बारिश व धूप में 10 साल बेफिक्र)',
      smartEn: 'Dual-coat epoxy zinc phosphate primer + automotive PU finish resistant to UV and rain',
      localHi: 'सस्ता लाल प्राइमर (Red Oxide) जो पहली बारिश में ही फूलकर उखड़ जाता है',
      localEn: 'Cheap red oxide dip that blisters and flakes off within the very first monsoon'
    },
    {
      featureHi: '5. घर पर नाप और फिटिंग',
      featureEn: '5. Site Measurement & Fitting',
      smartHi: 'डिजिटल लेज़र नाप + कुशल कारीगरों द्वारा वाटर लेवल पर पक्की और स्मूथ फिटिंग',
      smartEn: 'Digital laser dimensioning and precision water-level balanced installation',
      localHi: 'इंची टेप से अंदाज का नाप, गेट जमीन में घिसटना, दीवार में गैप या ताला न लगना',
      localEn: 'Rough guesswork measurement leading to floor scraping, frame gaps, and misaligned locks'
    },
    {
      featureHi: '6. वारंटी और कानूनी पक्का बिल',
      featureEn: '6. Guarantee & Accountability',
      smartHi: '10 साल की स्ट्रक्चरल वारंटी + पक्का जीएसटी बिल + जीवनभर आफ्टर-सेल्स सपोर्ट',
      smartEn: '10-Year Structural Warranty + Registered GST Tax Invoice + Dedicated support line',
      localHi: 'कोई लिखित वारंटी नहीं, काम पूरा होने के बाद फोन उठाना बंद',
      localEn: 'Zero warranty or invoice; no accountability once the final payment is collected'
    }
  ];

  const whatsappUrl =
    'https://wa.me/919876543210?text=' +
    encodeURIComponent(
      isHi
        ? 'नमस्ते SmartFabrication! मुझे अपने घर के काम के लिए असली टाटा/जिंदल स्टील और सही एस्टीमेट के बारे में जानकारी चाहिए।'
        : 'Hello SmartFabrication! I would like to consult regarding certified prime materials and quotation for my home fabrication.'
    );

  return (
    <section className="relative overflow-hidden bg-slate-950 py-16 sm:py-24 text-white">
      {/* Subtle glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-1/2 translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-b from-orange-600/15 to-transparent blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-xs font-semibold text-orange-400 backdrop-blur-md">
            <Award size={14} className="text-orange-400" />
            <span>{isHi ? 'भरोसा और फर्क पहचानें' : 'Recognize The True Difference'}</span>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
            {isHi ? (
              <>
                हम बनाम{' '}
                <span className="text-slate-400 font-normal">सड़क किनारे की</span>{' '}
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                  आम वेल्डिंग दुकान
                </span>
              </>
            ) : (
              <>
                SmartFabrication vs{' '}
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                  Local Welding Shops
                </span>
              </>
            )}
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto">
            {isHi
              ? 'गेट और रेलिंग जीवन में 1-2 बार ही बनते हैं। ₹2,000 बचाने के चक्कर में कमजोर लोहा लगाने से घर की सुरक्षा खतरे में पड़ सकती है।'
              : 'Architectural metal fabrication protects your home for decades. See why investing in engineering precision pays for itself.'}
          </p>
        </div>

        {/* Comparison Matrix Table */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur-md">
          {/* Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-slate-800 bg-slate-950/90 text-sm font-bold">
            <div className="md:col-span-4 p-4 sm:p-5 text-slate-400">
              {isHi ? 'पैरामीटर (Quality Standard)' : 'Quality Standard'}
            </div>
            <div className="md:col-span-4 p-4 sm:p-5 bg-orange-950/30 text-orange-400 border-l border-r border-orange-500/20 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-orange-400" />
                <span>SmartFabrication (स्मार्ट फैब्रिकेशन)</span>
              </span>
              <span className="hidden sm:inline-block rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                RECOMMENDED
              </span>
            </div>
            <div className="md:col-span-4 p-4 sm:p-5 text-slate-400 flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400" />
              <span>{isHi ? 'आम वेल्डिंग दुकान (Local Fabricator)' : 'Ordinary Local Workshop'}</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-slate-800/80">
            {COMPARISON_ROWS.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 transition-colors hover:bg-slate-850/50"
              >
                {/* Feature Name */}
                <div className="md:col-span-4 p-4 sm:p-5 flex items-center text-xs sm:text-sm font-bold text-white bg-slate-950/40">
                  <span>{isHi ? row.featureHi : row.featureEn}</span>
                </div>

                {/* SmartFabrication Column (Winning) */}
                <div className="md:col-span-4 p-4 sm:p-5 bg-orange-950/15 border-l border-r border-orange-500/20 text-xs sm:text-sm text-slate-200">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                      <Check size={13} className="stroke-[3]" />
                    </span>
                    <span className="leading-relaxed font-medium">
                      {isHi ? row.smartHi : row.smartEn}
                    </span>
                  </div>
                </div>

                {/* Local Shop Column (Losing) */}
                <div className="md:col-span-4 p-4 sm:p-5 text-xs sm:text-sm text-slate-400">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 mt-0.5">
                      <X size={13} className="stroke-[3]" />
                    </span>
                    <span className="leading-relaxed">
                      {isHi ? row.localHi : row.localEn}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Trust Action Box */}
        <div className="mt-10 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-emerald-950/40 p-6 sm:p-8 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <span className="inline-block rounded-md bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                {isHi ? '✅ 100% पक्की गारंटी' : '✅ 100% Guaranteed Peace of Mind'}
              </span>
              <h3 className="mt-2 text-lg sm:text-xl font-bold text-white">
                {isHi
                  ? 'गलत जगह पैसा बर्बाद होने से बचाएं — सीधे वर्कशॉप एक्सपर्ट से सलाह लें'
                  : 'Avoid costly repairs and rust issues — Speak with our fabrication engineer today'}
              </h3>
              <p className="mt-1 text-xs text-slate-300 max-w-xl">
                {isHi
                  ? 'हमारे कारीगर आपके घर आकर सही नाप लेंगे और आपकी पसंद के अनुसार सटीक कोटेशन देंगे।'
                  : 'Get free doorstep measurement and transparent itemized pricing before committing.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition"
              >
                <MessageCircle size={16} />
                <span>{isHi ? 'WhatsApp पर सलाह लें' : 'Consult on WhatsApp'}</span>
              </a>

              <a
                href="tel:+919876543210"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-5 py-3 text-xs sm:text-sm font-bold text-white transition"
              >
                <Phone size={15} />
                <span>{isHi ? 'कॉल करें (+91 98765 43210)' : 'Call +91 98765 43210'}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
