export type ProductCategory =
  | 'Signature Cakes'
  | 'Pastries & Desserts'
  | 'Cupcakes & Cookies'
  | 'Artisan Bakery'
  | 'Specialty Coffee'
  | 'Milkshakes & Cold Beverages';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  description: string;
  image: string;
  available: boolean;
  bestseller: boolean;
  seasonal: boolean;
  egglessOption: boolean;
  variants?: string[];
  notes?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  category: ProductCategory;
  price: number;
  image: string;
  quantity: number;
  variant?: string;
  eggless?: boolean;
  cakeMessage?: string;
}

export type OrderStatus =
  | 'Order Received'
  | 'Confirmed'
  | 'Preparing'
  | 'Baking'
  | 'Ready for Pickup'
  | 'Out for Delivery'
  | 'Delivered';

export type OrderType = 'Home Delivery' | 'Store Pickup';

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  phone: string;
  email: string;
  orderType: OrderType;
  address?: string;
  city?: string;
  pinCode?: string;
  deliveryDate: string;
  deliveryTimeSlot: string;
  instructions?: string;
  paymentMethod: string;
  paymentStatus: 'Demo Mode — Pending' | 'Demo Mode — Authorised';
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  isDemo?: boolean;
}

export type CustomCakeStatus =
  | 'Enquiry Received'
  | 'Design Review'
  | 'Quotation Sent'
  | 'Confirmed'
  | 'In Preparation'
  | 'Completed';

export interface CustomCakeRequest {
  id: string;
  customerId?: string;
  customerName: string;
  mobile: string;
  email: string;
  flavour: string;
  size: string;
  shape: string;
  designPreference: string;
  occasion: string;
  eggless: boolean;
  messageOnCake: string;
  deliveryDate: string;
  deliveryTime: string;
  instructions: string;
  referenceImage?: string;
  estimatedPrice: number;
  quotationAmount?: number;
  adminNotes?: string;
  status: CustomCakeStatus;
  createdAt: string;
  isDemo?: boolean;
}

export type ReservationStatus = 'Requested' | 'Confirmed' | 'Seated' | 'Completed' | 'Cancelled';

export interface TableReservation {
  id: string;
  customerId?: string;
  customerName: string;
  mobile: string;
  email: string;
  date: string;
  time: string;
  guests: number;
  seatingPreference: string;
  specialRequests?: string;
  status: ReservationStatus;
  createdAt: string;
  isDemo?: boolean;
}

export interface Enquiry {
  id: string;
  type: string;
  name: string;
  email: string;
  mobile: string;
  message: string;
  status: 'New' | 'Reviewed' | 'Responded';
  createdAt: string;
}

export interface Coupon {
  code: string;
  description: string;
  type: 'percent' | 'flat';
  value: number;
  minOrder: number;
  active: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  quote: string;
  occasion: string;
  isDemoLabel: string;
}

export interface CmsContent {
  heroHeadline: string;
  heroSubheadline: string;
  promoBannerText: string;
  promoBannerActive: boolean;
  seasonalTitle: string;
  seasonalSubtitle: string;
  openingHours: string;
  phoneDemo: string;
  emailDemo: string;
  address: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  taxPercent: number;
  notificationsEnabled: boolean;
  testimonials: Testimonial[];
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city: string;
  pinCode: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'customer' | 'admin';
  savedAddresses: SavedAddress[];
  wishlist: string[];
  notifications: { id: string; title: string; date: string; read: boolean }[];
  createdAt: string;
}

export interface StoreData {
  products: Product[];
  orders: Order[];
  customCakes: CustomCakeRequest[];
  reservations: TableReservation[];
  enquiries: Enquiry[];
  coupons: Coupon[];
  newsletterSubscribers: { email: string; subscribedAt: string }[];
  cms: CmsContent;
}
