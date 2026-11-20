import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Instagram,
  Search,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { IMAGES, PRODUCT_CATEGORIES } from '../data/seedData';
import { formatINR, useBakery } from '../context/BakeryContext';
import { SafeImage } from '../components/BrandPrimitives';
import { ProductCard } from '../components/ProductCard';

const HERO_SLIDES = [
  {
    id: 'slide-1',
    image: IMAGES.heroDisplay,
    caption: 'Artisan Display · Sector 62, Noida',
    alt: 'Maison Éclat luxury bakery glass display counter with cakes and macarons',
  },
  {
    id: 'slide-2',
    image: IMAGES.heroCelebration,
    caption: 'Custom Celebration Studio',
    alt: 'Tiered luxury ivory celebration cake with gold leaf and berries',
  },
  {
    id: 'slide-3',
    image: IMAGES.heroCafe,
    caption: 'European-Inspired Cafe Lounge',
    alt: 'Sunlit Maison Éclat cafe interior with cappuccino latte art and butter croissants',
  },
];

const WINDOW_SLIDES = [
  {
    id: 'win-1',
    timeTag: '08:30 AM · Morning Window',
    title: 'The Sunlit Pastry Display',
    subtitle:
      'Every morning our marble-trimmed window opens with warm croissants, glazed fruit tarts, and delicate mini cakes resting under brushed brass lamps.',
    highlight: 'Fresh Small-Batch Display · Sector 62',
    image: IMAGES.windowMorning,
    alt: 'Morning sunlit bakery glass window display filled with pastries and layered cakes',
    ctaLabel: 'Browse Morning Bakery',
    ctaPath: '/menu?category=Artisan%20Bakery',
  },
  {
    id: 'win-2',
    timeTag: '12:30 PM · Midday Tasting',
    title: 'Creamy Tiramisu & Warm Fudge Squares',
    subtitle:
      'Espresso-drenched sponge biscuits layered beneath whipped cream cheese alongside crackle-top 54% dark chocolate brownies finished with warm cocoa dusting.',
    highlight: 'Served in Lounge or Packed for Gifting',
    image: IMAGES.tiramisuBrownie,
    alt: 'Classic espresso tiramisu and dark chocolate fudge brownie plating',
    ctaLabel: 'Explore Pastries & Desserts',
    ctaPath: '/menu?category=Pastries%20%26%20Desserts',
  },
  {
    id: 'win-3',
    timeTag: '04:00 PM · High Tea Tier',
    title: 'Hand-Piped Cupcake Rosettes',
    subtitle:
      'Small crimson velvet, Madagascar vanilla bean, and whipped chocolate fudge cupcakes swirled to order for intimate table gatherings.',
    highlight: 'Available in Boxes of 4 & Custom Assortments',
    image: IMAGES.cupcakes,
    alt: 'Assorted luxury hand-piped cupcakes on a ceramic pedestal',
    ctaLabel: 'Shop Cupcakes & Cookies',
    ctaPath: '/menu?category=Cupcakes%20%26%20Cookies',
  },
  {
    id: 'win-4',
    timeTag: '06:00 PM · Golden Hour Bake',
    title: 'Layered Fruit Cream Danish',
    subtitle:
      '27 crisp butter-folded pastry layers cradling Madagascar vanilla custard cream and jewel-toned glazed seasonal berries.',
    highlight: 'Crisp Flaky Layers · Eggless Available',
    image: IMAGES.fruitDanish,
    alt: 'Flaky glazed berry Danish pastry with vanilla custard center',
    ctaLabel: 'Order Fresh Pastries',
    ctaPath: '/menu?seasonal=true',
  },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.ceil(target / 24));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setVal(target);
        clearInterval(timer);
      } else {
        setVal(start);
      }
    }, 28);
    return () => clearInterval(timer);
  }, [target]);
  return (
    <span className="tabular-nums">
      {val}
      {suffix}
    </span>
  );
}

export function HomePage() {
  const { products, cms, addToCart, setQuickViewProduct, notify } = useBakery();
  const navigate = useNavigate();

  const [slideIdx, setSlideIdx] = useState(0);
  const [windowIdx, setWindowIdx] = useState(0);
  const [cakePage, setCakePage] = useState(0);
  const [coffeePage, setCoffeePage] = useState(0);
  const [dessertPage, setDessertPage] = useState(0);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [joining, setJoining] = useState(false);
  const [signatureMenuOpen, setSignatureMenuOpen] = useState(false);
  const [homeMenuSearch, setHomeMenuSearch] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setWindowIdx((prev) => (prev + 1) % WINDOW_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Non-overlapping Signature Cakes list
  const cakeCollection = products.filter(
    (p) => p.category === 'Signature Cakes' && !p.seasonal
  );
  const cakeTotalPages = Math.max(1, Math.ceil(cakeCollection.length / 3));
  const safeCakePage = cakePage % cakeTotalPages;
  const visibleCakes = cakeCollection.slice(safeCakePage * 3, safeCakePage * 3 + 3);

  // Featured Specialty Coffees showcase (Cappuccino, Café Latte, Caramel Macchiato first, then Espresso, Mocha, Iced Latte)
  const coffeeIdsOrder = [
    'coffee-cappuccino',
    'coffee-latte',
    'coffee-caramel-macchiato',
    'coffee-espresso',
    'coffee-mocha',
    'coffee-iced-latte',
  ];
  const coffeeShowcaseList = coffeeIdsOrder
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const coffeeTotalPages = Math.max(1, Math.ceil(coffeeShowcaseList.length / 3));
  const safeCoffeePage = coffeePage % coffeeTotalPages;
  const visibleCoffees = coffeeShowcaseList.slice(safeCoffeePage * 3, safeCoffeePage * 3 + 3);

  // Non-overlapping Signature Desserts list
  const dessertCollection = products.filter(
    (p) =>
      (p.category === 'Pastries & Desserts' || p.category === 'Cupcakes & Cookies') &&
      !p.seasonal &&
      p.id !== 'cupcake-chocolate' &&
      p.id !== 'cookie-choc-chip'
  );
  const dessertTotalPages = Math.max(1, Math.ceil(dessertCollection.length / 3));
  const safeDessertPage = dessertPage % dessertTotalPages;
  const visibleDesserts = dessertCollection.slice(safeDessertPage * 3, safeDessertPage * 3 + 3);

  // Main Artisan Bakery & Cold Beverages for the Café Lounge section (zero overlap with Coffees or Philosophy)
  const cafeHighlightIds = [
    'bakery-choc-croissant',
    'bakery-sourdough',
    'shake-belgian-choc',
    'bev-caramel-frappe',
  ];
  const cafeHighlights = cafeHighlightIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  // 6 unique visual journal tiles (zero overlap with any visible section above)
  const galleryTiles = [
    { src: IMAGES.strawberryCream, label: 'Strawberry Cream Cake' },
    { src: IMAGES.macarons, label: 'Pastel Almond Macarons' },
    { src: IMAGES.cupcakeChoc, label: 'Dark Chocolate Fudge Cupcake' },
    { src: IMAGES.cookieButter, label: 'Piped Butter Shortbread Cookies' },
    { src: IMAGES.oreoShake, label: 'Cookies & Cream Milkshake' },
    { src: IMAGES.chocFrappe, label: 'Whipped Chocolate Frappe' },
  ];

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setJoining(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not subscribe');
      notify('Welcome to the Journal', data.message);
      setNewsletterEmail('');
    } catch (err) {
      notify('Subscription Error', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setJoining(false);
    }
  };

  const activeWindow = WINDOW_SLIDES[windowIdx];
  const activeTestimonial = cms.testimonials[testimonialIdx] || cms.testimonials[0];

  return (
    <div>
      {/* 1. Full-Width Cinematic Hero Carousel */}
      <section className="relative h-[540px] sm:h-[620px] lg:h-[680px] overflow-hidden bg-[#49372F]">
        <AnimatePresence mode="wait">
          <motion.div
            key={HERO_SLIDES[slideIdx].id}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            <SafeImage
              src={HERO_SLIDES[slideIdx].image}
              alt={HERO_SLIDES[slideIdx].alt}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#49372F]/90 via-[#49372F]/45 to-[#49372F]/20" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-14 sm:pb-20">
          <div className="max-w-2xl">
            <p className="text-xs tracking-[0.2em] uppercase text-[#D9C2A5] mb-3">
              Maison Éclat · {HERO_SLIDES[slideIdx].caption}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[60px] font-semibold text-[#FFFFFF] leading-[1.08] tracking-tight mb-4">
              {cms.heroHeadline}
            </h1>
            <p className="text-base sm:text-lg text-[#F8F3EB]/90 leading-relaxed mb-8 max-w-xl">
              {cms.heroSubheadline}
            </p>
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                to="/menu"
                className="h-12 px-6 rounded-lg bg-[#C6A477] text-[#49372F] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#D9C2A5] transition-colors whitespace-nowrap"
              >
                Our Signature Menu
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/orders"
                className="h-12 px-6 rounded-lg bg-[#FFFFFF]/12 backdrop-blur-sm border border-[#F8F3EB]/50 text-[#FFFFFF] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#FFFFFF]/22 transition-colors whitespace-nowrap"
              >
                Order Your Favourites
              </Link>
            </div>
          </div>

          {/* Slide controls */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {HERO_SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSlideIdx(idx)}
                  aria-label={`View hero slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === slideIdx ? 'w-10 bg-[#C6A477]' : 'w-4 bg-[#F8F3EB]/40 hover:bg-[#F8F3EB]/70'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSlideIdx((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
                aria-label="Previous slide"
                className="w-10 h-10 rounded-full border border-[#F8F3EB]/40 text-[#FFFFFF] flex items-center justify-center hover:bg-[#FFFFFF]/15 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSlideIdx((i) => (i + 1) % HERO_SLIDES.length)}
                aria-label="Next slide"
                className="w-10 h-10 rounded-full border border-[#F8F3EB]/40 text-[#FFFFFF] flex items-center justify-center hover:bg-[#FFFFFF]/15 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Animated Business Highlights Strip */}
      <section className="bg-[#FFFFFF] border-b border-[#D9C2A5]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="border-r-0 lg:border-r border-[#D9C2A5]/50 pr-4">
              <p className="font-serif text-3xl font-semibold text-[#49372F]">
                <AnimatedCounter target={50} suffix="+" />
              </p>
              <p className="text-sm font-medium text-[#49372F] mt-1">Signature Creations</p>
              <p className="text-xs text-[#795B48] mt-0.5">Cakes, pastries &amp; beverages</p>
            </div>
            <div className="border-r-0 lg:border-r border-[#D9C2A5]/50 pr-4">
              <p className="font-serif text-3xl font-semibold text-[#49372F]">
                <AnimatedCounter target={6} suffix=":00 AM" />
              </p>
              <p className="text-sm font-medium text-[#49372F] mt-1">Freshly Baked Daily</p>
              <p className="text-xs text-[#795B48] mt-0.5">Small-batch morning ovens</p>
            </div>
            <div className="border-r-0 lg:border-r border-[#D9C2A5]/50 pr-4">
              <p className="font-serif text-3xl font-semibold text-[#49372F]">54%</p>
              <p className="text-sm font-medium text-[#49372F] mt-1">Premium Ingredients</p>
              <p className="text-xs text-[#795B48] mt-0.5">Belgian cocoa &amp; cultured butter</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-semibold text-[#49372F]">100%</p>
              <p className="text-sm font-medium text-[#49372F] mt-1">Made With Love</p>
              <p className="text-xs text-[#795B48] mt-0.5">Eggless &amp; classic house recipes</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2B. Our Signature Menu Quick-Explorer & Category Dropdown */}
      <section className="bg-[#F8F3EB] border-b border-[#D9C2A5]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#795B48] mb-1">
                  Instant Menu Explorer · Search &amp; Order
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#49372F]">
                  Our Signature Menu
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-2xl lg:justify-end">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const q = homeMenuSearch.trim();
                    navigate(q ? `/menu?q=${encodeURIComponent(q)}` : '/menu');
                  }}
                  className="relative flex-1 sm:max-w-xs"
                >
                  <Search className="w-4 h-4 text-[#795B48] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={homeMenuSearch}
                    onChange={(e) => setHomeMenuSearch(e.target.value)}
                    placeholder="Search cakes, pastries, coffees..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm text-[#49372F] placeholder:text-[#795B48]/70 focus:outline-none focus:border-[#C6A477]"
                  />
                </form>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSignatureMenuOpen((v) => !v)}
                    aria-expanded={signatureMenuOpen}
                    className="w-full sm:w-auto h-10 px-4 rounded-lg border border-[#D9C2A5] bg-[#F8F3EB] text-xs font-semibold text-[#49372F] inline-flex items-center justify-between gap-2 hover:border-[#C6A477] transition-colors whitespace-nowrap"
                  >
                    <span>Browse Categories</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#795B48] transition-transform ${
                        signatureMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {signatureMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-[#FFFFFF] rounded-xl shadow-xl border border-[#D9C2A5] py-2 z-30">
                      <Link
                        to="/menu"
                        onClick={() => setSignatureMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#49372F] hover:bg-[#F8F3EB]"
                      >
                        <span>All {products.length} Signature Creations</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C6A477]" />
                      </Link>
                      <div className="my-1 border-t border-[#D9C2A5]/40" />
                      {PRODUCT_CATEGORIES.map((cat) => {
                        const count = products.filter((p) => p.category === cat).length;
                        return (
                          <Link
                            key={cat}
                            to={`/menu?category=${encodeURIComponent(cat)}`}
                            onClick={() => setSignatureMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-2 text-sm text-[#795B48] hover:text-[#49372F] hover:bg-[#F8F3EB]"
                          >
                            <span>{cat}</span>
                            <span className="text-[11px] font-mono text-[#795B48]">{count}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                <Link
                  to="/menu"
                  className="h-10 px-5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#795B48] transition-colors whitespace-nowrap"
                >
                  Open Full Menu
                  <ArrowRight className="w-3.5 h-3.5 text-[#C6A477]" />
                </Link>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#D9C2A5]/40 flex items-center gap-2 overflow-x-auto pb-1">
              <Link
                to="/menu"
                className="px-3.5 py-2 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium whitespace-nowrap shrink-0 hover:bg-[#795B48] transition-colors"
              >
                All Creations ({products.length})
              </Link>
              {PRODUCT_CATEGORIES.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                return (
                  <Link
                    key={cat}
                    to={`/menu?category=${encodeURIComponent(cat)}`}
                    className="px-3.5 py-2 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5]/70 text-xs font-medium text-[#49372F] hover:border-[#C6A477] hover:bg-[#FFFFFF] whitespace-nowrap shrink-0 transition-colors"
                  >
                    {cat} ({count})
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Brand Introduction & Craftsmanship */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-3">
              The Maison Éclat Philosophy
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F] leading-tight mb-5">
              A Little Indulgence. A Lot of Love.
            </h2>
            <p className="text-base text-[#795B48] leading-relaxed mb-4">
              Born from a reverence for classic European baking and warm Indian hospitality,
              Maison Éclat brings together mirror-glazed layered cakes, 72-hour flaky croissants,
              and freshly roasted single-origin coffee under one sunlit roof in Sector 62, Noida.
            </p>
            <p className="text-base text-[#795B48] leading-relaxed mb-7">
              Whether you are ordering a tiered wedding centerpiece or pausing for an afternoon
              tiramisu and cappuccino, every creation is crafted to make ordinary days feel
              special.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/experience"
                className="h-11 px-5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#795B48] transition-colors"
              >
                Discover Our Story
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/cafe"
                className="h-11 px-5 rounded-lg border border-[#D9C2A5] text-[#49372F] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#FFFFFF] transition-colors"
              >
                <Calendar className="w-4 h-4 text-[#C6A477]" />
                Book a Cafe Table
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl overflow-hidden bg-[#FFFFFF] border border-[#D9C2A5]/60 aspect-[3/4] lg:aspect-auto lg:h-full">
              <SafeImage
                src={IMAGES.ingredientsCraft}
                alt="Belgian dark chocolate, Madagascar vanilla, strawberries, and pistachios"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="rounded-2xl overflow-hidden bg-[#FFFFFF] border border-[#D9C2A5]/60 aspect-[3/4] lg:aspect-auto lg:h-full">
              <SafeImage
                src={IMAGES.croissantsDanish}
                alt="Flaky golden butter croissants and fruit Danish pastry"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. The Bakery Window Showcase */}
      <section className="bg-[#49372F] text-[#F8F3EB] py-16 lg:py-20 border-y border-[#C6A477]/30 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#C6A477] mb-2">
                Bakery Window Showcase · Daily Counter Display
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#FFFFFF]">
                Through the Bakery Window
              </h2>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[#D9C2A5] tabular-nums mr-1">
                {String(windowIdx + 1).padStart(2, '0')} / {String(WINDOW_SLIDES.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() =>
                  setWindowIdx((i) => (i - 1 + WINDOW_SLIDES.length) % WINDOW_SLIDES.length)
                }
                aria-label="Previous window slide"
                className="w-10 h-10 rounded-full border border-[#C6A477]/50 text-[#F8F3EB] flex items-center justify-center hover:bg-[#C6A477] hover:text-[#49372F] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setWindowIdx((i) => (i + 1) % WINDOW_SLIDES.length)}
                aria-label="Next window slide"
                className="w-10 h-10 rounded-full border border-[#C6A477]/50 text-[#F8F3EB] flex items-center justify-center hover:bg-[#C6A477] hover:text-[#49372F] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-[#3A2B24] border border-[#C6A477]/35 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch shadow-2xl">
            <div className="lg:col-span-7 relative min-h-[320px] sm:min-h-[420px] overflow-hidden bg-[#2E211C] p-3 sm:p-4">
              <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-[#C6A477]/45">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeWindow.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.45 }}
                    className="w-full h-full min-h-[300px] sm:min-h-[390px]"
                  >
                    <SafeImage
                      src={activeWindow.image}
                      alt={activeWindow.alt}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#49372F]/35 via-transparent to-[#FFFFFF]/10" />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-[#49372F]/85 backdrop-blur-sm border border-[#C6A477]/40">
                  <p className="text-[11px] uppercase tracking-wider text-[#D9C2A5]">
                    {activeWindow.timeTag}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-9 flex flex-col justify-between">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeWindow.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-[#C6A477] mb-2">
                    {activeWindow.highlight}
                  </p>
                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FFFFFF] leading-snug mb-3">
                    {activeWindow.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#D9C2A5] leading-relaxed mb-6">
                    {activeWindow.subtitle}
                  </p>
                  <Link
                    to={activeWindow.ctaPath}
                    className="h-11 px-5 rounded-lg bg-[#C6A477] text-[#49372F] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#D9C2A5] transition-colors"
                  >
                    {activeWindow.ctaLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 pt-6 border-t border-[#C6A477]/25">
                <p className="text-[11px] uppercase tracking-wider text-[#D9C2A5]/80 mb-3">
                  Select Window View
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  {WINDOW_SLIDES.map((win, idx) => (
                    <button
                      key={win.id}
                      type="button"
                      onClick={() => setWindowIdx(idx)}
                      aria-label={`Select window slide ${win.title}`}
                      className={`group relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                        idx === windowIdx
                          ? 'border-[#C6A477] scale-[1.03]'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <SafeImage
                        src={win.image}
                        alt={win.title}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Bestselling Signature Cakes (Interactive Carousel) */}
      <section className="bg-[#FFFFFF] border-b border-[#D9C2A5]/50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
                From the Pastry Counter
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F]">
                Bestselling Signature Cakes
              </h2>
            </div>
            <div className="flex items-center gap-4">
              {cakeTotalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCakePage((p) => (p - 1 + cakeTotalPages) % cakeTotalPages)
                    }
                    aria-label="Previous signature cakes"
                    className="w-9 h-9 rounded-full border border-[#D9C2A5] text-[#49372F] flex items-center justify-center hover:bg-[#F8F3EB]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[#795B48] tabular-nums">
                    {safeCakePage + 1} / {cakeTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCakePage((p) => (p + 1) % cakeTotalPages)}
                    aria-label="Next signature cakes"
                    className="w-9 h-9 rounded-full border border-[#D9C2A5] text-[#49372F] flex items-center justify-center hover:bg-[#F8F3EB]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <Link
                to="/menu?category=Signature%20Cakes"
                className="text-sm font-medium text-[#49372F] hover:text-[#795B48] inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                View All 8 Signature Cakes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {visibleCakes.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Specialty Coffee & Artisanal Espresso Bar + Signature Desserts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* Specialty Coffee Feature Row (Replaces Seasonal block with curated main coffees) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-16">
          <div className="lg:col-span-5 bg-[#49372F] text-[#F8F3EB] rounded-2xl p-8 sm:p-10 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#C6A477] mb-3">
                Espresso Bar &amp; Roastery
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#FFFFFF] leading-tight mb-4">
                Specialty Coffee &amp; Signature Pours
              </h2>
              <p className="text-sm sm:text-base text-[#D9C2A5] leading-relaxed mb-6">
                Freshly brewed 100% single-origin Arabica espresso balanced with silky steamed
                milk foam, rich dark chocolate, and house salted caramel.
              </p>
              <p className="text-xs text-[#D9B9AC] leading-relaxed">
                Featured Pours: Cappuccino · Cafe Latte · Caramel Macchiato · Espresso · Mocha · Iced Latte
              </p>
            </div>
            <div className="pt-8 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/menu?category=Specialty%20Coffee')}
                className="h-11 px-6 rounded-lg bg-[#C6A477] text-[#49372F] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#D9C2A5] transition-colors"
              >
                Explore Coffee Menu
                <ArrowRight className="w-4 h-4" />
              </button>
              {coffeeTotalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCoffeePage((p) => (p - 1 + coffeeTotalPages) % coffeeTotalPages)
                    }
                    aria-label="Previous coffees"
                    className="w-9 h-9 rounded-full border border-[#C6A477]/50 text-[#F8F3EB] flex items-center justify-center hover:bg-[#C6A477] hover:text-[#49372F] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[#D9C2A5] tabular-nums">
                    {safeCoffeePage + 1} / {coffeeTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCoffeePage((p) => (p + 1) % coffeeTotalPages)}
                    aria-label="Next coffees"
                    className="w-9 h-9 rounded-full border border-[#C6A477]/50 text-[#F8F3EB] flex items-center justify-center hover:bg-[#C6A477] hover:text-[#49372F] transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {visibleCoffees.map((item) => (
              <div
                key={item.id}
                className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <button
                    type="button"
                    onClick={() => setQuickViewProduct(item)}
                    className="block w-full aspect-[4/3] bg-[#F8F3EB] overflow-hidden"
                  >
                    <SafeImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </button>
                  <div className="p-4">
                    <p className="text-[11px] uppercase tracking-wider text-[#795B48] mb-1">
                      {item.category}
                    </p>
                    <h3 className="font-serif text-lg font-semibold text-[#49372F] mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#795B48] line-clamp-2">{item.description}</p>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#49372F] tabular-nums">
                    {formatINR(item.price)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      addToCart({
                        productId: item.id,
                        name: item.name,
                        category: item.category,
                        price: item.price,
                        image: item.image,
                        quantity: 1,
                        variant: item.variants?.[0],
                        eggless: item.egglessOption,
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium hover:bg-[#795B48]"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Desserts Row (Interactive Slider with unique pastry photography) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
              Individual Indulgences
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#49372F]">
              Signature Desserts &amp; Petite Treats
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {dessertTotalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDessertPage((p) => (p - 1 + dessertTotalPages) % dessertTotalPages)
                  }
                  aria-label="Previous signature desserts"
                  className="w-9 h-9 rounded-full border border-[#D9C2A5] text-[#49372F] flex items-center justify-center hover:bg-[#FFFFFF]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-[#795B48] tabular-nums">
                  {safeDessertPage + 1} / {dessertTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setDessertPage((p) => (p + 1) % dessertTotalPages)}
                  aria-label="Next signature desserts"
                  className="w-9 h-9 rounded-full border border-[#D9C2A5] text-[#49372F] flex items-center justify-center hover:bg-[#FFFFFF]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            <Link
              to="/menu?category=Pastries%20%26%20Desserts"
              className="text-sm font-medium text-[#49372F] hover:text-[#795B48] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              Explore Pastries &amp; Macarons
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {visibleDesserts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 7. Artisan Bakery, Gourmet Milkshakes & Café Ambience */}
      <section className="bg-[#FFFFFF] border-y border-[#D9C2A5]/50 py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 rounded-2xl overflow-hidden bg-[#F8F3EB] min-h-[340px]">
              <SafeImage
                src={IMAGES.cafeExterior}
                alt="Maison Éclat limestone bakery and cafe boutique in Sector 62, Noida"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-6 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
                  Bakery &amp; Cold Bar
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F] mb-3">
                  Artisan Bakery &amp; Gourmet Milkshakes
                </h2>
                <p className="text-sm sm:text-base text-[#795B48] leading-relaxed mb-6">
                  Pair warm flaky Chocolate Croissants and naturally fermented country sourdough with
                  thick Belgian Chocolate Milkshakes and sea-salt Caramel Frappes in our sunlit
                  Sector 62 cafe.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {cafeHighlights.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F3EB] border border-[#D9C2A5]/50"
                    >
                      <button
                        type="button"
                        onClick={() => setQuickViewProduct(item)}
                        className="w-14 h-14 rounded-lg overflow-hidden shrink-0"
                      >
                        <SafeImage
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-base font-semibold text-[#49372F] truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-[#795B48] tabular-nums">{formatINR(item.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          addToCart({
                            productId: item.id,
                            name: item.name,
                            category: item.category,
                            price: item.price,
                            image: item.image,
                            quantity: 1,
                            variant: item.variants?.[0],
                            eggless: item.egglessOption,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium hover:bg-[#795B48] shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  to="/menu?category=Milkshakes%20%26%20Cold%20Beverages"
                  className="h-11 px-5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#795B48] transition-colors"
                >
                  <Coffee className="w-4 h-4 text-[#C6A477]" />
                  Explore Shakes &amp; Bakery
                </Link>
                <Link
                  to="/cafe"
                  className="h-11 px-5 rounded-lg border border-[#D9C2A5] text-[#49372F] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#F8F3EB] transition-colors"
                >
                  Reserve a Cafe Table
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Custom Celebration Cakes Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-3">
              Custom Cake Studio
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F] mb-4">
              Your Celebration. Our Creation.
            </h2>
            <p className="text-base text-[#795B48] leading-relaxed mb-6">
              From intimate birthday gatherings and milestone anniversaries to multi-tier floral
              wedding centerpieces—collaborate with our pastry chefs on custom flavours, eggless
              sponges, silhouettes, and bespoke sugar artistry.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/orders"
                className="h-11 px-6 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#795B48] transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#C6A477]" />
                Customize Your Cake
              </Link>
              <Link
                to="/cafe#contact"
                className="h-11 px-6 rounded-lg border border-[#D9C2A5] text-[#49372F] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#F8F3EB] transition-colors"
              >
                Plan Your Celebration
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6 min-h-[300px]">
            <SafeImage
              src={IMAGES.customCake}
              alt="Bespoke two-tier ivory wedding and celebration cake with dusty rose florals"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 9. Testimonials Carousel (Marked as Fictional Demo Content) */}
      <section className="bg-[#FFFFFF] border-y border-[#D9C2A5]/50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
            Guest Impressions · Sample Demonstration Reviews
          </p>
          <h2 className="font-serif text-3xl font-semibold text-[#49372F] mb-8">
            Moments Shared Around Our Table
          </h2>

          {activeTestimonial && (
            <div className="bg-[#F8F3EB] rounded-2xl p-8 sm:p-10 border border-[#D9C2A5]/60">
              <p className="font-serif italic text-xl sm:text-2xl text-[#49372F] leading-relaxed mb-6">
                “{activeTestimonial.quote}”
              </p>
              <p className="text-sm font-semibold text-[#49372F]">{activeTestimonial.name}</p>
              <p className="text-xs text-[#795B48] mt-1">
                {activeTestimonial.role} · {activeTestimonial.occasion} ·{' '}
                {activeTestimonial.isDemoLabel}
              </p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                setTestimonialIdx(
                  (i) => (i - 1 + cms.testimonials.length) % cms.testimonials.length
                )
              }
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-full border border-[#D9C2A5] text-[#49372F] flex items-center justify-center hover:bg-[#F8F3EB]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-[#795B48] tabular-nums">
              {testimonialIdx + 1} / {cms.testimonials.length}
            </span>
            <button
              type="button"
              onClick={() => setTestimonialIdx((i) => (i + 1) % cms.testimonials.length)}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-full border border-[#D9C2A5] text-[#49372F] flex items-center justify-center hover:bg-[#F8F3EB]"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 10. Instagram-Inspired Gallery & Newsletter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
              Visual Journal · @maisoneclat.bakery
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#49372F]">
              Fresh From Our Bakery
            </h2>
          </div>
          <Link
            to="/experience"
            className="text-sm font-medium text-[#49372F] hover:text-[#795B48] inline-flex items-center gap-1.5"
          >
            <Instagram className="w-4 h-4 text-[#C6A477]" />
            Open Full Gallery
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-14">
          {galleryTiles.map((tile, i) => (
            <Link
              key={i}
              to="/experience"
              className="group relative aspect-square rounded-xl overflow-hidden bg-[#FFFFFF] border border-[#D9C2A5]/50"
            >
              <SafeImage
                src={tile.src}
                alt={tile.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#49372F]/0 group-hover:bg-[#49372F]/45 transition-colors flex items-end p-3">
                <span className="text-[11px] font-medium text-[#FFFFFF] opacity-0 group-hover:opacity-100 transition-opacity">
                  {tile.label}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter Banner */}
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#49372F] mb-2">
              Join the Maison Éclat Tasting Circle
            </h3>
            <p className="text-sm text-[#795B48]">
              Receive seasonal pastry menus, festive hamper previews, and invitation-only cafe
              tasting evenings.
            </p>
          </div>
          <form onSubmit={handleNewsletter} className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              className="h-11 px-4 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm text-[#49372F] sm:w-72 focus:outline-none focus:border-[#C6A477]"
            />
            <button
              type="submit"
              disabled={joining}
              className="h-11 px-6 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium hover:bg-[#795B48] transition-colors whitespace-nowrap"
            >
              {joining ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
