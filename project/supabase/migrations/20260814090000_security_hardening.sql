/*
# Security Hardening

This migration fixes the "wide open" RLS posture from the initial schema
(most tables had `USING (true) WITH CHECK (true)` for anon + authenticated,
meaning anyone with the public anon key could read or write anything —
customer PII, order history, product prices, coupons, etc.)

1. Real roles
   - `admin_users` — maps a Supabase Auth user (auth.uid()) to an admin.
     There is no self-service way to become an admin: rows are inserted
     manually (see README/SECURITY_NOTES for the one-time setup step).
   - `is_admin()` — SECURITY DEFINER helper, true if the current JWT
     belongs to a row in admin_users.
   - Customers now authenticate with real Supabase Auth (email+password)
     instead of a hand-rolled, plaintext-password table. Ownership checks
     use `auth.jwt() ->> 'email'` matched (case-insensitively) against the
     `customer_email` column that already existed on every customer-owned
     table, so no application code that queries by email needs to change.

2. Policy shape (per table)
   - Public catalog data (categories, products, product_images, approved
     reviews, enabled coupons, enabled banners/announcements): SELECT open
     to anon+authenticated, all writes admin-only.
   - Customer-owned data (customers, orders, order_items, addresses,
     wishlist): SELECT/UPDATE/DELETE restricted to the owning customer
     (by verified email) or an admin. INSERT is admin/service-role only
     for orders/order_items (created exclusively by the Edge Functions
     using the service role key, which bypasses RLS entirely — the
     checkout flow is unaffected). Customers may insert/update their own
     addresses and wishlist rows.
   - newsletter: insert-only for anon/authenticated (signup), read/delete
     restricted to admins.
   - reviews: anyone can submit a review (status defaults to "pending"
     server-side default remains "approved" only via admin edit), but
     only admins can change status/delete/edit others' reviews.

3. `customers.password` is dropped — passwords are now managed by
   Supabase Auth (bcrypt-hashed, never touched by application code).
*/

-- ============ ADMIN ROLE ============
CREATE TABLE IF NOT EXISTS admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
$$;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon;

-- Only admins can see who else is an admin; nobody can self-grant.
DROP POLICY IF EXISTS "admins_read_admin_users" ON admin_users;
CREATE POLICY "admins_read_admin_users" ON admin_users FOR SELECT TO authenticated USING (is_admin());

-- ============ CATEGORIES ============
DROP POLICY IF EXISTS "manage_categories" ON categories;
CREATE POLICY "admin_write_categories" ON categories FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_categories" ON categories FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_categories" ON categories FOR DELETE TO authenticated USING (is_admin());

-- ============ PRODUCTS ============
DROP POLICY IF EXISTS "manage_products" ON products;
CREATE POLICY "admin_write_products" ON products FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_products" ON products FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_products" ON products FOR DELETE TO authenticated USING (is_admin());

-- ============ PRODUCT IMAGES ============
DROP POLICY IF EXISTS "manage_product_images" ON product_images;
CREATE POLICY "admin_write_product_images" ON product_images FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_product_images" ON product_images FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_product_images" ON product_images FOR DELETE TO authenticated USING (is_admin());

-- ============ REVIEWS ============
-- Anyone (including guests) can leave a review; only admins can moderate,
-- edit someone else's review, or delete one.
DROP POLICY IF EXISTS "public_read_approved_reviews" ON reviews;
CREATE POLICY "public_read_approved_reviews" ON reviews FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR is_admin());
DROP POLICY IF EXISTS "manage_reviews" ON reviews;
CREATE POLICY "public_submit_reviews" ON reviews FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin_update_reviews" ON reviews FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_reviews" ON reviews FOR DELETE TO authenticated USING (is_admin());

-- ============ CUSTOMERS ============
ALTER TABLE customers DROP COLUMN IF EXISTS password;
DROP POLICY IF EXISTS "public_read_customers" ON customers;
DROP POLICY IF EXISTS "manage_customers" ON customers;
CREATE POLICY "customer_read_own" ON customers FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email') OR is_admin());
CREATE POLICY "customer_update_own" ON customers FOR UPDATE TO authenticated
  USING (lower(email) = lower(auth.jwt() ->> 'email') OR is_admin())
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email') OR is_admin());
CREATE POLICY "customer_insert_own" ON customers FOR INSERT TO authenticated
  WITH CHECK (lower(email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY "admin_delete_customers" ON customers FOR DELETE TO authenticated USING (is_admin());

-- ============ ORDERS ============
-- Orders are created exclusively by Edge Functions using the service-role
-- key (which bypasses RLS), so there is deliberately no anon/authenticated
-- INSERT policy here — checkout is unaffected, but nobody can forge an
-- order row directly against the REST API.
DROP POLICY IF EXISTS "public_read_orders" ON orders;
DROP POLICY IF EXISTS "manage_orders" ON orders;
CREATE POLICY "customer_read_own_orders" ON orders FOR SELECT TO authenticated
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email') OR is_admin());
CREATE POLICY "admin_update_orders" ON orders FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_orders" ON orders FOR DELETE TO authenticated USING (is_admin());

-- ============ ORDER ITEMS ============
DROP POLICY IF EXISTS "public_read_order_items" ON order_items;
DROP POLICY IF EXISTS "manage_order_items" ON order_items;
CREATE POLICY "customer_read_own_order_items" ON order_items FOR SELECT TO authenticated
  USING (
    is_admin() OR EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_items.order_id
      AND lower(o.customer_email) = lower(auth.jwt() ->> 'email')
    )
  );
CREATE POLICY "admin_update_order_items" ON order_items FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_order_items" ON order_items FOR DELETE TO authenticated USING (is_admin());

-- ============ COUPONS ============
-- Public can only see enabled coupons (needed so checkout can validate a
-- code); full row management is admin-only.
DROP POLICY IF EXISTS "public_read_coupons" ON coupons;
CREATE POLICY "public_read_enabled_coupons" ON coupons FOR SELECT TO anon, authenticated
  USING (enabled = true OR is_admin());
DROP POLICY IF EXISTS "manage_coupons" ON coupons;
CREATE POLICY "admin_write_coupons" ON coupons FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_coupons" ON coupons FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_coupons" ON coupons FOR DELETE TO authenticated USING (is_admin());

-- ============ WISHLIST ============
DROP POLICY IF EXISTS "manage_wishlist" ON wishlist;
CREATE POLICY "customer_read_own_wishlist" ON wishlist FOR SELECT TO authenticated
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email') OR is_admin());
CREATE POLICY "customer_insert_own_wishlist" ON wishlist FOR INSERT TO authenticated
  WITH CHECK (lower(customer_email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY "customer_delete_own_wishlist" ON wishlist FOR DELETE TO authenticated
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email') OR is_admin());

-- ============ ADDRESSES ============
DROP POLICY IF EXISTS "manage_addresses" ON addresses;
CREATE POLICY "customer_read_own_addresses" ON addresses FOR SELECT TO authenticated
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email') OR is_admin());
CREATE POLICY "customer_insert_own_addresses" ON addresses FOR INSERT TO authenticated
  WITH CHECK (lower(customer_email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY "customer_update_own_addresses" ON addresses FOR UPDATE TO authenticated
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email') OR is_admin())
  WITH CHECK (lower(customer_email) = lower(auth.jwt() ->> 'email') OR is_admin());
CREATE POLICY "customer_delete_own_addresses" ON addresses FOR DELETE TO authenticated
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email') OR is_admin());

-- ============ NEWSLETTER ============
-- Anyone can subscribe (insert their own email); nobody can read or
-- enumerate the subscriber list except admins.
DROP POLICY IF EXISTS "manage_newsletter" ON newsletter;
CREATE POLICY "public_subscribe_newsletter" ON newsletter FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin_read_newsletter" ON newsletter FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "admin_delete_newsletter" ON newsletter FOR DELETE TO authenticated USING (is_admin());

-- ============ BANNERS ============
DROP POLICY IF EXISTS "manage_banners" ON banners;
CREATE POLICY "admin_write_banners" ON banners FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_banners" ON banners FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_banners" ON banners FOR DELETE TO authenticated USING (is_admin());

-- ============ ANNOUNCEMENTS ============
DROP POLICY IF EXISTS "manage_announcements" ON announcements;
CREATE POLICY "admin_write_announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "admin_update_announcements" ON announcements FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "admin_delete_announcements" ON announcements FOR DELETE TO authenticated USING (is_admin());

-- ============ PRODUCT VARIANTS (added in a later migration; lock down the
-- same "true" policy if it exists) ============
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') THEN
    EXECUTE 'ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "manage_product_variants" ON product_variants';
    EXECUTE 'DROP POLICY IF EXISTS "public_read_product_variants" ON product_variants';
    EXECUTE 'CREATE POLICY "public_read_product_variants" ON product_variants FOR SELECT TO anon, authenticated USING (true)';
    EXECUTE 'CREATE POLICY "admin_write_product_variants" ON product_variants FOR INSERT TO authenticated WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "admin_update_product_variants" ON product_variants FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin())';
    EXECUTE 'CREATE POLICY "admin_delete_product_variants" ON product_variants FOR DELETE TO authenticated USING (is_admin())';
  END IF;
END $$;

-- ============ PRODUCT IMAGE STORAGE ============
-- The bucket must stay publicly *readable* (product images are shown to
-- every visitor), but uploads/overwrites/deletes were open to anon too —
-- anyone could deface the storefront or fill the bucket with arbitrary
-- files. Lock writes to admins only.
DROP POLICY IF EXISTS "public_upload_product_images" ON storage.objects;
CREATE POLICY "admin_upload_product_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "public_update_product_images" ON storage.objects;
CREATE POLICY "admin_update_product_images_storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images' AND is_admin())
WITH CHECK (bucket_id = 'product-images' AND is_admin());

DROP POLICY IF EXISTS "public_delete_product_images" ON storage.objects;
CREATE POLICY "admin_delete_product_images_storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND is_admin());
