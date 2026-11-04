'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, Ruler } from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

interface MobileStickyActionBarProps {
  phone?: string;
  whatsapp?: string;
}

export function MobileStickyActionBar({
  phone = '+919876543210',
  whatsapp = '919876543210'
}: MobileStickyActionBarProps = {}) {
  const { locale } = useLocale();
  const isHi = locale === 'hi';

  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const cleanWa = whatsapp.replace(/[^0-9]/g, '');

  const whatsappUrl =
    `https://wa.me/${cleanWa || '919876543210'}?text=` +
    encodeURIComponent(
      isHi
        ? 'नमस्ते GateWala! मुझे अपने घर के लिए गेट / रेलिंग / जाली का काम करवाना है। कृपया डिज़ाइन और कोटेशन शेयर करें।'
        : 'Hello GateWala! I would like to enquire about custom fabrication for my home.'
    );

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden border-t border-slate-800 bg-slate-950/95 px-3 py-2.5 backdrop-blur-lg shadow-2xl">
      <div className="flex items-center gap-2">
        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition"
        >
          <MessageCircle size={15} />
          <span>{isHi ? 'WhatsApp फोटो' : 'WhatsApp'}</span>
        </a>

        {/* Call Button */}
        <a
          href={`tel:${cleanPhone || '+919876543210'}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition"
        >
          <Phone size={14} />
          <span>{isHi ? 'सीधे कॉल करें' : 'Call Workshop'}</span>
        </a>

        {/* Free Measurement Link */}
        <Link
          href="/contact"
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-xs font-bold text-slate-200 active:scale-95 transition"
        >
          <Ruler size={14} className="text-blue-400" />
          <span className="sr-only">Book Measurement</span>
        </Link>
      </div>
    </div>
  );
}
