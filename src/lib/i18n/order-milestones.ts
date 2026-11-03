import type { Locale } from './types';

export interface MilestoneInfo {
  label: string;
  stageNumber: number;
  stageName: string;
  description: string;
  colorClass: string;
}

const statusMap: Record<
  string,
  {
    stage: number;
    hi: { stageName: string; label: string; desc: string };
    en: { stageName: string; label: string; desc: string };
    color: string;
  }
> = {
  CONFIRMED: {
    stage: 1,
    hi: {
      stageName: 'ऑर्डर मिल गया',
      label: '1. ऑर्डर मिल गया',
      desc: 'आपकी बुकिंग वर्कशॉप द्वारा स्वीकार कर ली गई है।'
    },
    en: {
      stageName: 'Order Placed',
      label: '1. Order Confirmed',
      desc: 'Your order has been confirmed by the workshop.'
    },
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  ADVANCE_RECEIVED: {
    stage: 1,
    hi: {
      stageName: 'ऑर्डर मिल गया',
      label: '1. ऑर्डर मिल गया (एडवांस प्राप्त)',
      desc: 'एडवांस पेमेंट जमा हो चुका है और काम कतार में लगा दिया गया है।'
    },
    en: {
      stageName: 'Order Placed',
      label: '1. Advance Received',
      desc: 'Advance payment received. Work is scheduled.'
    },
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  MEASUREMENT_CONFIRMED: {
    stage: 2,
    hi: {
      stageName: 'नाप की जाँच पूरी',
      label: '2. नाप की जाँच पूरी',
      desc: 'कारीगर द्वारा साइट पर जाकर सही नाप ले ली गई है।'
    },
    en: {
      stageName: 'Measurement Verified',
      label: '2. Measurement Confirmed',
      desc: 'Site measurements checked and confirmed.'
    },
    color: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  PRODUCTION_PENDING: {
    stage: 2,
    hi: {
      stageName: 'नाप की जाँच पूरी',
      label: '2. नाप की जाँच पूरी (तैयारी जारी)',
      desc: 'मटीरियल का आवंटन हो चुका है और कटिंग की तैयारी है।'
    },
    en: {
      stageName: 'Measurement Verified',
      label: '2. Production Queued',
      desc: 'Materials arranged. Ready to start fabrication.'
    },
    color: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  PRODUCTION_STARTED: {
    stage: 3,
    hi: {
      stageName: 'काम शुरू हो गया',
      label: '3. काम शुरू हो गया (कटिंग व वेल्डिंग)',
      desc: 'लोहा या स्टील की कटिंग, वेल्डिंग और जोड़ाई चल रही है।'
    },
    en: {
      stageName: 'Fabrication Started',
      label: '3. Fabrication Started',
      desc: 'Cutting and welding work is in progress.'
    },
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  FABRICATION_COMPLETED: {
    stage: 3,
    hi: {
      stageName: 'काम शुरू हो गया',
      label: '3. काम शुरू हो गया (फ्रेम तैयार)',
      desc: 'ढांचा बनकर तैयार है, फिनिशिंग और घिसाई का काम शुरू हो रहा है।'
    },
    en: {
      stageName: 'Fabrication Started',
      label: '3. Assembly Complete',
      desc: 'Main frame ready. Moving to paint and polish.'
    },
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  FINISHING: {
    stage: 3,
    hi: {
      stageName: 'काम शुरू हो गया',
      label: '3. काम शुरू हो गया (पॉलिश व पेंट)',
      desc: 'प्राइमर, पेंट, पाउडर कोटिंग या स्टील पॉलिशिंग का काम जारी है।'
    },
    en: {
      stageName: 'Fabrication Started',
      label: '3. Surface Finishing',
      desc: 'Painting, polishing, and final finishing underway.'
    },
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  READY: {
    stage: 4,
    hi: {
      stageName: 'आपका सामान तैयार है',
      label: '4. आपका सामान तैयार है',
      desc: 'क्वालिटी चेक पूरा हो चुका है। सामान भेजने के लिए तैयार है।'
    },
    en: {
      stageName: 'Ready for Dispatch',
      label: '4. Ready for Dispatch',
      desc: 'Checked, packed, and ready for delivery.'
    },
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
  },
  OUT_FOR_DELIVERY: {
    stage: 5,
    hi: {
      stageName: 'डिलीवरी के लिए निकला',
      label: '5. डिलीवरी के लिए निकला',
      desc: 'गाड़ी में लोड होकर सामान आपके पते के लिए रवाना हो चुका है।'
    },
    en: {
      stageName: 'Out for Delivery',
      label: '5. Out for Delivery',
      desc: 'Loaded and on the way to your site.'
    },
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  INSTALLATION: {
    stage: 6,
    hi: {
      stageName: 'सामान पहुँच गया',
      label: '6. सामान पहुँच गया (फिटिंग जारी)',
      desc: 'सामान आपके घर पहुँच चुका है और कारीगर फिटिंग कर रहे हैं।'
    },
    en: {
      stageName: 'Delivered / On-Site',
      label: '6. On-Site Installation',
      desc: 'Material delivered to your site. Fitting and welding in progress.'
    },
    color: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  COMPLETED: {
    stage: 7,
    hi: {
      stageName: 'काम पूरा हो गया',
      label: '7. काम पूरा हो गया ✓',
      desc: 'काम सफलतापूर्वक पूरा होकर आपको सौंप दिया गया है।'
    },
    en: {
      stageName: 'Completed',
      label: '7. Completed & Handed Over',
      desc: 'Work completed, inspected, and handed over.'
    },
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  CANCELLED: {
    stage: 0,
    hi: {
      stageName: 'ऑर्डर रद्द',
      label: 'ऑर्डर रद्द किया गया',
      desc: 'यह ऑर्डर आपसी सहमति से रद्द किया गया है।'
    },
    en: {
      stageName: 'Cancelled',
      label: 'Order Cancelled',
      desc: 'This order has been cancelled.'
    },
    color: 'bg-red-50 text-red-700 border-red-200'
  }
};

export function getMilestoneInfo(status: string, locale: Locale = 'hi'): MilestoneInfo {
  const norm = (status || '').toUpperCase().trim();
  const entry = statusMap[norm];
  if (entry) {
    const loc = locale === 'en' ? entry.en : entry.hi;
    return {
      label: loc.label,
      stageNumber: entry.stage,
      stageName: loc.stageName,
      description: loc.desc,
      colorClass: entry.color
    };
  }

  // Fallback for custom or unmapped statuses
  const readable = status.replace(/_/g, ' ');
  return {
    label: locale === 'hi' ? `स्थिति: ${readable}` : `Status: ${readable}`,
    stageNumber: 0,
    stageName: readable,
    description: '',
    colorClass: 'bg-slate-50 text-slate-700 border-slate-200'
  };
}
