import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Truck,
  Upload,
  User,
} from 'lucide-react';
import { SAMPLE_CUSTOM_CAKE_GALLERY } from '../data/seedData';
import { formatINR, useBakery } from '../context/BakeryContext';
import type { CustomCakeRequest, Order, OrderStatus, OrderType } from '../types/bakery';
import { SafeImage } from '../components/BrandPrimitives';

const CAKE_FLAVOURS = [
  'Chocolate',
  'Vanilla',
  'Red Velvet',
  'Strawberry',
  'Butterscotch',
  'Black Forest',
  'Blueberry',
  'Biscoff',
];
const CAKE_SIZES = ['0.5 kg', '1 kg', '1.5 kg', '2 kg', '3 kg'];
const CAKE_SHAPES = ['Round Classic', 'Two-Tier Round', 'Square Architectural', 'Heart Silhouette'];
const CAKE_OCCASIONS = [
  'Birthday',
  'Anniversary',
  'Wedding',
  'Baby Shower',
  'Graduation',
  'Corporate Events',
  'Other Celebrations',
];

const ORDER_STAGES: OrderStatus[] = [
  'Order Received',
  'Confirmed',
  'Preparing',
  'Baking',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
];

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'custom' | 'cart' | 'checkout' | 'track') || 'custom';
  const [activeTab, setActiveTab] = useState<'custom' | 'cart' | 'checkout' | 'track'>(initialTab);

  const {
    cart,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    coupons,
    cms,
    user,
    token,
    notify,
  } = useBakery();

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'custom' || t === 'cart' || t === 'checkout' || t === 'track') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const switchTab = (tab: 'custom' | 'cart' | 'checkout' | 'track') => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  // --- Custom Cake Studio State ---
  const [customForm, setCustomForm] = useState({
    customerName: user?.name || '',
    mobile: user?.mobile || '',
    email: user?.email || '',
    flavour: 'Chocolate',
    size: '1 kg',
    shape: 'Round Classic',
    designPreference: 'Ivory buttercream with brushed gold leaf and delicate florals',
    occasion: 'Birthday',
    eggless: true,
    messageOnCake: '',
    deliveryDate: '2026-11-25',
    deliveryTime: '5:00 PM',
    instructions: '',
    referenceImage: '',
  });
  const [customSubmitting, setCustomSubmitting] = useState(false);
  const [submittedCustomCake, setSubmittedCustomCake] = useState<CustomCakeRequest | null>(null);
  const [customLookupId, setCustomLookupId] = useState('CC-2081');
  const [lookedUpCustomCake, setLookedUpCustomCake] = useState<CustomCakeRequest | null>(null);
  const [customLookupError, setCustomLookupError] = useState('');

  useEffect(() => {
    if (!user) return;
    setCustomForm((prev) => ({
      ...prev,
      customerName: prev.customerName || user.name || '',
      mobile: prev.mobile || user.mobile || '',
      email: prev.email || user.email || '',
    }));
    setCheckoutForm((prev) => ({
      ...prev,
      customerName: prev.customerName || user.name || '',
      phone: prev.phone || user.mobile || '',
      email: prev.email || user.email || '',
      address: prev.address || user.savedAddresses?.[0]?.address || '',
      city: prev.city || user.savedAddresses?.[0]?.city || 'Noida',
      pinCode: prev.pinCode || user.savedAddresses?.[0]?.pinCode || '201309',
    }));
  }, [user]);

  const lookupCustomCake = async (target?: string) => {
    const id = (target ?? customLookupId).trim();
    if (!id) return;
    setCustomLookupError('');
    try {
      const res = await fetch(`/api/custom-cakes/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Custom cake request not found');
      setLookedUpCustomCake(data.customCake);
      setCustomLookupId(data.customCake.id);
    } catch (err) {
      setLookedUpCustomCake(null);
      setCustomLookupError(err instanceof Error ? err.message : 'Not found');
    }
  };

  const estimatedCustomPrice = (() => {
    const kg = parseFloat(customForm.size) || 1;
    const rate = customForm.flavour === 'Biscoff' || customForm.flavour === 'Blueberry' ? 1950 : 1750;
    return Math.round(kg * rate);
  })();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify('Image Too Large', 'Please choose a reference photo under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomForm((f) => ({ ...f, referenceImage: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomSubmitting(true);
    try {
      const res = await fetch('/api/custom-cakes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(customForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to submit request');
      setSubmittedCustomCake(data.customCake);
      setLookedUpCustomCake(data.customCake);
      setCustomLookupId(data.customCake.id);
      notify('Custom Cake Request Logged', `Reference ${data.customCake.id} saved.`);
    } catch (err) {
      notify('Submission Error', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setCustomSubmitting(false);
    }
  };

  // --- Cart & Checkout State ---
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');
  const [orderType, setOrderType] = useState<OrderType>('Home Delivery');
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: user?.name || '',
    phone: user?.mobile || '',
    email: user?.email || '',
    address: user?.savedAddresses?.[0]?.address || '',
    city: user?.savedAddresses?.[0]?.city || 'Noida',
    pinCode: user?.savedAddresses?.[0]?.pinCode || '201309',
    deliveryDate: '2026-11-19',
    deliveryTimeSlot: '4:00 PM – 6:00 PM',
    instructions: '',
    paymentMethod: 'Demo Card / UPI (Simulated)',
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const activeCoupon = coupons.find(
    (c) => c.active && c.code.toUpperCase() === appliedCouponCode.toUpperCase()
  );
  const discount =
    activeCoupon && cartSubtotal >= activeCoupon.minOrder
      ? activeCoupon.type === 'percent'
        ? Math.round((cartSubtotal * activeCoupon.value) / 100)
        : activeCoupon.value
      : 0;
  const deliveryFee =
    cart.length === 0 || orderType === 'Store Pickup' || cartSubtotal >= cms.freeDeliveryThreshold
      ? 0
      : cms.deliveryFee;
  const taxable = Math.max(0, cartSubtotal - discount);
  const tax = Math.round((taxable * cms.taxPercent) / 100);
  const finalTotal = taxable + deliveryFee + tax;

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const match = coupons.find((c) => c.active && c.code === code);
    if (!match) {
      notify('Invalid Coupon', 'Try demo codes ECLAT10, SWEET150, or FESTIVE200.');
      return;
    }
    if (cartSubtotal < match.minOrder) {
      notify('Minimum Order Required', `${match.code} applies on orders above ${formatINR(match.minOrder)}.`);
      return;
    }
    setAppliedCouponCode(match.code);
    notify('Coupon Applied', match.description);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      notify('Your Bag is Empty', 'Add creations from the Menu before checking out.');
      return;
    }
    setPlacingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...checkoutForm,
          orderType,
          couponCode: appliedCouponCode || undefined,
          items: cart,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not place order');
      setPlacedOrder(data.order);
      setTrackedOrder(data.order);
      setTrackId(data.order.id);
      clearCart();
      notify('Demo Order Recorded', `Order ${data.order.id} created in demonstration mode.`);
      switchTab('track');
    } catch (err) {
      notify('Checkout Error', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setPlacingOrder(false);
    }
  };

  // --- Order Tracking State ---
  const [trackId, setTrackId] = useState('ME-1042');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);

  const lookupOrder = async (idToFind?: string) => {
    const target = (idToFind ?? trackId).trim();
    if (!target) return;
    setTrackLoading(true);
    setTrackError('');
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order not found');
      setTrackedOrder(data.order);
      setTrackId(data.order.id);
    } catch (err) {
      setTrackedOrder(null);
      setTrackError(err instanceof Error ? err.message : 'Order not found');
    } finally {
      setTrackLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'track' && !trackedOrder) {
      lookupOrder('ME-1042');
    }
  }, [activeTab]);

  return (
    <div className="pb-20">
      {/* Header */}
      <section className="bg-[#FFFFFF] border-b border-[#D9C2A5]/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
                Custom Cake Studio &amp; Online Ordering
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-[#49372F] mb-3">
                Custom Cakes &amp; Online Orders
              </h1>
              <p className="text-base text-[#795B48] max-w-2xl">
                Commission a personalized celebration centerpiece, review everything you are ordering,
                complete a demonstration checkout, or track live kitchen progress.
              </p>
            </div>
            {!user ? (
              <Link
                to="/account"
                className="h-10 px-4 rounded-lg border border-[#D9C2A5] bg-[#F8F3EB] text-xs font-semibold text-[#49372F] inline-flex items-center gap-2 hover:border-[#C6A477] shrink-0"
              >
                <User className="w-4 h-4 text-[#C6A477]" />
                Sign In to Save Orders
              </Link>
            ) : (
              <Link
                to="/account"
                className="h-10 px-4 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs font-medium text-[#49372F] inline-flex items-center gap-2 shrink-0"
              >
                <User className="w-4 h-4 text-[#C6A477]" />
                Signed in as {user.name.split(' ')[0]}
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { id: 'custom', label: 'Custom Cake Studio', icon: Sparkles },
              { id: 'cart', label: `Shopping Bag (${cart.reduce((s, i) => s + i.quantity, 0)})`, icon: ShoppingBag },
              { id: 'checkout', label: 'Checkout (Demo)', icon: CreditCard },
              { id: 'track', label: 'Order Tracking', icon: Package },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => switchTab(t.id as typeof activeTab)}
                  className={`h-10 px-4 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap ${
                    activeTab === t.id
                      ? 'bg-[#49372F] text-[#F8F3EB]'
                      : 'bg-[#F8F3EB] text-[#795B48] border border-[#D9C2A5] hover:text-[#49372F]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {/* TAB 1: CUSTOM CAKE STUDIO */}
        {activeTab === 'custom' && (
          <div className="space-y-14">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-2">
                  Custom Cake Studio
                </p>
                <h2 className="font-serif text-3xl font-semibold text-[#49372F] mb-2">
                  Your Celebration. Our Creation.
                </h2>
                <p className="text-sm text-[#795B48] mb-6">
                  Share your flavour palette, celebration date, and inspiration. Our pastry kitchen
                  reviews every custom cake request personally.
                </p>

                {submittedCustomCake ? (
                  <div className="p-6 rounded-xl bg-[#F8F3EB] border border-[#C6A477] space-y-4">
                    <div className="flex items-center gap-2.5 text-[#49372F]">
                      <CheckCircle2 className="w-6 h-6 text-[#A8B39C]" />
                      <h3 className="font-serif text-2xl font-semibold">
                        Custom Cake Enquiry Logged
                      </h3>
                    </div>
                    <p className="text-sm text-[#795B48]">
                      Reference ID:{' '}
                      <span className="font-mono font-semibold text-[#49372F]">
                        {submittedCustomCake.id}
                      </span>{' '}
                      · Estimated Starting Range:{' '}
                      <span className="font-semibold text-[#49372F] tabular-nums">
                        {formatINR(submittedCustomCake.estimatedPrice)}
                      </span>
                    </p>
                    <p className="text-xs text-[#795B48]">
                      Demo Notice: This request has been saved to the Maison Éclat demonstration
                      system and is visible in both the Customer Dashboard and Bakery Admin Portal.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmittedCustomCake(null)}
                      className="px-5 py-2.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
                    >
                      Submit Another Design Request
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCustomSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Your Name *
                        </label>
                        <input
                          required
                          type="text"
                          value={customForm.customerName}
                          onChange={(e) =>
                            setCustomForm({ ...customForm, customerName: e.target.value })
                          }
                          placeholder="Full name"
                          className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Mobile Number *
                        </label>
                        <input
                          required
                          type="tel"
                          value={customForm.mobile}
                          onChange={(e) => setCustomForm({ ...customForm, mobile: e.target.value })}
                          placeholder="+91 98..."
                          className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Email Address *
                        </label>
                        <input
                          required
                          type="email"
                          value={customForm.email}
                          onChange={(e) => setCustomForm({ ...customForm, email: e.target.value })}
                          placeholder="you@example.com"
                          className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Cake Flavour
                        </label>
                        <select
                          value={customForm.flavour}
                          onChange={(e) =>
                            setCustomForm({ ...customForm, flavour: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        >
                          {CAKE_FLAVOURS.map((fl) => (
                            <option key={fl} value={fl}>
                              {fl}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Weight / Size
                        </label>
                        <select
                          value={customForm.size}
                          onChange={(e) => setCustomForm({ ...customForm, size: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        >
                          {CAKE_SIZES.map((sz) => (
                            <option key={sz} value={sz}>
                              {sz}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Cake Shape
                        </label>
                        <select
                          value={customForm.shape}
                          onChange={(e) => setCustomForm({ ...customForm, shape: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        >
                          {CAKE_SHAPES.map((sh) => (
                            <option key={sh} value={sh}>
                              {sh}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Occasion
                        </label>
                        <select
                          value={customForm.occasion}
                          onChange={(e) =>
                            setCustomForm({ ...customForm, occasion: e.target.value })
                          }
                          className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        >
                          {CAKE_OCCASIONS.map((occ) => (
                            <option key={occ} value={occ}>
                              {occ}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Dietary Preference
                        </label>
                        <div className="inline-flex rounded-lg bg-[#F8F3EB] p-1 border border-[#D9C2A5]">
                          <button
                            type="button"
                            onClick={() => setCustomForm({ ...customForm, eggless: true })}
                            className={`px-3.5 py-1.5 rounded-md text-xs font-medium ${
                              customForm.eggless
                                ? 'bg-[#FFFFFF] text-[#49372F] shadow-2xs'
                                : 'text-[#795B48]'
                            }`}
                          >
                            100% Eggless
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomForm({ ...customForm, eggless: false })}
                            className={`px-3.5 py-1.5 rounded-md text-xs font-medium ${
                              !customForm.eggless
                                ? 'bg-[#FFFFFF] text-[#49372F] shadow-2xs'
                                : 'text-[#795B48]'
                            }`}
                          >
                            Classic Sponge
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Message on Cake
                        </label>
                        <input
                          type="text"
                          value={customForm.messageOnCake}
                          onChange={(e) =>
                            setCustomForm({ ...customForm, messageOnCake: e.target.value })
                          }
                          placeholder="e.g. Happy 25th Anniversary"
                          className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Preferred Delivery Date *
                        </label>
                        <input
                          required
                          type="date"
                          value={customForm.deliveryDate}
                          onChange={(e) =>
                            setCustomForm({ ...customForm, deliveryDate: e.target.value })
                          }
                          className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                          Preferred Time
                        </label>
                        <select
                          value={customForm.deliveryTime}
                          onChange={(e) =>
                            setCustomForm({ ...customForm, deliveryTime: e.target.value })
                          }
                          className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                        >
                          <option>11:00 AM</option>
                          <option>2:00 PM</option>
                          <option>5:00 PM</option>
                          <option>7:30 PM</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                        Cake Design Preference
                      </label>
                      <input
                        type="text"
                        value={customForm.designPreference}
                        onChange={(e) =>
                          setCustomForm({ ...customForm, designPreference: e.target.value })
                        }
                        className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                        Additional Instructions &amp; Allergies
                      </label>
                      <textarea
                        rows={3}
                        value={customForm.instructions}
                        onChange={(e) =>
                          setCustomForm({ ...customForm, instructions: e.target.value })
                        }
                        placeholder="Describe colour palette, floral accents, or dietary notes..."
                        className="w-full p-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                        Reference Inspiration Image (Optional)
                      </label>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="h-10 px-4 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs font-medium text-[#49372F] inline-flex items-center gap-2 cursor-pointer hover:border-[#C6A477]">
                          <Upload className="w-4 h-4 text-[#795B48]" />
                          Upload Inspiration Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                        {customForm.referenceImage && (
                          <div className="flex items-center gap-2">
                            <img
                              src={customForm.referenceImage}
                              alt="Reference preview"
                              className="w-12 h-12 rounded-lg object-cover border border-[#D9C2A5]"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomForm({ ...customForm, referenceImage: '' })}
                              className="text-xs text-[#795B48] underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#D9C2A5]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-[#795B48]">Estimated Price</p>
                        <p className="font-serif text-2xl font-semibold text-[#49372F] tabular-nums">
                          From {formatINR(estimatedCustomPrice)}
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={customSubmitting}
                        className="h-11 px-6 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium hover:bg-[#795B48] transition-colors"
                      >
                        {customSubmitting ? 'Submitting Request...' : 'Request Custom Cake Quote'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Live Custom Cake Summary, Lookup & Portfolio */}
              <div className="lg:col-span-5 space-y-6">
                {/* Live Summary Card */}
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#C6A477]/70 p-6 space-y-3">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#795B48]">
                    Live Summary · What You Are Commissioning
                  </p>
                  <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
                    {customForm.flavour} ({customForm.size})
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#795B48]">
                    <div>
                      Shape: <strong className="text-[#49372F]">{customForm.shape}</strong>
                    </div>
                    <div>
                      Occasion: <strong className="text-[#49372F]">{customForm.occasion}</strong>
                    </div>
                    <div>
                      Dietary:{' '}
                      <strong className="text-[#49372F]">
                        {customForm.eggless ? '100% Eggless' : 'Classic Sponge'}
                      </strong>
                    </div>
                    <div>
                      Schedule:{' '}
                      <strong className="text-[#49372F]">
                        {customForm.deliveryDate} · {customForm.deliveryTime}
                      </strong>
                    </div>
                  </div>
                  {customForm.messageOnCake && (
                    <p className="text-xs text-[#49372F] bg-[#F8F3EB] px-3 py-2 rounded-lg border border-[#D9C2A5]/60">
                      Plaque Message: <span className="italic">“{customForm.messageOnCake}”</span>
                    </p>
                  )}
                  <p className="text-xs text-[#795B48]">
                    Design: <span className="text-[#49372F]">{customForm.designPreference}</span>
                  </p>
                  <div className="pt-2 border-t border-[#D9C2A5]/50 flex items-center justify-between">
                    <span className="text-xs text-[#795B48]">Indicative Starting Price</span>
                    <span className="font-serif text-xl font-semibold text-[#49372F] tabular-nums">
                      From {formatINR(estimatedCustomPrice)}
                    </span>
                  </div>
                </div>

                {/* Lookup Existing Custom Cake */}
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-5 space-y-3">
                  <p className="text-xs font-semibold text-[#49372F]">
                    Check Existing Custom Cake Quote
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      lookupCustomCake();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={customLookupId}
                      onChange={(e) => setCustomLookupId(e.target.value)}
                      placeholder="e.g. CC-2081"
                      className="flex-1 h-9 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs font-mono uppercase"
                    />
                    <button
                      type="submit"
                      className="h-9 px-3.5 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
                    >
                      Check
                    </button>
                  </form>
                  <div className="flex items-center gap-2 text-[11px] text-[#795B48]">
                    <span>Demo IDs:</span>
                    {['CC-2081', 'CC-2082'].map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => lookupCustomCake(id)}
                        className="px-2 py-0.5 rounded bg-[#F8F3EB] border border-[#D9C2A5] font-mono text-[#49372F]"
                      >
                        {id}
                      </button>
                    ))}
                  </div>
                  {customLookupError && (
                    <p className="text-xs text-[#795B48]">{customLookupError}</p>
                  )}
                  {lookedUpCustomCake && (
                    <div className="p-3 rounded-xl bg-[#F8F3EB] border border-[#D9C2A5] text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-[#49372F]">
                        <span className="font-mono">{lookedUpCustomCake.id}</span>
                        <span>{lookedUpCustomCake.status}</span>
                      </div>
                      <p className="font-medium text-[#49372F]">
                        {lookedUpCustomCake.flavour} ({lookedUpCustomCake.size},{' '}
                        {lookedUpCustomCake.shape})
                      </p>
                      <p className="text-[#795B48]">
                        {lookedUpCustomCake.occasion} · {lookedUpCustomCake.deliveryDate} at{' '}
                        {lookedUpCustomCake.deliveryTime}
                      </p>
                      <p className="text-[#49372F] font-medium tabular-nums">
                        {lookedUpCustomCake.quotationAmount
                          ? `Custom Quote: ${formatINR(lookedUpCustomCake.quotationAmount)}`
                          : `Estimate: ${formatINR(lookedUpCustomCake.estimatedPrice)}`}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-1">
                    Signature Cake Portfolio
                  </p>
                  <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
                    Sample Celebration Designs
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {SAMPLE_CUSTOM_CAKE_GALLERY.map((sample) => (
                    <div
                      key={sample.title}
                      className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 overflow-hidden flex flex-col sm:flex-row lg:flex-row"
                    >
                      <div className="sm:w-36 aspect-[4/3] sm:aspect-auto shrink-0 bg-[#F8F3EB]">
                        <SafeImage
                          src={sample.image}
                          alt={sample.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex flex-col justify-center">
                        <h4 className="font-serif text-lg font-semibold text-[#49372F]">
                          {sample.title}
                        </h4>
                        <p className="text-xs text-[#795B48] mt-1">{sample.flavour}</p>
                        <p className="text-[11px] text-[#795B48] mt-2">{sample.weight}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SHOPPING CART */}
        {activeTab === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              {cart.length === 0 ? (
                <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-12 text-center">
                  <ShoppingBag className="w-10 h-10 text-[#C6A477] mx-auto mb-3" />
                  <h2 className="font-serif text-2xl font-semibold text-[#49372F] mb-2">
                    Your Shopping Bag is Empty
                  </h2>
                  <p className="text-sm text-[#795B48] mb-6">
                    Browse our signature cakes, pastries, croissants, and specialty beverages to
                    begin your order.
                  </p>
                  <Link
                    to="/menu"
                    className="inline-flex h-11 px-6 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium items-center"
                  >
                    Browse Full Menu
                  </Link>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={`${item.productId}-${idx}`}
                    className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/60 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                  >
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-[#F8F3EB] shrink-0">
                      <SafeImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-[#795B48]">
                        {item.category}
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-[#49372F]">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#795B48] mt-0.5">
                        {item.variant || 'Regular'}
                        {item.eggless ? ' · 100% Eggless' : ''}
                      </p>
                      {item.cakeMessage && (
                        <p className="text-xs italic text-[#795B48] mt-1">
                          Plaque: “{item.cakeMessage}”
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 self-end sm:self-center">
                      <div className="inline-flex items-center border border-[#D9C2A5] rounded-lg bg-[#F8F3EB]">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(idx, item.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="w-9 h-9 flex items-center justify-center"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(idx, item.quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-9 h-9 flex items-center justify-center"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-base font-semibold text-[#49372F] tabular-nums w-20 text-right">
                        {formatINR(item.price * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(idx)}
                        aria-label="Remove item"
                        className="p-2 text-[#795B48] hover:text-[#49372F]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="lg:col-span-4 bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 space-y-5">
              <h3 className="font-serif text-2xl font-semibold text-[#49372F]">Order Summary</h3>

              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Demo Coupon Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="ECLAT10 or SWEET150"
                    className="flex-1 h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="h-10 px-4 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs font-semibold text-[#49372F] hover:border-[#C6A477]"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-[11px] text-[#795B48] mt-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#C6A477]" />
                  Available: ECLAT10, SWEET150, FESTIVE200
                </p>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[#D9C2A5]/50 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#795B48]">Subtotal</span>
                  <span className="font-medium tabular-nums">{formatINR(cartSubtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#49372F]">
                    <span>Coupon ({appliedCouponCode})</span>
                    <span className="font-medium tabular-nums">-{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#795B48]">Estimated Delivery</span>
                  <span className="font-medium tabular-nums">
                    {deliveryFee === 0 ? 'Complimentary' : formatINR(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#795B48]">Taxes ({cms.taxPercent}%)</span>
                  <span className="font-medium tabular-nums">{formatINR(tax)}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#D9C2A5]/50 text-base font-semibold text-[#49372F]">
                  <span>Total (Demo)</span>
                  <span className="tabular-nums">{formatINR(finalTotal)}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={() => switchTab('checkout')}
                  className="w-full h-11 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium hover:bg-[#795B48] disabled:opacity-40"
                >
                  Proceed to Checkout
                </button>
                <Link
                  to="/menu"
                  className="w-full h-10 rounded-lg border border-[#D9C2A5] text-[#49372F] text-xs font-medium flex items-center justify-center hover:bg-[#F8F3EB]"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHECKOUT (DEMO MODE) */}
        {activeTab === 'checkout' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={handlePlaceOrder}
              className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 sm:p-8 space-y-6"
            >
              <div className="p-4 rounded-xl bg-[#F8F3EB] border border-[#C6A477]/60 text-xs text-[#49372F] leading-relaxed">
                <strong className="font-semibold">Demonstration Checkout Mode:</strong> No real
                payment gateway is connected and no actual financial charge occurs. Submitting this
                form records a realistic demonstration order for tracking and admin workflow testing.
              </div>

              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#49372F] mb-3">
                  Order Fulfilment Method
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setOrderType('Home Delivery')}
                    className={`p-4 rounded-xl border text-left transition-colors flex items-start gap-3 ${
                      orderType === 'Home Delivery'
                        ? 'bg-[#F8F3EB] border-[#49372F]'
                        : 'bg-[#FFFFFF] border-[#D9C2A5]'
                    }`}
                  >
                    <Truck className="w-5 h-5 text-[#C6A477] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#49372F]">Home Delivery</p>
                      <p className="text-xs text-[#795B48] mt-0.5">
                        {cartSubtotal >= cms.freeDeliveryThreshold
                          ? 'Complimentary Noida delivery'
                          : `${formatINR(cms.deliveryFee)} delivery fee`}
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('Store Pickup')}
                    className={`p-4 rounded-xl border text-left transition-colors flex items-start gap-3 ${
                      orderType === 'Store Pickup'
                        ? 'bg-[#F8F3EB] border-[#49372F]'
                        : 'bg-[#FFFFFF] border-[#D9C2A5]'
                    }`}
                  >
                    <Store className="w-5 h-5 text-[#C6A477] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#49372F]">Store Pickup</p>
                      <p className="text-xs text-[#795B48] mt-0.5">
                        Collect at Sector 62, Noida (Free)
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={checkoutForm.customerName}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, customerName: e.target.value })
                    }
                    className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    required
                    type="tel"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Email *
                  </label>
                  <input
                    required
                    type="email"
                    value={checkoutForm.email}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
              </div>

              {orderType === 'Home Delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Delivery Address *
                    </label>
                    <input
                      required
                      type="text"
                      value={checkoutForm.address}
                      onChange={(e) =>
                        setCheckoutForm({ ...checkoutForm, address: e.target.value })
                      }
                      placeholder="Apartment, Street, Sector"
                      className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      City *
                    </label>
                    <input
                      required
                      type="text"
                      value={checkoutForm.city}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                      className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      PIN Code *
                    </label>
                    <input
                      required
                      type="text"
                      value={checkoutForm.pinCode}
                      onChange={(e) =>
                        setCheckoutForm({ ...checkoutForm, pinCode: e.target.value })
                      }
                      className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    value={checkoutForm.deliveryDate}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, deliveryDate: e.target.value })
                    }
                    className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Time Slot
                  </label>
                  <select
                    value={checkoutForm.deliveryTimeSlot}
                    onChange={(e) =>
                      setCheckoutForm({ ...checkoutForm, deliveryTimeSlot: e.target.value })
                    }
                    className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  >
                    <option>10:00 AM – 12:00 PM</option>
                    <option>12:00 PM – 2:00 PM</option>
                    <option>4:00 PM – 6:00 PM</option>
                    <option>6:00 PM – 8:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Configurable Demo Payment Option
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Demo Card / UPI (Simulated)',
                    'Pay at Cafe Counter / COD (Demo)',
                  ].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setCheckoutForm({ ...checkoutForm, paymentMethod: method })}
                      className={`p-3.5 rounded-xl border text-xs font-medium text-left ${
                        checkoutForm.paymentMethod === method
                          ? 'bg-[#F8F3EB] border-[#49372F] text-[#49372F]'
                          : 'bg-[#FFFFFF] border-[#D9C2A5] text-[#795B48]'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Order Instructions
                </label>
                <textarea
                  rows={2}
                  value={checkoutForm.instructions}
                  onChange={(e) =>
                    setCheckoutForm({ ...checkoutForm, instructions: e.target.value })
                  }
                  placeholder="Gate code, candles, or gift note..."
                  className="w-full p-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={placingOrder || cart.length === 0}
                className="w-full h-12 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-semibold hover:bg-[#795B48] disabled:opacity-40"
              >
                {placingOrder
                  ? 'Recording Demo Order...'
                  : `Place Demo Order · ${formatINR(finalTotal)}`}
              </button>
            </form>

            <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-[#795B48]">
                  Complete Order Review
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
                  What You Are Ordering
                </h3>
              </div>

              {/* Fulfilment & Schedule Snapshot */}
              <div className="p-3.5 rounded-xl bg-[#F8F3EB] border border-[#D9C2A5]/70 text-xs space-y-1.5">
                <p className="font-semibold text-[#49372F]">
                  {orderType} · {checkoutForm.deliveryDate} ({checkoutForm.deliveryTimeSlot})
                </p>
                {orderType === 'Home Delivery' ? (
                  <p className="text-[#795B48]">
                    To:{' '}
                    {checkoutForm.address
                      ? `${checkoutForm.address}, ${checkoutForm.city} ${checkoutForm.pinCode}`
                      : 'Enter delivery address on the left'}
                  </p>
                ) : (
                  <p className="text-[#795B48]">
                    Pickup at: Maison Éclat Boutique, Sector 62, Noida
                  </p>
                )}
                <p className="text-[#795B48]">Payment: {checkoutForm.paymentMethod}</p>
              </div>

              {cart.length === 0 ? (
                <p className="text-sm text-[#795B48]">
                  No items in bag.{' '}
                  <Link to="/menu" className="underline text-[#49372F]">
                    Add items from the Menu
                  </Link>
                  .
                </p>
              ) : (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {cart.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-11 h-11 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-[#49372F] truncate">
                            {item.quantity} × {item.name}
                          </p>
                          <p className="text-xs text-[#795B48]">
                            {item.variant || 'Standard'}
                            {item.eggless ? ' · Eggless' : ''}
                          </p>
                          {item.cakeMessage && (
                            <p className="text-[11px] italic text-[#795B48] truncate">
                              Plaque: “{item.cakeMessage}”
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-medium tabular-nums shrink-0">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-[#D9C2A5]/50 space-y-2 text-sm">
                <div className="flex justify-between text-[#795B48]">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatINR(cartSubtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-[#49372F]">
                    <span>Discount ({appliedCouponCode})</span>
                    <span className="tabular-nums">-{formatINR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#795B48]">
                  <span>{orderType}</span>
                  <span className="tabular-nums">
                    {deliveryFee === 0 ? 'Complimentary' : formatINR(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between text-[#795B48]">
                  <span>Tax ({cms.taxPercent}%)</span>
                  <span className="tabular-nums">{formatINR(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#D9C2A5]/50 text-base font-semibold text-[#49372F]">
                  <span>Total (Demo Mode)</span>
                  <span className="tabular-nums">{formatINR(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ORDER TRACKING */}
        {activeTab === 'track' && (
          <div className="max-w-4xl mx-auto space-y-8">
            {placedOrder && (
              <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#C6A477] flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#A8B39C] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#49372F]">
                    Demo Order {placedOrder.id} Logged Successfully
                  </p>
                  <p className="text-xs text-[#795B48] mt-0.5">
                    Payment Status: {placedOrder.paymentStatus}. No real monetary transaction was
                    processed.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5]/70 p-6 sm:p-8">
              <h2 className="font-serif text-3xl font-semibold text-[#49372F] mb-2">
                Track Your Maison Éclat Order
              </h2>
              <p className="text-sm text-[#795B48] mb-5">
                Enter an Order ID or select one of our demonstration orders below to inspect live
                preparation stages.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  lookupOrder();
                }}
                className="flex flex-col sm:flex-row gap-3 mb-4"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#795B48] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                    placeholder="e.g. ME-1042"
                    className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm font-mono uppercase"
                  />
                </div>
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="h-11 px-6 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium hover:bg-[#795B48]"
                >
                  {trackLoading ? 'Locating...' : 'Track Order'}
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#795B48]">Demo Order IDs:</span>
                {['ME-1042', 'ME-1043', 'ME-1044', 'ME-1045'].map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => lookupOrder(id)}
                    className="px-2.5 py-1 rounded-md bg-[#F8F3EB] border border-[#D9C2A5] font-mono text-[#49372F] hover:border-[#C6A477]"
                  >
                    {id}
                  </button>
                ))}
              </div>

              {trackError && (
                <p className="mt-4 text-sm text-[#795B48] bg-[#F8F3EB] p-3 rounded-lg">
                  {trackError}
                </p>
              )}

              {trackedOrder && (
                <div className="mt-8 pt-8 border-t border-[#D9C2A5]/60 space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono text-[#795B48]">
                        {trackedOrder.id} · {trackedOrder.isDemo ? 'Demonstration Order' : 'Order'}
                      </p>
                      <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
                        Status: {trackedOrder.status}
                      </h3>
                      <p className="text-xs text-[#795B48] mt-1 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#C6A477]" />
                          {trackedOrder.deliveryDate} · {trackedOrder.deliveryTimeSlot}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#C6A477]" />
                          {trackedOrder.orderType}
                        </span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-[#795B48]">{trackedOrder.paymentStatus}</p>
                      <p className="font-serif text-2xl font-semibold text-[#49372F] tabular-nums">
                        {formatINR(trackedOrder.total)}
                      </p>
                    </div>
                  </div>

                  {/* 7-Stage Stepper */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    {ORDER_STAGES.map((stage, idx) => {
                      const currentIdx = ORDER_STAGES.indexOf(trackedOrder.status);
                      const completed = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      return (
                        <div
                          key={stage}
                          className={`p-3 rounded-xl border text-center transition-colors ${
                            isCurrent
                              ? 'bg-[#49372F] text-[#F8F3EB] border-[#49372F]'
                              : completed
                              ? 'bg-[#F8F3EB] text-[#49372F] border-[#C6A477]'
                              : 'bg-[#FFFFFF] text-[#795B48]/60 border-[#D9C2A5]/40'
                          }`}
                        >
                          <p className="text-[10px] font-mono mb-1">0{idx + 1}</p>
                          <p className="text-xs font-medium leading-snug">{stage}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Items */}
                  <div className="bg-[#F8F3EB] rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#795B48]">
                      Order Receipt
                    </h4>
                    {trackedOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <span>
                            {item.quantity} × {item.name}{' '}
                            <span className="text-xs text-[#795B48]">({item.variant || 'Standard'})</span>
                          </span>
                        </div>
                        <span className="font-medium tabular-nums">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
