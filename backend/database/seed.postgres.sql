BEGIN;

INSERT INTO categories (id, name, slug, description, sort_order) VALUES
(1, 'Books', 'books', 'Reading and reference titles for thoughtful workspaces.', 1),
(2, 'Stationery', 'stationery', 'Pens, notebooks, and writing tools.', 2),
(3, 'Art Supplies', 'art-supplies', 'Paper, markers, and creative tools.', 3),
(4, 'Tech', 'tech', 'Compact accessories that make the desk work harder.', 4),
(5, 'Gifts', 'gifts', 'Objects that feel intentional and useful.', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, name, slug) VALUES
(1, 'Pilot', 'pilot'),
(2, 'Stabilo', 'stabilo'),
(3, 'Lamy', 'lamy'),
(4, 'Moleskine', 'moleskine'),
(5, 'Muji', 'muji'),
(6, 'Baseus', 'baseus'),
(7, 'Canson', 'canson')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, name, slug, description, price, sale_price, stock_qty, category_id, brand_id, badge, image_url) VALUES
(1, 'Pastel Highlighter Set (6 Pack)', 'pastel-highlighter-set', 'Soft tones, clean lines, and a compact set for daily study.', 14.00, 18.50, 80, 2, 2, 'Sale', 'https://lh3.googleusercontent.com/aida/AP1WRLsv-uhFk17KGk_jgPWP20N0eBNjMnQlQunwqaGwTOtr-LeOum-VbyDTF_JGvDqAD4PTNWzMsEs921_JaBUzaH4_0HPHJTU3AIzw0RRa5g4ee8_NgdyTsHBiRRtyXzcLitVrhjQUeQI1tQbZxoFcwwk9tzTt8xI-4ZxUXL8G7xq8q-4G4bNZbdCNd364KlkogXgEVl7YPrSYfLSsT6sazmRj5xawCjCQdFW7SPMX6Vj0jvq5VO0UIMEOews'),
(2, 'Classic Hardcover Journal - Navy Blue Edition', 'classic-hardcover-journal-navy', 'A durable journal with smooth paper and a refined cloth cover.', 24.00, NULL, 32, 2, NULL, NULL, 'https://lh3.googleusercontent.com/aida/AP1WRLuid_yohZZz3e_1vGozTwad7qCBPi3d2DPhrW3hfrfYpDLOjps7lytC4Ucly0xYGAWxHQe1L-tPfY_Is4BpsrTUh8Y2Lj7RDiLNe2g9yOTsm0Cd4lVMpSeu9rV92loraTjhu0i-m1OY13M5N1HpFHlQRbIIrNI17ZTCbvMh4JQjOyUgWBWObUZ62Ip8fH6Oy0uUZUNloniWvj-ygse8D7kpvZO_aFA8aMPm34aSjiaLdA7rYdglLpTjE3Dh'),
(3, 'Premium Fine-Liner Pen Set - Assorted Colors', 'premium-fine-liner-pen-set', 'A clean, precise set for sketches, notes, and color coding.', 18.50, NULL, 18, 2, NULL, NULL, 'https://lh3.googleusercontent.com/aida/AP1WRLvit1pqIelvrb7l1ouy_DtHsKyGudHeNZFRMKsWtZTzMPkBA2JogyGZTIItW1J1zYpdiMjTO4uXZIuCsIZYoI-DMyZa2uctLeworkGXMAf1RjRKP2Gcv-FxWIm1ApbkTffrArUWSN8jIGHS1Ucw9zOQ71lJ5ZigOzwfVXhcSQTQFCPmDZX24egIRoaRj4VADIyCGU94wtwJJn2C32KxpxsDyrR0yCJm9zFic7NKUxaszk5n1MZeSf8RNKcM'),
(4, 'Professional Sketchbook - Heavyweight Acid-Free Paper', 'professional-sketchbook', 'A sturdy sketchbook built for studies, drafts, and finished work.', 32.00, NULL, 24, 3, NULL, NULL, 'https://lh3.googleusercontent.com/aida/AP1WRLtWPEWZmlVrNUUjGdGyCRd8vhCVzND0rZLVw0GUmBpOQrJv2LKxYszZbp7OTRvcqnD_whehL_Q2SqCDzFLSMLqgIM6LrcnrsNzEA7BHg2SNMtzHoJJOJLMe6z1ozMWPRHT0kwY41Xy_-ebRvYVcoq6RPAjFPXuW7bDVCaX7Q4OY0RVR1UtiqTGjLt5ZOWZayA-jfgkMbFZYAj4gsADSkpGobArIW6qYdt36CbnEGq2fqBkz90JfMiOoMRo9'),
(5, 'Birch Wood Desk Organizer - Modular Design', 'birch-wood-desk-organizer', 'A flexible desk organizer that keeps small tools in one place.', 45.00, NULL, 12, 5, NULL, NULL, 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbQ4kFafv11pzds52xzwMDXM9To2vkwOTnnW0xuTx9J7ctLaSQ-K0bxzm-Poel9dC5-5NEJoTq1qvGcE8rC-MuAsWCLAeuJUgdzNvjHlBmI0GRvBpO88QQew_xvU016gzNyy7ebX6CNyGnUUJ7xvr7zpE0EUrLYZ-ft3B2zW6Qg-oWWcgK_OslZz2srNSJiK-OmwhD3rUFgknsWI7A2cpKGf4O4Jfb3u4kebC7lct0C7Z01kejDdz41ASCSy66v5RkKX8QTL3E0UcY'),
(6, 'Executive Fountain Pen Set', 'executive-fountain-pen-set', 'A premium writing set with balanced weight and smooth ink flow.', 120.00, NULL, 8, 2, 1, 'Premium', 'https://lh3.googleusercontent.com/aida/AP1WRLvit1pqIelvrb7l1ouy_DtHsKyGudHeNZFRMKsWtZTzMPkBA2JogyGZTIItW1J1zYpdiMjTO4uXZIuCsIZYoI-DMyZa2uctLeworkGXMAf1RjRKP2Gcv-FxWIm1ApbkTffrArUWSN8jIGHS1Ucw9zOQ71lJ5ZigOzwfVXhcSQTQFCPmDZX24egIRoaRj4VADIyCGU94wtwJJn2C32KxpxsDyrR0yCJm9zFic7NKUxaszk5n1MZeSf8RNKcM'),
(7, 'USB-C Hub 7-in-1', 'usb-c-hub-7-in-1', 'A compact hub for displays, storage, and fast charging.', 55.00, NULL, 9, 4, 6, 'New', 'https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&w=1200&q=80'),
(8, 'The Creative Act: A Way of Being', 'the-creative-act-way-of-being', 'A beautiful and gentle guide to the creative process by Rick Rubin.', 42.00, NULL, 15, 1, NULL, NULL, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80'),
(9, 'Atomic Habits', 'atomic-habits', 'An easy & proven way to build good habits & break bad ones.', 38.00, NULL, 40, 1, NULL, NULL, 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80'),
(10, 'Minimalist Fountain Pen', 'minimalist-fountain-pen', 'Refined matte finish writing instrument with smooth ink delivery.', 45.00, NULL, 25, 2, 3, NULL, 'https://images.unsplash.com/photo-1583485088034-697ab6a0800a?auto=format&fit=crop&w=600&q=80')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, email, password, role) VALUES
(1, 'Admin', 'admin@ibnsina.tn', '$2a$12$3sPqxTJkyWCsjyAjGem3Iuz/Oc7cUpHcdfW4HCLcKpkmwDhwktYkK', 'staff'),
(2, 'Staff', 'adelmoula9hwa1234@gmail.com', '$2a$12$cSp1WHidVt1ydwiINyTtNeV3/R1AOkEwS7UXjbFscEO6.Ir2TwMjm', 'staff')
ON CONFLICT (id) DO NOTHING;

INSERT INTO homepage_sections (id, title, slug, description, order_num, is_active) VALUES
(1, 'All Products', 'all-products', 'Browse our complete collection of products', 1, 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1));
SELECT setval(pg_get_serial_sequence('brands', 'id'), COALESCE((SELECT MAX(id) FROM brands), 1));
SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1));
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('homepage_sections', 'id'), COALESCE((SELECT MAX(id) FROM homepage_sections), 1));

COMMIT;
