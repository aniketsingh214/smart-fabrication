'use client';

import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { useShop } from './shop-context';

export function HeaderShopTriggers() {
  const {
    totalWishlistItems,
    totalCartItems,
    setIsWishlistOpen,
    setIsCartOpen
  } = useShop();

  return (
    <div className="flex items-center gap-2">
      {/* Wishlist Trigger */}
      <button
        type="button"
        onClick={() => setIsWishlistOpen(true)}
        aria-label={`Open wishlist (${totalWishlistItems} items)`}
        title="Saved designs"
        className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-600 transition shadow-2xs"
      >
        <Heart size={18} className="transition-transform group-hover:scale-110" />
        {totalWishlistItems > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {totalWishlistItems}
          </span>
        )}
      </button>

      {/* Cart Trigger */}
      <button
        type="button"
        onClick={() => setIsCartOpen(true)}
        aria-label={`Open cart (${totalCartItems} items)`}
        title="Project cart"
        className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-600 transition shadow-2xs"
      >
        <ShoppingCart size={18} className="transition-transform group-hover:scale-110" />
        {totalCartItems > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {totalCartItems}
          </span>
        )}
      </button>
    </div>
  );
}
