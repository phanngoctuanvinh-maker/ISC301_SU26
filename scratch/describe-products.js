const db = require('../src/config/db');

async function test() {
  try {
    const columns = await db.query('DESCRIBE products');
    console.log('Products columns:', columns);
  } catch (error) {
    console.error('Error describing products:', error);
  } finally {
    await db.pool.end();
  }
}

test();
