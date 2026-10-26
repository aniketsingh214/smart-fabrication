'use client';

import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  Wrench,
  FileText,
  Ruler,
  Headphones,
  CheckCircle2,
  MessageCircle,
  Phone,
  Award,
  ArrowRight,
} from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

interface FabricatorComparisonProps {
  phone?: string;
  whatsapp?: string;
}

interface ServiceQualityItem {
  id: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  titleHi: string;
  titleEn: string;
  highlightHi: string;
  highlightEn: string;
  standardHi: string;
  standardEn: string;
  benefitHi: string;
  benefitEn: string;
}

export function FabricatorComparison({
  phone = '+91 98765 43210',
  whatsapp = '919876543210'
}: FabricatorComparisonProps = {}) {
  const { locale } = useLocale();
  const isHi = locale === 'hi';

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanWa = whatsapp.replace(/[^0-9]/g, '');

  const QUALITY_SERVICES: ServiceQualityItem[] = [
    {
      id: 'material-quality',
      icon: ShieldCheck,
      titleHi: '1. मटेरियल क्वालिटी',
      titleEn: '1. Material Quality',
      highlightHi: 'मजबूत और सही गेज',
      highlightEn: 'Heavy Gauge & Strength',
      standardHi:
        'ब्रांडेड और हेवी-गेज पाइप व स्टील का उपयोग। पूरा वजन और मोटाई (गेज) ग्राहक के सामने स्पष्ट बताई जाती है ताकि काम पूरी तरह भरोसेमंद रहे।',
      standardEn:
        'Use of durable, heavy-gauge steel and standard structural pipes. Pipe wall thickness and gauge are shared transparently so you know exactly what you are paying for.',
      benefitHi: 'गेट सालों-साल मजबूत रहता है, टेढ़ा नहीं होता और आसानी से नहीं दबता।',
      benefitEn: 'Long-lasting structural rigidity without bending, sagging, or premature wear.'
    },
    {
      id: 'custom-designs',
      icon: Sparkles,
      titleHi: '2. कस्टम डिज़ाइन',
      titleEn: '2. Custom Designs',
      highlightHi: 'आपकी पसंद के अनुसार',
      highlightEn: 'Tailored To Your Choice',
      standardHi:
        'सीएनसी (CNC) कटिंग और कंप्यूटर द्वारा तैयार आधुनिक डिज़ाइन। आप अपनी पसंद का कोई भी फोटो या कैटलॉग डिज़ाइन चुन सकते हैं।',
      standardEn:
        'Precision CNC laser cutting and modern architectural patterns. Choose from our catalog or customize any photo reference to fit your entryway.',
      benefitHi: 'मकान के मुख्य द्वार को आधुनिक, सुंदर और आकर्षक लुक मिलता है।',
      benefitEn: 'Elevates your home’s curb appeal with clean aesthetics and contemporary design.'
    },
    {
      id: 'welding-finishing',
      icon: Wrench,
      titleHi: '3. वेल्डिंग और फिनिशिंग',
      titleEn: '3. Welding & Finishing',
      highlightHi: 'पक्के जोड़ और स्मूथ फिनिश',
      highlightEn: 'Strong Welds & Smooth Edges',
      standardHi:
        'आर्गन (TIG/MIG) वेल्डिंग से पक्के और साफ जोड़। ग्राइंडिंग करके किनारों को एकदम स्मूथ बनाया जाता है और जंग से बचाव के लिए सुरक्षात्मक कोटिंग की जाती है।',
      standardEn:
        'High-integrity TIG/MIG welding for tight, solid joints. Meticulous grinding leaves corners smooth to the touch, protected with anti-corrosion primer coating.',
      benefitHi: 'जोड़ों में दरार नहीं पड़ती, कपड़े या हाथ नहीं उलझते और जंग से लंबा बचाव रहता है।',
      benefitEn: 'No rough edges to snag hands or clothes, with reliable resistance against rust.'
    },
    {
      id: 'transparent-quotation',
      icon: FileText,
      titleHi: '4. पारदर्शी कोटेशन',
      titleEn: '4. Transparent Quotation',
      highlightHi: 'पक्का और साफ हिसाब',
      highlightEn: 'Clear & Itemized Pricing',
      standardHi:
        'काम शुरू होने से पहले स्क्वायर फीट या वजन (kg) के आधार पर स्पष्ट एस्टीमेट। मटेरियल और काम का रेट पहले ही साफ बताया जाता है।',
      standardEn:
        'Detailed pricing based on square footage or actual weight before work begins. Clear breakdown of material specifications with zero hidden charges.',
      benefitHi: 'काम पूरा होने के बाद कोई अतिरिक्त या छुपा हुआ खर्च नहीं आता। पूरा हिसाब साफ रहता है।',
      benefitEn: 'Predictable billing and clear clarity throughout the project from start to finish.'
    },
    {
      id: 'installation',
      icon: Ruler,
      titleHi: '5. घर पर नाप और फिटिंग',
      titleEn: '5. Installation & Fitting',
      highlightHi: 'वाटर लेवल पर सटीक फिटिंग',
      highlightEn: 'Balanced & Accurate Fit',
      standardHi:
        'कारीगर खुद आपके घर आकर सही नाप लेते हैं और वाटर लेवल देखकर गेट बिल्कुल सीधा और संतुलित फिट करते हैं।',
      standardEn:
        'Our fabrication technicians visit your site for accurate measurements and install with true water-level balance and secure anchoring.',
      benefitHi: 'गेट जमीन पर कभी घिसटता नहीं, ताला-कुंडी आसानी से बंद होती है और चौखट में गैप नहीं रहता।',
      benefitEn: 'Smooth opening without floor dragging, perfectly aligned latches, and tight frame alignment.'
    },
    {
      id: 'customer-support',
      icon: Headphones,
      titleHi: '6. कस्टमर सपोर्ट और सहायता',
      titleEn: '6. Customer Support',
      highlightHi: 'काम के बाद भी साथ',
      highlightEn: 'After-Delivery Assistance',
      standardHi:
        'काम पूरा होने के बाद भी फोन और व्हाट्सएप पर सीधी सहायता। किसी भी जरूरत या छोटी एडजस्टमेंट के लिए हमारी टीम संपर्क में रहती है।',
      standardEn:
        'Direct phone and WhatsApp support even after installation is complete. Quick response for any advice, inspection, or adjustment needs.',
      benefitHi: 'काम पूरा होने के बाद भी आपको किसी मिस्त्री को ढूंढने की चिंता नहीं रहती।',
      benefitEn: 'Peace of mind knowing a dependable team is just a call or message away.'
    }
  ];

  const whatsappUrl =
    `https://wa.me/${cleanWa || '919876543210'}?text=` +
    encodeURIComponent(
      isHi
        ? 'नमस्ते GateWala! मुझे अपने घर के लिए मजबूत मटेरियल और सही कोटेशन की जानकारी चाहिए।'
        : 'Hello GateWala! I would like to consult regarding fabrication quality and quotation for my home.'
    );

  return (
    <section className="relative overflow-hidden bg-[#071d15] py-16 sm:py-24 text-white">
      {/* Decorative subtle emerald & cream ambient gradients */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[900px] rounded-full bg-gradient-to-b from-emerald-600/20 via-emerald-800/10 to-transparent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-10 h-72 w-72 rounded-full bg-amber-200/5 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/25 bg-[#fbf9f2]/10 px-4 py-1.5 text-xs font-semibold text-amber-100 backdrop-blur-md shadow-sm">
            <Award size={14} className="text-amber-200" />
            <span>{isHi ? 'GateWala Quality & Services' : 'GateWala Quality & Services'}</span>
          </div>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl text-white">
            {isHi ? (
              <>
                GateWala{' '}
                <span className="bg-gradient-to-r from-amber-100 via-emerald-300 to-amber-200 bg-clip-text text-transparent">
                  ही क्यों चुनें?
                </span>
              </>
            ) : (
              <>
                Why Choose{' '}
                <span className="bg-gradient-to-r from-amber-100 via-emerald-300 to-amber-200 bg-clip-text text-transparent">
                  GateWala?
                </span>
              </>
            )}
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl mx-auto font-normal">
            {isHi
              ? 'जानिए कैसे बेहतर मटेरियल, मजबूत वेल्डिंग और शानदार डिजाइन आपके घर को सुरक्षित और खूबसूरत बनाते हैं।'
              : 'Discover how quality materials, durable welding, and modern designs keep your home secure and beautiful.'}
          </p>
        </div>

        {/* Quality & Services Table / Responsive Matrix */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-emerald-800/60 bg-[#0a261c]/90 shadow-2xl backdrop-blur-md">
          {/* Table Header (Desktop & Tablet) */}
          <div className="hidden md:grid md:grid-cols-12 border-b border-emerald-800/70 bg-[#061a13]/95 text-xs font-bold uppercase tracking-wider text-amber-100/90">
            <div className="md:col-span-4 p-4 lg:p-5 flex items-center gap-2">
              <span>{isHi ? 'सेवा व क्वालिटी क्षेत्र' : 'Quality & Service Area'}</span>
            </div>
            <div className="md:col-span-5 p-4 lg:p-5 border-l border-r border-emerald-800/50 bg-[#092b20]/60 text-emerald-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>{isHi ? 'गेटवाला का कार्य मानक (Standard)' : 'GateWala Working Standard'}</span>
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                {isHi ? 'भरोसेमंद' : 'VERIFIED'}
              </span>
            </div>
            <div className="md:col-span-3 p-4 lg:p-5 text-amber-100/80">
              {isHi ? 'आपके घर के लिए फायदा' : 'Customer Benefit'}
            </div>
          </div>

          {/* Table Rows (Desktop & Tablet) */}
          <div className="hidden md:block divide-y divide-emerald-800/50">
            {QUALITY_SERVICES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-12 transition-colors hover:bg-emerald-900/25 items-stretch"
                >
                  {/* Column 1: Feature Title & Tag */}
                  <div className="col-span-4 p-4 lg:p-5 flex flex-col justify-center bg-[#071d15]/50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200 border border-amber-200/20 shadow-sm">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm lg:text-base font-bold text-white">
                          {isHi ? item.titleHi : item.titleEn}
                        </h3>
                        <span className="inline-block mt-0.5 text-xs text-amber-200/80 font-medium">
                          {isHi ? item.highlightHi : item.highlightEn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: GateWala Working Standard */}
                  <div className="col-span-5 p-4 lg:p-5 border-l border-r border-emerald-800/50 bg-[#092b20]/30 flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 mt-0.5 border border-emerald-400/30">
                      <CheckCircle2 size={15} />
                    </span>
                    <p className="text-xs lg:text-sm text-emerald-50 leading-relaxed font-normal">
                      {isHi ? item.standardHi : item.standardEn}
                    </p>
                  </div>

                  {/* Column 3: Customer Benefit */}
                  <div className="col-span-3 p-4 lg:p-5 flex items-center bg-[#071d15]/30">
                    <div className="w-full rounded-xl border border-emerald-700/40 bg-emerald-950/60 p-3 text-xs text-emerald-200 leading-relaxed">
                      <span className="font-semibold text-amber-200/90 block mb-1">
                        {isHi ? 'मुख्य लाभ:' : 'Key Benefit:'}
                      </span>
                      {isHi ? item.benefitHi : item.benefitEn}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Card View (Optimized for Small Screens) */}
          <div className="block md:hidden divide-y divide-emerald-800/60">
            {QUALITY_SERVICES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="p-4 sm:p-5 space-y-3.5 bg-[#0a261c]/90">
                  {/* Item Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/10 text-amber-200 border border-amber-200/20">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {isHi ? item.titleHi : item.titleEn}
                      </h3>
                      <span className="inline-block text-xs text-amber-200/80 font-medium">
                        {isHi ? item.highlightHi : item.highlightEn}
                      </span>
                    </div>
                  </div>

                  {/* Standard */}
                  <div className="rounded-xl border border-emerald-800/70 bg-[#061a13]/70 p-3.5 flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 mt-0.5">
                      <CheckCircle2 size={13} />
                    </span>
                    <p className="text-xs text-emerald-50 leading-relaxed">
                      {isHi ? item.standardHi : item.standardEn}
                    </p>
                  </div>

                  {/* Benefit */}
                  <div className="rounded-lg border border-amber-200/20 bg-amber-100/5 p-3 text-xs text-amber-100/90 leading-relaxed">
                    <span className="font-bold text-amber-200 block mb-0.5">
                      {isHi ? 'घर के लिए फायदा:' : 'Customer Benefit:'}
                    </span>
                    {isHi ? item.benefitHi : item.benefitEn}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Trust Action Box */}
        <div className="mt-10 rounded-2xl border border-emerald-700/50 bg-gradient-to-r from-[#061a13] via-[#0b2b20] to-[#061a13] p-6 sm:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200 border border-emerald-400/30">
                <CheckCircle2 size={13} className="text-emerald-300" />
                <span>{isHi ? 'भरोसेमंद सेवा व उचित दाम' : 'Trusted Service & Honest Pricing'}</span>
              </span>
              <h3 className="mt-2.5 text-lg sm:text-xl font-bold text-white">
                {isHi
                  ? 'अपने घर के लिए सही सलाह और सटीक एस्टीमेट चाहिए?'
                  : 'Need Expert Guidance & An Accurate Estimate For Your Home?'}
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
                {isHi
                  ? 'हमारे विशेषज्ञ से सीधे बात करें। हम आपकी जरूरत और बजट के अनुसार सही मटेरियल और सुंदर डिजाइन चुनने में पूरी मदद करेंगे।'
                  : 'Speak directly with our fabrication team. We will help you select the right materials and design for your space and budget.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-950/50 transition active:scale-95"
              >
                <MessageCircle size={16} />
                <span>{isHi ? 'WhatsApp पर बात करें' : 'Chat on WhatsApp'}</span>
              </a>

              <a
                href={`tel:${cleanPhone || '+919876543210'}`}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200/30 bg-[#fbf9f2]/10 hover:bg-[#fbf9f2]/20 px-5 py-3 text-xs sm:text-sm font-bold text-amber-100 transition active:scale-95"
              >
                <Phone size={15} className="text-amber-200" />
                <span>{isHi ? `कॉल करें (${phone})` : `Call ${phone}`}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

