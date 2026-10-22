'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useShop, type WishlistItem } from './shop-context';

interface WishlistButtonProps {
  item: WishlistItem;
  variant?: 'icon' | 'badge' | 'full';
  className?: string;
}

export function WishlistButton({ item, variant = 'icon', className = '' }: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist } = useShop();
  const active = isWishlisted(item.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item);
  };

  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 ${
          active
            ? 'border-2 border-rose-500 bg-rose-50 text-rose-700 shadow-sm hover:bg-rose-100'
            : 'border border-slate-300 bg-white text-slate-700 hover:border-rose-400 hover:bg-rose-50/50 hover:text-rose-600 shadow-sm'
        } ${className}`}
      >
        <Heart
          size={18}
          className={`transition-transform duration-200 ${
            active ? 'fill-rose-500 text-rose-500 scale-110' : ''
          }`}
        />
        <span>{active ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
      </button>
    );
  }

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={active ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all duration-200 ${
          active
            ? 'bg-rose-100 text-rose-700 border border-rose-200'
            : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
        } ${className}`}
      >
        <Heart
          size={14}
          className={active ? 'fill-rose-500 text-rose-500' : ''}
        />
        <span>{active ? 'Wishlisted' : 'Wishlist'}</span>
      </button>
    );
  }

  // Default 'icon' variant
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
      title={active ? 'Remove from wishlist' : 'Save to wishlist'}
      className={`group/wish relative flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 shadow-sm ${
        active
          ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:scale-105'
          : 'bg-white/95 text-slate-500 border border-slate-200/90 hover:text-rose-600 hover:bg-white hover:scale-105'
      } ${className}`}
    >
      <Heart
        size={18}
        className={`transition-all duration-200 ${
          active
            ? 'fill-rose-500 text-rose-500 scale-110'
            : 'group-hover/wish:text-rose-500 group-hover/wish:scale-110'
        }`}
      />
    </button>
  );
}
