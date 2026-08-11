/*
# Razorpay Payments + WhatsApp Order Alerts

This migration wires real payment processing and owner WhatsApp notifications
into the store's EXISTING `orders` / `order_items` tables (created in
20260807171006_create_store_schema.sql) — it does not create a second,
parallel orders table, so the admin dashboard, account page, and order
confirmation page all keep working unchanged.

1. New columns on `orders`
   - razorpay_order_id, razorpay_payment_id, razorpay_signature — Razorpay's
     identifiers for the transaction.
   - payment_status — 'pending' | 'paid' | 'failed' | 'cod_pending'. Separate
     from the existing `status` column, which tracks fulfillment
     (Pending/Confirmed/Shipped/Delivered/...).
   - whatsapp_sent / whatsapp_error — delivery tracking for the owner alert.
   - stock_decremented — guards against double stock deduction.
   - updated_at — maintained by trigger.

2. Security
   - The old wide-open "manage_orders" / "manage_order_items" policies (which
     let the anon key insert/update/delete freely) are dropped. Reads stay
     public (needed by the account page's order history + tracking, and the
     order confirmation page), but ALL writes now go exclusively through the
     Edge Functions below, which use the service-role key and verify prices,
     stock, and payment signatures server-side. The browser can no longer
     create or edit an order directly.

3. decrement_stock_for_order(order_id)
   - Atomically decrements stock for every line in an order and recomputes
     each product's status (In Stock / Low Stock / Out of Stock) in one
     server-side call — replaces the old per-item loop that ran in the
     browser.
*/

-- ============ ORDERS: new columns ============
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS razorpay_signature text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_sent boolean NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_error text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_decremented boolean NOT NULL DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ============ updated_at trigger ============
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS orders_set_updated_at ON orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============ LOCK DOWN ORDER WRITES ============
-- Reads stay public (account page / order tracking / order confirmation
-- rely on this). Writes are removed — only Edge Functions (service role,
-- which bypasses RLS entirely) may create or modify orders from now on.
-- This is the actual fix for the price-tampering risk: previously any
-- browser with the anon key could insert an order row with any total it
-- wanted. Now every order is created server-side after verifying real
-- prices and stock.
DROP POLICY IF EXISTS "manage_orders" ON orders;
DROP POLICY IF EXISTS "manage_order_items" ON order_items;

-- Note: `customers` and `products` keep their existing open policies from
-- the base schema. This build uses a lightweight custom auth (email +
-- password stored in the `customers` table, checked client-side) rather
-- than Supabase Auth, so the browser still needs to write there directly
-- for registration/login/profile updates. See README for a note on
-- migrating to Supabase Auth if this store needs to harden further.

-- ============ ATOMIC STOCK DECREMENT ============
CREATE OR REPLACE FUNCTION decrement_stock_for_order(p_order_id uuid)
RETURNS void AS $$
DECLARE
  item RECORD;
  new_stock integer;
BEGIN
  FOR item IN SELECT product_id, quantity FROM order_items WHERE order_id = p_order_id AND product_id IS NOT NULL LOOP
    UPDATE products
    SET stock = GREATEST(stock - item.quantity, 0)
    WHERE id = item.product_id
    RETURNING stock INTO new_stock;

    IF new_stock IS NOT NULL THEN
      UPDATE products
      SET status = CASE
        WHEN new_stock = 0 THEN 'Out of Stock'
        WHEN new_stock <= low_stock_threshold THEN 'Low Stock'
        ELSE 'In Stock'
      END
      WHERE id = item.product_id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
