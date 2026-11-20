import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  INITIAL_CMS,
  INITIAL_COUPONS,
  INITIAL_CUSTOM_CAKES,
  INITIAL_ENQUIRIES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_RESERVATIONS,
} from './src/data/seedData';
import type {
  Coupon,
  CustomCakeRequest,
  Enquiry,
  Order,
  OrderStatus,
  Product,
  StoreData,
  TableReservation,
  UserProfile,
} from './src/types/bakery';

dotenv.config();

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update('maison-eclat-atelier-secret-2026').digest('hex');

interface StoredUser extends UserProfile {
  passwordHash: string;
}

function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, s, 64).toString('hex');
  return `${s}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const hashBuf = Buffer.from(hash, 'hex');
  if (derived.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(derived, hashBuf);
}

function signToken(payload: { id: string; role: 'customer' | 'admin'; exp: number }): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): { id: string; role: 'customer' | 'admin'; exp: number } | null {
  try {
    const [encoded, sig] = token.split('.');
    if (!encoded || !sig) return null;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload?.id || !payload?.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

let cachedStore: StoreData | null = null;

function loadStore(): StoreData {
  if (cachedStore) return cachedStore;
  ensureDataDir();
  if (!fs.existsSync(STORE_FILE)) {
    const initial: StoreData = {
      products: INITIAL_PRODUCTS,
      orders: INITIAL_ORDERS,
      customCakes: INITIAL_CUSTOM_CAKES,
      reservations: INITIAL_RESERVATIONS,
      enquiries: INITIAL_ENQUIRIES,
      coupons: INITIAL_COUPONS,
      newsletterSubscribers: [],
      cms: INITIAL_CMS,
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2));
    cachedStore = initial;
    return initial;
  }
  const raw = fs.readFileSync(STORE_FILE, 'utf8');
  const parsed = JSON.parse(raw) as StoreData;
  const seedProductMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
  let updated = false;

  parsed.products = parsed.products.map((p) => {
    const seed = seedProductMap.get(p.id);
    if (!seed) return p;
    const next = { ...p };
    let changed = false;
    if (next.image !== seed.image) {
      next.image = seed.image;
      changed = true;
    }
    if (next.name !== seed.name) {
      next.name = seed.name;
      changed = true;
    }
    if (next.description !== seed.description) {
      next.description = seed.description;
      changed = true;
    }
    if ((next.notes || '') !== (seed.notes || '')) {
      next.notes = seed.notes;
      changed = true;
    }
    if (JSON.stringify(next.variants || []) !== JSON.stringify(seed.variants || [])) {
      next.variants = seed.variants;
      changed = true;
    }
    if (changed) {
      updated = true;
      return next;
    }
    return p;
  });

  parsed.orders = (parsed.orders || []).map((o) => {
    if (o.paymentMethod && /café/i.test(o.paymentMethod)) {
      updated = true;
      return { ...o, paymentMethod: o.paymentMethod.replace(/café/gi, 'Cafe') };
    }
    return o;
  });

  parsed.customCakes = (parsed.customCakes || []).map((cc) => {
    if ((cc.status as string) === 'In Atelier') {
      updated = true;
      return { ...cc, status: 'In Preparation' };
    }
    return cc;
  });

  const cmsSerialized = JSON.stringify(parsed.cms || {});
  if (
    /patisserie|atelier|salon|coffret|entremet|chantilly|french macarons|viennoiserie|concierge|café/i.test(
      cmsSerialized
    )
  ) {
    parsed.cms = {
      ...INITIAL_CMS,
      deliveryFee: parsed.cms?.deliveryFee ?? INITIAL_CMS.deliveryFee,
      freeDeliveryThreshold: parsed.cms?.freeDeliveryThreshold ?? INITIAL_CMS.freeDeliveryThreshold,
      taxPercent: parsed.cms?.taxPercent ?? INITIAL_CMS.taxPercent,
    };
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(STORE_FILE, JSON.stringify(parsed, null, 2));
  }
  cachedStore = parsed;
  return parsed;
}

function saveStore(store: StoreData) {
  ensureDataDir();
  cachedStore = store;
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2));
}

function loadUsers(): StoredUser[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    const initialUsers: StoredUser[] = [
      {
        id: 'cust-demo-1',
        name: 'Ananya Sharma',
        email: 'ananya.demo@maisoneclat.in',
        mobile: '9810000142',
        role: 'customer',
        passwordHash: hashPassword('CustomerDemo@2026'),
        savedAddresses: [
          {
            id: 'addr-1',
            label: 'Home — Sector 100',
            address: 'Tower B-1402, Lotus Boulevard, Sector 100',
            city: 'Noida',
            pinCode: '201304',
          },
          {
            id: 'addr-2',
            label: 'Studio — Sector 62',
            address: 'Suite 408, Stellar IT Park, Sector 62',
            city: 'Noida',
            pinCode: '201309',
          },
        ],
        wishlist: ['cake-belgian-chocolate', 'cake-ny-cheesecake', 'pastry-macarons'],
        notifications: [
          {
            id: 'notif-1',
            title: 'Order ME-1042 is currently Baking in our Sector 62 kitchen.',
            date: 'Today · 9:10 AM',
            read: false,
          },
          {
            id: 'notif-2',
            title: 'Quotation received for Custom Cake Request CC-2081 (₹3,850).',
            date: 'Yesterday · 6:40 PM',
            read: false,
          },
        ],
        createdAt: '2026-10-01T10:00:00Z',
      },
      {
        id: 'admin-demo-1',
        name: 'Chef Julian Brooks (Admin)',
        email: 'admin@maisoneclat-demo.in',
        mobile: '9810000001',
        role: 'admin',
        passwordHash: hashPassword('AdminBakery@2026'),
        savedAddresses: [],
        wishlist: [],
        notifications: [],
        createdAt: '2026-09-01T08:00:00Z',
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
    return initialUsers;
  }
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) as StoredUser[];
  let changed = false;
  const migrated = users.map((u) => {
    if (u.id === 'admin-demo-1' && /julien/i.test(u.name)) {
      changed = true;
      return {
        ...u,
        name: 'Chef Julian Brooks (Admin)',
        passwordHash: hashPassword('AdminBakery@2026'),
      };
    }
    return u;
  });
  if (changed) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(migrated, null, 2));
  }
  return migrated;
}

function saveUsers(users: StoredUser[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function sanitizeUser(u: StoredUser): UserProfile {
  const { passwordHash: _ph, ...safe } = u;
  return safe;
}

function getAuthUser(req: express.Request): StoredUser | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const users = loadUsers();
  return users.find((u) => u.id === payload.id) || null;
}

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Initialize store & users on boot
  loadStore();
  loadUsers();

  // Public bootstrap
  app.get('/api/bootstrap', (_req, res) => {
    const store = loadStore();
    res.json({
      products: store.products,
      cms: store.cms,
      coupons: store.coupons.filter((c) => c.active),
    });
  });

  // Auth routes
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password, expectedRole } = req.body as {
      identifier?: string;
      password?: string;
      expectedRole?: 'customer' | 'admin';
    };
    if (!identifier || !password) {
      res.status(400).json({ error: 'Email/mobile and password are required.' });
      return;
    }
    const normalized = identifier.trim().toLowerCase();
    const digits = identifier.replace(/\D/g, '');
    const users = loadUsers();
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === normalized ||
        (digits.length >= 10 && u.mobile.replace(/\D/g, '').endsWith(digits.slice(-10)))
    );
    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid credentials. Please check your email/mobile and password.' });
      return;
    }
    if (expectedRole && user.role !== expectedRole) {
      res.status(403).json({
        error:
          expectedRole === 'admin'
            ? 'This portal requires administrator privileges.'
            : 'Please use the Admin Portal to sign in with an administrator account.',
      });
      return;
    }
    const token = signToken({
      id: user.id,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });
    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/register', (req, res) => {
    const { name, email, mobile, password } = req.body as {
      name?: string;
      email?: string;
      mobile?: string;
      password?: string;
    };
    if (!name || !email || !mobile || !password || password.length < 6) {
      res.status(400).json({ error: 'Please complete all fields (password minimum 6 characters).' });
      return;
    }
    const users = loadUsers();
    const exists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    const newUser: StoredUser = {
      id: `cust-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      role: 'customer',
      passwordHash: hashPassword(password),
      savedAddresses: [],
      wishlist: [],
      notifications: [
        {
          id: `notif-${Date.now()}`,
          title: 'Welcome to Maison Éclat. Enjoy complimentary tasting updates in your dashboard.',
          date: 'Just now',
          read: false,
        },
      ],
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    const token = signToken({
      id: newUser.id,
      role: 'customer',
      exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });
    res.status(201).json({ token, user: sanitizeUser(newUser) });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body as { email?: string };
    if (!email) {
      res.status(400).json({ error: 'Please enter your registered email address.' });
      return;
    }
    res.json({
      message:
        'Demo mode: If this email is registered, a password recovery link would be dispatched. Use the demo credentials panel to sign in immediately.',
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  });

  // Public Order Tracking
  app.get('/api/orders/:id', (req, res) => {
    const store = loadStore();
    const order = store.orders.find((o) => o.id.toLowerCase() === req.params.id.trim().toLowerCase());
    if (!order) {
      res.status(404).json({ error: 'Order not found. Try demo IDs ME-1042, ME-1043, or ME-1044.' });
      return;
    }
    res.json({ order });
  });

  // Place Order (Demo Mode)
  app.post('/api/orders', (req, res) => {
    const store = loadStore();
    const user = getAuthUser(req);
    const body = req.body;
    if (!body.customerName || !body.phone || !body.email || !Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Customer details and at least one item are required.' });
      return;
    }
    const subtotal = body.items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + Number(item.price) * Number(item.quantity),
      0
    );
    let discount = 0;
    let appliedCode: string | undefined;
    if (body.couponCode) {
      const coupon = store.coupons.find(
        (c) => c.active && c.code.toUpperCase() === String(body.couponCode).trim().toUpperCase()
      );
      if (coupon && subtotal >= coupon.minOrder) {
        appliedCode = coupon.code;
        discount = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
      }
    }
    const orderType = body.orderType === 'Store Pickup' ? 'Store Pickup' : 'Home Delivery';
    const deliveryFee =
      orderType === 'Store Pickup' || subtotal >= store.cms.freeDeliveryThreshold ? 0 : store.cms.deliveryFee;
    const taxable = Math.max(0, subtotal - discount);
    const tax = Math.round((taxable * store.cms.taxPercent) / 100);
    const total = taxable + deliveryFee + tax;

    const nextNum = 1046 + store.orders.length;
    const newOrder: Order = {
      id: `ME-${nextNum}`,
      customerId: user?.id,
      customerName: String(body.customerName).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email).trim(),
      orderType,
      address: body.address ? String(body.address).trim() : undefined,
      city: body.city ? String(body.city).trim() : undefined,
      pinCode: body.pinCode ? String(body.pinCode).trim() : undefined,
      deliveryDate: String(body.deliveryDate || new Date().toISOString().slice(0, 10)),
      deliveryTimeSlot: String(body.deliveryTimeSlot || '4:00 PM – 6:00 PM'),
      instructions: body.instructions ? String(body.instructions).trim() : undefined,
      paymentMethod: String(body.paymentMethod || 'Demo Card / UPI (Simulated)'),
      paymentStatus: 'Demo Mode — Authorised',
      items: body.items,
      subtotal,
      discount,
      couponCode: appliedCode,
      deliveryFee,
      tax,
      total,
      status: 'Order Received',
      createdAt: new Date().toISOString(),
      isDemo: true,
    };

    store.orders.unshift(newOrder);
    saveStore(store);
    res.status(201).json({ order: newOrder });
  });

  // Custom Cake Request
  app.post('/api/custom-cakes', (req, res) => {
    const store = loadStore();
    const user = getAuthUser(req);
    const b = req.body;
    if (!b.customerName || !b.mobile || !b.email || !b.flavour || !b.size) {
      res.status(400).json({ error: 'Please provide your contact details, cake flavour, and size.' });
      return;
    }
    const kgMatch = parseFloat(String(b.size)) || 1;
    const baseRate = b.flavour === 'Biscoff' || b.flavour === 'Blueberry' ? 1950 : 1750;
    const estimatedPrice = Math.round(kgMatch * baseRate);
    const newRequest: CustomCakeRequest = {
      id: `CC-${2083 + store.customCakes.length}`,
      customerId: user?.id,
      customerName: String(b.customerName).trim(),
      mobile: String(b.mobile).trim(),
      email: String(b.email).trim(),
      flavour: String(b.flavour),
      size: String(b.size),
      shape: String(b.shape || 'Round Classic'),
      designPreference: String(b.designPreference || 'Signature Bakery Finish'),
      occasion: String(b.occasion || 'Birthday'),
      eggless: Boolean(b.eggless),
      messageOnCake: String(b.messageOnCake || ''),
      deliveryDate: String(b.deliveryDate || ''),
      deliveryTime: String(b.deliveryTime || '5:00 PM'),
      instructions: String(b.instructions || ''),
      referenceImage: typeof b.referenceImage === 'string' ? b.referenceImage : undefined,
      estimatedPrice,
      status: 'Enquiry Received',
      createdAt: new Date().toISOString(),
      isDemo: true,
    };
    store.customCakes.unshift(newRequest);
    saveStore(store);
    res.status(201).json({ customCake: newRequest });
  });

  // Public Custom Cake Lookup
  app.get('/api/custom-cakes/:id', (req, res) => {
    const store = loadStore();
    const customCake = store.customCakes.find(
      (c) => c.id.toLowerCase() === req.params.id.trim().toLowerCase()
    );
    if (!customCake) {
      res.status(404).json({ error: 'Custom cake request not found. Try demo IDs CC-2081 or CC-2082.' });
      return;
    }
    res.json({ customCake });
  });

  // Public Reservation Lookup
  app.get('/api/reservations/:id', (req, res) => {
    const store = loadStore();
    const reservation = store.reservations.find(
      (r) => r.id.toLowerCase() === req.params.id.trim().toLowerCase()
    );
    if (!reservation) {
      res.status(404).json({ error: 'Reservation not found. Try demo IDs TR-501 or TR-502.' });
      return;
    }
    res.json({ reservation });
  });

  // Table Reservations
  app.post('/api/reservations', (req, res) => {
    const store = loadStore();
    const user = getAuthUser(req);
    const b = req.body;
    if (!b.customerName || !b.mobile || !b.email || !b.date || !b.time) {
      res.status(400).json({ error: 'Name, mobile, email, date, and time are required.' });
      return;
    }
    const reservation: TableReservation = {
      id: `TR-${503 + store.reservations.length}`,
      customerId: user?.id,
      customerName: String(b.customerName).trim(),
      mobile: String(b.mobile).trim(),
      email: String(b.email).trim(),
      date: String(b.date),
      time: String(b.time),
      guests: Number(b.guests) || 2,
      seatingPreference: String(b.seatingPreference || 'Sunlit Window Lounge'),
      specialRequests: b.specialRequests ? String(b.specialRequests).trim() : undefined,
      status: 'Requested',
      createdAt: new Date().toISOString(),
      isDemo: true,
    };
    store.reservations.unshift(reservation);
    saveStore(store);
    res.status(201).json({ reservation });
  });

  // Enquiries
  app.post('/api/enquiries', (req, res) => {
    const store = loadStore();
    const b = req.body;
    if (!b.name || !b.email || !b.message) {
      res.status(400).json({ error: 'Name, email, and enquiry details are required.' });
      return;
    }
    const enquiry: Enquiry = {
      id: `ENQ-${303 + store.enquiries.length}`,
      type: String(b.type || 'General enquiries'),
      name: String(b.name).trim(),
      email: String(b.email).trim(),
      mobile: String(b.mobile || '').trim(),
      message: String(b.message).trim(),
      status: 'New',
      createdAt: new Date().toISOString(),
    };
    store.enquiries.unshift(enquiry);
    saveStore(store);
    res.status(201).json({ enquiry });
  });

  // Newsletter
  app.post('/api/newsletter', (req, res) => {
    const { email } = req.body as { email?: string };
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    const store = loadStore();
    const normalized = email.trim().toLowerCase();
    if (!store.newsletterSubscribers.some((s) => s.email === normalized)) {
      store.newsletterSubscribers.push({ email: normalized, subscribedAt: new Date().toISOString() });
      saveStore(store);
    }
    res.status(201).json({ message: 'Thank you for joining the Maison Éclat tasting journal.' });
  });

  // Customer Protected Dashboard
  app.get('/api/customer/dashboard', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const store = loadStore();
    const emailLower = user.email.toLowerCase();
    const sortByNewest = <T extends { createdAt: string }>(arr: T[]) =>
      [...arr].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const orders = sortByNewest(
      store.orders.filter(
        (o) => o.customerId === user.id || o.email.toLowerCase() === emailLower
      )
    );
    const customCakes = sortByNewest(
      store.customCakes.filter(
        (c) => c.customerId === user.id || c.email.toLowerCase() === emailLower
      )
    );
    const reservations = sortByNewest(
      store.reservations.filter(
        (r) => r.customerId === user.id || r.email.toLowerCase() === emailLower
      )
    );
    res.json({
      profile: sanitizeUser(user),
      orders,
      customCakes,
      reservations,
    });
  });

  app.put('/api/customer/profile', (req, res) => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const users = loadUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx === -1) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const b = req.body;
    if (typeof b.name === 'string' && b.name.trim()) users[idx].name = b.name.trim();
    if (typeof b.mobile === 'string' && b.mobile.trim()) users[idx].mobile = b.mobile.trim();
    if (Array.isArray(b.savedAddresses)) users[idx].savedAddresses = b.savedAddresses;
    if (Array.isArray(b.wishlist)) users[idx].wishlist = b.wishlist;
    if (Array.isArray(b.notifications)) users[idx].notifications = b.notifications;
    saveUsers(users);
    res.json({ profile: sanitizeUser(users[idx]) });
  });

  // Admin Middleware
  const requireAdmin: express.RequestHandler = (req, res, next) => {
    const user = getAuthUser(req);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Administrator authorization required.' });
      return;
    }
    next();
  };

  // Admin Overview & Data
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const store = loadStore();
    const users = loadUsers().filter((u) => u.role === 'customer').map(sanitizeUser);
    res.json({
      products: store.products,
      orders: store.orders,
      customCakes: store.customCakes,
      reservations: store.reservations,
      enquiries: store.enquiries,
      coupons: store.coupons,
      cms: store.cms,
      customers: users,
      newsletterCount: store.newsletterSubscribers.length,
    });
  });

  // Admin Products CRUD
  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const store = loadStore();
    const b = req.body;
    if (!b.name || !b.category || b.price === undefined) {
      res.status(400).json({ error: 'Product name, category, and price are required.' });
      return;
    }
    const product: Product = {
      id: `prod-${crypto.randomUUID().slice(0, 8)}`,
      name: String(b.name).trim(),
      category: b.category,
      price: Number(b.price),
      description: String(b.description || ''),
      image: String(b.image || '/src/assets/images/cake_belgian_chocolate_1795023272408.jpg'),
      available: b.available !== false,
      bestseller: Boolean(b.bestseller),
      seasonal: Boolean(b.seasonal),
      egglessOption: b.egglessOption !== false,
      variants: Array.isArray(b.variants) ? b.variants : ['Regular'],
    };
    store.products.unshift(product);
    saveStore(store);
    res.status(201).json({ product });
  });

  app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
    const store = loadStore();
    const idx = store.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    store.products[idx] = { ...store.products[idx], ...req.body, id: store.products[idx].id };
    saveStore(store);
    res.json({ product: store.products[idx] });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const store = loadStore();
    store.products = store.products.filter((p) => p.id !== req.params.id);
    saveStore(store);
    res.json({ success: true });
  });

  // Admin Orders Update
  app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const store = loadStore();
    const idx = store.orders.findIndex((o) => o.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (req.body.status) store.orders[idx].status = req.body.status as OrderStatus;
    if (req.body.paymentStatus) store.orders[idx].paymentStatus = req.body.paymentStatus;
    saveStore(store);
    res.json({ order: store.orders[idx] });
  });

  // Admin Custom Cakes Update
  app.patch('/api/admin/custom-cakes/:id', requireAdmin, (req, res) => {
    const store = loadStore();
    const idx = store.customCakes.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Custom cake request not found' });
      return;
    }
    store.customCakes[idx] = { ...store.customCakes[idx], ...req.body, id: store.customCakes[idx].id };
    saveStore(store);
    res.json({ customCake: store.customCakes[idx] });
  });

  // Admin Reservations CRUD
  app.post('/api/admin/reservations', requireAdmin, (req, res) => {
    const store = loadStore();
    const b = req.body;
    const reservation: TableReservation = {
      id: `TR-${503 + store.reservations.length}`,
      customerName: String(b.customerName || 'Walk-in Guest'),
      mobile: String(b.mobile || '+91 98100 00000'),
      email: String(b.email || 'guest@maisoneclat-demo.in'),
      date: String(b.date || new Date().toISOString().slice(0, 10)),
      time: String(b.time || '5:00 PM'),
      guests: Number(b.guests) || 2,
      seatingPreference: String(b.seatingPreference || 'Main Dining Lounge'),
      specialRequests: b.specialRequests ? String(b.specialRequests) : undefined,
      status: b.status || 'Confirmed',
      createdAt: new Date().toISOString(),
      isDemo: true,
    };
    store.reservations.unshift(reservation);
    saveStore(store);
    res.status(201).json({ reservation });
  });

  app.patch('/api/admin/reservations/:id', requireAdmin, (req, res) => {
    const store = loadStore();
    const idx = store.reservations.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Reservation not found' });
      return;
    }
    store.reservations[idx] = { ...store.reservations[idx], ...req.body, id: store.reservations[idx].id };
    saveStore(store);
    res.json({ reservation: store.reservations[idx] });
  });

  app.delete('/api/admin/reservations/:id', requireAdmin, (req, res) => {
    const store = loadStore();
    store.reservations = store.reservations.filter((r) => r.id !== req.params.id);
    saveStore(store);
    res.json({ success: true });
  });

  // Admin Enquiries Update
  app.patch('/api/admin/enquiries/:id', requireAdmin, (req, res) => {
    const store = loadStore();
    const idx = store.enquiries.findIndex((e) => e.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Enquiry not found' });
      return;
    }
    store.enquiries[idx] = { ...store.enquiries[idx], ...req.body };
    saveStore(store);
    res.json({ enquiry: store.enquiries[idx] });
  });

  // Admin CMS & Settings
  app.put('/api/admin/cms', requireAdmin, (req, res) => {
    const store = loadStore();
    store.cms = { ...store.cms, ...req.body };
    saveStore(store);
    res.json({ cms: store.cms });
  });

  // Admin Coupons
  app.post('/api/admin/coupons', requireAdmin, (req, res) => {
    const store = loadStore();
    const b = req.body as Partial<Coupon>;
    if (!b.code || !b.value) {
      res.status(400).json({ error: 'Coupon code and value are required.' });
      return;
    }
    const coupon: Coupon = {
      code: b.code.trim().toUpperCase(),
      description: b.description || 'Promotional demo offer',
      type: b.type === 'percent' ? 'percent' : 'flat',
      value: Number(b.value),
      minOrder: Number(b.minOrder) || 0,
      active: b.active !== false,
    };
    store.coupons.push(coupon);
    saveStore(store);
    res.status(201).json({ coupon });
  });

  app.patch('/api/admin/coupons/:code', requireAdmin, (req, res) => {
    const store = loadStore();
    const idx = store.coupons.findIndex((c) => c.code === req.params.code);
    if (idx === -1) {
      res.status(404).json({ error: 'Coupon not found' });
      return;
    }
    store.coupons[idx] = { ...store.coupons[idx], ...req.body };
    saveStore(store);
    res.json({ coupon: store.coupons[idx] });
  });

  app.delete('/api/admin/coupons/:code', requireAdmin, (req, res) => {
    const store = loadStore();
    store.coupons = store.coupons.filter((c) => c.code !== req.params.code);
    saveStore(store);
    res.json({ success: true });
  });

  interface ConciergeSuggestedItem {
    id: string;
    name: string;
    category: string;
    price: number;
    image: string;
    egglessOption: boolean;
    available: boolean;
    variant?: string;
  }

  function toSuggestedItem(p: Product): ConciergeSuggestedItem {
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      image: p.image,
      egglessOption: p.egglessOption,
      available: p.available,
      variant: p.variants?.[0],
    };
  }

  function rankRelevantProducts(query: string, products: Product[], limit = 14): Product[] {
    const q = query.toLowerCase();
    const tokens = q
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3);
    const wantsEggless = /eggless|no egg|without egg|veg\b/i.test(q);
    const priceMatch = q.match(/(?:under|below|less than|within|upto|up to|max)\s*₹?\s*(\d{2,5})/);
    const maxPrice = priceMatch ? Number(priceMatch[1]) : null;

    const scored = products.map((p) => {
      let score = 0;
      const nameL = p.name.toLowerCase();
      const catL = p.category.toLowerCase();
      const descL = p.description.toLowerCase();
      const notesL = (p.notes || '').toLowerCase();

      if (q.includes(nameL)) score += 30;
      for (const t of tokens) {
        if (nameL.includes(t)) score += 10;
        if (catL.includes(t)) score += 7;
        if (descL.includes(t) || notesL.includes(t)) score += 3;
      }
      if (/coffee|espresso|cappuccino|latte|mocha|americano|macchiato/i.test(q) && catL.includes('coffee')) {
        score += 12;
      }
      if (/shake|milkshake|frappe|cold|beverage|drink/i.test(q) && catL.includes('milkshakes')) {
        score += 12;
      }
      if (/pastry|pastries|dessert|tiramisu|brownie|macaron|cheesecake/i.test(q) && catL.includes('pastries')) {
        score += 10;
      }
      if (/cupcake|cookie|butter|choco chip/i.test(q) && catL.includes('cupcakes')) {
        score += 10;
      }
      if (/bread|croissant|danish|sourdough|bakery|loaf|bun/i.test(q) && catL.includes('bakery')) {
        score += 10;
      }
      if (/cake|birthday|anniversary|wedding|bestseller/i.test(q) && catL.includes('signature cakes')) {
        score += 8;
      }
      if (/seasonal|new|special|berry|strawberry/i.test(q) && p.seasonal) {
        score += 8;
      }
      if (wantsEggless && p.egglessOption) score += 6;
      if (maxPrice !== null) {
        score += p.price <= maxPrice ? 6 : -10;
      }
      if (p.bestseller) score += 2;
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score || Number(b.product.bestseller) - Number(a.product.bestseller));
    return scored.slice(0, limit).map((s) => s.product);
  }

  function extractMentionedProducts(replyText: string, query: string, products: Product[]): ConciergeSuggestedItem[] {
    const replyL = replyText.toLowerCase();
    const mentioned = products.filter((p) => replyL.includes(p.name.toLowerCase()));
    if (mentioned.length > 0) {
      return mentioned.slice(0, 3).map(toSuggestedItem);
    }
    const ranked = rankRelevantProducts(query, products, 3);
    const hasMenuIntent = /coffee|cake|pastry|pastries|croissant|bread|macaron|cupcake|cookie|shake|frappe|dessert|eggless|menu|recommend|pair|bestseller|price|under|below/i.test(
      query
    );
    return hasMenuIntent ? ranked.map(toSuggestedItem) : [];
  }

  function cleanConciergeText(raw: string): string {
    return raw
      .replace(/^(?:ÉCLAIR|Eclair(?:\s+AI)?)\s*:\s*/i, '')
      .replace(/^```(?:markdown|text)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .replace(/\bBonjour\b/gi, 'Hello')
      .replace(/\bNamaste\b/gi, 'Hello')
      .replace(/Café/g, 'Cafe')
      .replace(/café/g, 'cafe')
      .replace(/\bpatisserie\b/gi, 'bakery')
      .replace(/\batelier\b/gi, 'kitchen')
      .replace(/\bviennoiserie\b/gi, 'flaky pastries')
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function extractGeminiReplyText(response: {
    text?: string;
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
  }): string {
    if (typeof response.text === 'string' && response.text.trim()) {
      return cleanConciergeText(response.text);
    }
    const parts = response.candidates?.[0]?.content?.parts || [];
    const combined = parts
      .filter((part) => !part.thought && typeof part.text === 'string')
      .map((part) => part.text as string)
      .join('');
    return cleanConciergeText(combined);
  }

  function extractStreamChunkText(
    response: {
      text?: string;
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      }>;
    },
    isFirstChunk: boolean
  ): string {
    let chunkText = '';
    if (typeof response.text === 'string' && response.text.length > 0) {
      chunkText = response.text;
    } else {
      const parts = response.candidates?.[0]?.content?.parts || [];
      chunkText = parts
        .filter((part) => !part.thought && typeof part.text === 'string')
        .map((part) => part.text as string)
        .join('');
    }
    if (!chunkText) return '';
    chunkText = chunkText
      .replace(/\r\n/g, '\n')
      .replace(/\bBonjour\b/gi, 'Hello')
      .replace(/\bNamaste\b/gi, 'Hello')
      .replace(/Café/g, 'Cafe')
      .replace(/café/g, 'cafe')
      .replace(/\bpatisserie\b/gi, 'bakery')
      .replace(/\batelier\b/gi, 'kitchen')
      .replace(/\bviennoiserie\b/gi, 'pastries');
    if (isFirstChunk) {
      chunkText = chunkText
        .replace(/^(?:ÉCLAIR|Eclair(?:\s+AI)?)\s*:\s*/i, '')
        .replace(/^```(?:markdown|text)?\s*/i, '');
    }
    return chunkText;
  }

  function classifyGeminiError(err: unknown): {
    status: number;
    code: 'GEMINI_QUOTA_EXCEEDED' | 'GEMINI_AUTH_ERROR' | 'GEMINI_UNAVAILABLE';
    detail: string;
  } {
    const detail = err instanceof Error ? err.message : String(err);
    if (/429|RESOURCE_EXHAUSTED|quota/i.test(detail)) {
      return { status: 429, code: 'GEMINI_QUOTA_EXCEEDED', detail };
    }
    if (/403|401|API_KEY_INVALID|PERMISSION_DENIED/i.test(detail)) {
      return { status: 403, code: 'GEMINI_AUTH_ERROR', detail };
    }
    return { status: 502, code: 'GEMINI_UNAVAILABLE', detail };
  }

  // Shared helper to build complete, grounded prompt & context for Eclair AI
  function buildConciergeContext(message: string, history?: { role: 'user' | 'assistant'; content: string }[]) {
    const store = loadStore();
    const orderMatch = message.match(/ME-\d+/i);
    let orderContext = '';
    if (orderMatch) {
      const found = store.orders.find((o) => o.id.toUpperCase() === orderMatch[0].toUpperCase());
      orderContext = found
        ? `\nLive Order ${found.id}: Status=${found.status} | Type=${found.orderType} on ${found.deliveryDate} (${found.deliveryTimeSlot}) | Customer=${found.customerName} | Items=${found.items.map((i) => `${i.quantity}x ${i.name}${i.variant ? ` (${i.variant})` : ''}`).join(', ')} | Subtotal=₹${found.subtotal}, Tax=₹${found.tax}, Delivery=₹${found.deliveryFee}, Total=₹${found.total} | Payment=${found.paymentMethod} (${found.paymentStatus}).`
        : `\nLive Order ${orderMatch[0].toUpperCase()}: Not found in demonstration records. Valid demo order IDs are ME-1042, ME-1043, ME-1044, ME-1045.`;
    }

    const resMatch = message.match(/TR-\d+/i);
    let reservationContext = '';
    if (resMatch) {
      const foundRes = store.reservations.find((r) => r.id.toUpperCase() === resMatch[0].toUpperCase());
      reservationContext = foundRes
        ? `\nLive Table Reservation ${foundRes.id}: Status=${foundRes.status} | Zone=${foundRes.seatingPreference} | Guests=${foundRes.guests} | Date=${foundRes.date} at ${foundRes.time} | Guest=${foundRes.customerName}${foundRes.specialRequests ? ` | Notes=${foundRes.specialRequests}` : ''}.`
        : `\nLive Table Reservation ${resMatch[0].toUpperCase()}: Not found in demonstration records. Valid demo reservation IDs are TR-501 and TR-502.`;
    }

    const ccMatch = message.match(/CC-\d+/i);
    let customCakeContext = '';
    if (ccMatch) {
      const foundCc = store.customCakes.find((c) => c.id.toUpperCase() === ccMatch[0].toUpperCase());
      customCakeContext = foundCc
        ? `\nLive Custom Cake Request ${foundCc.id}: Status=${foundCc.status} | Flavour=${foundCc.flavour} (${foundCc.size}, ${foundCc.shape}) | Occasion=${foundCc.occasion} | ${foundCc.eggless ? '100% Eggless' : 'Classic Sponge'} | Delivery=${foundCc.deliveryDate} at ${foundCc.deliveryTime} | ${foundCc.quotationAmount ? `Custom Quote=₹${foundCc.quotationAmount}` : `Estimated Price=₹${foundCc.estimatedPrice}`}${foundCc.adminNotes ? ` | Notes=${foundCc.adminNotes}` : ''}.`
        : `\nLive Custom Cake Request ${ccMatch[0].toUpperCase()}: Not found in demonstration records. Valid demo IDs are CC-2081 and CC-2082.`;
    }

    // Compact full catalog so Gemini knows every single item, category, exact price, and dietary flag quickly
    const fullCatalogIndex = store.products
      .map(
        (p) =>
          `${p.name} [${p.category}] ₹${p.price}${p.variants?.length ? ` (${p.variants.join('/')})` : ''} | ${p.egglessOption ? 'Eggless OK' : 'Contains Egg'}${p.bestseller ? ' | Bestseller' : ''}${p.seasonal ? ' | Seasonal' : ''} | ${p.available ? 'In Stock' : 'Sold Out'}`
      )
      .join('\n');

    // Rich tasting notes only for top 5 relevant items to keep latency ultra-fast
    const relevantProducts = rankRelevantProducts(message, store.products, 5);
    const detailedTopMatches = relevantProducts
      .map((p) => `- ${p.name} (₹${p.price}): ${p.description}`)
      .join('\n');

    const couponSummary = store.coupons
      .filter((c) => c.active)
      .map((c) => `${c.code} (${c.description}, min ₹${c.minOrder})`)
      .join('; ');

    const systemInstruction = `You are Eclair AI, the personal bakery and cafe assistant for Maison Éclat in Sector 62, Noida.
LANGUAGE RULE: Respond strictly in pure English only. Never use French, Hindi, or any foreign words or greetings (never write Bonjour, Namaste, Patisserie, Atelier, Salon, Viennoiserie, Vitrine, Entremet, Chantilly, Sablé, Coulis, etc.). Always spell "Cafe" without an accent.

BUSINESS FACTS:
- Address: ${store.cms.address} | Hours: ${store.cms.openingHours} | Contact: ${store.cms.phoneDemo}, ${store.cms.emailDemo}
- Delivery & Tax: Home Delivery is ₹${store.cms.deliveryFee} (free on orders ₹${store.cms.freeDeliveryThreshold}+). Store Pickup is free. Tax is ${store.cms.taxPercent}% GST.
- Payments (Demo Mode): Demo Card / UPI (Simulated) and Pay at Cafe Counter / COD (Demo).
- Promo Codes: ${couponSummary || 'None'}.
- Seating Zones: Sunlit Window Lounge (2–6 guests), Espresso Bar Alcove (1–4 guests), Garden Terrace (2–6 guests), Private Celebration Corner (4–12 guests). Guests book tables on the Cafe & Contact page (/cafe) and can view saved bookings on /account.
- Custom Cake Studio Pricing (Orders page /orders): Custom cakes are priced strictly per kg as weight_in_kg × rate: Chocolate, Vanilla, Red Velvet, Strawberry, Butterscotch, Black Forest = ₹1,750/kg; Blueberry & Biscoff = ₹1,950/kg (e.g., 2 kg Custom Biscoff Cake = ₹3,900; 2 kg Custom Chocolate Cake = ₹3,500). Sizes 0.5–3 kg; 100% eggless available; 24–48h notice; custom plaque & reference photo supported. (Note: Ready Signature Cakes on the regular menu like Lotus Biscoff Cake ₹1,099 are separate 500g/1kg menu items.)
- Dietary: All cakes, pastries, cupcakes, cookies & breads offer 100% eggless options except Macarons (almond meringue). Cappuccino & Cafe Latte include Oat Milk & Almond Milk variants with no extra surcharge listed in the menu. Black Forest Cake is non-alcoholic. Shared kitchen handles dairy, wheat, soy & tree nuts.
- Dashboard & Tracking: Guests can sign in on /account to view their saved orders, reservations, and custom cake quotes. Orders track across 7 stages.${orderContext}${reservationContext}${customCakeContext}

MENU CATALOG (${store.products.length} items):
${fullCatalogIndex}

TOP MATCHES:
${detailedTopMatches}

RULES:
1. Answer clearly and directly in pure English (2–4 short sentences or bullets).
2. Quote ONLY exact item names and INR prices from the catalog above. Never invent items, prices, or extra charges not listed above.
3. For totals, cheapest/most expensive, or custom cake kg calculations, compute accurately from the catalog.`;

    const conversationContext = (history || [])
      .slice(-4)
      .map((m) => `${m.role === 'user' ? 'Guest' : 'Eclair AI'}: ${m.content}`)
      .join('\n');

    const prompt = conversationContext
      ? `${conversationContext}\nGuest: ${message.trim()}\nEclair AI:`
      : message.trim();

    return { systemInstruction, prompt, store };
  }

  // Deterministic live-data resolver grounded in actual StoreData (used when Gemini quota/service is unavailable)
  function resolveGroundedConciergeAnswer(message: string): {
    reply: string;
    suggestedItems: ConciergeSuggestedItem[];
  } {
    const store = loadStore();
    const q = message.toLowerCase().trim();
    const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

    // 1–3. Combined Order / Reservation / Custom Cake ID Lookups (supports multiple IDs in one question)
    const orderMatch = message.match(/ME-\d+/i);
    const resMatch = message.match(/TR-\d+/i);
    const ccMatch = message.match(/CC-\d+/i);
    if (orderMatch || resMatch || ccMatch) {
      const blocks: string[] = [];
      if (orderMatch) {
        const o = store.orders.find((item) => item.id.toUpperCase() === orderMatch[0].toUpperCase());
        if (o) {
          const items = o.items
            .map((i) => `• ${i.quantity} × ${i.name}${i.variant ? ` (${i.variant})` : ''} — ${fmt(i.price * i.quantity)}`)
            .join('\n');
          blocks.push(
            `Order **${o.id}** is currently **${o.status}**.\n• Fulfilment: ${o.orderType} on ${o.deliveryDate} (${o.deliveryTimeSlot})\n• Payment: ${o.paymentMethod} (${o.paymentStatus})\n• Total: ${fmt(o.total)}\n\nItems Reserved:\n${items}`
          );
        } else {
          blocks.push(
            `I could not find order **${orderMatch[0].toUpperCase()}** in our demonstration records. Try demo order IDs **ME-1042**, **ME-1043**, **ME-1044**, or **ME-1045**.`
          );
        }
      }
      if (resMatch) {
        const r = store.reservations.find((item) => item.id.toUpperCase() === resMatch[0].toUpperCase());
        if (r) {
          blocks.push(
            `Table Reservation **${r.id}** is **${r.status}**.\n• Seating Zone: ${r.seatingPreference}\n• Date & Time: ${r.date} at ${r.time}\n• Party Size: ${r.guests} Guests${r.specialRequests ? `\n• Notes: ${r.specialRequests}` : ''}`
          );
        } else {
          blocks.push(
            `I could not locate table reservation **${resMatch[0].toUpperCase()}**. Try demo reservation IDs **TR-501** or **TR-502**.`
          );
        }
      }
      if (ccMatch) {
        const c = store.customCakes.find((item) => item.id.toUpperCase() === ccMatch[0].toUpperCase());
        if (c) {
          blocks.push(
            `Custom Cake Request **${c.id}** is **${c.status}**.\n• Creation: ${c.flavour} (${c.size}, ${c.shape})\n• Occasion: ${c.occasion}${c.eggless ? ' · 100% Eggless' : ''}\n• Delivery: ${c.deliveryDate} at ${c.deliveryTime}\n• ${c.quotationAmount ? `Custom Quote: ${fmt(c.quotationAmount)}` : `Estimated Price: ${fmt(c.estimatedPrice)}`}`
          );
        } else {
          blocks.push(
            `I could not find custom cake request **${ccMatch[0].toUpperCase()}**. Try demo IDs **CC-2081** or **CC-2082**.`
          );
        }
      }
      return {
        reply: blocks.join('\n\n'),
        suggestedItems: [],
      };
    }

    // 4. Greeting
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|hii+)\b/i.test(q)) {
      const featured = store.products.filter((p) => p.bestseller).slice(0, 3);
      return {
        reply: `Hello! Welcome to Maison Éclat in Sector 62, Noida.\n\nI'm Eclair AI, and I can help you explore all ${store.products.length} handcrafted menu items (specialty coffees from ${fmt(129)}, pastries, cookies, breads, and signature cakes), estimate custom cake pricing, explain allergens or delivery, or check orders (e.g. ME-1042) and reservations (e.g. TR-501). What can I help you with today?`,
        suggestedItems: featured.map(toSuggestedItem),
      };
    }

    // 5. Account / Sign In / Tracking Help
    if (/\b(sign in|login|log in|register|account|dashboard|how to track|track my|track order)\b/i.test(q)) {
      return {
        reply: `**Account & Live Tracking Guide**\n• **Sign In**: Visit the **Account** page to sign in (or use the one-click Demo Customer button) so every order, reservation, and custom cake request is saved to your personal dashboard.\n• **Track an Order**: Enter your Order ID (such as **ME-1042**) on the **Orders & Custom Cakes → Order Tracking** tab or ask me directly right here.\n• **Check a Reservation**: Enter your Table ID (such as **TR-501**) on the **Cafe & Contact** page or ask me here.`,
        suggestedItems: [],
      };
    }

    // 6. Payment, Refund, Cancellation, GST, Demo Mode
    if (/\b(payment|pay|upi|card|cod|cash|refund|cancel|gst|tax|demo)\b/i.test(q) && !/\b(cake|coffee|pastry|cookie|bread)\b/i.test(q)) {
      return {
        reply: `**Payments, Taxes & Order Policies (Demo Mode)**\n• **Payment Methods**: Demo Card / UPI (Simulated) and Pay at Cafe Counter / COD (Demo).\n• **Taxes & Delivery**: ${store.cms.taxPercent}% GST applies; Home Delivery is ${fmt(store.cms.deliveryFee)} (free at ${fmt(store.cms.freeDeliveryThreshold)}+), and Store Pickup is always free.\n• **Demo Transparency**: Orders, payments, and table bookings on this platform run in demonstration mode with no real money charged.`,
        suggestedItems: [],
      };
    }

    // 7. Allergens, Eggless, Dairy-Free / Oat / Almond Milk, Non-Alcoholic
    if (/\b(allergen|allergy|nuts?|almond|oat milk|almond milk|dairy|vegan|alcohol|wine|rum|egg|eggs|eggless)\b/i.test(q) && !/\b(under|below|less than)\b/i.test(q) && !/\b(custom|kg)\b/i.test(q)) {
      const dairyFree = store.products.filter((p) => p.variants?.some((v) => /oat|almond milk/i.test(v)));
      const nonEggless = store.products.filter((p) => !p.egglessOption);
      return {
        reply: `**Dietary & Allergen Information at Maison Éclat**\n• **Eggless Options**: Almost our entire menu (${store.products.length - nonEggless.length} of ${store.products.length} items) is available 100% eggless, including all Signature Cakes and Custom Cakes.\n• **Contains Egg**: ${nonEggless.map((p) => `${p.name} (${fmt(p.price)})`).join(', ') || 'None'} uses classic almond meringue.\n• **Plant-Based Milk**: Both **Velvet Cappuccino** (${fmt(179)}) and **Cafe Latte** (${fmt(189)}) can be prepared with **Oat Milk** or **Almond Milk**.\n• **Alcohol-Free**: Our Black Forest Cake is 100% non-alcoholic.\n• **Kitchen Note**: All items are baked in a shared kitchen handling dairy, wheat/gluten, soy, and tree nuts.`,
        suggestedItems: dairyFree.slice(0, 3).map(toSuggestedItem),
      };
    }

    // 8. Custom Cakes + Dynamic kg Price Calculator
    const kgMatch = q.match(/(\d+(?:\.\d+)?)\s*kg\b/i);
    if (/\b(custom|tiered?|wedding|birthday|anniversary|plaque|photo cake)\b/i.test(q) || kgMatch) {
      const kg = kgMatch ? Math.min(5, Math.max(0.5, parseFloat(kgMatch[1]))) : 1;
      const isPremiumFlavour = /\b(biscoff|blueberry)\b/i.test(q);
      const rate = isPremiumFlavour ? 1950 : 1750;
      const calcPrice = Math.round(kg * rate);
      const cakes = store.products.filter((p) => p.category === 'Signature Cakes').slice(0, 3);
      return {
        reply: `${kgMatch ? `A **${kg} kg** custom ${isPremiumFlavour ? 'Biscoff / Blueberry' : 'Chocolate / Classic'} cake is estimated at **${fmt(calcPrice)}** (${fmt(rate)}/kg).\n\n` : ''}**Custom Cake Studio Options**\n• **Flavours**: Chocolate, Vanilla, Red Velvet, Strawberry, Butterscotch, Black Forest (${fmt(1750)}/kg) and Blueberry or Biscoff (${fmt(1950)}/kg).\n• **Sizes & Shapes**: 0.5 kg to 3 kg in Round Classic, Heart, Square, Two-Tier, or Minimalist Tall.\n• **Dietary & Timing**: 100% eggless available on every custom cake; custom message plaque and inspiration photo upload supported; please allow 24–48 hours advance notice.`,
        suggestedItems: cakes.map(toSuggestedItem),
      };
    }

    // 9. Table Seating Capacity / Group Size / Cafe Hours / Location / Coupons / Delivery
    const partyMatch = q.match(/\b(\d+)\s*(?:guests?|people|persons?|pax)\b/i);
    const asksLocationOrHours =
      /\b(hours?|open|opening|close|closing|timings?|location|address|where|noida|phone|email|contact|seat(?:ing)?|zone|zones|lounge|terrace|table|tables|reserve|reservation)\b/i.test(
        q
      ) || Boolean(partyMatch);
    const asksDeliveryOrCoupons =
      /\b(deliver|delivery|pickup|pick-up|fee|fees|charges?|shipping|coupon|coupons|discount|promo|code|codes|offer|offers)\b/i.test(
        q
      );

    if ((asksLocationOrHours || asksDeliveryOrCoupons) && !/\b(cake|cakes|coffee|coffees|pastry|pastries|croissant|shake|milkshake|cheapest|expensive)\b/i.test(q)) {
      const sections: string[] = [];
      if (partyMatch) {
        const guests = Number(partyMatch[1]);
        const zoneRec =
          guests >= 7
            ? '**Private Celebration Corner** (seats 4–12 guests with complimentary cake plating)'
            : guests >= 3
            ? '**Sunlit Window Lounge** or **Garden Terrace** (each seats 2–6 guests)'
            : '**Espresso Bar Alcove** (1–4 guests) or **Sunlit Window Lounge** (2–6 guests)';
        sections.push(`For a party of **${guests} guests**, we recommend our ${zoneRec}.`);
      }
      if (asksLocationOrHours) {
        sections.push(
          `**Location, Hours & Seating — Maison Éclat**\n• Address: ${store.cms.address}\n• Opening Hours: ${store.cms.openingHours}\n• Contact: ${store.cms.phoneDemo} · ${store.cms.emailDemo}\n• Seating Zones: Sunlit Window Lounge (2–6 guests), Espresso Bar Alcove (1–4 guests), Garden Terrace (2–6 guests), and Private Celebration Corner (4–12 guests).`
        );
      }
      if (asksDeliveryOrCoupons) {
        const couponsText = store.coupons
          .filter((c) => c.active)
          .map((c) => `• **${c.code}** — ${c.description} (min order ${fmt(c.minOrder)})`)
          .join('\n');
        sections.push(
          `**Delivery & Active Promo Codes**\n• Home Delivery: ${fmt(store.cms.deliveryFee)} (free on orders ${fmt(store.cms.freeDeliveryThreshold)}+)\n• Store Pickup: Free at Sector 62, Noida\n• Taxes: ${store.cms.taxPercent}% GST\n\nActive Demo Codes:\n${couponsText || '• ECLAT10'}`
        );
      }
      return {
        reply: `${sections.join('\n\n')}\n\n(Online bookings and orders run in demonstration mode.)`,
        suggestedItems: [],
      };
    }

    // 10. Cheapest / Most Expensive / Budget Overview
    if (/\b(cheapest|lowest price|least expensive|most affordable|budget)\b/i.test(q)) {
      const sorted = [...store.products].sort((a, b) => a.price - b.price).slice(0, 5);
      return {
        reply: `Our most affordable handcrafted items start at **${fmt(sorted[0].price)}**:\n\n${sorted
          .map((p) => `• **${p.name}** (${p.category}) — **${fmt(p.price)}**`)
          .join('\n')}`,
        suggestedItems: sorted.slice(0, 3).map(toSuggestedItem),
      };
    }
    if (/\b(most expensive|costliest|priciest|highest price|luxury cake)\b/i.test(q)) {
      const sorted = [...store.products].sort((a, b) => b.price - a.price).slice(0, 5);
      return {
        reply: `Our highest-priced signature creations:\n\n${sorted
          .map((p) => `• **${p.name}** (${p.category}) — **${fmt(p.price)}**`)
          .join('\n')}`,
        suggestedItems: sorted.slice(0, 3).map(toSuggestedItem),
      };
    }

    // 11. Pairing Recommendations
    if (/\b(pair|pairing|recommend|suggest|combo)\b|with coffee|afternoon/i.test(q)) {
      const cap = store.products.find((p) => p.id === 'coffee-cappuccino');
      const croissant = store.products.find((p) => p.id === 'bakery-croissant');
      const tiramisu = store.products.find((p) => p.id === 'pastry-tiramisu');
      const picks = [cap, croissant, tiramisu].filter((x): x is Product => Boolean(x));
      return {
        reply: `Recommended pairings from today's counter:\n\n• **Morning Classic**: Velvet Cappuccino (${fmt(cap?.price || 179)}) with a Classic Butter Croissant (${fmt(croissant?.price || 149)})\n• **Afternoon Treat**: Iced Caramel Latte (${fmt(219)}) paired with Mascarpone Tiramisu Cup (${fmt(tiramisu?.price || 249)})\n• **Chocolate Lovers**: Rich Belgian Chocolate Cake (${fmt(899)}) with Single-Origin Espresso (${fmt(129)})`,
        suggestedItems: picks.map(toSuggestedItem),
      };
    }

    // 12. Full Menu Overview or Bestsellers / Seasonal
    if (/\b(full menu|entire menu|all categories|what do you sell|what do you serve|menu overview)\b/i.test(q)) {
      const byCat = new Map<string, Product[]>();
      for (const p of store.products) {
        const list = byCat.get(p.category) || [];
        list.push(p);
        byCat.set(p.category, list);
      }
      const summary = Array.from(byCat.entries())
        .map(([cat, list]) => {
          const min = Math.min(...list.map((i) => i.price));
          const max = Math.max(...list.map((i) => i.price));
          return `• **${cat}** (${list.length} items, ${fmt(min)}–${fmt(max)}): e.g. ${list.slice(0, 2).map((i) => i.name).join(', ')}`;
        })
        .join('\n');
      return {
        reply: `Maison Éclat offers **${store.products.length} handcrafted items** across 6 categories:\n\n${summary}\n\nVisit **Our Signature Menu** to filter by category or ask me about any specific item!`,
        suggestedItems: store.products.filter((p) => p.bestseller).slice(0, 3).map(toSuggestedItem),
      };
    }

    if (/\b(bestsellers?|best sellers?|popular|famous|top picks?|most ordered)\b/i.test(q)) {
      const best = store.products.filter((p) => p.bestseller).slice(0, 6);
      return {
        reply: `Guest favourites at Maison Éclat right now:\n\n${best
          .map((p) => `• **${p.name}** (${p.category}) — **${fmt(p.price)}**`)
          .join('\n')}`,
        suggestedItems: best.slice(0, 3).map(toSuggestedItem),
      };
    }

    if (/\b(seasonal|festive|specials?|strawberry|new arrivals?)\b/i.test(q) && !/\bunder|below\b/i.test(q)) {
      const seasonal = store.products.filter((p) => p.seasonal).slice(0, 6);
      return {
        reply: `Our current Seasonal Specials:\n\n${seasonal
          .map((p) => `• **${p.name}** (${p.category}) — **${fmt(p.price)}**`)
          .join('\n')}`,
        suggestedItems: seasonal.slice(0, 3).map(toSuggestedItem),
      };
    }

    // 13. Coffees & Milkshakes Overview
    if (/\b(coffee|coffees|espresso|cappuccino|latte|mocha|americano|macchiato|milkshake|milkshakes|shake|shakes|frappe|beverage|beverages|drink|drinks)\b/i.test(q) && !/\b(under|below|less than)\b/i.test(q)) {
      const coffees = store.products.filter((p) => p.category === 'Specialty Coffee');
      const shakes = store.products.filter((p) => p.category === 'Milkshakes & Cold Beverages');
      const coffeeLines = coffees.map((c) => `• **${c.name}** — ${fmt(c.price)}`).join('\n');
      const shakeLines = shakes.map((s) => `• **${s.name}** — ${fmt(s.price)}`).join('\n');
      const picks = [coffees[1] || coffees[0], coffees[2], shakes[0]].filter((x): x is Product => Boolean(x));
      return {
        reply: `Freshly crafted at our Maison Éclat espresso & cold bar:\n\nSpecialty Coffee:\n${coffeeLines}\n\nMilkshakes & Cold Beverages:\n${shakeLines}\n\nTap any item below to view milk options or add directly to your bag.`,
        suggestedItems: picks.map(toSuggestedItem),
      };
    }

    // 14. Price-ceiling or Eggless or Category/Product query
    const priceMatch = q.match(/(?:under|below|less than|within|upto|up to|max)\s*₹?\s*(\d{2,5})/);
    const maxPrice = priceMatch ? Number(priceMatch[1]) : null;
    const wantsEggless = /eggless|no egg|without egg|\bveg\b/i.test(q);

    let filtered = [...store.products];
    if (maxPrice !== null) {
      filtered = filtered.filter((p) => p.price <= maxPrice);
    }
    if (wantsEggless) {
      filtered = filtered.filter((p) => p.egglessOption);
    }

    const pool = filtered.length > 0 ? filtered : store.products;
    const ranked = rankRelevantProducts(message, pool, 6);
    const lines = ranked
      .map(
        (p) =>
          `• **${p.name}** (${p.category}) — **${fmt(p.price)}**${p.variants?.length ? ` [${p.variants.join(', ')}]` : ''}${p.egglessOption ? ' · Eggless OK' : ' · Contains Egg'}\n  ${p.description}`
      )
      .join('\n');

    const headerNote =
      maxPrice !== null
        ? `Here are matching selections under ${fmt(maxPrice)}${wantsEggless ? ' (100% Eggless)' : ''}:`
        : wantsEggless
        ? `Here are 100% eggless-friendly selections from our live menu:`
        : `Here are the closest matches from our live Maison Éclat menu:`;

    return {
      reply: `${headerNote}\n\n${lines}\n\n(Prices are in INR for demonstration mode; tap any item below to view options or add directly to your bag.)`,
      suggestedItems: ranked.slice(0, 3).map(toSuggestedItem),
    };
  }

  // Dedicated backend live menu & business resolver (fast deterministic fallback, transparent source='catalog')
  app.post('/api/concierge/grounded', (req, res) => {
    const start = Date.now();
    const { message } = req.body as { message?: string };
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }
    const result = resolveGroundedConciergeAnswer(message);
    res.json({
      ...result,
      source: 'catalog',
      latencyMs: Date.now() - start,
    });
  });

  // Fast streaming Eclair AI Assistant (SSE)
  app.post('/api/concierge/stream', async (req, res) => {
    const startTime = Date.now();
    const { message, history } = req.body as {
      message?: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
        code: 'GEMINI_UNAVAILABLE',
      });
      return;
    }

    const { systemInstruction, prompt, store } = buildConciergeContext(message, history);

    const streamWithModel = async (
      model: string,
      thinkingLevel: ThinkingLevel | null,
      firstChunkMs: number
    ) => {
      const config: {
        systemInstruction: string;
        thinkingConfig?: { thinkingLevel: ThinkingLevel };
      } = { systemInstruction };
      if (thinkingLevel !== null) {
        config.thinkingConfig = { thinkingLevel };
      }

      const stream = await Promise.race([
        ai.models.generateContentStream({ model, contents: prompt, config }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${model} stream connect timeout`)), firstChunkMs)
        ),
      ]);
      const iterator = stream[Symbol.asyncIterator]();
      const firstResult = await Promise.race([
        iterator.next(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`${model} first chunk timeout`)), firstChunkMs)
        ),
      ]);
      const firstText = firstResult.value ? extractStreamChunkText(firstResult.value, true) : '';
      if (firstResult.done || !firstText.trim()) {
        throw new Error(`${model} returned empty stream`);
      }

      // Commit SSE headers only once a live chunk arrives
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let fullReply = firstText;
      res.write(`data: ${JSON.stringify({ chunk: firstText })}\n\n`);

      while (true) {
        const next = await iterator.next();
        if (next.done) break;
        const text = next.value ? extractStreamChunkText(next.value, false) : '';
        if (text) {
          fullReply += text;
          res.write(`data: ${JSON.stringify({ chunk: text })}\n\n`);
        }
      }

      const suggestedItems = extractMentionedProducts(fullReply, message, store.products);
      res.write(
        `data: ${JSON.stringify({
          done: true,
          suggestedItems,
          latencyMs: Date.now() - startTime,
        })}\n\n`
      );
      return true;
    };

    try {
      try {
        await streamWithModel('gemini-3.1-flash-lite', null, 6500);
      } catch (primaryErr) {
        if (res.headersSent) throw primaryErr;
        console.warn(
          'Fast stream gemini-3.1-flash-lite failed, trying gemini-4-hydrogen:',
          primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
        );
        await streamWithModel('gemini-4-hydrogen', ThinkingLevel.LOW, 6500);
      }
      res.end();
    } catch (err) {
      const classified = classifyGeminiError(err);
      console.error('Gemini assistant stream error:', classified.detail);
      if (!res.headersSent) {
        res.status(classified.status).json({
          error: 'Unable to reach Eclair AI assistant at the moment.',
          detail: classified.detail,
          code: classified.code,
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: classified.detail })}\n\n`);
        res.end();
      }
    }
  });

  // Eclair AI Assistant (Fast JSON endpoint with parsed suggestedItems & latency)
  app.post('/api/concierge', async (req, res) => {
    const startTime = Date.now();
    const { message, history } = req.body as {
      message?: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };
    if (!message || !message.trim()) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
        code: 'GEMINI_UNAVAILABLE',
      });
      return;
    }

    const { systemInstruction, prompt, store } = buildConciergeContext(message, history);

    try {
      const callModel = async (
        model: string,
        thinkingLevel: ThinkingLevel | null,
        timeoutMs: number
      ) => {
        const config: {
          systemInstruction: string;
          thinkingConfig?: { thinkingLevel: ThinkingLevel };
        } = { systemInstruction };
        if (thinkingLevel !== null) {
          config.thinkingConfig = { thinkingLevel };
        }
        return Promise.race([
          ai.models.generateContent({ model, contents: prompt, config }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${model} timed out after ${timeoutMs}ms`)), timeoutMs)
          ),
        ]);
      };

      let response;
      try {
        response = await callModel('gemini-3.1-flash-lite', null, 6500);
      } catch (primaryErr) {
        console.warn(
          'Primary fast model gemini-3.1-flash-lite unavailable, falling back to gemini-4-hydrogen:',
          primaryErr instanceof Error ? primaryErr.message : String(primaryErr)
        );
        response = await callModel('gemini-4-hydrogen', ThinkingLevel.LOW, 6500);
      }

      const reply = extractGeminiReplyText(response);
      if (!reply) {
        res.status(502).json({ error: 'Empty response from Gemini API.', code: 'GEMINI_UNAVAILABLE' });
        return;
      }
      const suggestedItems = extractMentionedProducts(reply, message, store.products);
      res.json({
        reply,
        suggestedItems,
        source: 'gemini',
        latencyMs: Date.now() - startTime,
      });
    } catch (err) {
      const classified = classifyGeminiError(err);
      console.error('Gemini assistant error:', classified.detail);
      res.status(classified.status).json({
        error: 'Unable to reach Eclair AI assistant at the moment.',
        detail: classified.detail,
        code: classified.code,
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maison Éclat server running at http://localhost:${PORT}`);
  });
}

startServer();
