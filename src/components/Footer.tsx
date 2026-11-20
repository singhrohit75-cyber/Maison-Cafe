import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Instagram, Mail, MapPin, Phone, ShieldCheck, X } from 'lucide-react';
import { IMAGES, PRODUCT_CATEGORIES } from '../data/seedData';
import { useBakery } from '../context/BakeryContext';
import { MaisonLogo, SafeImage } from './BrandPrimitives';

export function Footer() {
  const { cms, notify } = useBakery();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Subscription failed');
      notify('Subscribed to Tasting Journal', data.message);
      setEmail('');
    } catch (err) {
      notify('Unable to subscribe', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const galleryThumbs = [
    { src: IMAGES.espressoShot, alt: 'Double Shot Arabica Espresso' },
    { src: IMAGES.cafeLatte, alt: 'Silk Textured Cafe Latte' },
    { src: IMAGES.garlicBread, alt: 'Roasted Garlic Herb Bread' },
    { src: IMAGES.strawberryShake, alt: 'Strawberry Cream Milkshake' },
    { src: IMAGES.vanillaShake, alt: 'Madagascar Vanilla Milkshake' },
    { src: IMAGES.coldCoffee, alt: 'House Shaken Cold Coffee' },
  ];

  return (
    <footer className="bg-[#49372F] text-[#F8F3EB] border-t border-[#C6A477]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#C6A477]/20">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <MaisonLogo variant="light" size="lg" />
            <p className="font-serif italic text-lg text-[#D9C2A5]">
              “A Little Indulgence. A Lot of Love.”
            </p>
            <p className="text-sm text-[#D9C2A5]/90 leading-relaxed max-w-sm">
              A fine pastry shop, celebration cake studio, and European-style cafe in Sector 62,
              Noida. Handcrafted daily with rich chocolate, cultured butter, and whole-bean
              Arabica espresso.
            </p>
            <div className="pt-2 space-y-2 text-xs text-[#D9C2A5]">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#C6A477] shrink-0 mt-0.5" />
                <span>{cms.address}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C6A477] shrink-0" />
                <span>{cms.openingHours}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#C6A477] shrink-0" />
                <span>{cms.phoneDemo}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C6A477] shrink-0" />
                <span>{cms.emailDemo}</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-serif text-lg font-medium text-[#FFFFFF]">Explore</h3>
            <ul className="space-y-2.5 text-sm text-[#D9C2A5]">
              <li>
                <Link to="/" className="hover:text-[#C6A477] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/experience" className="hover:text-[#C6A477] transition-colors">
                  Our Experience
                </Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-[#C6A477] transition-colors">
                  Menu &amp; Collection
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#C6A477] transition-colors">
                  Custom Cake Studio
                </Link>
              </li>
              <li>
                <Link to="/cafe" className="hover:text-[#C6A477] transition-colors">
                  Table Reservations
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-[#C6A477] transition-colors">
                  Customer Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Menu Categories */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-serif text-lg font-medium text-[#FFFFFF]">Bakery Menu</h3>
            <ul className="space-y-2.5 text-sm text-[#D9C2A5]">
              {PRODUCT_CATEGORIES.map((cat) => (
                <li key={cat}>
                  <Link
                    to={`/menu?category=${encodeURIComponent(cat)}`}
                    className="hover:text-[#C6A477] transition-colors"
                  >
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Visual Gallery */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#FFFFFF]">Tasting Journal</h3>
            <p className="text-xs text-[#D9C2A5]/90 leading-relaxed">
              Receive seasonal menu previews, festive hamper releases, and bakery notes.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-[#FFFFFF]/10 border border-[#C6A477]/40 text-sm text-[#F8F3EB] placeholder:text-[#D9C2A5]/60 focus:outline-none focus:border-[#C6A477]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-10 px-4 rounded-lg bg-[#C6A477] text-[#49372F] text-xs font-semibold hover:bg-[#D9C2A5] transition-colors whitespace-nowrap shrink-0"
              >
                {submitting ? 'Joining...' : 'Join'}
              </button>
            </form>

            <div className="pt-2">
              <div className="flex items-center justify-between text-xs text-[#D9C2A5] mb-2">
                <span className="inline-flex items-center gap-1.5">
                  <Instagram className="w-3.5 h-3.5 text-[#C6A477]" />
                  @maisoneclat.bakery (Demo)
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {galleryThumbs.map((img, i) => (
                  <Link
                    key={i}
                    to="/experience"
                    className="aspect-square rounded-lg overflow-hidden border border-[#C6A477]/25 hover:opacity-85 transition-opacity"
                  >
                    <SafeImage src={img.src} alt={img.alt} className="w-full h-full object-cover" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#D9C2A5]/85">
          <p>
            © {new Date().getFullYear()} Maison Éclat. Fictional luxury demonstration brand &amp; showcase.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <button
              type="button"
              onClick={() => setLegalModal('privacy')}
              className="hover:text-[#C6A477] transition-colors"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setLegalModal('terms')}
              className="hover:text-[#C6A477] transition-colors"
            >
              Terms &amp; Conditions
            </button>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-[#C6A477] hover:text-[#F8F3EB] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Bakery Admin
            </Link>
          </div>
        </div>
      </div>

      {legalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="max-w-lg w-full bg-[#F8F3EB] text-[#49372F] rounded-2xl p-6 sm:p-8 shadow-2xl border border-[#D9C2A5]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-2xl font-semibold">
                {legalModal === 'privacy' ? 'Privacy Policy (Demo)' : 'Terms & Conditions (Demo)'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-9 h-9 rounded-full bg-[#FFFFFF] flex items-center justify-center text-[#49372F]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-[#795B48] leading-relaxed mb-3">
              {legalModal === 'privacy'
                ? 'Maison Éclat is a luxury bakery and cafe demonstration platform. Any orders, custom cake requests, table reservations, or account registrations submitted here are stored strictly for demonstration purposes without processing real financial transactions.'
                : 'All menu pricing in Indian Rupees (INR), delivery slots, and custom cake quotations displayed on Maison Éclat are illustrative demonstration figures. Final bespoke wedding and event cake quotations are confirmed directly by our bakery team.'}
            </p>
            <button
              type="button"
              onClick={() => setLegalModal(null)}
              className="mt-2 px-5 py-2.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
