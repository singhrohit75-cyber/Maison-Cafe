import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { IMAGES } from '../data/seedData';
import { SafeImage } from '../components/BrandPrimitives';

interface GalleryItem {
  id: string;
  title: string;
  category: 'Cafe Interior' | 'Signature Cakes' | 'Artisan Baking' | 'Coffee & Beverages';
  image: string;
  caption: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Morning Bakery Window',
    category: 'Cafe Interior',
    image: IMAGES.windowMorning,
    caption: 'Sunlit street-side display stocked each morning with pastries, fruit tarts, and warm bakes.',
  },
  {
    id: 'g2',
    title: 'Sunlit Lounge Seating',
    category: 'Cafe Interior',
    image: IMAGES.heroCafe,
    caption: 'Dusty rose velvet bench seating, natural marble tables, and walnut espresso bar.',
  },
  {
    id: 'g3',
    title: 'Limestone Boutique Front',
    category: 'Cafe Interior',
    image: IMAGES.cafeExterior,
    caption: 'Warm brass lanterns welcoming evening guests for dessert and espresso.',
  },
  {
    id: 'g4',
    title: 'Chocolate Croissants & Flaky Pastries',
    category: 'Artisan Baking',
    image: IMAGES.painAuChocolat,
    caption: 'Flaky 72-hour layered butter pastry wrapped around rich dark chocolate bars.',
  },
  {
    id: 'g5',
    title: 'Glazed Fruit Cream Danish',
    category: 'Artisan Baking',
    image: IMAGES.fruitDanish,
    caption: 'Crisp layered crowns filled with Madagascar vanilla custard and glazed berries.',
  },
  {
    id: 'g6',
    title: 'Dark Chocolate Truffle Cake',
    category: 'Signature Cakes',
    image: IMAGES.chocTruffleWhole,
    caption: 'Glossy tempered chocolate glaze over moist cocoa sponge.',
  },
  {
    id: 'g7',
    title: 'Salted Caramel Macchiato',
    category: 'Coffee & Beverages',
    image: IMAGES.caramelMacchiato,
    caption: 'Layered Arabica espresso, textured milk, and slow-cooked salted caramel.',
  },
  {
    id: 'g8',
    title: 'Celebration Dessert Table',
    category: 'Signature Cakes',
    image: IMAGES.heroCelebration,
    caption: 'Multi-tiered ivory cakes and small sweets styled for milestone gatherings.',
  },
  {
    id: 'g9',
    title: 'Iced Latte & Caramel Frappe',
    category: 'Coffee & Beverages',
    image: IMAGES.icedFrappe,
    caption: 'Chilled espresso pours and whipped caramel frappes for sunlit afternoons.',
  },
];

const INGREDIENTS = [
  {
    name: 'Belgian-Style Fine Chocolate',
    detail: 'Deep 54% dark and silky milk chocolate melted for mirror glazes, truffles, and ganache.',
  },
  {
    name: 'Fresh Strawberries & Wild Blueberries',
    detail: 'Folded into slow-simmered fruit preserves and arranged fresh atop whipped cream sponge.',
  },
  {
    name: 'Madagascar Vanilla Bean',
    detail: 'Whole aromatic pods steeped into baked New York cheesecake and smooth buttercream.',
  },
  {
    name: 'Dutch-Processed Cocoa',
    detail: 'Rich, velvety cocoa powder giving our Red Velvet and Fudge Brownies their signature depth.',
  },
  {
    name: 'Fresh Dairy Cream & Cultured Butter',
    detail: 'Whipped lightly for cream layers and folded into 27 delicate butter croissant layers.',
  },
  {
    name: 'California Almonds & Roasted Pistachios',
    detail: 'Finely ground for crisp almond macaron shells and toasted praline accents.',
  },
  {
    name: 'Freshly Brewed Arabica Coffee',
    detail: 'Dialed in each morning for espresso extractions, tiramisu soaking syrup, and iced lattes.',
  },
];

export function ExperiencePage() {
  const [filter, setFilter] = useState<string>('All');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const categories = ['All', 'Cafe Interior', 'Signature Cakes', 'Artisan Baking', 'Coffee & Beverages'];
  const filteredGallery =
    filter === 'All' ? GALLERY_ITEMS : GALLERY_ITEMS.filter((g) => g.category === filter);

  const activeLightbox = lightboxIdx !== null ? filteredGallery[lightboxIdx] : null;

  return (
    <div className="pb-20">
      {/* Editorial Hero */}
      <section className="bg-[#FFFFFF] border-b border-[#D9C2A5]/60 py-14 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-3">
              Our Bakery &amp; Cafe Experience
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#49372F] leading-tight mb-5">
              Where European-Style Baking Meets Warm Hospitality
            </h1>
            <p className="text-base text-[#795B48] leading-relaxed mb-6">
              Maison Éclat was envisioned as an unhurried sanctuary—a place where the aroma of
              flaky butter croissants meets freshly brewed espresso, and every cake is crafted
              like a piece of edible art.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/menu"
                className="h-11 px-5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#795B48]"
              >
                Explore the Menu
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/cafe"
                className="h-11 px-5 rounded-lg border border-[#D9C2A5] text-[#49372F] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#F8F3EB]"
              >
                Reserve a Table
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6 rounded-2xl overflow-hidden aspect-[4/3] bg-[#F8F3EB]">
            <SafeImage
              src={IMAGES.heroDisplay}
              alt="Maison Éclat bakery display counter"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Section A: Our Story */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 rounded-2xl overflow-hidden aspect-[4/3]">
            <SafeImage
              src={IMAGES.cafeExterior}
              alt="Maison Éclat bakery exterior"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-7 space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48]">01 · Our Story</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F]">
              Crafted Slowly in Small Morning Batches
            </h2>
            <p className="text-base text-[#795B48] leading-relaxed">
              Founded as a boutique pastry studio in Sector 62, Noida, Maison Éclat celebrates
              patient craftsmanship. Before sunrise, our bakers fold and layer cultured-butter pastry dough,
              temper dark chocolate, and glaze fresh fruit tarts for the day&apos;s glass display.
            </p>
            <p className="text-base text-[#795B48] leading-relaxed">
              We believe indulgence should feel honest and memorable—balanced sweetness, crisp
              textures, and gracious table service whether you visit for morning coffee or commission
              a custom celebration centerpiece.
            </p>
          </div>
        </div>
      </section>

      {/* Section B: The Art of Baking */}
      <section className="bg-[#FFFFFF] border-y border-[#D9C2A5]/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
              02 · The Art of Baking
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F]">
              Six Disciplines Under One Roof
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {[
              {
                title: 'Artisan Breads & Sourdough',
                desc: 'Long-fermented country loaves and roasted herb garlic breads baked on stone decks.',
                image: IMAGES.sourdoughGarlic,
              },
              {
                title: 'Flaky Croissants & Danish',
                desc: 'Delicate honeycomb layers folded with chilled butter for crisp, light flakes.',
                image: IMAGES.croissantsDanish,
              },
              {
                title: 'Handcrafted Pastries & Tiramisu',
                desc: 'Individual slices of espresso-soaked tiramisu, brownies, and almond macarons.',
                image: IMAGES.tiramisuBrownie,
              },
              {
                title: 'Signature Layered Cakes',
                desc: 'Velvety sponges paired with chocolate ganache, cream cheese frosting, and seasonal berries.',
                image: IMAGES.redVelvet,
              },
              {
                title: 'Tempered Fine Chocolate',
                desc: 'Glossy dark mirror glazes, hand-rolled truffles, and delicate chocolate curls.',
                image: IMAGES.belgianChocolate,
              },
              {
                title: 'Fresh Plated Desserts',
                desc: 'Baked cheesecakes, macarons, and warm brownies plated to order in our dining lounge.',
                image: IMAGES.macarons,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-[#F8F3EB] rounded-2xl overflow-hidden border border-[#D9C2A5]/60"
              >
                <div className="aspect-[4/3]">
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl font-semibold text-[#49372F] mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#795B48] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section C: Our Cafe Experience */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48]">
              03 · Our Cafe Experience
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F]">
              Designed for Conversation, Coffee &amp; Quiet Moments
            </h2>
            <p className="text-base text-[#795B48] leading-relaxed">
              Step into warm cream limestone, brushed brass lighting, and plush dusty-rose velvet
              seating. Our lounge pairs a sunlit pastry display with an open walnut coffee
              bar.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-[#49372F]">
              <li className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#D9C2A5]/60">
                Sunlit Window Lounge &amp; marble bistro tables
              </li>
              <li className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#D9C2A5]/60">
                Curated coffee &amp; warm pastry pairings
              </li>
              <li className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#D9C2A5]/60">
                Dedicated espresso &amp; milkshake bar
              </li>
              <li className="p-3.5 rounded-xl bg-[#FFFFFF] border border-[#D9C2A5]/60">
                Intimate celebration &amp; tasting seating
              </li>
            </ul>
          </div>
          <div className="lg:col-span-6 rounded-2xl overflow-hidden min-h-[340px]">
            <SafeImage
              src={IMAGES.heroCafe}
              alt="Maison Éclat cafe lounge and coffee bar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Section D: Our Ingredients */}
      <section className="bg-[#FFFFFF] border-y border-[#D9C2A5]/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 rounded-2xl overflow-hidden aspect-[4/3]">
            <SafeImage
              src={IMAGES.ingredientsCraft}
              alt="Bakery ingredients display"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
              04 · Our Ingredients
            </p>
            <h2 className="font-serif text-3xl font-semibold text-[#49372F] mb-6">
              Honest Pantry Essentials Behind Every Recipe
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INGREDIENTS.map((ing) => (
                <div key={ing.name} className="p-4 rounded-xl bg-[#F8F3EB] border border-[#D9C2A5]/50">
                  <h3 className="font-serif text-lg font-semibold text-[#49372F] mb-1">
                    {ing.name}
                  </h3>
                  <p className="text-xs text-[#795B48] leading-relaxed">{ing.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section E: Interactive Photo Gallery */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
              05 · Photo Gallery
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F]">
              Inside Maison Éclat
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setFilter(cat);
                  setLightboxIdx(null);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  filter === cat
                    ? 'bg-[#49372F] text-[#F8F3EB]'
                    : 'bg-[#FFFFFF] text-[#795B48] border border-[#D9C2A5] hover:text-[#49372F]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGallery.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIdx(idx)}
              className="group text-left bg-[#FFFFFF] rounded-2xl overflow-hidden border border-[#D9C2A5]/60 hover:shadow-lg transition-all"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#F8F3EB]">
                <SafeImage
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[#FFFFFF]/90 text-[#49372F] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Expand className="w-4 h-4" />
                </span>
              </div>
              <div className="p-4">
                <p className="text-[11px] uppercase tracking-wider text-[#795B48] mb-1">
                  {item.category}
                </p>
                <h3 className="font-serif text-lg font-semibold text-[#49372F]">{item.title}</h3>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      {activeLightbox && lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 bg-[#49372F]/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#FFFFFF] rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxIdx(null)}
              aria-label="Close image preview"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[#FFFFFF]/90 text-[#49372F] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-[16/10] bg-[#F8F3EB]">
              <SafeImage
                src={activeLightbox.image}
                alt={activeLightbox.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#795B48]">
                  {activeLightbox.category}
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
                  {activeLightbox.title}
                </h3>
                <p className="text-sm text-[#795B48] mt-1">{activeLightbox.caption}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIdx(
                      (lightboxIdx - 1 + filteredGallery.length) % filteredGallery.length
                    )
                  }
                  aria-label="Previous gallery image"
                  className="w-10 h-10 rounded-lg border border-[#D9C2A5] flex items-center justify-center text-[#49372F]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIdx((lightboxIdx + 1) % filteredGallery.length)}
                  aria-label="Next gallery image"
                  className="w-10 h-10 rounded-lg border border-[#D9C2A5] flex items-center justify-center text-[#49372F]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
