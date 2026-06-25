const db = require('../backend/src/config/db');

async function main() {
  try {
    const rows = await db.query(
      'SELECT pv.id, pv.price, pv.discount_price, p.price as prod_price FROM product_variants pv JOIN products p ON p.id = pv.product_id WHERE pv.id IN (1, 3)'
    );
    console.log('Prices in database:', rows);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.pool.end();
  }
}

main();
