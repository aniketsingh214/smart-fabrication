'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  Heart,
  ArrowRight,
  MessageCircle,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useShop, type CartItem, type WishlistItem } from './shop-context';
import { money } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/i18n/locale-context';
import { getBilingualProductName, getBilingualMaterial } from '@/lib/i18n/catalog-bilingual';

export function ShopDrawers() {
  const { locale, dict } = useLocale();
  const {
    cart,
    wishlist,
    isCartOpen,
    setIsCartOpen,
    isWishlistOpen,
    setIsWishlistOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalCartItems,
    totalWishlistItems,
    cartSubtotalMinor,
    addToCart,
    removeFromWishlist
  } = useShop();

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsCartOpen(false);
        setIsWishlistOpen(false);
      }
    }
    if (isCartOpen || isWishlistOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, isWishlistOpen, setIsCartOpen, setIsWishlistOpen]);

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
    <>
      {/* -------------------- CART DRAWER -------------------- */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-600 text-white shadow-sm">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{dict.cart.title}</h2>
                    <p className="text-xs text-slate-500">
                      {totalCartItems} {locale === 'hi' ? 'सामान जोड़े गए' : totalCartItems === 1 ? 'unique design' : 'unique designs'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close cart"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-orange-600 mb-4">
                      <ShoppingCart size={32} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{dict.cart.emptyTitle}</h3>
                    <p className="mt-2 text-xs text-slate-500 max-w-xs leading-5">
                      {dict.cart.emptyMsg}
                    </p>
                    <Link
                      href="/catalog"
                      onClick={() => setIsCartOpen(false)}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-700 transition"
                    >
                      {dict.cart.exploreBtn} <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  cart.map(item => {
                    const displayName = getBilingualProductName(item.name, locale);
                    const displayMaterial = getBilingualMaterial(item.material, locale);
                    return (
                      <div
                        key={item.id}
                        className="group flex gap-4 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-orange-200"
                      >
                        {/* Image Thumbnail */}
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-100">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-[10px] font-bold text-slate-400 uppercase">
                              {item.material.slice(0, 3)}
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/catalog/${item.slug}`}
                                onClick={() => setIsCartOpen(false)}
                                className="text-sm font-bold text-slate-900 hover:text-orange-600 line-clamp-1 transition"
                              >
                                {displayName}
                              </Link>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="text-slate-400 hover:text-red-600 p-1 transition"
                                title="Remove item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <span className="inline-block mt-0.5 rounded-sm bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-800">
                              {displayMaterial}
                            </span>
                          </div>

                          {/* Price and Quantity Stepper */}
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              {item.price_min_minor
                                ? money(item.price_min_minor * item.quantity)
                                : (locale === 'hi' ? 'कोटेशन पर' : 'Quote on request')}
                            </span>

                            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-5 text-center text-xs font-bold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-600 hover:bg-white hover:text-slate-900 transition"
                                aria-label="Increase quantity"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              {cart.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50/80 p-6 space-y-4">
                  {cartSubtotalMinor > 0 && (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-600">{dict.cart.subtotal}</span>
                        <p className="text-[10px] text-slate-400">
                          {locale === 'hi' ? 'नाप के बाद पक्की कीमत तय होगी' : 'Subject to site measurement'}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-slate-900">
                        {money(cartSubtotalMinor)}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      asChild
                      className="w-full bg-orange-600 hover:bg-orange-700 py-6 text-sm font-bold shadow-md"
                    >
                      <Link
                        href={contactCartHref}
                        onClick={() => setIsCartOpen(false)}
                        className="flex items-center justify-center gap-2"
                      >
                        <Sparkles size={16} /> {dict.cart.requestQuotationBtn} <ArrowUpRight size={15} />
                      </Link>
                    </Button>

                    <a
                      href={`https://wa.me/?text=${whatsappMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-white py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition shadow-xs"
                    >
                      <MessageCircle size={15} /> {dict.cart.whatsappBtn}
                    </a>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <Link
                      href="/cart"
                      onClick={() => setIsCartOpen(false)}
                      className="font-semibold text-slate-600 hover:text-orange-600 underline"
                    >
                      {locale === 'hi' ? 'पूरा कार्ट पेज देखें' : 'View full cart page'}
                    </Link>
                    <button
                      type="button"
                      onClick={clearCart}
                      className="text-slate-400 hover:text-red-600 transition"
                    >
                      {dict.cart.clearBtn}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------- WISHLIST DRAWER -------------------- */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsWishlistOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-rose-50/40">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500 text-white shadow-sm">
                    <Heart size={20} className="fill-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{dict.wishlist.title}</h2>
                    <p className="text-xs text-slate-500">
                      {totalWishlistItems} {locale === 'hi' ? 'डिज़ाइन सेव किए गए' : totalWishlistItems === 1 ? 'design' : 'designs'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWishlistOpen(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close wishlist"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {wishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 text-rose-500 mb-4">
                      <Heart size={32} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{dict.wishlist.emptyTitle}</h3>
                    <p className="mt-2 text-xs text-slate-500 max-w-xs leading-5">
                      {dict.wishlist.emptyMsg}
                    </p>
                    <Link
                      href="/catalog"
                      onClick={() => setIsWishlistOpen(false)}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                    >
                      {dict.wishlist.exploreBtn} <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  wishlist.map(item => {
                    const displayName = getBilingualProductName(item.name, locale);
                    const displayMaterial = getBilingualMaterial(item.material, locale);
                    return (
                      <div
                        key={item.id}
                        className="group flex gap-4 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition hover:border-rose-200"
                      >
                        {/* Image Thumbnail */}
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-100">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-[10px] font-bold text-slate-400 uppercase">
                              {item.material.slice(0, 3)}
                            </div>
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                href={`/catalog/${item.slug}`}
                                onClick={() => setIsWishlistOpen(false)}
                                className="text-sm font-bold text-slate-900 hover:text-rose-600 line-clamp-1 transition"
                              >
                                {displayName}
                              </Link>
                              <button
                                type="button"
                                onClick={() => removeFromWishlist(item.id)}
                                className="text-slate-400 hover:text-red-600 p-1 transition"
                                title="Remove from wishlist"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            <span className="inline-block mt-0.5 rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                              {displayMaterial}
                            </span>
                          </div>

                          {/* Price and Add to Cart Action */}
                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-800">
                              {item.price_min_minor
                                ? `${locale === 'hi' ? 'शुरुआती कीमत' : 'From'} ${money(item.price_min_minor)}`
                                : (locale === 'hi' ? 'कोटेशन पर' : 'Custom quote')}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                addToCart({
                                  product_id: item.id,
                                  name: item.name,
                                  slug: item.slug,
                                  material: item.material,
                                  price_min_minor: item.price_min_minor,
                                  image_url: item.image_url
                                });
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-orange-700 transition"
                            >
                              <ShoppingCart size={13} />
                              <span>{dict.product.addToCart}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              {wishlist.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50/80 p-6 space-y-3">
                  <Button
                    onClick={() => {
                      wishlist.forEach(item => {
                        addToCart({
                          product_id: item.id,
                          name: item.name,
                          slug: item.slug,
                          material: item.material,
                          price_min_minor: item.price_min_minor,
                          image_url: item.image_url
                        });
                      });
                      setIsWishlistOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 py-6 text-sm font-bold shadow-md"
                  >
                    {dict.wishlist.moveAllToCart} ({wishlist.length})
                  </Button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <Link
                      href="/wishlist"
                      onClick={() => setIsWishlistOpen(false)}
                      className="font-semibold text-slate-600 hover:text-rose-600 underline"
                    >
                      {locale === 'hi' ? 'पूरा विशलिस्ट पेज देखें' : 'View full wishlist page'}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

