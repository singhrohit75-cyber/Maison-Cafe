import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../data/seedData';
import { useBakery } from '../context/BakeryContext';
import { ProductCard } from '../components/ProductCard';

export function MenuPage() {
  const { products } = useBakery();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCat = searchParams.get('category') || 'All';
  const initialQuery = searchParams.get('q') || '';
  const initialSeasonal = searchParams.get('seasonal') === 'true';
  const initialBestseller = searchParams.get('bestseller') === 'true';
  const initialEggless = searchParams.get('eggless') === 'true';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCat);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [onlyBestsellers, setOnlyBestsellers] = useState(initialBestseller);
  const [onlySeasonal, setOnlySeasonal] = useState(initialSeasonal);
  const [onlyEggless, setOnlyEggless] = useState(initialEggless);

  useEffect(() => {
    const cat = searchParams.get('category');
    const q = searchParams.get('q');
    setSelectedCategory(cat || 'All');
    setSearchQuery(q ?? '');
    setOnlySeasonal(searchParams.get('seasonal') === 'true');
    setOnlyBestsellers(searchParams.get('bestseller') === 'true');
    setOnlyEggless(searchParams.get('eggless') === 'true');
  }, [searchParams]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const next = new URLSearchParams(searchParams);
    if (cat === 'All') next.delete('category');
    else next.set('category', cat);
    setSearchParams(next, { replace: true });
  };

  const toggleParamFilter = (
    key: 'seasonal' | 'bestseller' | 'eggless',
    current: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    const nextVal = !current;
    setter(nextVal);
    const next = new URLSearchParams(searchParams);
    if (nextVal) next.set(key, 'true');
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    if (onlyBestsellers) list = list.filter((p) => p.bestseller);
    if (onlySeasonal) list = list.filter((p) => p.seasonal);
    if (onlyEggless) list = list.filter((p) => p.egglessOption);

    if (sortBy === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => Number(b.bestseller) - Number(a.bestseller));

    return list;
  }, [products, selectedCategory, searchQuery, sortBy, onlyBestsellers, onlySeasonal, onlyEggless]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSortBy('featured');
    setOnlyBestsellers(false);
    setOnlySeasonal(false);
    setOnlyEggless(false);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <section className="bg-[#FFFFFF] border-b border-[#D9C2A5]/60 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
            Bakery &amp; Cafe Collection
          </p>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#49372F] mb-3">
                Our Signature Menu
              </h1>
              <p className="text-base text-[#795B48] max-w-2xl">
                Handcrafted celebration cakes, flaky layered pastries, almond macarons, single-origin
                coffees, and chilled milkshakes. All prices shown in INR are demonstration rates.
              </p>
            </div>
            <p className="text-xs text-[#795B48] tabular-nums shrink-0">
              Showing {filteredProducts.length} of {products.length} creations
            </p>
          </div>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-4 sm:p-5 space-y-4 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['All', ...PRODUCT_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#49372F] text-[#F8F3EB]'
                    : 'bg-[#F8F3EB] text-[#795B48] hover:text-[#49372F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search + Sort + Attribute Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-2 border-t border-[#D9C2A5]/40">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#795B48] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cakes, pastries, croissants, coffees..."
                className="w-full h-10 pl-10 pr-9 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm text-[#49372F] placeholder:text-[#795B48]/70 focus:outline-none focus:border-[#C6A477]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#795B48] hover:text-[#49372F]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toggleParamFilter('bestseller', onlyBestsellers, setOnlyBestsellers)}
                className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  onlyBestsellers
                    ? 'bg-[#C6A477]/20 border-[#C6A477] text-[#49372F]'
                    : 'bg-[#F8F3EB] border-[#D9C2A5] text-[#795B48]'
                }`}
              >
                Bestsellers
              </button>
              <button
                type="button"
                onClick={() => toggleParamFilter('seasonal', onlySeasonal, setOnlySeasonal)}
                className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  onlySeasonal
                    ? 'bg-[#C6A477]/20 border-[#C6A477] text-[#49372F]'
                    : 'bg-[#F8F3EB] border-[#D9C2A5] text-[#795B48]'
                }`}
              >
                New &amp; Seasonal
              </button>
              <button
                type="button"
                onClick={() => toggleParamFilter('eggless', onlyEggless, setOnlyEggless)}
                className={`h-9 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  onlyEggless
                    ? 'bg-[#A8B39C]/25 border-[#A8B39C] text-[#49372F]'
                    : 'bg-[#F8F3EB] border-[#D9C2A5] text-[#795B48]'
                }`}
              >
                Eggless Options
              </button>

              <div className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#795B48]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  aria-label="Sort products"
                  className="bg-transparent text-xs font-medium text-[#49372F] focus:outline-none"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-12 text-center">
            <h2 className="font-serif text-2xl font-semibold text-[#49372F] mb-2">
              No matching creations found
            </h2>
            <p className="text-sm text-[#795B48] mb-5">
              Adjust your search terms or reset filters to browse all {products.length} items.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
