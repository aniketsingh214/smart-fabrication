'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Layers, Calculator, MessageCircle } from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

interface MobileStickyActionBarProps {
  phone?: string;
  whatsapp?: string;
}

export function MobileStickyActionBar({
  whatsapp = '919876543210'
}: MobileStickyActionBarProps = {}) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const isHi = locale === 'hi';
  const cleanWa = whatsapp.replace(/[^0-9]/g, '');

  const whatsappUrl =
    `https://wa.me/${cleanWa || '919876543210'}?text=` +
    encodeURIComponent(
      isHi
        ? 'नमस्ते Royal Gates! मुझे अपने घर के लिए गेट / रेलिंग / जाली का काम करवाना है। कृपया डिज़ाइन और कोटेशन शेयर करें।'
        : 'Hello Royal Gates! I would like to enquire about custom metal fabrication for my home.'
    );

  const navItems = [
    {
      label: isHi ? 'होम' : 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/'
    },
    {
      label: isHi ? 'डिज़ाइन' : 'Designs',
      href: '/catalog',
      icon: Layers,
      isActive: pathname.startsWith('/catalog')
    },
    {
      label: isHi ? 'कीमत' : 'Price',
      href: '/estimate',
      icon: Calculator,
      isActive: pathname.startsWith('/estimate')
    }
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-lg transition-colors ${
                item.isActive
                  ? 'text-amber-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon size={20} className={item.isActive ? 'text-amber-600' : 'text-slate-500'} />
              <span className="text-[11px] mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* WhatsApp direct button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Enquiry"
          className="flex flex-col items-center justify-center py-1 px-3 min-w-[64px] rounded-lg text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
        >
          <div className="relative">
            <MessageCircle size={20} className="text-emerald-600" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-[11px] mt-0.5">WhatsApp</span>
        </a>
      </div>
    </nav>
  );
}
