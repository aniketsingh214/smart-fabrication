'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export interface WishlistItem {
  id: string;
  name: string;
  slug: string;
  material: string;
  price_min_minor?: number | null;
  image_url?: string | null;
}

export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  material: string;
  price_min_minor?: number | null;
  image_url?: string | null;
  quantity: number;
  dimensions?: {
    width_mm?: number;
    height_mm?: number;
    display?: string;
  };
}

interface ShopContextType {
  wishlist: WishlistItem[];
  cart: CartItem[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isInCart: (productId: string) => boolean;
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  totalCartItems: number;
  totalWishlistItems: number;
  cartSubtotalMinor: number;
}

const ShopContext = createContext<ShopContextType | null>(null);

const WISHLIST_STORAGE_KEY = 'sf_wishlist_items_v1';
const CART_STORAGE_KEY = 'sf_cart_items_v1';

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage after mount
  useEffect(() => {
    try {
      const storedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (storedWishlist) {
        setWishlist(JSON.parse(storedWishlist));
      }
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
    } catch {
      // Ignore storage read errors
    }
    setMounted(true);
  }, []);

  // Save wishlist
  const saveWishlist = useCallback((items: WishlistItem[]) => {
    setWishlist(items);
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write errors
    }
  }, []);

  // Save cart
  const saveCart = useCallback((items: CartItem[]) => {
    setCart(items);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write errors
    }
  }, []);

  // Wishlist methods
  const isWishlisted = useCallback(
    (productId: string) => wishlist.some(item => item.id === productId),
    [wishlist]
  );

  const addToWishlist = useCallback(
    (item: WishlistItem) => {
      if (!wishlist.some(i => i.id === item.id)) {
        saveWishlist([...wishlist, item]);
      }
    },
    [wishlist, saveWishlist]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      saveWishlist(wishlist.filter(item => item.id !== productId));
    },
    [wishlist, saveWishlist]
  );

  const toggleWishlist = useCallback(
    (item: WishlistItem) => {
      if (isWishlisted(item.id)) {
        removeFromWishlist(item.id);
      } else {
        addToWishlist(item);
      }
    },
    [isWishlisted, removeFromWishlist, addToWishlist]
  );

  // Cart methods
  const isInCart = useCallback(
    (productId: string) => cart.some(item => item.product_id === productId),
    [cart]
  );

  const addToCart = useCallback(
    (item: Omit<CartItem, 'id' | 'quantity'> & { quantity?: number }) => {
      const existingIndex = cart.findIndex(i => i.product_id === item.product_id);
      const addQty = item.quantity ?? 1;

      if (existingIndex > -1) {
        const next = [...cart];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + addQty
        };
        saveCart(next);
      } else {
        const newCartItem: CartItem = {
          id: `${item.product_id}_${Date.now()}`,
          ...item,
          quantity: addQty
        };
        saveCart([...cart, newCartItem]);
      }
      setIsCartOpen(true);
    },
    [cart, saveCart]
  );

  const removeFromCart = useCallback(
    (cartItemId: string) => {
      saveCart(cart.filter(item => item.id !== cartItemId));
    },
    [cart, saveCart]
  );

  const updateQuantity = useCallback(
    (cartItemId: string, qty: number) => {
      if (qty <= 0) {
        removeFromCart(cartItemId);
        return;
      }
      saveCart(
        cart.map(item => (item.id === cartItemId ? { ...item, quantity: Math.min(qty, 99) } : item))
      );
    },
    [cart, saveCart, removeFromCart]
  );

  const clearCart = useCallback(() => {
    saveCart([]);
  }, [saveCart]);

  const totalCartItems = useMemo(
    () => (mounted ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0),
    [cart, mounted]
  );

  const totalWishlistItems = useMemo(
    () => (mounted ? wishlist.length : 0),
    [wishlist, mounted]
  );

  const cartSubtotalMinor = useMemo(
    () => (mounted ? cart.reduce((sum, item) => sum + (item.price_min_minor ?? 0) * item.quantity, 0) : 0),
    [cart, mounted]
  );

  const value = useMemo(
    () => ({
      wishlist: mounted ? wishlist : [],
      cart: mounted ? cart : [],
      isWishlisted,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      isInCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      isWishlistOpen,
      setIsWishlistOpen,
      totalCartItems,
      totalWishlistItems,
      cartSubtotalMinor
    }),
    [
      wishlist,
      cart,
      mounted,
      isWishlisted,
      toggleWishlist,
      addToWishlist,
      removeFromWishlist,
      isInCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      isWishlistOpen,
      totalCartItems,
      totalWishlistItems,
      cartSubtotalMinor
    ]
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

const defaultContextValue: ShopContextType = {
  wishlist: [],
  cart: [],
  isWishlisted: () => false,
  toggleWishlist: () => {},
  addToWishlist: () => {},
  removeFromWishlist: () => {},
  isInCart: () => false,
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  isCartOpen: false,
  setIsCartOpen: () => {},
  isWishlistOpen: false,
  setIsWishlistOpen: () => {},
  totalCartItems: 0,
  totalWishlistItems: 0,
  cartSubtotalMinor: 0
};

export function useShop() {
  const context = useContext(ShopContext);
  return context ?? defaultContextValue;
}
