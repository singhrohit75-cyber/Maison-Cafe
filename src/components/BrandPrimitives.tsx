import React, { useState } from 'react';
import { Heart, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { formatINR, useBakery } from '../context/BakeryContext';

export function MaisonLogo({
  variant = 'dark',
  size = 'md',
}: {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}) {
  const textColor = variant === 'light' ? 'text-[#F8F3EB]' : 'text-[#49372F]';
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize =
    size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl';

  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className={`${iconSize} shrink-0`}
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="22" stroke="#C6A477" strokeWidth="1.4" />
        <circle cx="24" cy="24" r="18.5" stroke="#C6A477" strokeWidth="0.6" strokeDasharray="2 2" />
        <path
          d="M15 31V17L24 25L33 17V31"
          stroke={variant === 'light' ? '#F8F3EB' : '#49372F'}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21 12.5C22.2 10.8 25.8 10.8 27 12.5"
          stroke="#C6A477"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
      <span className={`font-serif font-semibold tracking-wide ${titleSize} ${textColor}`}>
        Maison Éclat
      </span>
    </span>
  );
}

export function SafeImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F8F3EB] via-[#D9C2A5]/45 to-[#D9B9AC]/40 text-[#49372F] p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10 mb-2 opacity-75">
          <circle cx="24" cy="24" r="20" stroke="#C6A477" strokeWidth="1.5" />
          <path d="M16 29V19L24 25L32 19V29" stroke="#795B48" strokeWidth="1.5" />
        </svg>
        <span className="font-serif text-base font-medium text-[#49372F]">
          {fallbackTitle || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
      className={className}
      loading="lazy"
    />
  );
}

function getVariantAdjustedPrice(basePrice: number, variant?: string): number {
  if (!variant) return basePrice;
  const match = variant.match(/\+₹([\d,]+)/);
  if (match) {
    const extra = parseInt(match[1].replace(/,/g, ''), 10);
    return basePrice + (isNaN(extra) ? 0 : extra);
  }
  if (variant.includes('Gift Box of 6')) return 549;
  return basePrice;
}

export function ProductQuickViewModal() {
  const {
    quickViewProduct,
    setQuickViewProduct,
    addToCart,
    wishlist,
    toggleWishlist,
    setCartDrawerOpen,
  } = useBakery();

  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [eggless, setEggless] = useState<boolean>(true);
  const [qty, setQty] = useState<number>(1);
  const [cakeMessage, setCakeMessage] = useState<string>('');

  if (!quickViewProduct) return null;

  const variants = quickViewProduct.variants?.length ? quickViewProduct.variants : ['Standard'];
  const activeVariant = selectedVariant && variants.includes(selectedVariant) ? selectedVariant : variants[0];
  const computedPrice = getVariantAdjustedPrice(quickViewProduct.price, activeVariant);
  const isWishlisted = wishlist.includes(quickViewProduct.id);
  const isCake = quickViewProduct.category === 'Signature Cakes';

  const handleClose = () => {
    setQuickViewProduct(null);
    setSelectedVariant('');
    setQty(1);
    setCakeMessage('');
  };

  const handleAdd = () => {
    addToCart({
      productId: quickViewProduct.id,
      name: quickViewProduct.name,
      category: quickViewProduct.category,
      price: computedPrice,
      image: quickViewProduct.image,
      quantity: qty,
      variant: activeVariant,
      eggless: quickViewProduct.egglessOption ? eggless : false,
      cakeMessage: isCake && cakeMessage.trim() ? cakeMessage.trim() : undefined,
    });
    handleClose();
    setCartDrawerOpen(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#49372F]/55 backdrop-blur-xs p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      <div
        className="relative w-full max-w-3xl bg-[#FFFFFF] rounded-2xl overflow-hidden shadow-2xl border border-[#D9C2A5]/60 grid grid-cols-1 md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          aria-label="Close product details"
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#F8F3EB]/90 text-[#49372F] flex items-center justify-center hover:bg-[#C6A477] hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-[#F8F3EB] aspect-[4/3] md:aspect-auto md:h-full">
          <SafeImage
            src={quickViewProduct.image}
            alt={quickViewProduct.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-between gap-5 max-h-[85vh] overflow-y-auto">
          <div>
            <p className="text-xs tracking-wider uppercase text-[#795B48] mb-2">
              {quickViewProduct.category}
              {quickViewProduct.bestseller ? ' · Bestseller' : ''}
              {quickViewProduct.seasonal ? ' · Seasonal' : ''}
            </p>
            <h2 id="quick-view-title" className="font-serif text-2xl sm:text-3xl font-semibold text-[#49372F] mb-2">
              {quickViewProduct.name}
            </h2>
            <p className="text-xl font-semibold text-[#49372F] tabular-nums mb-4">
              {formatINR(computedPrice)}
            </p>
            <p className="text-sm text-[#795B48] leading-relaxed mb-5">
              {quickViewProduct.description}
            </p>

            {/* Variants */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#49372F] mb-2">
                Select Portion / Option
              </label>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSelectedVariant(v)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                      activeVariant === v
                        ? 'bg-[#49372F] text-[#F8F3EB] border-[#49372F]'
                        : 'bg-[#F8F3EB] text-[#49372F] border-[#D9C2A5] hover:border-[#C6A477]'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Eggless toggle */}
            {quickViewProduct.egglessOption ? (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#49372F] mb-2">
                  Preparation Preference
                </label>
                <div className="inline-flex rounded-lg bg-[#F8F3EB] p-1 border border-[#D9C2A5]/70">
                  <button
                    type="button"
                    onClick={() => setEggless(true)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      eggless ? 'bg-[#FFFFFF] text-[#49372F] shadow-xs' : 'text-[#795B48]'
                    }`}
                  >
                    100% Eggless
                  </button>
                  <button
                    type="button"
                    onClick={() => setEggless(false)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      !eggless ? 'bg-[#FFFFFF] text-[#49372F] shadow-xs' : 'text-[#795B48]'
                    }`}
                  >
                    Classic Recipe
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#795B48] mb-4">
                Crafted traditionally with almond meringue (contains egg).
              </p>
            )}

            {isCake && (
              <div className="mb-2">
                <label htmlFor="cake-msg-qv" className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Complimentary Plaque Message (Optional)
                </label>
                <input
                  id="cake-msg-qv"
                  type="text"
                  maxLength={40}
                  value={cakeMessage}
                  onChange={(e) => setCakeMessage(e.target.value)}
                  placeholder="e.g. Happy Birthday Ananya"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm text-[#49372F] focus:outline-none focus:border-[#C6A477]"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#D9C2A5]/50 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center border border-[#D9C2A5] rounded-lg bg-[#F8F3EB]">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-10 h-10 flex items-center justify-center text-[#49372F] hover:text-[#C6A477]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-10 h-10 flex items-center justify-center text-[#49372F] hover:text-[#C6A477]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={!quickViewProduct.available}
              className="flex-1 min-w-[160px] h-11 px-5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-[#795B48] transition-colors disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              {quickViewProduct.available ? `Add · ${formatINR(computedPrice * qty)}` : 'Currently Unavailable'}
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(quickViewProduct.id, quickViewProduct.name)}
              aria-label="Save to favourites"
              className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-colors ${
                isWishlisted
                  ? 'border-[#D9B9AC] bg-[#D9B9AC]/25 text-[#49372F]'
                  : 'border-[#D9C2A5] text-[#795B48] hover:border-[#C6A477]'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#49372F]' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
