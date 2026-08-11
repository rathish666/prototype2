export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  enabled: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string | null;
  category_id: string | null;
  price: number;
  discount_price: number | null;
  sku: string | null;
  sizes: string[];
  colors: string[];
  stock: number;
  low_stock_threshold: number;
  status: string;
  featured: boolean;
  best_seller: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  images?: ProductImage[];
  category?: Category | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  position: number;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  password: string | null;
  disabled: boolean;
  total_spending: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  shipping_method: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon_code: string | null;
  status: string;
  payment_method: string;
  payment_status?: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  whatsapp_sent?: boolean;
  whatsapp_error?: string | null;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  brand: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  min_order: number;
  expires_at: string | null;
  enabled: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string | null;
  cta_text: string | null;
  cta_link: string | null;
  position: number;
  enabled: boolean;
}

export interface Announcement {
  id: string;
  message: string;
  enabled: boolean;
  created_at: string;
}

export interface Address {
  id: string;
  customer_email: string;
  label: string;
  recipient: string;
  phone: string | null;
  address: string;
  city: string | null;
  country: string | null;
  is_default: boolean;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  customer_email: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  product_id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  size: string;
  color: string;
  quantity: number;
  stock: number;
}

export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned',
] as const;

export const PRODUCT_STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'] as const;

export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '7', '8', '9', '10', '11', '12', 'One Size'];

export const COLOR_MAP: Record<string, string> = {
  Black: '#1a1a1a',
  White: '#f8f8f8',
  Charcoal: '#36454f',
  Navy: '#1a2540',
  Grey: '#8d8d93',
  Olive: '#708238',
  Cream: '#f5f0e1',
  Sand: '#c2b280',
  Sage: '#9caf88',
  Brown: '#6b4423',
  Tan: '#d2b48c',
  Burgundy: '#5e1a1a',
  Khaki: '#c3b091',
  Stone: '#dedede',
  Silver: '#c0c0c0',
  Gold: '#d4af37',
  'Dark Indigo': '#27235f',
  'Mid Wash': '#6b8cae',
  'Light Blue': '#a4c8e1',
  'Mid Blue': '#4a6fa5',
  'Raw Indigo': '#1a1a4a',
  Washed: '#7a8ba8',
  'Sky': '#87ceeb',
  'Pink': '#f0c0c0',
  Blue: '#3b6ea5',
  'Red Plaid': '#b32d2d',
  'Green Plaid': '#2d6b3f',
  'Blue Plaid': '#2d4f6b',
  'Navy/White': '#1a2540',
  'Black/Grey': '#3a3a3e',
  'Black/Green': '#1a2a1a',
  'Silver/Black': '#5a5a5e',
  'Silver/Blue': '#5a7a9e',
  'Brown/Cream': '#9c7a4f',
  'Black/White': '#5a5a5a',
  'Tan/Navy': '#6b7a9e',
  'Navy/Green': '#2a4a2a',
  'Navy/Sand': '#5a6a7a',
  'Navy/Black': '#1a1a2a',
  'Navy/Olive': '#3a4a3a',
  'Charcoal/Navy': '#2a2a3a',
  'Charcoal/Olive': '#3a3a2a',
  'Charcoal/Burgundy': '#3a1a1a',
  'Black/Navy': '#1a1a2a',
  'Black/Olive': '#1a2a1a',
  'Black/Sage': '#2a3a2a',
  'Black/Burgundy': '#2a1a1a',
  'Black/Brown': '#2a2218',
  'Olive/Navy': '#3a4a3a',
  'Olive/Sand': '#5a6a4a',
  'Olive/Black': '#2a3a2a',
  'Sand/Black': '#5a5a4a',
  'Sand/Olive': '#6a7a5a',
  'Sand/Sage': '#7a8a6a',
  'Brown/Black': '#3a2a1a',
  'Brown/Tan': '#7a6a4a',
  'Brown/Navy': '#3a3a5a',
  'Tan/Black': '#6a5a4a',
  'Tan/Brown': '#7a6a5a',
  'Cream/Black': '#9a9a8a',
  'Cream/Navy': '#5a6a7a',
  'Cream/Tan': '#9a8a7a',
  'Burgundy/Cream': '#7a5a5a',
  'Burgundy/Black': '#3a2a2a',
  'Burgundy/Navy': '#3a2a4a',
  'Burgundy/Olive': '#3a3a2a',
  'Crystal': '#e0e0e8',
  'Tortoise': '#8b6b3a',
};

export function hexForColor(color: string): string {
  if (COLOR_MAP[color]) return COLOR_MAP[color];
  const parts = color.split('/');
  if (parts.length > 1 && COLOR_MAP[parts[0]]) return COLOR_MAP[parts[0]];
  return '#888888';
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    currencyDisplay: 'code',
    maximumFractionDigits: 2,
  }).format(price);
}

export function discountPercent(price: number, discountPrice: number | null): number {
  if (!discountPrice || discountPrice >= price) return 0;
  return Math.round(((price - discountPrice) / price) * 100);
}

export function effectivePrice(p: Pick<Product, 'price' | 'discount_price'>): number {
  return p.discount_price && p.discount_price < p.price ? p.discount_price : p.price;
}
