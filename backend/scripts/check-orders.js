const getPool = require('../src/config/db');

async function checkOrders() {
  const pool = getPool();
  
  console.log('Checking all orders in database...');
  
  const [orders] = await pool.query(
    'SELECT id, external_id, status, created_at FROM orders ORDER BY created_at DESC LIMIT 10'
  );
  
  console.log(`Found ${orders.length} orders:`);
  
  for (const order of orders) {
    console.log(`\nOrder ${order.external_id || order.id}:`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Created: ${order.created_at}`);
    
    const [items] = await pool.query(
      'SELECT product_id, product_name, quantity FROM order_items WHERE order_id = ?',
      [order.id]
    );
    
    console.log(`  Items: ${items.length}`);
    for (const item of items) {
      console.log(`    - ${item.product_name} (ID: ${item.product_id}, Qty: ${item.quantity})`);
    }
  }
  
  process.exit(0);
}

checkOrders().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
