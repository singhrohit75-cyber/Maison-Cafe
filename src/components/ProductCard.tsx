import React from 'react';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../types/bakery';
import { formatINR, useBakery } from '../context/BakeryContext';
import { SafeImage } from './BrandPrimitives';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, setQuickViewProduct, wishlist, toggleWishlist } = useBakery();
  const isWishlisted = wishlist.includes(product.id);

  const metaParts: string[] = [product.category];
  if (product.bestseller) metaParts.push('Bestseller');
  else if (product.seasonal) metaParts.push('Seasonal');
  if (product.egglessOption) metaParts.push('Eggless Option');

  return (
    <article className="group bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-[#F8F3EB] overflow-hidden">
        <button
          type="button"
          onClick={() => setQuickViewProduct(product)}
          className="w-full h-full block text-left"
          aria-label={`View details for ${product.name}`}
        >
          <SafeImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </button>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => toggleWishlist(product.id, product.name)}
            aria-label={isWishlisted ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`}
            className="w-9 h-9 rounded-full bg-[#FFFFFF]/90 backdrop-blur-xs text-[#49372F] flex items-center justify-center shadow-xs hover:bg-[#FFFFFF] transition-colors"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#49372F]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setQuickViewProduct(product)}
            aria-label={`Quick view ${product.name}`}
            className="w-9 h-9 rounded-full bg-[#FFFFFF]/90 backdrop-blur-xs text-[#49372F] flex items-center justify-center shadow-xs hover:bg-[#FFFFFF] transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {!product.available && (
          <div className="absolute inset-0 bg-[#49372F]/45 flex items-center justify-center">
            <span className="px-3.5 py-1.5 rounded-lg bg-[#F8F3EB] text-[#49372F] text-xs font-medium">
              Sold Out Today
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#795B48] mb-1.5 truncate">
            {metaParts.join(' · ')}
          </p>
          <h3 className="font-serif text-xl font-semibold text-[#49372F] leading-snug mb-1.5">
            <button
              type="button"
              onClick={() => setQuickViewProduct(product)}
              className="text-left hover:text-[#795B48] transition-colors"
            >
              {product.name}
            </button>
          </h3>
          <p className="text-sm text-[#795B48] leading-relaxed line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="pt-3 border-t border-[#D9C2A5]/40 flex items-center justify-between gap-3">
          <div>
            <span className="text-base font-semibold text-[#49372F] tabular-nums">
              {formatINR(product.price)}
            </span>
            {product.variants?.[0] && (
              <span className="block text-[11px] text-[#795B48]">{product.variants[0]}</span>
            )}
          </div>

          <button
            type="button"
            disabled={!product.available}
            onClick={() =>
              addToCart({
                productId: product.id,
                name: product.name,
                category: product.category,
                price: product.price,
                image: product.image,
                quantity: 1,
                variant: product.variants?.[0],
                eggless: product.egglessOption,
              })
            }
            className="h-10 px-4 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#795B48] transition-colors disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Add to Bag
          </button>
        </div>
      </div>
    </article>
  );
}
