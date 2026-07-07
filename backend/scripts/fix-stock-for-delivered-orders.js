const getPool = require('../src/config/db');
const { ORDER_STATUS } = require('../src/lib/orderStatus');

async function fixStockForDeliveredOrders() {
  const pool = getPool();
  
  console.log('Finding all delivered orders...');
  
  // Get all orders that are approved_delivered
  const [orders] = await pool.query(
    `SELECT o.id, o.external_id, o.status FROM orders o WHERE o.status = ?`,
    [ORDER_STATUS.APPROVED_DELIVERED]
  );
  
  console.log(`Found ${orders.length} delivered orders`);
  
  for (const order of orders) {
    console.log(`\nProcessing order ${order.external_id || order.id}...`);
    
    // Get order items
    const [items] = await pool.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [order.id]
    );
    
    console.log(`Order has ${items.length} items`);
    
    for (const item of items) {
      if (item.product_id) {
        console.log(`  - Product ${item.product_id}, quantity ${item.quantity}`);
        
        // Get current stock
        const [currentStock] = await pool.query(
          'SELECT stock_qty FROM products WHERE id = ?',
          [item.product_id]
        );
        
        if (currentStock.length > 0) {
          console.log(`    Current stock: ${currentStock[0].stock_qty}`);
          
          // Decrement stock
          const [result] = await pool.query(
            'UPDATE products SET stock_qty = stock_qty - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );
          
          console.log(`    Updated stock, affected rows: ${result.affectedRows}`);
          
          // Verify new stock
          const [newStock] = await pool.query(
            'SELECT stock_qty FROM products WHERE id = ?',
            [item.product_id]
          );
          console.log(`    New stock: ${newStock[0].stock_qty}`);
        }
      }
    }
  }
  
  console.log('\nDone!');
  process.exit(0);
}

fixStockForDeliveredOrders().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
