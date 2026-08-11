-- Seed data for MAISON storefront demo

INSERT INTO categories (name, slug, image, enabled) VALUES
  ('T-Shirts', 't-shirts', 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200', true),
  ('Shirts', 'shirts', 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200', true),
  ('Jeans', 'jeans', 'https://images.pexels.com/photos/1082528/pexels-photo-1082528.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200', true),
  ('Jackets', 'jackets', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200', true),
  ('Sweaters', 'sweaters', 'https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200', true),
  ('Shoes', 'shoes', 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200', true),
  ('Accessories', 'accessories', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200', true),
  ('Shorts', 'shorts', 'https://images.pexels.com/photos/1082526/pexels-photo-1082526.jpeg?auto=compress&cs=tinysrgb&h=800&w=1200', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, brand, description, category_id, price, discount_price, sku, sizes, colors, stock, low_stock_threshold, status, featured, best_seller, rating, review_count) VALUES
  ('Essential Crewneck Tee', 'Maison Basics', 'A wardrobe staple cut from breathable cotton jersey for everyday comfort, built to layer or wear on its own.', (SELECT id FROM categories WHERE slug = 't-shirts'), 28.00, NULL, 'TS-001', ARRAY['S','M','L','XL','XXL'], ARRAY['Black','White','Charcoal','Navy'], 120, 8, 'In Stock', True, True, 4.2, 8),
  ('Heavyweight Pocket Tee', 'Northfield', 'A wardrobe staple cut from breathable cotton jersey for everyday comfort, built to layer or wear on its own.', (SELECT id FROM categories WHERE slug = 't-shirts'), 34.00, 26.00, 'TS-002', ARRAY['S','M','L','XL'], ARRAY['Olive','Sand','Black'], 80, 8, 'In Stock', False, True, 4.4, 11),
  ('Striped Cotton Tee', 'Maison Basics', 'A wardrobe staple cut from breathable cotton jersey for everyday comfort, built to layer or wear on its own.', (SELECT id FROM categories WHERE slug = 't-shirts'), 32.00, NULL, 'TS-003', ARRAY['S','M','L','XL'], ARRAY['Navy/White','Black/Grey'], 60, 8, 'In Stock', False, False, 4.5, 14),
  ('Long Sleeve Henley', 'Northfield', 'A wardrobe staple cut from breathable cotton jersey for everyday comfort, built to layer or wear on its own.', (SELECT id FROM categories WHERE slug = 't-shirts'), 38.00, NULL, 'TS-004', ARRAY['M','L','XL','XXL'], ARRAY['Stone','Black'], 45, 8, 'In Stock', True, False, 4.7, 17),
  ('Oxford Button-Down Shirt', 'Harrow & Co.', 'Tailored with a clean silhouette and a soft-touch finish, designed to move easily from desk to dinner.', (SELECT id FROM categories WHERE slug = 'shirts'), 68.00, NULL, 'SH-001', ARRAY['S','M','L','XL','XXL'], ARRAY['White','Light Blue','Sky'], 90, 8, 'In Stock', True, True, 4.8, 20),
  ('Flannel Check Shirt', 'Northfield', 'Tailored with a clean silhouette and a soft-touch finish, designed to move easily from desk to dinner.', (SELECT id FROM categories WHERE slug = 'shirts'), 62.00, 48.00, 'SH-002', ARRAY['M','L','XL'], ARRAY['Red Plaid','Green Plaid','Blue Plaid'], 55, 8, 'In Stock', False, True, 4.2, 23),
  ('Linen Blend Shirt', 'Harrow & Co.', 'Tailored with a clean silhouette and a soft-touch finish, designed to move easily from desk to dinner.', (SELECT id FROM categories WHERE slug = 'shirts'), 74.00, NULL, 'SH-003', ARRAY['S','M','L','XL'], ARRAY['Sand','White','Sage'], 40, 8, 'In Stock', True, False, 4.4, 26),
  ('Denim Overshirt', 'Maison Basics', 'Tailored with a clean silhouette and a soft-touch finish, designed to move easily from desk to dinner.', (SELECT id FROM categories WHERE slug = 'shirts'), 82.00, NULL, 'SH-004', ARRAY['M','L','XL','XXL'], ARRAY['Mid Wash','Dark Indigo'], 35, 8, 'In Stock', False, False, 4.5, 29),
  ('Slim Fit Stretch Jeans', 'Harrow & Co.', 'Engineered denim with just the right amount of stretch, finished with a lived-in wash for everyday wear.', (SELECT id FROM categories WHERE slug = 'jeans'), 89.00, 69.00, 'JN-001', ARRAY['28','30','32','34','36','38'], ARRAY['Dark Indigo','Mid Wash','Black'], 100, 8, 'In Stock', True, True, 4.7, 32),
  ('Straight Leg Raw Denim', 'Northfield', 'Engineered denim with just the right amount of stretch, finished with a lived-in wash for everyday wear.', (SELECT id FROM categories WHERE slug = 'jeans'), 110.00, NULL, 'JN-002', ARRAY['30','32','34','36'], ARRAY['Raw Indigo'], 30, 8, 'In Stock', True, False, 4.8, 35),
  ('Relaxed Fit Jeans', 'Maison Basics', 'Engineered denim with just the right amount of stretch, finished with a lived-in wash for everyday wear.', (SELECT id FROM categories WHERE slug = 'jeans'), 78.00, NULL, 'JN-003', ARRAY['30','32','34','36','38'], ARRAY['Washed','Black'], 65, 8, 'In Stock', False, True, 4.2, 38),
  ('Bomber Jacket', 'Harrow & Co.', 'A versatile outer layer with a modern fit, finished with durable hardware and a soft interior lining.', (SELECT id FROM categories WHERE slug = 'jackets'), 148.00, 118.00, 'JK-001', ARRAY['S','M','L','XL'], ARRAY['Black','Olive'], 40, 8, 'In Stock', True, True, 4.4, 41),
  ('Quilted Field Jacket', 'Northfield', 'A versatile outer layer with a modern fit, finished with durable hardware and a soft interior lining.', (SELECT id FROM categories WHERE slug = 'jackets'), 165.00, NULL, 'JK-002', ARRAY['M','L','XL','XXL'], ARRAY['Sand','Navy'], 28, 8, 'In Stock', True, False, 4.5, 44),
  ('Denim Trucker Jacket', 'Maison Basics', 'A versatile outer layer with a modern fit, finished with durable hardware and a soft interior lining.', (SELECT id FROM categories WHERE slug = 'jackets'), 98.00, NULL, 'JK-003', ARRAY['S','M','L','XL'], ARRAY['Mid Wash','Black'], 32, 8, 'In Stock', False, True, 4.7, 47),
  ('Wool Blend Overcoat', 'Harrow & Co.', 'A versatile outer layer with a modern fit, finished with durable hardware and a soft interior lining.', (SELECT id FROM categories WHERE slug = 'jackets'), 240.00, 199.00, 'JK-004', ARRAY['M','L','XL'], ARRAY['Charcoal','Camel'], 18, 8, 'In Stock', True, False, 4.8, 50),
  ('Merino Crewneck Sweater', 'Harrow & Co.', 'Knit from a warm, soft-touch yarn blend with ribbed cuffs and hem for a lasting shape.', (SELECT id FROM categories WHERE slug = 'sweaters'), 95.00, NULL, 'SW-001', ARRAY['S','M','L','XL'], ARRAY['Navy','Grey','Burgundy'], 50, 8, 'In Stock', True, True, 4.2, 53),
  ('Cable Knit Sweater', 'Northfield', 'Knit from a warm, soft-touch yarn blend with ribbed cuffs and hem for a lasting shape.', (SELECT id FROM categories WHERE slug = 'sweaters'), 88.00, 68.00, 'SW-002', ARRAY['M','L','XL','XXL'], ARRAY['Cream','Olive'], 38, 8, 'In Stock', False, True, 4.4, 9),
  ('Half-Zip Sweater', 'Maison Basics', 'Knit from a warm, soft-touch yarn blend with ribbed cuffs and hem for a lasting shape.', (SELECT id FROM categories WHERE slug = 'sweaters'), 76.00, NULL, 'SW-003', ARRAY['S','M','L','XL'], ARRAY['Charcoal','Sand'], 42, 8, 'In Stock', False, False, 4.5, 12),
  ('Classic Leather Sneakers', 'Harrow & Co.', 'Crafted with premium materials and a cushioned footbed for comfort that lasts all day.', (SELECT id FROM categories WHERE slug = 'shoes'), 120.00, NULL, 'SN-001', ARRAY['7','8','9','10','11','12'], ARRAY['White','Black'], 70, 8, 'In Stock', True, True, 4.7, 15),
  ('Suede Chukka Boots', 'Northfield', 'Crafted with premium materials and a cushioned footbed for comfort that lasts all day.', (SELECT id FROM categories WHERE slug = 'shoes'), 145.00, 115.00, 'SN-002', ARRAY['8','9','10','11','12'], ARRAY['Tan','Brown'], 34, 8, 'In Stock', True, False, 4.8, 18),
  ('Canvas Low-Top Sneakers', 'Maison Basics', 'Crafted with premium materials and a cushioned footbed for comfort that lasts all day.', (SELECT id FROM categories WHERE slug = 'shoes'), 68.00, NULL, 'SN-003', ARRAY['7','8','9','10','11'], ARRAY['Black/White','Navy'], 55, 8, 'In Stock', False, True, 4.2, 21),
  ('Leather Derby Shoes', 'Harrow & Co.', 'Crafted with premium materials and a cushioned footbed for comfort that lasts all day.', (SELECT id FROM categories WHERE slug = 'shoes'), 165.00, NULL, 'SN-004', ARRAY['8','9','10','11','12'], ARRAY['Black','Brown'], 20, 8, 'In Stock', False, False, 4.4, 24),
  ('Leather Belt', 'Harrow & Co.', 'A refined finishing touch made from quality materials, designed to complement any outfit.', (SELECT id FROM categories WHERE slug = 'accessories'), 42.00, NULL, 'AC-001', ARRAY['One Size'], ARRAY['Black','Brown'], 90, 8, 'In Stock', False, True, 4.5, 27),
  ('Wool Beanie', 'Northfield', 'A refined finishing touch made from quality materials, designed to complement any outfit.', (SELECT id FROM categories WHERE slug = 'accessories'), 26.00, NULL, 'AC-002', ARRAY['One Size'], ARRAY['Charcoal','Navy','Olive'], 75, 8, 'In Stock', False, False, 4.7, 30),
  ('Aviator Sunglasses', 'Maison Basics', 'A refined finishing touch made from quality materials, designed to complement any outfit.', (SELECT id FROM categories WHERE slug = 'accessories'), 58.00, 44.00, 'AC-003', ARRAY['One Size'], ARRAY['Gold','Silver'], 46, 8, 'In Stock', True, False, 4.8, 33),
  ('Canvas Weekender Bag', 'Harrow & Co.', 'A refined finishing touch made from quality materials, designed to complement any outfit.', (SELECT id FROM categories WHERE slug = 'accessories'), 88.00, NULL, 'AC-004', ARRAY['One Size'], ARRAY['Sand','Black'], 25, 8, 'In Stock', True, False, 4.2, 36),
  ('Chino Shorts', 'Maison Basics', 'Lightweight and breathable with a tailored fit, ideal for warm-weather days on or off duty.', (SELECT id FROM categories WHERE slug = 'shorts'), 46.00, NULL, 'SO-001', ARRAY['28','30','32','34','36'], ARRAY['Khaki','Navy','Stone'], 60, 8, 'In Stock', False, True, 4.4, 39),
  ('Cargo Shorts', 'Northfield', 'Lightweight and breathable with a tailored fit, ideal for warm-weather days on or off duty.', (SELECT id FROM categories WHERE slug = 'shorts'), 52.00, 40.00, 'SO-002', ARRAY['30','32','34','36','38'], ARRAY['Olive','Black'], 44, 8, 'In Stock', False, False, 4.5, 42)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO product_images (product_id, url, position) VALUES
  ((SELECT id FROM products WHERE sku = 'TS-001'), 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'TS-001'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'TS-002'), 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'TS-002'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'TS-003'), 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'TS-003'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'TS-004'), 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'TS-004'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SH-001'), 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SH-001'), 'https://images.pexels.com/photos/2897883/pexels-photo-2897883.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SH-002'), 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SH-002'), 'https://images.pexels.com/photos/2897883/pexels-photo-2897883.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SH-003'), 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SH-003'), 'https://images.pexels.com/photos/2897883/pexels-photo-2897883.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SH-004'), 'https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SH-004'), 'https://images.pexels.com/photos/2897883/pexels-photo-2897883.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'JN-001'), 'https://images.pexels.com/photos/1082528/pexels-photo-1082528.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'JN-001'), 'https://images.pexels.com/photos/2897531/pexels-photo-2897531.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'JN-002'), 'https://images.pexels.com/photos/1082528/pexels-photo-1082528.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'JN-002'), 'https://images.pexels.com/photos/2897531/pexels-photo-2897531.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'JN-003'), 'https://images.pexels.com/photos/1082528/pexels-photo-1082528.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'JN-003'), 'https://images.pexels.com/photos/2897531/pexels-photo-2897531.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'JK-001'), 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'JK-001'), 'https://images.pexels.com/photos/1670766/pexels-photo-1670766.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'JK-002'), 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'JK-002'), 'https://images.pexels.com/photos/1670766/pexels-photo-1670766.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'JK-003'), 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'JK-003'), 'https://images.pexels.com/photos/1670766/pexels-photo-1670766.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'JK-004'), 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'JK-004'), 'https://images.pexels.com/photos/1670766/pexels-photo-1670766.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SW-001'), 'https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SW-001'), 'https://images.pexels.com/photos/6046236/pexels-photo-6046236.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SW-002'), 'https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SW-002'), 'https://images.pexels.com/photos/6046236/pexels-photo-6046236.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SW-003'), 'https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SW-003'), 'https://images.pexels.com/photos/6046236/pexels-photo-6046236.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SN-001'), 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SN-001'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SN-002'), 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SN-002'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SN-003'), 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SN-003'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SN-004'), 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SN-004'), 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'AC-001'), 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'AC-001'), 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'AC-002'), 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'AC-002'), 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'AC-003'), 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'AC-003'), 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'AC-004'), 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'AC-004'), 'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SO-001'), 'https://images.pexels.com/photos/1082526/pexels-photo-1082526.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SO-001'), 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1),
  ((SELECT id FROM products WHERE sku = 'SO-002'), 'https://images.pexels.com/photos/1082526/pexels-photo-1082526.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 0),
  ((SELECT id FROM products WHERE sku = 'SO-002'), 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1000', 1);

INSERT INTO reviews (product_id, customer_name, customer_email, rating, title, body, status) VALUES
  ((SELECT id FROM products WHERE sku = 'TS-001'), 'James Whitfield', 'james.w@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'TS-001'), 'Marcus Lee', 'marcus.lee@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'TS-002'), 'Daniel Ortiz', 'daniel.ortiz@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'TS-002'), 'Ethan Brooks', 'ethan.brooks@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'TS-004'), 'Samuel Grant', 'sam.grant@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'TS-004'), 'Oliver Bennett', 'oliver.b@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SH-001'), 'James Whitfield', 'james.w@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SH-001'), 'Marcus Lee', 'marcus.lee@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SH-002'), 'Daniel Ortiz', 'daniel.ortiz@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SH-002'), 'Ethan Brooks', 'ethan.brooks@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SH-003'), 'Samuel Grant', 'sam.grant@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SH-003'), 'Oliver Bennett', 'oliver.b@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JN-001'), 'James Whitfield', 'james.w@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JN-001'), 'Marcus Lee', 'marcus.lee@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JN-002'), 'Daniel Ortiz', 'daniel.ortiz@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JN-002'), 'Ethan Brooks', 'ethan.brooks@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JN-003'), 'Samuel Grant', 'sam.grant@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JN-003'), 'Oliver Bennett', 'oliver.b@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JK-001'), 'James Whitfield', 'james.w@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JK-001'), 'Marcus Lee', 'marcus.lee@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JK-002'), 'Daniel Ortiz', 'daniel.ortiz@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JK-002'), 'Ethan Brooks', 'ethan.brooks@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JK-003'), 'Samuel Grant', 'sam.grant@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JK-003'), 'Oliver Bennett', 'oliver.b@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JK-004'), 'James Whitfield', 'james.w@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'JK-004'), 'Marcus Lee', 'marcus.lee@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SW-001'), 'Daniel Ortiz', 'daniel.ortiz@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SW-001'), 'Ethan Brooks', 'ethan.brooks@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SW-002'), 'Samuel Grant', 'sam.grant@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SW-002'), 'Oliver Bennett', 'oliver.b@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SN-001'), 'James Whitfield', 'james.w@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SN-001'), 'Marcus Lee', 'marcus.lee@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SN-002'), 'Daniel Ortiz', 'daniel.ortiz@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SN-002'), 'Ethan Brooks', 'ethan.brooks@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SN-003'), 'Samuel Grant', 'sam.grant@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SN-003'), 'Oliver Bennett', 'oliver.b@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'AC-001'), 'James Whitfield', 'james.w@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'AC-001'), 'Marcus Lee', 'marcus.lee@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'AC-003'), 'Daniel Ortiz', 'daniel.ortiz@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'AC-003'), 'Ethan Brooks', 'ethan.brooks@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'AC-004'), 'Samuel Grant', 'sam.grant@example.com', 4, 'Great fit and quality', 'Fits true to size and the fabric feels much better than the price suggests. Will buy again.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'AC-004'), 'Oliver Bennett', 'oliver.b@example.com', 5, 'Exactly as pictured', 'Color matched the photos and shipping was fast. Very happy with this purchase.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SO-001'), 'James Whitfield', 'james.w@example.com', 4, 'Solid everyday piece', 'Comfortable enough to wear all day. Holds up well after a few washes.', 'approved'),
  ((SELECT id FROM products WHERE sku = 'SO-001'), 'Marcus Lee', 'marcus.lee@example.com', 5, 'Good value', 'Not the most premium fabric but for the price it''s a solid pick for regular rotation.', 'approved');

INSERT INTO banners (title, subtitle, image, cta_text, cta_link, position, enabled) VALUES
  ('Autumn Collection 2026', 'Refined essentials for the modern gentleman.', 'https://images.pexels.com/photos/10482937/pexels-photo-10482937.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1600', 'Shop the Collection', '/shop', 0, true),
  ('New Arrivals Weekly', 'Fresh styles added every week, straight from the atelier.', 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1600', 'See What''s New', '/new-arrivals', 1, true),
  ('Up to 30% Off Select Styles', 'Limited-time seasonal savings on outerwear and knitwear.', 'https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1600', 'Shop Offers', '/offers', 2, true);

INSERT INTO coupons (code, type, value, min_order, expires_at, enabled) VALUES
  ('WELCOME10', 'percentage', 10.0, 0.0, '2026-12-31', true),
  ('SAVE20', 'percentage', 20.0, 100.0, '2026-11-30', true),
  ('FREESHIP', 'fixed', 8.0, 50.0, '2026-12-31', true)
ON CONFLICT (code) DO NOTHING;


INSERT INTO customers (name, email, phone, password, total_spending) VALUES
  ('James Carter', 'james.carter@email.com', '+1 555-201-4488', 'password123', 0)
ON CONFLICT (email) DO NOTHING;

INSERT INTO addresses (customer_email, label, recipient, phone, address, city, country, is_default) VALUES
  ('james.carter@email.com', 'Home', 'James Carter', '+1 555-201-4488', '482 Riverside Drive, Apt 6B', 'New York', 'USA', true);

WITH demo_order AS (
  INSERT INTO orders (order_number, customer_name, customer_email, phone, address, city, country, shipping_method, subtotal, discount, shipping_fee, total, status, payment_method)
  VALUES ('ORD-100234', 'James Carter', 'james.carter@email.com', '+1 555-201-4488', '482 Riverside Drive, Apt 6B', 'New York', 'USA', 'Standard', 96.00, 0, 0, 96.00, 'Delivered', 'Card')
  RETURNING id
)
INSERT INTO order_items (order_id, product_id, product_name, product_image, brand, size, color, quantity, price)
SELECT demo_order.id, p.id, p.name, pi.url, p.brand, 'M', p.colors[1], 1, p.price
FROM demo_order, products p
LEFT JOIN LATERAL (SELECT url FROM product_images WHERE product_id = p.id ORDER BY position LIMIT 1) pi ON true
WHERE p.sku = 'TS-001';
