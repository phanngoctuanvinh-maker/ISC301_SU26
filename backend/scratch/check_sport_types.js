const db = require('../src/config/db');

async function check() {
  try {
    const columnsOrderItems = await db.query('DESCRIBE order_items');
    console.log('order_items structure:', columnsOrderItems);
    
    const columnsOrders = await db.query('DESCRIBE orders');
    console.log('orders structure:', columnsOrders);
  } catch (err) {
    console.error(err);
  } finally {
    db.pool.end();
  }
}

check();
