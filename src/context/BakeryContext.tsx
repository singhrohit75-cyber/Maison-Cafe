import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  INITIAL_CMS,
  INITIAL_COUPONS,
  INITIAL_PRODUCTS,
} from '../data/seedData';
import type {
  CartItem,
  CmsContent,
  Coupon,
  Product,
  UserProfile,
} from '../types/bakery';

interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
}

interface BakeryContextValue {
  products: Product[];
  cms: CmsContent;
  coupons: Coupon[];
  loadingBootstrap: boolean;
  refreshCatalog: () => Promise<void>;

  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateCartQuantity: (index: number, qty: number) => void;
  clearCart: () => void;

  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  conciergeOpen: boolean;
  setConciergeOpen: (open: boolean) => void;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;

  token: string | null;
  user: UserProfile | null;
  authLoading: boolean;
  login: (identifier: string, password: string, expectedRole?: 'customer' | 'admin') => Promise<UserProfile>;
  register: (name: string, email: string, mobile: string, password: string) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;

  wishlist: string[];
  toggleWishlist: (productId: string, productName?: string) => void;

  toasts: ToastMessage[];
  notify: (title: string, subtitle?: string) => void;
  dismissToast: (id: string) => void;
}

const BakeryContext = createContext<BakeryContextValue | undefined>(undefined);

const CART_KEY = 'maison_eclat_cart_v1';
const TOKEN_KEY = 'maison_eclat_token_v1';
const WISHLIST_KEY = 'maison_eclat_wishlist_v1';

export function BakeryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cms, setCms] = useState<CmsContent>(INITIAL_CMS);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [loadingBootstrap, setLoadingBootstrap] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      return raw ? (JSON.parse(raw) as string[]) : ['cake-belgian-chocolate', 'pastry-macarons'];
    } catch {
      return [];
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(token));

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback((title: string, subtitle?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-2), { id, title, subtitle }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshCatalog = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) setProducts(data.products);
        if (data.cms) setCms(data.cms);
        if (Array.isArray(data.coupons)) setCoupons(data.coupons);
      }
    } catch {
      // Fallback to initial seed catalog silently
    } finally {
      setLoadingBootstrap(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (Array.isArray(data.user?.wishlist)) {
          setWishlist(data.user.wishlist);
        }
      } else {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Keep token state if offline
    } finally {
      setAuthLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage error
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      // Ignore storage error
    }
  }, [wishlist]);

  const addToCart = useCallback(
    (item: CartItem) => {
      setCart((prev) => {
        const idx = prev.findIndex(
          (c) =>
            c.productId === item.productId &&
            (c.variant || '') === (item.variant || '') &&
            Boolean(c.eggless) === Boolean(item.eggless) &&
            (c.cakeMessage || '') === (item.cakeMessage || '')
        );
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + item.quantity };
          return updated;
        }
        return [...prev, item];
      });
      notify(`Added to Bag: ${item.name}`, `${item.quantity} × ₹${item.price.toLocaleString('en-IN')}`);
    },
    [notify]
  );

  const removeFromCart = useCallback((index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCartQuantity = useCallback((index: number, qty: number) => {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((_, i) => i !== index);
      const next = [...prev];
      next[index] = { ...next[index], quantity: qty };
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const login = useCallback(
    async (identifier: string, password: string, expectedRole?: 'customer' | 'admin') => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, expectedRole }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sign in failed');
      }
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      if (Array.isArray(data.user?.wishlist)) {
        setWishlist(data.user.wishlist);
      }
      return data.user as UserProfile;
    },
    []
  );

  const register = useCallback(async (name: string, email: string, mobile: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, mobile, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem(TOKEN_KEY, data.token);
    return data.user as UserProfile;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    notify('Signed out', 'Thank you for visiting Maison Éclat.');
  }, [notify]);

  const toggleWishlist = useCallback(
    (productId: string, productName?: string) => {
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
        if (token && user?.role === 'customer') {
          fetch('/api/customer/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ wishlist: next }),
          }).catch(() => {});
        }
        notify(
          exists ? 'Removed from Favourites' : 'Saved to Favourites',
          productName || undefined
        );
        return next;
      });
    },
    [notify, token, user?.role]
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <BakeryContext.Provider
      value={{
        products,
        cms,
        coupons,
        loadingBootstrap,
        refreshCatalog,
        cart,
        cartCount,
        cartSubtotal,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartDrawerOpen,
        setCartDrawerOpen,
        searchOpen,
        setSearchOpen,
        conciergeOpen,
        setConciergeOpen,
        quickViewProduct,
        setQuickViewProduct,
        token,
        user,
        authLoading,
        login,
        register,
        logout,
        refreshUser,
        wishlist,
        toggleWishlist,
        toasts,
        notify,
        dismissToast,
      }}
    >
      {children}
    </BakeryContext.Provider>
  );
}

export function useBakery() {
  const ctx = useContext(BakeryContext);
  if (!ctx) throw new Error('useBakery must be used within BakeryProvider');
  return ctx;
}

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
