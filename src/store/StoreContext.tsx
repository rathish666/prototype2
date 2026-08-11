import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { CartItem, Product } from '@/types';
import { effectivePrice } from '@/types';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreContextValue {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size: string, color: string, quantity?: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateCartQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  // Wishlist
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  // Customer
  customerEmail: string | null;
  customerName: string | null;
  setCustomer: (email: string, name: string) => void;
  logoutCustomer: () => void;
  // Coupon
  appliedCoupon: string | null;
  setAppliedCoupon: (code: string | null) => void;
  // Toast
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

const CART_KEY = 'maison-cart';
const WISHLIST_KEY = 'maison-wishlist';
const CUSTOMER_KEY = 'maison-customer';
const COUPON_KEY = 'maison-coupon';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCouponState] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    try {
      const c = localStorage.getItem(CART_KEY);
      if (c) setCart(JSON.parse(c));
      const w = localStorage.getItem(WISHLIST_KEY);
      if (w) setWishlist(JSON.parse(w));
      const cust = localStorage.getItem(CUSTOMER_KEY);
      if (cust) {
        const parsed = JSON.parse(cust);
        setCustomerEmail(parsed.email);
        setCustomerName(parsed.name);
      }
      const cpn = localStorage.getItem(COUPON_KEY);
      if (cpn) setAppliedCouponState(cpn);
    } catch { /* ignore */ }
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const persistCart = (c: CartItem[]) => {
    setCart(c);
    localStorage.setItem(CART_KEY, JSON.stringify(c));
  };

  const addToCart = useCallback((product: Product, size: string, color: string, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.product_id === product.id && i.size === size && i.color === color
      );
      let next: CartItem[];
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock);
        next = prev.map((i) =>
          i === existing ? { ...i, quantity: newQty } : i
        );
      } else {
        next = [...prev, {
          product_id: product.id,
          name: product.name,
          brand: product.brand,
          image: product.images?.[0]?.url ?? '',
          price: effectivePrice(product),
          size,
          color,
          quantity: Math.min(quantity, product.stock),
          stock: product.stock,
        }];
      }
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: string, size: string, color: string) => {
    setCart((prev) => {
      const next = prev.filter(
        (i) => !(i.product_id === productId && i.size === size && i.color === color)
      );
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateCartQuantity = useCallback((productId: string, size: string, color: string, quantity: number) => {
    setCart((prev) => {
      const next = prev.map((i) => {
        if (i.product_id === productId && i.size === size && i.color === color) {
          return { ...i, quantity: Math.max(1, Math.min(quantity, i.stock)) };
        }
        return i;
      });
      localStorage.setItem(CART_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    persistCart([]);
    setAppliedCouponState(null);
    localStorage.removeItem(COUPON_KEY);
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const setCustomer = useCallback((email: string, name: string) => {
    setCustomerEmail(email);
    setCustomerName(name);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ email, name }));
  }, []);

  const logoutCustomer = useCallback(() => {
    setCustomerEmail(null);
    setCustomerName(null);
    localStorage.removeItem(CUSTOMER_KEY);
  }, []);

  const setAppliedCoupon = useCallback((code: string | null) => {
    setAppliedCouponState(code);
    if (code) localStorage.setItem(COUPON_KEY, code);
    else localStorage.removeItem(COUPON_KEY);
  }, []);

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart, addToCart, removeFromCart, updateCartQuantity, clearCart, cartCount, cartSubtotal,
        wishlist, toggleWishlist, isInWishlist,
        customerEmail, customerName, setCustomer, logoutCustomer,
        appliedCoupon, setAppliedCoupon,
        toasts, showToast, removeToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}
