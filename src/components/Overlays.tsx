import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Minus, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { formatINR, useBakery } from '../context/BakeryContext';
import { SafeImage } from './BrandPrimitives';

export function CartDrawer() {
  const {
    cart,
    cartCount,
    cartSubtotal,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    cms,
  } = useBakery();
  const navigate = useNavigate();

  const remainingForFree = Math.max(0, cms.freeDeliveryThreshold - cartSubtotal);

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartDrawerOpen(false)}
            className="fixed inset-0 bg-[#49372F]/50 backdrop-blur-xs"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative z-10 w-full max-w-md bg-[#F8F3EB] h-full shadow-2xl flex flex-col border-l border-[#D9C2A5]"
            aria-label="Shopping Bag"
          >
            <div className="px-6 py-5 bg-[#FFFFFF] border-b border-[#D9C2A5]/60 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#49372F]">Your Pastry Bag</h2>
                <p className="text-xs text-[#795B48] tabular-nums">
                  {cartCount} {cartCount === 1 ? 'creation' : 'creations'} selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                aria-label="Close bag"
                className="w-10 h-10 rounded-full hover:bg-[#F8F3EB] flex items-center justify-center text-[#49372F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cart.length > 0 && (
              <div className="px-6 py-2.5 bg-[#D9C2A5]/25 border-b border-[#D9C2A5]/50 text-xs text-[#49372F]">
                {remainingForFree === 0
                  ? 'Complimentary home delivery unlocked on this order.'
                  : `Add ${formatINR(remainingForFree)} more for complimentary home delivery.`}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-[#FFFFFF] border border-[#D9C2A5] flex items-center justify-center mb-4">
                    <ShoppingBag className="w-7 h-7 text-[#C6A477]" />
                  </div>
                  <h3 className="font-serif text-xl font-medium text-[#49372F] mb-1">
                    Your bag is currently empty
                  </h3>
                  <p className="text-sm text-[#795B48] max-w-xs mb-6">
                    Explore our handcrafted Belgian chocolate cakes, flaky croissants, and specialty
                    coffees.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('/menu');
                    }}
                    className="px-6 py-2.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium hover:bg-[#795B48] transition-colors"
                  >
                    Explore Our Menu
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.productId}-${item.variant}-${idx}`}
                    className="flex gap-3.5 bg-[#FFFFFF] p-3.5 rounded-xl border border-[#D9C2A5]/50"
                  >
                    <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-[#F8F3EB]">
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-base font-semibold text-[#49372F] truncate">
                          {item.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeFromCart(idx)}
                          aria-label={`Remove ${item.name}`}
                          className="text-[#795B48] hover:text-[#49372F] p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-[#795B48] mt-0.5">
                        {item.variant || 'Standard'}
                        {item.eggless ? ' · Eggless' : ''}
                      </p>
                      {item.cakeMessage && (
                        <p className="text-xs italic text-[#795B48] mt-0.5 truncate">
                          Plaque: “{item.cakeMessage}”
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <div className="inline-flex items-center border border-[#D9C2A5] rounded-lg bg-[#F8F3EB]">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                            aria-label="Decrease quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#49372F]"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                            aria-label="Increase quantity"
                            className="w-7 h-7 flex items-center justify-center text-[#49372F]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-[#49372F] tabular-nums">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 bg-[#FFFFFF] border-t border-[#D9C2A5]/70 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#795B48]">Subtotal</span>
                  <span className="text-lg font-semibold text-[#49372F] tabular-nums">
                    {formatINR(cartSubtotal)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('/menu');
                    }}
                    className="h-11 rounded-lg border border-[#D9C2A5] text-[#49372F] text-xs font-medium hover:bg-[#F8F3EB] transition-colors"
                  >
                    Continue Shopping
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCartDrawerOpen(false);
                      navigate('/orders?tab=checkout');
                    }}
                    className="h-11 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[#795B48] transition-colors"
                  >
                    Checkout
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function SearchModal() {
  const { searchOpen, setSearchOpen, products, setQuickViewProduct, addToCart } = useBakery();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.filter((p) => p.bestseller).slice(0, 6);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [products, query]);

  return (
    <AnimatePresence>
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#49372F]/55 backdrop-blur-xs"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl shadow-2xl border border-[#D9C2A5] overflow-hidden"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#D9C2A5]/60">
              <Search className="w-5 h-5 text-[#795B48] shrink-0" />
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Belgian chocolate cake, tiramisu, croissants, cappuccino..."
                className="flex-1 text-sm sm:text-base text-[#49372F] placeholder:text-[#795B48]/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="w-8 h-8 rounded-full hover:bg-[#F8F3EB] flex items-center justify-center text-[#49372F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 max-h-[65vh] overflow-y-auto">
              <p className="text-xs font-medium text-[#795B48] mb-3">
                {query.trim() ? `Results (${matches.length})` : 'Popular Creations'}
              </p>
              {matches.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#795B48]">
                  No creations match “{query}”. Try searching for cheesecake, macarons, or frappe.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matches.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F8F3EB]/70 border border-[#D9C2A5]/40 hover:border-[#C6A477] transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setQuickViewProduct(p);
                        }}
                        className="w-14 h-14 rounded-lg overflow-hidden shrink-0"
                      >
                        <SafeImage src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSearchOpen(false);
                            setQuickViewProduct(p);
                          }}
                          className="text-left block w-full"
                        >
                          <p className="font-serif text-base font-semibold text-[#49372F] truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-[#795B48] tabular-nums">
                            {p.category} · {formatINR(p.price)}
                          </p>
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={!p.available}
                        onClick={() =>
                          addToCart({
                            productId: p.id,
                            name: p.name,
                            category: p.category,
                            price: p.price,
                            image: p.image,
                            quantity: 1,
                            variant: p.variants?.[0],
                            eggless: p.egglessOption,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium hover:bg-[#795B48] disabled:opacity-40 shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-[#D9C2A5]/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    navigate(`/menu${query ? `?q=${encodeURIComponent(query)}` : ''}`);
                  }}
                  className="text-xs font-medium text-[#795B48] hover:text-[#49372F] inline-flex items-center gap-1"
                >
                  View Full Menu
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ToastStack() {
  const { toasts, dismissToast } = useBakery();

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto bg-[#49372F] text-[#F8F3EB] px-4 py-3 rounded-xl shadow-xl border border-[#C6A477]/50 flex items-start justify-between gap-3"
          >
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              {t.subtitle && <p className="text-xs text-[#D9C2A5] mt-0.5">{t.subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="text-[#D9C2A5] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
