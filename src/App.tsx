import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { BakeryProvider } from './context/BakeryContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer, SearchModal, ToastStack } from './components/Overlays';
import { ProductQuickViewModal } from './components/BrandPrimitives';
import { EclairConcierge } from './components/EclairConcierge';
import { HomePage } from './pages/HomePage';
import { ExperiencePage } from './pages/ExperiencePage';
import { MenuPage } from './pages/MenuPage';
import { OrdersPage } from './pages/OrdersPage';
import { CafeContactPage } from './pages/CafeContactPage';
import { CustomerPortalPage } from './pages/CustomerPortalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}

function AppShell() {
  const { pathname } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F3EB] text-[#49372F]">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/experience" element={<ExperiencePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/cafe" element={<CafeContactPage />} />
          <Route path="/account" element={<CustomerPortalPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}

      <CartDrawer />
      <SearchModal />
      <ProductQuickViewModal />
      {!isAdminRoute && <EclairConcierge />}
      <ToastStack />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BakeryProvider>
        <AppShell />
      </BakeryProvider>
    </BrowserRouter>
  );
}
