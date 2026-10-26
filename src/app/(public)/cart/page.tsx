'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Ruler
} from 'lucide-react';
import { useShop } from '@/features/shop/shop-context';
import { money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale-context';
import { getBilingualProductName, getBilingualMaterial } from '@/lib/i18n/catalog-bilingual';

export default function CartPage() {
  const { locale, dict } = useLocale();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCartItems,
    cartSubtotalMinor
  } = useShop();

  // Construct combined quotation requirement text for /contact enquiry
  const cartRequirementText = cart
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} (${item.material}) × ${item.quantity} unit(s)` +
        (item.dimensions?.display ? ` [Size: ${item.dimensions.display}]` : '')
    )
    .join('\n');

  const contactCartHref = `/contact?requirement=${encodeURIComponent(
    `Hello GateWala team,\n\nI would like to request an official quotation for the following items in my project cart:\n\n${cartRequirementText}\n\nPlease contact me regarding dimensions, material specifications, and delivery/installation timeline.`
  )}`;

  const whatsappMessage = encodeURIComponent(
    `नमस्ते GateWala! मुझे अपने प्रोजेक्ट के लिए इन सामानों का कोटेशन चाहिए:\n${cart
      .map(i => `• ${i.name} (${i.material}) × ${i.quantity}`)
      .join('\n')}\n\nकृपया डिज़ाइन और खर्च का विवरण भेजें।`
  );

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-orange-600 transition">
          {dict.nav.home}
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <Link href="/catalog" className="hover:text-orange-600 transition">
          {dict.nav.catalog}
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="font-semibold text-slate-900">{dict.cart.title}</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-orange-600">
            {locale === 'hi' ? 'चुने हुए सामान की लिस्ट' : 'Fabrication Order Basket'}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {dict.cart.title}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {dict.cart.subtitle}
          </p>
        </div>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 transition"
          >
            {dict.cart.clearBtn}
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="card mx-auto max-w-2xl p-12 text-center my-12">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-orange-50 text-orange-600 mb-6">
            <ShoppingCart size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">{dict.cart.emptyTitle}</h2>
          <p className="mt-3 text-sm text-slate-500 max-w-md mx-auto leading-6">
            {dict.cart.emptyMsg}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/catalog">
                {dict.cart.exploreBtn} <ArrowRight size={15} />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/estimate">{dict.nav.estimate}</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map(item => {
              const displayName = getBilingualProductName(item.name, locale);
              const displayMaterial = getBilingualMaterial(item.material, locale);
              return (
                <div
                  key={item.id}
                  className="card flex flex-col sm:flex-row gap-5 p-5 transition hover:border-orange-200"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-[4/3] sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-100">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs font-bold text-slate-400 uppercase">
                        {item.material}
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="inline-block rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-800 uppercase tracking-wide">
                            {displayMaterial}
                          </span>
                          <Link
                            href={`/catalog/${item.slug}`}
                            className="mt-1 block text-base font-bold text-slate-900 hover:text-orange-600 transition"
                          >
                            {displayName}
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                          title="Remove from cart"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {locale === 'hi' ? 'शुरुआती रेट:' : 'Indicative starting rate:'}{' '}
                        <strong className="text-slate-800">
                          {item.price_min_minor ? money(item.price_min_minor) : (locale === 'hi' ? 'कोटेशन पर' : 'Custom quote')}
                        </strong>
                      </p>
                    </div>

                    {/* Quantity Stepper & Subtotal */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-500">
                          {locale === 'hi' ? 'मात्रा (संख्या):' : 'Quantity:'}
                        </span>
                        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">

                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Item Total</span>
                      <span className="text-sm font-bold text-slate-900">
                        {item.price_min_minor
                          ? money(item.price_min_minor * item.quantity)
                          : 'Quotation on request'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

            {/* Quality & Service Guarantees */}
            <div className="grid gap-3 sm:grid-cols-2 pt-4">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4">
                <Ruler className="text-orange-600 shrink-0" size={20} />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Site Measurement Included</p>
                  <p className="text-slate-500">Fabrication drawings verified on-site</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4">
                <ShieldCheck className="text-emerald-600 shrink-0" size={20} />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Quality Certified Materials</p>
                  <p className="text-slate-500">Grade 304 SS / ISI Standard Steel</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quotation Summary Sidebar */}
          <div>
            <div className="card sticky top-6 p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Quotation Summary</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Total of {totalCartItems} {totalCartItems === 1 ? 'unique design' : 'unique designs'} in your project plan
                </p>
              </div>

              {cartSubtotalMinor > 0 && (
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-slate-700">Indicative Subtotal</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {money(cartSubtotalMinor)}
                  </span>
                </div>
              )}

              <p className="rounded-lg bg-orange-50/80 p-3 text-xs leading-5 text-orange-900">
                ⚡ <strong>Fabrication Notice:</strong> Final pricing depends on accurate on-site dimensions, gauge thickness, and chosen finish. Submitting this basket sends an official enquiry to our engineering team.
              </p>

              <div className="space-y-3">
                <Button
                  asChild
                  className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-sm font-bold shadow-md"
                >
                  <Link href={contactCartHref} className="flex items-center justify-center gap-2">
                    <Sparkles size={16} /> Request Combined Quotation <ArrowUpRight size={16} />
                  </Link>
                </Button>

                <a
                  href={`https://wa.me/?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white py-3.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition shadow-xs"
                >
                  <MessageCircle size={16} /> Inquire via WhatsApp
                </a>
              </div>

              <div className="border-t border-slate-100 pt-4 text-center">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition"
                >
                  ← Continue browsing catalogue
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
