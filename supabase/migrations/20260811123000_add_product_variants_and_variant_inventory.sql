-- Add product_variants table and variant-aware order stock support

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size text NOT NULL,
  color text NOT NULL,
  sku text UNIQUE,
  stock integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_product_variants" ON product_variants;
CREATE POLICY "public_read_product_variants" ON product_variants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "manage_product_variants" ON product_variants;
CREATE POLICY "manage_product_variants" ON product_variants FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_unique ON product_variants(product_id, size, color);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON order_items(variant_id);

CREATE OR REPLACE FUNCTION set_updated_at_variant()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS product_variants_set_updated_at ON product_variants;
CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_variant();

CREATE OR REPLACE FUNCTION refresh_product_inventory_summary(p_product_id uuid)
RETURNS void AS $$
DECLARE
  total_stock integer;
  has_in_stock boolean;
  min_threshold integer;
BEGIN
  SELECT
    COALESCE(SUM(stock), 0),
    bool_or(stock > low_stock_threshold),
    COALESCE(MIN(low_stock_threshold), 0)
  INTO total_stock, has_in_stock, min_threshold
  FROM product_variants
  WHERE product_id = p_product_id;

  UPDATE products
  SET stock = total_stock,
      low_stock_threshold = min_threshold,
      status = CASE
        WHEN total_stock = 0 THEN 'Out of Stock'
        WHEN has_in_stock THEN 'In Stock'
        ELSE 'Low Stock'
      END
  WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION product_variants_refresh_summary()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_product_inventory_summary(OLD.product_id);
    RETURN OLD;
  END IF;

  PERFORM refresh_product_inventory_summary(NEW.product_id);
  IF TG_OP = 'UPDATE' AND NEW.product_id <> OLD.product_id THEN
    PERFORM refresh_product_inventory_summary(OLD.product_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS product_variants_after_change ON product_variants;
CREATE TRIGGER product_variants_after_change
  AFTER INSERT OR UPDATE OR DELETE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION product_variants_refresh_summary();

CREATE OR REPLACE FUNCTION decrement_stock_for_order(p_order_id uuid)
RETURNS void AS $$
DECLARE
  line RECORD;
  updated_product_id uuid;
BEGIN
  FOR line IN
    SELECT
      variant_id,
      product_id,
      SUM(quantity)::integer AS qty
    FROM order_items
    WHERE order_id = p_order_id
    GROUP BY variant_id, product_id
  LOOP
    IF line.variant_id IS NOT NULL THEN
      UPDATE product_variants
      SET stock = stock - line.qty
      WHERE id = line.variant_id AND stock >= line.qty
      RETURNING product_id INTO updated_product_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for variant %', line.variant_id;
      END IF;

      PERFORM refresh_product_inventory_summary(updated_product_id);
    ELSE
      UPDATE products
      SET stock = stock - line.qty
      WHERE id = line.product_id AND stock >= line.qty
      RETURNING id INTO updated_product_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient stock for product %', line.product_id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Migrate existing product-level stock into fallback variants.
INSERT INTO product_variants (product_id, size, color, sku, stock, low_stock_threshold)
SELECT
  p.id,
  COALESCE(p.sizes[1], 'One Size'),
  COALESCE(p.colors[1], 'Default'),
  COALESCE(p.sku, concat('VAR-', left(regexp_replace(lower(p.name), '[^a-z0-9]+', '-', 'g'), 10), '-', left(gen_random_uuid()::text, 4))),
  p.stock,
  p.low_stock_threshold
FROM products p
WHERE p.stock IS NOT NULL;

-- Refresh summary for all products now that variants exist.
DO $$
DECLARE
  prod RECORD;
BEGIN
  FOR prod IN SELECT id FROM products LOOP
    PERFORM refresh_product_inventory_summary(prod.id);
  END LOOP;
END;
$$ LANGUAGE plpgsql;
