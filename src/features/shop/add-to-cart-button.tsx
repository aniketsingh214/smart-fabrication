'use client';

import React, { useState } from 'react';
import { ShoppingCart, Check } from 'lucide-react';
import { useShop, type CartItem } from './shop-context';

interface AddToCartButtonProps {
  item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number };
  variant?: 'primary' | 'outline' | 'icon' | 'compact';
  className?: string;
  label?: string;
}

export function AddToCartButton({
  item,
  variant = 'primary',
  className = '',
  label
}: AddToCartButtonProps) {
  const { addToCart, isInCart } = useShop();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = isInCart(item.product_id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={justAdded ? 'Added to cart' : `Add ${item.name} to cart`}
        title={justAdded ? 'Added to cart!' : inCart ? 'Add another to cart' : 'Add to cart'}
        className={`group/cart relative flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 shadow-sm ${
          justAdded
            ? 'bg-emerald-600 text-white scale-105'
            : inCart
            ? 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:scale-105'
            : 'bg-white/95 text-slate-700 border border-slate-200/90 hover:text-orange-600 hover:bg-white hover:scale-105'
        } ${className}`}
      >
        {justAdded ? (
          <Check size={18} className="animate-in zoom-in duration-150" />
        ) : (
          <ShoppingCart
            size={18}
            className={`transition-all duration-200 ${
              inCart ? 'text-orange-600' : 'group-hover/cart:text-orange-600 group-hover/cart:scale-105'
            }`}
          />
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Add ${item.name} to cart`}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
          justAdded
            ? 'bg-emerald-600 text-white'
            : inCart
            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
            : 'bg-orange-600 text-white hover:bg-orange-700'
        } ${className}`}
      >
        {justAdded ? (
          <>
            <Check size={14} />
            <span>Added</span>
          </>
        ) : (
          <>
            <ShoppingCart size={14} />
            <span>{label || (inCart ? 'Add More' : 'Add to Cart')}</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'outline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Add ${item.name} to cart`}
        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-150 ${
          justAdded
            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
            : 'border-orange-500 text-orange-600 hover:bg-orange-50'
        } ${className}`}
      >
        {justAdded ? (
          <>
            <Check size={18} className="text-emerald-600" />
            <span>Added to Cart!</span>
          </>
        ) : (
          <>
            <ShoppingCart size={18} />
            <span>{label || (inCart ? 'Add Another to Cart' : 'Add to Cart')}</span>
          </>
        )}
      </button>
    );
  }

  // Primary variant
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Add ${item.name} to cart`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:shadow-lg active:scale-98 ${
        justAdded
          ? 'bg-emerald-600 ring-2 ring-emerald-400'
          : 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800'
      } ${className}`}
    >
      {justAdded ? (
        <>
          <Check size={19} className="animate-in zoom-in" />
          <span>Added to Cart!</span>
        </>
      ) : (
        <>
          <ShoppingCart size={19} />
          <span>{label || (inCart ? 'Add More to Cart' : 'Add to Project Cart')}</span>
        </>
      )}
    </button>
  );
}
