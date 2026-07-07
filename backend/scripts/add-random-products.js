const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD ?? '';
const DB_NAME = process.env.DB_NAME || 'ibn_sina_db';

const productNames = [
  'Luxury Fountain Pen', 'Mechanical Pencil 0.7mm', 'Sketching Charcoal Set',
  'Watercolor Brush Set', 'Acrylic Painting Canvas A3', 'Eraser Pack of 4',
  'Drafting Ruler Set', 'Hardcover Journal Black', 'Spiral Notebook A4',
  'Weekly Desk Planner', 'Sticky Notes Pack', 'Metal Paperclips Rainbow',
  'Premium Scissors 8 Inch', 'Double-Sided Tape Roller', 'Desktop Pen Holder',
  'Felt-Tip Markers 24 Pack', 'Gel Ink Pens Multi-color', 'Graph Paper Pad A4',
  'Calligraphy Ink Black', 'Leather Pencil Case', 'Dual Brush Markers',
  'Origami Paper Pack', 'Clear Ruler 30cm', 'Heavy Duty Stapler',
  'Desktop Document Tray', 'Sticky Index Tabs', 'Mini Whiteboard Set',
  'Whiteboard Markers Set', 'Pastel Acrylic Paint', 'Glue Sticks Pack'
];

const descriptions = [
  'High quality and reliable for everyday use. Durable materials.',
  'Perfect for students, teachers, and professionals alike. Highly recommended.',
  'A classic item designed for comfort, style, and efficiency.',
  'Featuring modern materials and sleek construction. Elevate your desk space.',
  'Great value pack. Long-lasting, reliable, and premium quality.'
];

const badges = ['none', 'premium', 'sale', 'bestseller', 'new', 'in_stock'];

const unsplashImages = [
  'https://images.unsplash.com/photo-1583485088034-697ab6a0800a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544816145-5a21b96b929b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1565026051657-130190dcca21?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1455390213941-b7cae2642b47?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1513364776149-6b21bff31408?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80'
];

const COUNT = parseInt(process.argv[2], 10) || 30;

async function main() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
  });

  try {
    // Get all category IDs
    const [categories] = await connection.query('SELECT id FROM categories');
    if (categories.length === 0) {
      throw new Error('No categories found in the database. Run setup first.');
    }
    const categoryIds = categories.map(c => c.id);

    // Get all brand IDs
    const [brands] = await connection.query('SELECT id FROM brands');
    if (brands.length === 0) {
      throw new Error('No brands found in the database. Run setup first.');
    }
    const brandIds = brands.map(b => b.id);

    console.log(`Found ${categoryIds.length} categories and ${brandIds.length} brands.`);
    console.log(`Adding ${COUNT} random products...`);

    for (let i = 0; i < COUNT; i++) {
      const baseName = productNames[i % productNames.length] + ' ' + Math.floor(Math.random() * 1000);
      const slug = baseName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const price = parseFloat((Math.random() * 90 + 10).toFixed(2));
      const onSale = Math.random() > 0.7;
      const sale_price = onSale ? parseFloat((price * 0.8).toFixed(2)) : null;
      const stock_qty = Math.floor(Math.random() * 150) + 5;
      const category_id = categoryIds[Math.floor(Math.random() * categoryIds.length)];
      const brand_id = brandIds[Math.floor(Math.random() * brandIds.length)];
      const badge = badges[Math.floor(Math.random() * badges.length)];
      const image_url = unsplashImages[Math.floor(Math.random() * unsplashImages.length)];

      await connection.query(
        `INSERT INTO products 
          (name, slug, description, price, sale_price, stock_qty, category_id, brand_id, badge, image_url, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [baseName, slug, description, price, sale_price, stock_qty, category_id, brand_id, badge, image_url]
      );
      console.log(`Inserted product: ${baseName} (Category: ${category_id}, Brand: ${brand_id})`);
    }

    console.log(`Successfully added ${COUNT} random products.`);
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error('Error adding random products:', err);
  process.exit(1);
});
