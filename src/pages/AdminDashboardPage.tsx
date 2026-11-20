import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { IMAGES, PRODUCT_CATEGORIES } from '../data/seedData';
import { formatINR, useBakery } from '../context/BakeryContext';
import type {
  CmsContent,
  Coupon,
  CustomCakeRequest,
  CustomCakeStatus,
  Enquiry,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  ReservationStatus,
  TableReservation,
  UserProfile,
} from '../types/bakery';
import { SafeImage } from '../components/BrandPrimitives';

type AdminSection =
  | 'overview'
  | 'products'
  | 'orders'
  | 'custom'
  | 'customers'
  | 'reservations'
  | 'analytics'
  | 'cms'
  | 'settings';

const ORDER_STATUSES: OrderStatus[] = [
  'Order Received',
  'Confirmed',
  'Preparing',
  'Baking',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
];

const CUSTOM_CAKE_STATUSES: CustomCakeStatus[] = [
  'Enquiry Received',
  'Design Review',
  'Quotation Sent',
  'Confirmed',
  'In Preparation',
  'Completed',
];

const RESERVATION_STATUSES: ReservationStatus[] = [
  'Requested',
  'Confirmed',
  'Seated',
  'Completed',
  'Cancelled',
];

const IMAGE_PRESETS = Object.entries(IMAGES).map(([key, url]) => ({ label: key, url }));

export function AdminDashboardPage() {
  const { user, token, authLoading, login, logout, refreshCatalog, notify } = useBakery();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [section, setSection] = useState<AdminSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin Data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customCakes, setCustomCakes] = useState<CustomCakeRequest[]>([]);
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [cmsEdit, setCmsEdit] = useState<CmsContent | null>(null);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // Filters & Modals
  const [productSearch, setProductSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingCustomCake, setEditingCustomCake] = useState<CustomCakeRequest | null>(null);
  const [newResModal, setNewResModal] = useState(false);
  const [newResForm, setNewResForm] = useState({
    customerName: '',
    mobile: '',
    email: '',
    date: '2026-11-20',
    time: '6:00 PM',
    guests: 2,
    seatingPreference: 'Sunlit Window Lounge',
  });
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    type: 'percent' as 'percent' | 'flat',
    value: 10,
    minOrder: 499,
  });

  const fetchOverview = useCallback(async () => {
    if (!token || user?.role !== 'admin') return;
    setLoadingAdmin(true);
    try {
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setOrders(data.orders || []);
        setCustomCakes(data.customCakes || []);
        setReservations(data.reservations || []);
        setEnquiries(data.enquiries || []);
        setCustomers(data.customers || []);
        setCoupons(data.coupons || []);
        setCmsEdit(data.cms || null);
      }
    } finally {
      setLoadingAdmin(false);
    }
  }, [token, user?.role]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      await login(email, password, 'admin');
      notify('Bakery Admin Session Active');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Authorization failed');
    } finally {
      setLoggingIn(false);
    }
  };

  // KPI Metrics (Demonstration Analytics)
  const totalRevenue = useMemo(
    () => orders.reduce((s, o) => s + o.total, 0),
    [orders]
  );
  const pendingOrdersCount = useMemo(
    () => orders.filter((o) => o.status !== 'Delivered').length,
    [orders]
  );

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingProduct) return;
    const url = isNewProduct
      ? '/api/admin/products'
      : `/api/admin/products/${editingProduct.id}`;
    const method = isNewProduct ? 'POST' : 'PUT';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editingProduct),
    });
    if (res.ok) {
      setEditingProduct(null);
      await fetchOverview();
      await refreshCatalog();
      notify(isNewProduct ? 'Product Added' : 'Product Updated');
    }
  };

  const handleQuickToggleProduct = async (p: Product, field: 'available' | 'bestseller' | 'seasonal') => {
    if (!token) return;
    const res = await fetch(`/api/admin/products/${p.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ [field]: !p[field] }),
    });
    if (res.ok) {
      await fetchOverview();
      await refreshCatalog();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchOverview();
      await refreshCatalog();
      notify('Product Deleted');
    }
  };

  // Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!token) return;
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchOverview();
      notify('Order Status Updated', `${orderId} → ${status}`);
    }
  };

  // Custom Cake Update
  const handleSaveCustomCake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingCustomCake) return;
    const res = await fetch(`/api/admin/custom-cakes/${editingCustomCake.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: editingCustomCake.status,
        quotationAmount: editingCustomCake.quotationAmount,
        adminNotes: editingCustomCake.adminNotes,
      }),
    });
    if (res.ok) {
      setEditingCustomCake(null);
      await fetchOverview();
      notify('Custom Cake Request Updated');
    }
  };

  // Reservation CRUD
  const handleUpdateReservation = async (id: string, status: ReservationStatus) => {
    if (!token) return;
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await fetchOverview();
      notify('Reservation Updated');
    }
  };

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch('/api/admin/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newResForm),
    });
    if (res.ok) {
      setNewResModal(false);
      await fetchOverview();
      notify('Reservation Added');
    }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!token) return;
    const res = await fetch(`/api/admin/reservations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      await fetchOverview();
      notify('Reservation Removed');
    }
  };

  // CMS & Settings Save
  const handleSaveCms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !cmsEdit) return;
    const res = await fetch('/api/admin/cms', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(cmsEdit),
    });
    if (res.ok) {
      await refreshCatalog();
      notify('CMS & Settings Saved', 'Live storefront updated.');
    }
  };

  // Coupon CRUD
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newCoupon),
    });
    if (res.ok) {
      setNewCoupon({ code: '', description: '', type: 'percent', value: 10, minOrder: 499 });
      await fetchOverview();
      await refreshCatalog();
      notify('Coupon Created');
    }
  };

  const handleToggleCoupon = async (c: Coupon) => {
    if (!token) return;
    await fetch(`/api/admin/coupons/${c.code}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ active: !c.active }),
    });
    await fetchOverview();
    await refreshCatalog();
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!token) return;
    await fetch(`/api/admin/coupons/${code}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    await fetchOverview();
    await refreshCatalog();
  };

  if (authLoading) {
    return (
      <div className="py-20 text-center text-sm text-[#795B48]">
        Verifying administrator session...
      </div>
    );
  }

  // Admin Login Gate
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#D9C2A5] p-7 sm:p-8 shadow-sm space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-[#49372F] text-[#C6A477] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#795B48] mb-1">
              Protected Management Console
            </p>
            <h1 className="font-serif text-3xl font-semibold text-[#49372F]">
              Bakery Admin Portal
            </h1>
            <p className="text-xs text-[#795B48] mt-1.5">
              Role-based server authentication required for bakery operations.
            </p>
          </div>

          {user && user.role !== 'admin' && (
            <div className="p-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs text-[#49372F] flex items-center justify-between">
              <span>Signed in as customer ({user.email}).</span>
              <button type="button" onClick={logout} className="underline font-medium">
                Sign out
              </button>
            </div>
          )}

          {loginError && (
            <div className="p-3 rounded-lg bg-[#D9B9AC]/35 border border-[#D9B9AC] text-xs text-[#49372F]">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                Administrator Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@maisoneclat-demo.in"
                className="w-full h-11 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#49372F] mb-1.5">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full h-11 px-3.5 pr-10 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label="Toggle password visibility"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#795B48]"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full h-11 rounded-lg bg-[#49372F] text-[#F8F3EB] text-sm font-medium hover:bg-[#795B48]"
            >
              {loggingIn ? 'Authenticating...' : 'Sign In to Admin Console'}
            </button>
          </form>

          <div className="p-4 rounded-xl bg-[#F8F3EB] border border-[#D9C2A5]/70 space-y-1.5">
            <p className="text-xs font-semibold text-[#49372F]">
              Demo Administrator Credentials
            </p>
            <p className="text-xs font-mono text-[#795B48]">
              admin@maisoneclat-demo.in · AdminBakery@2026
            </p>
            <button
              type="button"
              onClick={() => {
                setEmail('admin@maisoneclat-demo.in');
                setPassword('AdminBakery@2026');
              }}
              className="text-xs font-medium text-[#49372F] underline"
            >
              Fill Demo Admin Credentials
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: ShoppingBag },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'custom', label: 'Custom Cakes', icon: Sparkles },
    { id: 'customers', label: 'Customers & Inbox', icon: Users },
    { id: 'reservations', label: 'Reservations', icon: Calendar },
    { id: 'analytics', label: 'Sales & Analytics', icon: BarChart3 },
    { id: 'cms', label: 'Content CMS', icon: FileText },
    { id: 'settings', label: 'Settings & Coupons', icon: Settings },
  ];

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'All' || o.status === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const categoryDistribution = PRODUCT_CATEGORIES.map((cat) => ({
    category: cat,
    count: products.filter((p) => p.category === cat).length,
  }));

  const dailySalesDemo = [
    { day: 'Mon', amount: 18400 },
    { day: 'Tue', amount: 21900 },
    { day: 'Wed', amount: 19600 },
    { day: 'Thu', amount: 26300 },
    { day: 'Fri', amount: 34200 },
    { day: 'Sat', amount: 46800 },
    { day: 'Sun', amount: 42100 },
  ];

  const monthlyRevenueDemo = [
    { month: 'Jun', amount: 485000 },
    { month: 'Jul', amount: 520000 },
    { month: 'Aug', amount: 562000 },
    { month: 'Sep', amount: 610000 },
    { month: 'Oct', amount: 745000 },
    { month: 'Nov', amount: 682000 + totalRevenue },
  ];

  return (
    <div className="min-h-[82vh] bg-[#F8F3EB] border-t border-[#D9C2A5]/60">
      <div className="max-w-[1440px] mx-auto flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#FFFFFF] border-r border-[#D9C2A5]/70 p-4 justify-between min-h-[82vh]">
          <div className="space-y-1">
            <div className="px-3 py-2 mb-3 border-b border-[#D9C2A5]/50">
              <p className="text-[11px] uppercase tracking-wider text-[#795B48]">
                Bakery Management
              </p>
              <p className="font-serif text-lg font-semibold text-[#49372F] truncate">
                {user.name}
              </p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    section === item.id
                      ? 'bg-[#49372F] text-[#F8F3EB]'
                      : 'text-[#795B48] hover:bg-[#F8F3EB] hover:text-[#49372F]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium text-[#795B48] hover:bg-[#F8F3EB] border border-[#D9C2A5]/60"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </aside>

        {/* Main Admin Content */}
        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Breadcrumb Bar */}
          <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 px-5 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden w-9 h-9 rounded-lg border border-[#D9C2A5] flex items-center justify-center"
                aria-label="Toggle admin sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
              <div>
                <p className="text-xs text-[#795B48]">
                  Maison Éclat Admin / <span className="text-[#49372F] font-medium capitalize">{section}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-[#795B48]">
                Demonstration Business Data
              </span>
              <button
                type="button"
                onClick={logout}
                className="lg:hidden px-3 py-1.5 rounded-lg border border-[#D9C2A5] text-xs font-medium"
              >
                Logout
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lg:hidden bg-[#FFFFFF] rounded-xl border border-[#D9C2A5] p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left ${
                    section === item.id ? 'bg-[#49372F] text-[#F8F3EB]' : 'bg-[#F8F3EB] text-[#49372F]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {loadingAdmin && (
            <div className="text-xs text-[#795B48]">Synchronizing bakery records...</div>
          )}

          {/* SECTION A: OVERVIEW */}
          {section === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Orders (Demo)', value: orders.length + 140 },
                  { label: 'Total Customers', value: customers.length + 86 },
                  { label: "Today's Sales (Demo)", value: formatINR(24680 + totalRevenue) },
                  { label: 'Monthly Revenue (Demo)', value: formatINR(682000 + totalRevenue) },
                  { label: 'Active / Pending Orders', value: pendingOrdersCount },
                  { label: 'Custom Cake Requests', value: customCakes.length },
                  { label: 'Table Reservations', value: reservations.length },
                  { label: 'Bestselling SKUs', value: products.filter((p) => p.bestseller).length },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-4 sm:p-5"
                  >
                    <p className="text-xs text-[#795B48] mb-1.5">{kpi.label}</p>
                    <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#49372F] tabular-nums">
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-xl font-semibold text-[#49372F]">
                      Recent Orders
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSection('orders')}
                      className="text-xs underline text-[#795B48]"
                    >
                      Manage All
                    </button>
                  </div>
                  <div className="divide-y divide-[#D9C2A5]/40">
                    {orders.slice(0, 5).map((o) => (
                      <div key={o.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="font-semibold text-[#49372F]">
                            <span className="font-mono">{o.id}</span> · {o.customerName}
                          </p>
                          <p className="text-[#795B48]">{o.orderType} · {o.status}</p>
                        </div>
                        <span className="font-semibold tabular-nums text-[#49372F]">
                          {formatINR(o.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-xl font-semibold text-[#49372F]">
                      Bestselling Menu Creations
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSection('products')}
                      className="text-xs underline text-[#795B48]"
                    >
                      Edit Catalog
                    </button>
                  </div>
                  <div className="divide-y divide-[#D9C2A5]/40">
                    {products
                      .filter((p) => p.bestseller)
                      .slice(0, 5)
                      .map((p) => (
                        <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-9 h-9 rounded-md object-cover shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-[#49372F] truncate">{p.name}</p>
                              <p className="text-[#795B48]">{p.category}</p>
                            </div>
                          </div>
                          <span className="font-semibold tabular-nums">{formatINR(p.price)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: PRODUCT MANAGEMENT */}
          {section === 'products' && (
            <div className="space-y-4">
              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[#795B48] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filter menu items..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewProduct(true);
                    setEditingProduct({
                      name: '',
                      category: 'Signature Cakes',
                      price: 899,
                      description: '',
                      image: IMAGES.belgianChocolate,
                      available: true,
                      bestseller: false,
                      seasonal: false,
                      egglessOption: true,
                      variants: ['500g', '1kg (+₹750)'],
                    });
                  }}
                  className="h-9 px-4 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add New Product
                </button>
              </div>

              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#D9C2A5]/60 text-[#795B48]">
                      <th className="py-3 px-4 font-medium">Creation</th>
                      <th className="py-3 px-4 font-medium">Category</th>
                      <th className="py-3 px-4 font-medium text-right">Price</th>
                      <th className="py-3 px-4 font-medium">Flags</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9C2A5]/40">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F8F3EB]/60">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <span className="font-medium text-[#49372F]">{p.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[#795B48]">{p.category}</td>
                        <td className="py-2.5 px-4 text-right font-semibold tabular-nums">
                          {formatINR(p.price)}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleQuickToggleProduct(p, 'available')}
                              className={`px-2 py-1 rounded border ${
                                p.available
                                  ? 'bg-[#A8B39C]/25 border-[#A8B39C] text-[#49372F]'
                                  : 'bg-[#F8F3EB] border-[#D9C2A5] text-[#795B48]'
                              }`}
                            >
                              {p.available ? 'In Stock' : 'Sold Out'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickToggleProduct(p, 'bestseller')}
                              className={`px-2 py-1 rounded border ${
                                p.bestseller
                                  ? 'bg-[#C6A477]/25 border-[#C6A477] text-[#49372F]'
                                  : 'bg-[#FFFFFF] border-[#D9C2A5] text-[#795B48]'
                              }`}
                            >
                              Bestseller
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickToggleProduct(p, 'seasonal')}
                              className={`px-2 py-1 rounded border ${
                                p.seasonal
                                  ? 'bg-[#D9B9AC]/35 border-[#D9B9AC] text-[#49372F]'
                                  : 'bg-[#FFFFFF] border-[#D9C2A5] text-[#795B48]'
                              }`}
                            >
                              Seasonal
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewProduct(false);
                              setEditingProduct(p);
                            }}
                            aria-label={`Edit ${p.name}`}
                            className="p-1.5 text-[#795B48] hover:text-[#49372F]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            aria-label={`Delete ${p.name}`}
                            className="p-1.5 text-[#795B48] hover:text-[#49372F]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION C: ORDER MANAGEMENT */}
          {section === 'orders' && (
            <div className="space-y-4">
              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-4 flex flex-col sm:flex-row gap-3 justify-between">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search Order ID or Customer..."
                  className="h-9 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs sm:w-64"
                />
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs"
                >
                  <option value="All">All Order Statuses</option>
                  {ORDER_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#D9C2A5]/60 text-[#795B48]">
                      <th className="py-3 px-4 font-medium">Order ID</th>
                      <th className="py-3 px-4 font-medium">Customer</th>
                      <th className="py-3 px-4 font-medium">Type &amp; Schedule</th>
                      <th className="py-3 px-4 font-medium">Payment (Demo)</th>
                      <th className="py-3 px-4 font-medium text-right">Total</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9C2A5]/40">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#F8F3EB]/60">
                        <td className="py-3 px-4 font-mono font-semibold">{o.id}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#49372F]">{o.customerName}</p>
                          <p className="text-[#795B48]">{o.phone}</p>
                        </td>
                        <td className="py-3 px-4 text-[#795B48]">
                          {o.orderType}
                          <span className="block text-[11px]">{o.deliveryDate} · {o.deliveryTimeSlot}</span>
                        </td>
                        <td className="py-3 px-4 text-[#795B48]">{o.paymentStatus}</td>
                        <td className="py-3 px-4 text-right font-semibold tabular-nums">
                          {formatINR(o.total)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={o.status}
                            onChange={(e) =>
                              handleUpdateOrderStatus(o.id, e.target.value as OrderStatus)
                            }
                            className="h-8 px-2 rounded border border-[#D9C2A5] bg-[#F8F3EB] text-xs"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(o)}
                            className="px-2.5 py-1 rounded border border-[#D9C2A5] text-[#49372F] hover:bg-[#F8F3EB]"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION D: CUSTOM CAKE MANAGEMENT */}
          {section === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {customCakes.map((cc) => (
                <div
                  key={cc.id}
                  className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-mono text-[#795B48]">
                        {cc.id} · {cc.occasion} · {cc.deliveryDate}
                      </p>
                      <h3 className="font-serif text-xl font-semibold text-[#49372F]">
                        {cc.flavour} ({cc.size})
                      </h3>
                      <p className="text-xs text-[#795B48]">
                        {cc.customerName} · {cc.mobile}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#F8F3EB] border border-[#D9C2A5] text-xs font-medium">
                      {cc.status}
                    </span>
                  </div>
                  {cc.referenceImage && (
                    <div className="h-36 rounded-lg overflow-hidden bg-[#F8F3EB]">
                      <SafeImage
                        src={cc.referenceImage}
                        alt={cc.designPreference}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-[#795B48]">{cc.designPreference}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#D9C2A5]/40 text-xs">
                    <span className="tabular-nums font-semibold text-[#49372F]">
                      {cc.quotationAmount
                        ? `Quote: ${formatINR(cc.quotationAmount)}`
                        : `Est: ${formatINR(cc.estimatedPrice)}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingCustomCake(cc)}
                      className="px-3 py-1.5 rounded-lg bg-[#49372F] text-[#F8F3EB] font-medium"
                    >
                      Manage Quote &amp; Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SECTION E: CUSTOMER MANAGEMENT & ENQUIRIES */}
          {section === 'customers' && (
            <div className="space-y-6">
              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-5">
                <h2 className="font-serif text-2xl font-semibold text-[#49372F] mb-4">
                  Registered Customers
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D9C2A5]/60 text-[#795B48]">
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Mobile</th>
                        <th className="py-2.5 px-3 text-right">Orders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9C2A5]/40">
                      {customers.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2.5 px-3 font-medium text-[#49372F]">{c.name}</td>
                          <td className="py-2.5 px-3 text-[#795B48]">{c.email}</td>
                          <td className="py-2.5 px-3 text-[#795B48]">{c.mobile}</td>
                          <td className="py-2.5 px-3 text-right tabular-nums">
                            {orders.filter((o) => o.email.toLowerCase() === c.email.toLowerCase()).length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-5 space-y-3">
                <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                  Event &amp; Corporate Enquiries
                </h2>
                {enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="p-4 rounded-xl bg-[#F8F3EB] border border-[#D9C2A5]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-mono text-[#795B48]">
                        {enq.id} · {enq.type}
                      </p>
                      <p className="text-sm font-semibold text-[#49372F]">
                        {enq.name} ({enq.email})
                      </p>
                      <p className="text-xs text-[#795B48] mt-1">{enq.message}</p>
                    </div>
                    <select
                      value={enq.status}
                      onChange={async (e) => {
                        if (!token) return;
                        await fetch(`/api/admin/enquiries/${enq.id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ status: e.target.value }),
                        });
                        fetchOverview();
                      }}
                      className="h-9 px-3 rounded-lg bg-[#FFFFFF] border border-[#D9C2A5] text-xs shrink-0"
                    >
                      <option>New</option>
                      <option>Reviewed</option>
                      <option>Responded</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION F: CAFE RESERVATIONS */}
          {section === 'reservations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                  Cafe Table Reservations
                </h2>
                <button
                  type="button"
                  onClick={() => setNewResModal(true)}
                  className="h-9 px-4 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Reservation
                </button>
              </div>
              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#D9C2A5]/60 text-[#795B48]">
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Guest</th>
                      <th className="py-3 px-4">Schedule</th>
                      <th className="py-3 px-4">Guests &amp; Zone</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9C2A5]/40">
                    {reservations.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 px-4 font-mono">{r.id}</td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-[#49372F]">{r.customerName}</p>
                          <p className="text-[#795B48]">{r.mobile}</p>
                        </td>
                        <td className="py-3 px-4">
                          {r.date} · {r.time}
                        </td>
                        <td className="py-3 px-4">
                          {r.guests} Guests · {r.seatingPreference}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={r.status}
                            onChange={(e) =>
                              handleUpdateReservation(r.id, e.target.value as ReservationStatus)
                            }
                            className="h-8 px-2 rounded border border-[#D9C2A5] bg-[#F8F3EB] text-xs"
                          >
                            {RESERVATION_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteReservation(r.id)}
                            aria-label="Delete reservation"
                            className="p-1.5 text-[#795B48] hover:text-[#49372F]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION G: SALES & ANALYTICS */}
          {section === 'analytics' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#FFFFFF] border border-[#D9C2A5]/70 text-xs text-[#795B48]">
                Note: Charts below illustrate fictional demonstration sales trends combined with live
                orders recorded during this demonstration session.
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Sales Chart */}
                <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-6">
                  <h3 className="font-serif text-xl font-semibold text-[#49372F] mb-5">
                    Daily Sales (Demo INR)
                  </h3>
                  <div className="flex items-end gap-3 h-48 pt-4">
                    {dailySalesDemo.map((d) => {
                      const pct = Math.round((d.amount / 50000) * 100);
                      return (
                        <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <span className="text-[10px] font-mono text-[#795B48] tabular-nums">
                            ₹{(d.amount / 1000).toFixed(1)}k
                          </span>
                          <div
                            style={{ height: `${pct}%` }}
                            className="w-full rounded-t-lg bg-[#C6A477] transition-all"
                          />
                          <span className="text-xs font-medium text-[#49372F]">{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Monthly Revenue Chart */}
                <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-6">
                  <h3 className="font-serif text-xl font-semibold text-[#49372F] mb-5">
                    Monthly Revenue Trend (Demo INR)
                  </h3>
                  <div className="flex items-end gap-3 h-48 pt-4">
                    {monthlyRevenueDemo.map((m) => {
                      const pct = Math.min(100, Math.round((m.amount / 800000) * 100));
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                          <span className="text-[10px] font-mono text-[#795B48] tabular-nums">
                            ₹{(m.amount / 100000).toFixed(1)}L
                          </span>
                          <div
                            style={{ height: `${pct}%` }}
                            className="w-full rounded-t-lg bg-[#49372F] transition-all"
                          />
                          <span className="text-xs font-medium text-[#49372F]">{m.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-6 space-y-4">
                <h3 className="font-serif text-xl font-semibold text-[#49372F]">
                  Menu Catalog Distribution by Category
                </h3>
                <div className="space-y-3">
                  {categoryDistribution.map((c) => {
                    const width = Math.round((c.count / Math.max(1, products.length)) * 100);
                    return (
                      <div key={c.category} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-[#49372F]">{c.category}</span>
                          <span className="text-[#795B48] tabular-nums">
                            {c.count} items ({width}%)
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-[#F8F3EB] overflow-hidden">
                          <div
                            style={{ width: `${width}%` }}
                            className="h-full bg-[#C6A477] rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* SECTION H: CONTENT MANAGEMENT */}
          {section === 'cms' && cmsEdit && (
            <form
              onSubmit={handleSaveCms}
              className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-6 space-y-5 max-w-3xl"
            >
              <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                Storefront Content Management
              </h2>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Homepage Hero Headline
                </label>
                <input
                  type="text"
                  value={cmsEdit.heroHeadline}
                  onChange={(e) => setCmsEdit({ ...cmsEdit, heroHeadline: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Homepage Hero Subheadline
                </label>
                <textarea
                  rows={2}
                  value={cmsEdit.heroSubheadline}
                  onChange={(e) => setCmsEdit({ ...cmsEdit, heroSubheadline: e.target.value })}
                  className="w-full p-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                  Top Promotional Banner Text
                </label>
                <input
                  type="text"
                  value={cmsEdit.promoBannerText}
                  onChange={(e) => setCmsEdit({ ...cmsEdit, promoBannerText: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                />
                <label className="inline-flex items-center gap-2 text-xs text-[#795B48] mt-2">
                  <input
                    type="checkbox"
                    checked={cmsEdit.promoBannerActive}
                    onChange={(e) =>
                      setCmsEdit({ ...cmsEdit, promoBannerActive: e.target.checked })
                    }
                    className="accent-[#49372F]"
                  />
                  Show top promotional banner
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Seasonal Section Title
                  </label>
                  <input
                    type="text"
                    value={cmsEdit.seasonalTitle}
                    onChange={(e) => setCmsEdit({ ...cmsEdit, seasonalTitle: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                    Opening Hours
                  </label>
                  <input
                    type="text"
                    value={cmsEdit.openingHours}
                    onChange={(e) => setCmsEdit({ ...cmsEdit, openingHours: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="h-10 px-6 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
              >
                Publish CMS Changes
              </button>
            </form>
          )}

          {/* SECTION I: SETTINGS & COUPONS */}
          {section === 'settings' && cmsEdit && (
            <div className="space-y-6 max-w-4xl">
              <form
                onSubmit={handleSaveCms}
                className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-6 space-y-4"
              >
                <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                  Bakery, Delivery &amp; Tax Settings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Delivery Fee (INR)
                    </label>
                    <input
                      type="number"
                      value={cmsEdit.deliveryFee}
                      onChange={(e) =>
                        setCmsEdit({ ...cmsEdit, deliveryFee: Number(e.target.value) || 0 })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Free Delivery Threshold (INR)
                    </label>
                    <input
                      type="number"
                      value={cmsEdit.freeDeliveryThreshold}
                      onChange={(e) =>
                        setCmsEdit({
                          ...cmsEdit,
                          freeDeliveryThreshold: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      value={cmsEdit.taxPercent}
                      onChange={(e) =>
                        setCmsEdit({ ...cmsEdit, taxPercent: Number(e.target.value) || 0 })
                      }
                      className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm tabular-nums"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Cafe Phone (Demo)
                    </label>
                    <input
                      type="text"
                      value={cmsEdit.phoneDemo}
                      onChange={(e) => setCmsEdit({ ...cmsEdit, phoneDemo: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#49372F] mb-1.5">
                      Cafe Email (Demo)
                    </label>
                    <input
                      type="text"
                      value={cmsEdit.emailDemo}
                      onChange={(e) => setCmsEdit({ ...cmsEdit, emailDemo: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="h-10 px-6 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
                >
                  Save Store Settings
                </button>
              </form>

              <div className="bg-[#FFFFFF] rounded-xl border border-[#D9C2A5]/70 p-6 space-y-4">
                <h2 className="font-serif text-2xl font-semibold text-[#49372F]">
                  Coupon Code Management
                </h2>
                <div className="space-y-2.5">
                  {coupons.map((c) => (
                    <div
                      key={c.code}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5]/60 text-xs"
                    >
                      <div>
                        <span className="font-mono font-semibold text-[#49372F]">{c.code}</span>
                        <span className="text-[#795B48] ml-2">
                          {c.type === 'percent' ? `${c.value}% off` : `${formatINR(c.value)} off`} ·
                          Min {formatINR(c.minOrder)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c)}
                          className={`px-2.5 py-1 rounded border ${
                            c.active
                              ? 'bg-[#A8B39C]/25 border-[#A8B39C]'
                              : 'bg-[#FFFFFF] border-[#D9C2A5]'
                          }`}
                        >
                          {c.active ? 'Active' : 'Paused'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.code)}
                          className="p-1 text-[#795B48] hover:text-[#49372F]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={handleCreateCoupon}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-3 border-t border-[#D9C2A5]/50"
                >
                  <input
                    required
                    type="text"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    placeholder="CODE"
                    className="h-9 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs font-mono uppercase"
                  />
                  <select
                    value={newCoupon.type}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, type: e.target.value as 'percent' | 'flat' })
                    }
                    className="h-9 px-2 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs"
                  >
                    <option value="percent">% Discount</option>
                    <option value="flat">Flat ₹ Off</option>
                  </select>
                  <input
                    required
                    type="number"
                    value={newCoupon.value}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, value: Number(e.target.value) || 0 })
                    }
                    placeholder="Value"
                    className="h-9 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs tabular-nums"
                  />
                  <input
                    required
                    type="number"
                    value={newCoupon.minOrder}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, minOrder: Number(e.target.value) || 0 })
                    }
                    placeholder="Min Order"
                    className="h-9 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-xs tabular-nums"
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
                  >
                    Add Coupon
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setEditingProduct(null)}
        >
          <form
            onSubmit={handleSaveProduct}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FFFFFF] rounded-2xl p-6 space-y-4 border border-[#D9C2A5] max-h-[88vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
                {isNewProduct ? 'Add Menu Creation' : 'Edit Menu Creation'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F8F3EB] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Product Name *</label>
              <input
                required
                type="text"
                value={editingProduct.name || ''}
                onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Category</label>
                <select
                  value={editingProduct.category || 'Signature Cakes'}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      category: e.target.value as ProductCategory,
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Price (INR) *</label>
                <input
                  required
                  type="number"
                  value={editingProduct.price ?? 0}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                  }
                  className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Photography Asset</label>
              <select
                value={editingProduct.image || IMAGES.belgianChocolate}
                onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
              >
                {IMAGE_PRESETS.map((img) => (
                  <option key={img.label} value={img.url}>
                    {img.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Description</label>
              <textarea
                rows={3}
                value={editingProduct.description || ''}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, description: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 rounded-lg border border-[#D9C2A5] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#FFFFFF] rounded-2xl p-6 space-y-4 border border-[#D9C2A5]"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
                Order {selectedOrder.id}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full hover:bg-[#F8F3EB] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-[#795B48] space-y-1">
              <p>
                <strong className="text-[#49372F]">Customer:</strong> {selectedOrder.customerName} (
                {selectedOrder.phone})
              </p>
              <p>
                <strong className="text-[#49372F]">Fulfilment:</strong> {selectedOrder.orderType}{' '}
                {selectedOrder.address ? `— ${selectedOrder.address}, ${selectedOrder.city}` : ''}
              </p>
              <p>
                <strong className="text-[#49372F]">Schedule:</strong> {selectedOrder.deliveryDate} ·{' '}
                {selectedOrder.deliveryTimeSlot}
              </p>
              <p>
                <strong className="text-[#49372F]">Payment:</strong> {selectedOrder.paymentMethod} (
                {selectedOrder.paymentStatus})
              </p>
            </div>
            <div className="bg-[#F8F3EB] rounded-xl p-4 space-y-2 text-xs">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {item.quantity} × {item.name} ({item.variant || 'Standard'})
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#D9C2A5]/60 flex justify-between font-semibold text-sm text-[#49372F]">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Cake Edit Modal */}
      {editingCustomCake && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setEditingCustomCake(null)}
        >
          <form
            onSubmit={handleSaveCustomCake}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FFFFFF] rounded-2xl p-6 space-y-4 border border-[#D9C2A5]"
          >
            <h3 className="font-serif text-2xl font-semibold text-[#49372F]">
              Update {editingCustomCake.id}
            </h3>
            <div>
              <label className="block text-xs font-semibold mb-1">Status</label>
              <select
                value={editingCustomCake.status}
                onChange={(e) =>
                  setEditingCustomCake({
                    ...editingCustomCake,
                    status: e.target.value as CustomCakeStatus,
                  })
                }
                className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
              >
                {CUSTOM_CAKE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Quotation Amount (INR)</label>
              <input
                type="number"
                value={editingCustomCake.quotationAmount ?? editingCustomCake.estimatedPrice}
                onChange={(e) =>
                  setEditingCustomCake({
                    ...editingCustomCake,
                    quotationAmount: Number(e.target.value),
                  })
                }
                className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Bakery Notes for Guest</label>
              <textarea
                rows={3}
                value={editingCustomCake.adminNotes || ''}
                onChange={(e) =>
                  setEditingCustomCake({ ...editingCustomCake, adminNotes: e.target.value })
                }
                className="w-full p-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCustomCake(null)}
                className="px-4 py-2 rounded-lg border border-[#D9C2A5] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
              >
                Save Update
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Reservation Modal */}
      {newResModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setNewResModal(false)}
        >
          <form
            onSubmit={handleAddReservation}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FFFFFF] rounded-2xl p-6 space-y-4 border border-[#D9C2A5]"
          >
            <h3 className="font-serif text-2xl font-semibold text-[#49372F]">Add Table Booking</h3>
            <input
              required
              type="text"
              placeholder="Guest Name"
              value={newResForm.customerName}
              onChange={(e) => setNewResForm({ ...newResForm, customerName: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
            />
            <input
              required
              type="tel"
              placeholder="Mobile Number"
              value={newResForm.mobile}
              onChange={(e) => setNewResForm({ ...newResForm, mobile: e.target.value })}
              className="w-full h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={newResForm.date}
                onChange={(e) => setNewResForm({ ...newResForm, date: e.target.value })}
                className="h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
              />
              <input
                type="number"
                min={1}
                value={newResForm.guests}
                onChange={(e) => setNewResForm({ ...newResForm, guests: Number(e.target.value) })}
                className="h-10 px-3 rounded-lg bg-[#F8F3EB] border border-[#D9C2A5] text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewResModal(false)}
                className="px-4 py-2 rounded-lg border border-[#D9C2A5] text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#49372F] text-[#F8F3EB] text-xs font-medium"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
