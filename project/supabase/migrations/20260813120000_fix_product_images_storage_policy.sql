-- Ensure the product-images storage bucket exists and is public.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Allow anonymous and authenticated users to read product images.
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- Allow uploads for product images from the storefront/admin app.
DROP POLICY IF EXISTS "public_upload_product_images" ON storage.objects;
CREATE POLICY "public_upload_product_images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow updates and deletes for stored product images.
DROP POLICY IF EXISTS "public_update_product_images" ON storage.objects;
CREATE POLICY "public_update_product_images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "public_delete_product_images" ON storage.objects;
CREATE POLICY "public_delete_product_images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'product-images');
