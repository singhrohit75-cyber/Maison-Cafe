import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { PRODUCT_CATEGORIES } from '../data/seedData';
import { useBakery } from '../context/BakeryContext';
import { MaisonLogo } from './BrandPrimitives';

export function Navbar() {
  const {
    cartCount,
    setCartDrawerOpen,
    setSearchOpen,
    user,
    cms,
  } = useBakery();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [promoDismissed, setPromoDismissed] = useState(false);
  const navigate = useNavigate();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b ${
      isActive
        ? 'text-[#49372F] border-[#C6A477]'
        : 'text-[#795B48] border-transparent hover:text-[#49372F] hover:border-[#D9C2A5]'
    }`;

  return (
    <div className="sticky top-0 z-40">
      {cms.promoBannerActive && !promoDismissed && (
        <div className="hidden md:flex items-center justify-center relative bg-[#49372F] text-[#F8F3EB] text-xs py-2 px-10 tracking-wide">
          <p className="truncate">{cms.promoBannerText}</p>
          <button
            type="button"
            onClick={() => setPromoDismissed(true)}
            aria-label="Dismiss announcement"
            className="absolute right-4 text-[#D9C2A5] hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className="bg-[#F8F3EB]/95 backdrop-blur-md border-b border-[#D9C2A5]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] flex items-center justify-between gap-4 lg:gap-8">
          <Link to="/" className="shrink-0 focus-visible:outline-2 focus-visible:outline-[#C6A477] rounded">
            <MaisonLogo variant="dark" size="md" />
          </Link>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Primary Navigation">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/experience" className={navLinkClass}>
              Our Experience
            </NavLink>
            <div
              className="relative"
              onMouseEnter={() => setMenuDropdownOpen(true)}
              onMouseLeave={() => setMenuDropdownOpen(false)}
            >
              <div className="inline-flex items-center gap-1">
                <NavLink
                  to="/menu"
                  onClick={() => setMenuDropdownOpen(false)}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b ${
                      isActive
                        ? 'text-[#49372F] border-[#C6A477]'
                        : 'text-[#795B48] border-transparent hover:text-[#49372F] hover:border-[#D9C2A5]'
                    }`
                  }
                >
                  Our Signature Menu
                </NavLink>
                <button
                  type="button"
                  onClick={() => setMenuDropdownOpen((v) => !v)}
                  aria-label="Toggle Our Signature Menu categories"
                  className="p-1 text-[#795B48] hover:text-[#49372F] transition-colors"
                >
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      menuDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>
              <AnimatePresence>
                {menuDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-0 top-full pt-2 w-72 z-50"
                  >
                    <div className="bg-[#FFFFFF] rounded-xl shadow-xl border border-[#D9C2A5]/70 py-2">
                      <Link
                        to="/menu"
                        onClick={() => setMenuDropdownOpen(false)}
                        className="block px-4 py-2.5 text-xs font-semibold text-[#49372F] hover:bg-[#F8F3EB] transition-colors"
                      >
                        View All &amp; Search Full Menu
                      </Link>
                      <div className="my-1 border-t border-[#D9C2A5]/40" />
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <Link
                          key={cat}
                          to={`/menu?category=${encodeURIComponent(cat)}`}
                          onClick={() => setMenuDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-[#795B48] hover:text-[#49372F] hover:bg-[#F8F3EB] transition-colors"
                        >
                          {cat}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <NavLink to="/orders" className={navLinkClass}>
              Custom Cakes &amp; Orders
            </NavLink>
            <NavLink to="/cafe" className={navLinkClass}>
              Cafe &amp; Contact
            </NavLink>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search menu"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[#49372F] hover:bg-[#D9C2A5]/30 transition-colors"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>

            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              aria-label={`Shopping bag with ${cartCount} items`}
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-[#49372F] hover:bg-[#D9C2A5]/30 transition-colors"
            >
              <ShoppingBag className="w-[18px] h-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C6A477] text-[#FFFFFF] text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>

            <Link
              to={user?.role === 'admin' ? '/admin' : '/account'}
              aria-label={user ? 'Customer account' : 'Sign In'}
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3.5 rounded-lg border border-[#D9C2A5] bg-[#FFFFFF]/70 text-xs sm:text-sm font-medium text-[#49372F] hover:bg-[#FFFFFF] hover:border-[#C6A477] transition-colors whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#795B48]" />
              <span>{user ? user.name.split(' ')[0] : 'Sign In'}</span>
            </Link>

            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="hidden sm:inline-flex items-center justify-center h-10 px-4 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium tracking-wide hover:bg-[#795B48] transition-colors whitespace-nowrap shrink-0"
            >
              Order Now
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-[#49372F] hover:bg-[#D9C2A5]/30 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-[#FFFFFF] border-t border-[#D9C2A5]/60 overflow-hidden"
            >
              <div className="px-5 py-5 space-y-2">
                {[
                  { to: '/', label: 'Home' },
                  { to: '/experience', label: 'Our Experience' },
                  { to: '/menu', label: 'Our Signature Menu' },
                  { to: '/orders', label: 'Custom Cakes & Orders' },
                  { to: '/cafe', label: 'Cafe & Contact' },
                  { to: user?.role === 'admin' ? '/admin' : '/account', label: user ? `Account (${user.name.split(' ')[0]})` : 'Customer Login' },
                ].map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-[#F8F3EB] text-[#49372F]' : 'text-[#795B48] hover:bg-[#F8F3EB]'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      navigate('/menu');
                    }}
                    className="w-full h-11 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium"
                  >
                    Order Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </div>
  );
}
