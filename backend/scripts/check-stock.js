const getPool = require('../src/config/db');

async function checkStock() {
  const pool = getPool();
  
  console.log('Checking product stock in database...');
  
  const [products] = await pool.query(
    'SELECT id, name, slug, stock_qty FROM products ORDER BY id LIMIT 10'
  );
  
  console.log(`\nFound ${products.length} products:`);
  
  for (const product of products) {
    console.log(`\nID: ${product.id}`);
    console.log(`  Name: ${product.name}`);
    console.log(`  Slug: ${product.slug}`);
    console.log(`  Stock: ${product.stock_qty}`);
  }
  
  process.exit(0);
}

checkStock().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
