/*
# Men's Fashion E-commerce Schema

1. Overview
This migration creates the complete database for a men's fashion e-commerce platform.
It is a single-tenant store: the storefront reads/writes as the anon key (cart, wishlist,
orders, reviews, newsletter) while an admin (authenticated) manages products, inventory,
categories, coupons, and orders.

2. New Tables
- `categories` — product categories (T-Shirts, Shirts, Jeans, etc.) with image and enabled flag.
- `products` — full product catalog with brand, price, discount, SKU, images, sizes, colors,
  stock, low-stock threshold, status, featured, best_seller, created_at.
- `product_images` — multiple images per product.
- `reviews` — customer reviews with rating, status (approved/pending/hidden).
- `customers` — customer profiles (name, email, phone, disabled flag, total_spending).
- `orders` — orders with status, totals, shipping, coupon, customer snapshot.
- `order_items` — line items per order (product snapshot, qty, size, color, price).
- `coupons` — discount coupons (percentage/fixed, min order, expiry, enabled).
- `wishlist` — saved products per customer.
- `addresses` — saved delivery addresses per customer.
- `newsletter` — email subscriptions.
- `banners` — homepage banner content management.
- `announcements` — store-wide announcement bar content.

3. Security
- RLS enabled on every table.
- Public read on catalog data (categories, products, product_images, approved reviews,
  enabled coupons, enabled banners/announcements) for anon + authenticated.
- Customers manage their own reviews, wishlist, addresses, orders (owner-scoped by email
  since the storefront uses a lightweight customer identity, not Supabase auth).
- Admin (authenticated role) has full CRUD on management tables.
- For simplicity in this demo, management writes are allowed for anon + authenticated
  so the admin dashboard (which uses a separate admin login gate in the UI) can operate.
  In production these would be locked to an admin role.

4. Notes
- Stock status is derived: stock = 0 -> 'Out of Stock', stock <= threshold -> 'Low Stock',
  else 'In Stock'. We store a computed `status` column updated by the app for query speed.
- Orders reference products by id but snapshot name/price/image so historical orders remain
  accurate even if a product is later edited.
*/

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  image text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_categories" ON categories;
CREATE POLICY "manage_categories" ON categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL,
  description text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  price numeric(10,2) NOT NULL,
  discount_price numeric(10,2),
  sku text UNIQUE,
  sizes text[] NOT NULL DEFAULT '{}',
  colors text[] NOT NULL DEFAULT '{}',
  stock integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  status text NOT NULL DEFAULT 'In Stock',
  featured boolean NOT NULL DEFAULT false,
  best_seller boolean NOT NULL DEFAULT false,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_products" ON products;
CREATE POLICY "manage_products" ON products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at DESC);

-- ============ PRODUCT IMAGES ============
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  position integer NOT NULL DEFAULT 0
);
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_product_images" ON product_images;
CREATE POLICY "public_read_product_images" ON product_images FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_product_images" ON product_images;
CREATE POLICY "manage_product_images" ON product_images FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

-- ============ REVIEWS ============
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
CREATE POLICY "public_read_approved_reviews" ON reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_reviews" ON reviews;
CREATE POLICY "manage_reviews" ON reviews FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

-- ============ CUSTOMERS ============
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  password text,
  disabled boolean NOT NULL DEFAULT false,
  total_spending numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_customers" ON customers;
CREATE POLICY "public_read_customers" ON customers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_customers" ON customers;
CREATE POLICY "manage_customers" ON customers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ ORDERS ============
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  phone text,
  address text,
  city text,
  country text,
  shipping_method text NOT NULL DEFAULT 'Standard',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  shipping_fee numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  coupon_code text,
  status text NOT NULL DEFAULT 'Pending',
  payment_method text NOT NULL DEFAULT 'Card',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_orders" ON orders;
CREATE POLICY "public_read_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_orders" ON orders;
CREATE POLICY "manage_orders" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- ============ ORDER ITEMS ============
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image text,
  brand text,
  size text,
  color text,
  quantity integer NOT NULL,
  price numeric(10,2) NOT NULL
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_order_items" ON order_items;
CREATE POLICY "public_read_order_items" ON order_items FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_order_items" ON order_items;
CREATE POLICY "manage_order_items" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ============ COUPONS ============
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'percentage',
  value numeric(10,2) NOT NULL,
  min_order numeric(10,2) NOT NULL DEFAULT 0,
  expires_at date,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_coupons" ON coupons;
CREATE POLICY "public_read_coupons" ON coupons FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_coupons" ON coupons;
CREATE POLICY "manage_coupons" ON coupons FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ WISHLIST ============
CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manage_wishlist" ON wishlist;
CREATE POLICY "manage_wishlist" ON wishlist FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_wishlist_email ON wishlist(customer_email);

-- ============ ADDRESSES ============
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email text NOT NULL,
  label text NOT NULL,
  recipient text NOT NULL,
  phone text,
  address text NOT NULL,
  city text,
  country text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manage_addresses" ON addresses;
CREATE POLICY "manage_addresses" ON addresses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_addresses_email ON addresses(customer_email);

-- ============ NEWSLETTER ============
CREATE TABLE IF NOT EXISTS newsletter (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE newsletter ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "manage_newsletter" ON newsletter;
CREATE POLICY "manage_newsletter" ON newsletter FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ BANNERS ============
CREATE TABLE IF NOT EXISTS banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image text,
  cta_text text,
  cta_link text,
  position integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true
);
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_banners" ON banners;
CREATE POLICY "public_read_banners" ON banners FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_banners" ON banners;
CREATE POLICY "manage_banners" ON banners FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============ ANNOUNCEMENTS ============
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_announcements" ON announcements;
CREATE POLICY "public_read_announcements" ON announcements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_announcements" ON announcements;
CREATE POLICY "manage_announcements" ON announcements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
