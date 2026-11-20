import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calendar,
  Eye,
  EyeOff,
  Heart,
  LogOut,
  MapPin,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Settings,
  ShoppingBag,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react';
import { formatINR, useBakery } from '../context/BakeryContext';
import type { CustomCakeRequest, Order, SavedAddress, TableReservation } from '../types/bakery';
import { SafeImage } from '../components/BrandPrimitives';

export function CustomerPortalPage() {
  const {
    user,
    token,
    authLoading,
    login,
    register,
    logout,
    refreshUser,
    products,
    wishlist,
    toggleWishlist,
    cart,
    cartCount,
    cartSubtotal,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    setCartDrawerOpen,
    notify,
  } = useBakery();
  const navigate = useNavigate();

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [regForm, setRegForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  // Dashboard state
  const [dashTab, setDashTab] = useState<
    'orders' | 'bag' | 'custom' | 'reservations' | 'addresses' | 'wishlist' | 'notifications' | 'settings'
  >('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customCakes, setCustomCakes] = useState<CustomCakeRequest[]>([]);
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [loadingDash, setLoadingDash] = useState(false);

  // Address & profile form
  const [newAddress, setNewAddress] = useState({ label: '', address: '', city: 'Noida', pinCode: '' });
  const [profileForm, setProfileForm] = useState({ name: '', mobile: '' });

  const loadDashboard = useCallback(async () => {
    if (!token || !user || user.role !== 'customer') return;
    setLoadingDash(true);
    try {
      const res = await fetch('/api/customer/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setCustomCakes(data.customCakes || []);
        setReservations(data.reservations || []);
        setProfileForm({
          name: data.profile?.name || user.name,
          mobile: data.profile?.mobile || user.mobile,
        });
      }
    } finally {
      setLoadingDash(false);
    }
  }, [token, user]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);
    try {
      await login(identifier, password, 'customer');
      notify('Welcome back to Maison Éclat');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);
    try {
      await register(regForm.name, regForm.email, regForm.mobile, regForm.password);
      notify('Account Created', 'Welcome to the Maison Éclat tasting portal.');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to register');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail }),
    });
    const data = await res.json();
    setForgotMsg(data.message || data.error);
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => addToCart({ ...item }));
    setCartDrawerOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;
    const addr: SavedAddress = {
      id: `addr-${Date.now()}`,
      ...newAddress,
    };
    const nextAddresses = [...(user.savedAddresses || []), addr];
    const res = await fetch('/api/customer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ savedAddresses: nextAddresses }),
    });
    if (res.ok) {
      setNewAddress({ label: '', address: '', city: 'Noida', pinCode: '' });
      await refreshUser();
      notify('Address Saved');
    }
  };

  const handleRemoveAddress = async (id: string) => {
    if (!token || !user) return;
    const nextAddresses = (user.savedAddresses || []).filter((a) => a.id !== id);
    const res = await fetch('/api/customer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ savedAddresses: nextAddresses }),
    });
    if (res.ok) {
      await refreshUser();
      notify('Address Removed');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch('/api/customer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(profileForm),
    });
    if (res.ok) {
      await refreshUser();
      notify('Profile Updated');
    }
  };

  const markAllNotificationsRead = async () => {
    if (!token || !user) return;
    const next = (user.notifications || []).map((n) => ({ ...n, read: true }));
    await fetch('/api/customer/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notifications: next }),
    });
    await refreshUser();
    notify('Notifications Marked Read');
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-sm text-[#795B48]">
        Loading your Maison Éclat account...
      </div>
    );
  }

  if (user && user.role === 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-serif text-3xl font-semibold text-[#49372F]">
          Signed in as Bakery Administrator
        </h1>
        <p className="text-sm text-[#795B48]">
          You are currently authenticated with administrator credentials.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/admin"
            className="px-5 py-2.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium"
          >
            Open Admin Dashboard
          </Link>
          <button
            type="button"
            onClick={logout}
            className="px-5 py-2.5 rounded-lg border border-[#D9C2A5] text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-14 sm:py-20">
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
              Guest Account Portal
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F]">
              {authMode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h1>
            <p className="text-sm text-[#795B48] mt-1.5">
              Track orders, manage custom cake quotes, and save your favourite creations.
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#F8F3EB] border border-[#D9C2A5]/60 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
              }}
              className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
                authMode === 'login' ? 'bg-[#FFFFFF] text-[#49372F] shadow-2xs' : 'text-[#795B48]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError('');
              }}
              className={`h-9 rounded-lg text-xs font-semibold transition-colors ${
                authMode === 'register'
                  ? 'bg-[#FFFFFF] text-[#49372F] shadow-2xs'
                  : 'text-[#795B48]'
              }`}
            >
              Register
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg bg-[#D9B9AC]/30 border border-[#D9B9AC] text-xs text-[#49372F]">
              {authError}
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Email or Mobile Number
                </label>
                <input
                  required
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ananya.demo@maisoneclat.in or 9810000142"
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full h-11 px-3.5 pr-10 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#795B48]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="inline-flex items-center gap-2 text-[#795B48] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-[#49372F]"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[#795B48] hover:text-[#49372F] underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium hover:bg-[#795B48]"
              >
                {submitting ? 'Signing In...' : 'Sign In'}
              </button>

              <div className="mt-5 p-4 rounded-xl bg-[#F8F3EB] border border-[#D9C2A5]/70 space-y-2">
                <p className="text-xs font-semibold text-[#49372F]">
                  Demo Customer Account (Server-Verified)
                </p>
                <p className="text-xs text-[#795B48] font-mono">
                  ananya.demo@maisoneclat.in · CustomerDemo@2026
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('ananya.demo@maisoneclat.in');
                    setPassword('CustomerDemo@2026');
                  }}
                  className="text-xs font-medium text-[#49372F] underline hover:text-[#795B48]"
                >
                  Fill Demo Customer Credentials
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Mobile Number *
                </label>
                <input
                  required
                  type="tel"
                  value={regForm.mobile}
                  onChange={(e) => setRegForm({ ...regForm, mobile: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Password (min 6 characters) *
                </label>
                <input
                  required
                  minLength={6}
                  type="password"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  className="w-full h-11 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium hover:bg-[#795B48]"
              >
                {submitting ? 'Creating Account...' : 'Create Customer Account'}
              </button>
            </form>
          )}
        </div>

        {forgotOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setForgotOpen(false)}
          >
            <div
              className="max-w-md w-full bg-[#FFFFFF] rounded-2xl p-6 space-y-4 border border-[#D9C2A5]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
                Reset Password (Demo)
              </h3>
              <form onSubmit={handleForgot} className="space-y-3">
                <input
                  required
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
                {forgotMsg && <p className="text-xs text-[#795B48]">{forgotMsg}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotOpen(false)}
                    className="px-4 py-2 rounded-lg border border-[#D9C2A5] text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
                  >
                    Send Recovery Note
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));
  const unreadCount = (user.notifications || []).filter((n) => !n.read).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20">
      {/* Header */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 sm:p-8 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-1">
            Customer Account Dashboard
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#49372F]">
            Welcome, {user.name}
          </h1>
          <p className="text-xs text-[#795B48] mt-1">
            {user.email} · {user.mobile}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadDashboard}
            disabled={loadingDash}
            className="h-10 px-4 rounded-lg border border-[#D9C2A5] text-[#49372F] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#F8F3EB]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingDash ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/menu"
            className="h-10 px-4 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium inline-flex items-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Our Signature Menu
          </Link>
          <button
            type="button"
            onClick={logout}
            className="h-10 px-4 rounded-lg border border-[#D9C2A5] text-[#49372F] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#F8F3EB]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>

      {/* Live Quick-Overview Stat Cards: Bag, Orders, Reservations, Custom Cakes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          type="button"
          onClick={() => setDashTab('bag')}
          className={`p-4 rounded-2xl border text-left transition-colors ${
            dashTab === 'bag'
              ? 'bg-[#49372F] text-[#F8F3EB] border-[#49372F]'
              : 'bg-[#FFFFFF] text-[#49372F] border-[#D9C2A5]/70 hover:border-[#C6A477]'
          }`}
        >
          <p className={`text-[11px] uppercase tracking-wider ${dashTab === 'bag' ? 'text-[#D9C2A5]' : 'text-[#795B48]'}`}>
            Shopping Bag
          </p>
          <p className="font-serif text-2xl font-semibold mt-1 tabular-nums">
            {cartCount} {cartCount === 1 ? 'Item' : 'Items'}
          </p>
          <p className={`text-xs mt-0.5 tabular-nums ${dashTab === 'bag' ? 'text-[#D9C2A5]' : 'text-[#795B48]'}`}>
            {cartCount > 0 ? `Subtotal ${formatINR(cartSubtotal)}` : 'Bag currently empty'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setDashTab('orders')}
          className={`p-4 rounded-2xl border text-left transition-colors ${
            dashTab === 'orders'
              ? 'bg-[#49372F] text-[#F8F3EB] border-[#49372F]'
              : 'bg-[#FFFFFF] text-[#49372F] border-[#D9C2A5]/70 hover:border-[#C6A477]'
          }`}
        >
          <p className={`text-[11px] uppercase tracking-wider ${dashTab === 'orders' ? 'text-[#D9C2A5]' : 'text-[#795B48]'}`}>
            Orders Placed
          </p>
          <p className="font-serif text-2xl font-semibold mt-1 tabular-nums">
            {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
          </p>
          <p className={`text-xs mt-0.5 truncate ${dashTab === 'orders' ? 'text-[#D9C2A5]' : 'text-[#795B48]'}`}>
            {orders[0] ? `Latest: ${orders[0].id} (${orders[0].status})` : 'No orders yet'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setDashTab('reservations')}
          className={`p-4 rounded-2xl border text-left transition-colors ${
            dashTab === 'reservations'
              ? 'bg-[#49372F] text-[#F8F3EB] border-[#49372F]'
              : 'bg-[#FFFFFF] text-[#49372F] border-[#D9C2A5]/70 hover:border-[#C6A477]'
          }`}
        >
          <p className={`text-[11px] uppercase tracking-wider ${dashTab === 'reservations' ? 'text-[#D9C2A5]' : 'text-[#795B48]'}`}>
            Table Reservations
          </p>
          <p className="font-serif text-2xl font-semibold mt-1 tabular-nums">
            {reservations.length} {reservations.length === 1 ? 'Booking' : 'Bookings'}
          </p>
          <p className={`text-xs mt-0.5 truncate ${dashTab === 'reservations' ? 'text-[#D9C2A5]' : 'text-[#795B48]'}`}>
            {reservations[0] ? `${reservations[0].id} · ${reservations[0].date}` : 'No tables reserved'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setDashTab('custom')}
          className={`p-4 rounded-2xl border text-left transition-colors ${
            dashTab === 'custom'
              ? 'bg-[#49372F] text-[#F8F3EB] border-[#49372F]'
              : 'bg-[#FFFFFF] text-[#49372F] border-[#D9C2A5]/70 hover:border-[#C6A477]'
          }`}
        >
          <p className={`text-[11px] uppercase tracking-wider ${dashTab === 'custom' ? 'text-[#D9C2A5]' : 'text-[#795B48]'}`}>
            Custom Cakes
          </p>
          <p className="font-serif text-2xl font-semibold mt-1 tabular-nums">
            {customCakes.length} {customCakes.length === 1 ? 'Request' : 'Requests'}
          </p>
          <p className={`text-xs mt-0.5 truncate ${dashTab === 'custom' ? 'text-[#D9C2A5]' : 'text-[#795B48]'}`}>
            {customCakes[0] ? `${customCakes[0].id} · ${customCakes[0].flavour}` : 'No custom requests'}
          </p>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Tabs */}
        <aside className="lg:col-span-3 bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-3 space-y-1">
          {[
            { id: 'orders', label: `Orders & History (${orders.length})`, icon: Package },
            { id: 'bag', label: `My Shopping Bag (${cartCount})`, icon: ShoppingBag },
            { id: 'reservations', label: `Reservations (${reservations.length})`, icon: Calendar },
            { id: 'custom', label: `Custom Cakes (${customCakes.length})`, icon: Sparkles },
            { id: 'wishlist', label: `Wishlist (${wishlistedProducts.length})`, icon: Heart },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'notifications', label: `Notifications (${unreadCount})`, icon: Bell },
            { id: 'settings', label: 'Profile Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setDashTab(item.id as typeof dashTab)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-left transition-colors ${
                  dashTab === item.id
                    ? 'bg-[#49372F] text-[#F8F3EB]'
                    : 'text-[#795B48] hover:bg-[#F8F3EB] hover:text-[#49372F]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main Panel */}
        <div className="lg:col-span-9 space-y-6">
          {loadingDash && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-8 text-sm text-[#795B48]">
              Refreshing your account records...
            </div>
          )}

          {dashTab === 'bag' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                    Items Currently in Your Bag
                  </h2>
                  <p className="text-xs text-[#795B48]">
                    Anything you add from Our Signature Menu appears here immediately ready for checkout.
                  </p>
                </div>
                <Link
                  to="/menu"
                  className="px-4 py-2 rounded-lg border border-[#D9C2A5] text-xs font-medium text-[#49372F] hover:bg-[#FFFFFF] self-start sm:self-auto"
                >
                  Browse Our Signature Menu
                </Link>
              </div>

              {cart.length === 0 ? (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-8 text-center space-y-3">
                  <ShoppingBag className="w-8 h-8 text-[#C6A477] mx-auto" />
                  <p className="text-sm text-[#795B48]">
                    Your bag is currently empty. Add cakes, pastries, croissants, or specialty coffee from Our Signature Menu.
                  </p>
                  <Link
                    to="/menu"
                    className="inline-flex h-10 px-5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium items-center"
                  >
                    Explore Our Signature Menu
                  </Link>
                </div>
              ) : (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-5 sm:p-6 space-y-4">
                  <div className="space-y-3">
                    {cart.map((item, idx) => (
                      <div
                        key={`${item.productId}-${idx}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F8F3EB]/70 border border-[#D9C2A5]/50"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[#FFFFFF]">
                            <SafeImage
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-serif text-lg font-semibold text-[#49372F] truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-[#795B48]">
                              {item.variant || 'Standard'}
                              {item.eggless ? ' · 100% Eggless' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="inline-flex items-center border border-[#D9C2A5] rounded-lg bg-[#FFFFFF]">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 flex items-center justify-center"
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
                              className="w-8 h-8 flex items-center justify-center"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-[#49372F] tabular-nums w-20 text-right">
                            {formatINR(item.price * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            aria-label="Remove item"
                            className="p-1.5 text-[#795B48] hover:text-[#49372F]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-[#D9C2A5]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-[#795B48]">Bag Subtotal ({cartCount} items)</p>
                      <p className="font-serif text-2xl font-semibold text-[#49372F] tabular-nums">
                        {formatINR(cartSubtotal)}
                      </p>
                    </div>
                    <Link
                      to="/orders?tab=checkout"
                      className="h-11 px-6 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium inline-flex items-center justify-center hover:bg-[#795B48]"
                    >
                      Proceed to Checkout
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {dashTab === 'orders' && (
            <div className="space-y-4">
              {cart.length > 0 && (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#C6A477] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-[#795B48]">
                      Active Shopping Bag ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                    </p>
                    <p className="text-sm font-medium text-[#49372F] mt-0.5">
                      {cart.map((c) => `${c.quantity} × ${c.name}`).join(', ')}
                    </p>
                    <p className="text-xs text-[#795B48] mt-0.5 tabular-nums">
                      Subtotal: {formatINR(cartSubtotal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setDashTab('bag')}
                      className="h-9 px-3.5 rounded-lg border border-[#D9C2A5] text-xs font-medium text-[#49372F]"
                    >
                      View Bag
                    </button>
                    <Link
                      to="/orders?tab=checkout"
                      className="h-9 px-4 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium inline-flex items-center"
                    >
                      Checkout Now
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                  Your Orders &amp; History
                </h2>
                <Link to="/orders?tab=track" className="text-xs underline text-[#795B48]">
                  Open Live Tracker
                </Link>
              </div>
              {orders.length === 0 ? (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-8 text-center text-sm text-[#795B48]">
                  No orders yet. Explore Our Signature Menu to place a demo order.
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-5 sm:p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D9C2A5]/40">
                      <div>
                        <p className="text-xs font-mono text-[#795B48]">
                          {order.id} · {order.orderType} · {order.deliveryDate}
                        </p>
                        <h3 className="font-serif text-xl font-semibold text-[#49372F]">
                          Status: {order.status}
                        </h3>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-base font-semibold text-[#49372F] tabular-nums">
                          {formatINR(order.total)}
                        </p>
                        <p className="text-[11px] text-[#795B48]">{order.paymentStatus}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-[#F8F3EB]">
                            <SafeImage
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#49372F] truncate">
                              {item.quantity} × {item.name}
                            </p>
                            <p className="text-xs text-[#795B48] tabular-nums">
                              {formatINR(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        className="h-9 px-4 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#795B48]"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Reorder Favourites
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/orders?tab=track')}
                        className="h-9 px-4 rounded-lg border border-[#D9C2A5] text-[#49372F] text-xs font-medium"
                      >
                        Track Progress
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {dashTab === 'custom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                  Custom Cake Requests
                </h2>
                <Link
                  to="/orders"
                  className="px-4 py-2 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
                >
                  New Custom Cake
                </Link>
              </div>
              {customCakes.length === 0 ? (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-8 text-sm text-[#795B48]">
                  No custom cake requests submitted yet.
                </div>
              ) : (
                customCakes.map((cc) => (
                  <div
                    key={cc.id}
                    className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-5 flex flex-col sm:flex-row gap-4"
                  >
                    {cc.referenceImage && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                        <SafeImage
                          src={cc.referenceImage}
                          alt={cc.designPreference}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-mono text-[#795B48]">
                        {cc.id} · {cc.occasion} · Delivery {cc.deliveryDate}
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-[#49372F]">
                        {cc.flavour} ({cc.size}, {cc.shape})
                      </h3>
                      <p className="text-xs text-[#795B48]">{cc.designPreference}</p>
                      <p className="text-xs font-medium text-[#49372F] pt-1">
                        Status: {cc.status} ·{' '}
                        {cc.quotationAmount
                          ? `Custom Quote: ${formatINR(cc.quotationAmount)}`
                          : `Estimate: ${formatINR(cc.estimatedPrice)}`}
                      </p>
                      {cc.adminNotes && (
                        <p className="text-xs italic text-[#795B48]">Note: {cc.adminNotes}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {dashTab === 'reservations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                  Cafe Table Reservations
                </h2>
                <Link
                  to="/cafe"
                  className="px-4 py-2 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
                >
                  Request Table
                </Link>
              </div>
              {reservations.length === 0 ? (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-8 text-center space-y-3">
                  <p className="text-sm text-[#795B48]">
                    You haven't reserved a cafe table yet. Reserve a table and it will appear right here.
                  </p>
                  <Link
                    to="/cafe"
                    className="inline-flex h-10 px-5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium items-center"
                  >
                    Book a Cafe Table
                  </Link>
                </div>
              ) : (
                reservations.map((r) => (
                  <div
                    key={r.id}
                    className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-mono text-[#795B48]">
                        {r.id} · {r.date} at {r.time}
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-[#49372F]">
                        {r.guests} Guests · {r.seatingPreference}
                      </h3>
                      {r.specialRequests && (
                        <p className="text-xs text-[#795B48] mt-1">{r.specialRequests}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-[#49372F] bg-[#F8F3EB] px-3 py-1.5 rounded-lg border border-[#D9C2A5]">
                      {r.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {dashTab === 'wishlist' && (
            <div className="space-y-4">
              <h2 className="font-serif text-2xl font-semibold text-[#49372F]">Saved Favourites</h2>
              {wishlistedProducts.length === 0 ? (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-8 text-sm text-[#795B48]">
                  Tap the heart icon on any creation in the Menu to save it here.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistedProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-4 flex items-center gap-4"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <SafeImage src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg font-semibold text-[#49372F] truncate">
                          {p.name}
                        </h3>
                        <p className="text-xs text-[#795B48] tabular-nums mb-2">
                          {formatINR(p.price)}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
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
                            className="px-3 py-1.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
                          >
                            Add to Bag
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(p.id, p.name)}
                            className="text-xs text-[#795B48] underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {dashTab === 'addresses' && (
            <div className="space-y-6">
              <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                Saved Delivery Addresses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(user.savedAddresses || []).map((a) => (
                  <div
                    key={a.id}
                    className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-5 flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#49372F]">{a.label}</p>
                      <p className="text-xs text-[#795B48] mt-1">
                        {a.address}, {a.city} — {a.pinCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAddress(a.id)}
                      aria-label="Delete address"
                      className="text-[#795B48] hover:text-[#49372F]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSaveAddress}
                className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-6 space-y-4"
              >
                <h3 className="font-serif text-xl font-semibold text-[#49372F]">
                  Add New Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    required
                    type="text"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                    placeholder="Label (e.g. Home, Office)"
                    className="h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                  <input
                    required
                    type="text"
                    value={newAddress.pinCode}
                    onChange={(e) => setNewAddress({ ...newAddress, pinCode: e.target.value })}
                    placeholder="PIN Code"
                    className="h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    required
                    type="text"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    placeholder="Street / Tower / Sector"
                    className="sm:col-span-2 h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                  <input
                    required
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    placeholder="City"
                    className="h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Address
                </button>
              </form>
            </div>
          )}

          {dashTab === 'notifications' && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-[#49372F]">Notifications</h2>
                <button
                  type="button"
                  onClick={markAllNotificationsRead}
                  className="text-xs underline text-[#795B48]"
                >
                  Mark all as read
                </button>
              </div>
              <div className="space-y-3">
                {(user.notifications || []).map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border ${
                      n.read
                        ? 'bg-[#F8F3EB]/50 border-[#D9C2A5]/40'
                        : 'bg-[#F8F3EB] border-[#C6A477]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[#49372F]">{n.title}</p>
                    <p className="text-xs text-[#795B48] mt-1">{n.date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {dashTab === 'settings' && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-6 space-y-4 max-w-xl"
            >
              <h2 className="font-serif text-2xl font-semibold text-[#49372F] flex items-center gap-2">
                <User className="w-5 h-5 text-[#C6A477]" />
                Profile Settings
              </h2>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Full Name
                </label>
                <input
                  required
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Mobile Number
                </label>
                <input
                  required
                  type="tel"
                  value={profileForm.mobile}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">Email</label>
                <input
                  disabled
                  type="email"
                  value={user.email}
                  className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB]/60 border border-[#D9C2A5]/60 text-sm text-[#795B48]"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
              >
                Save Changes
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
