const db = require('../../backend/src/config/db');

async function test() {
  try {
    const tables = ['users', 'categories', 'brands', 'addresses', 'otp_pending'];
    for (const table of tables) {
      const columns = await db.query(`DESCRIBE ${table}`);
      console.log(`=== ${table} ===`);
      console.log(columns.map(c => `${c.Field}: ${c.Type} | Null: ${c.Null} | Key: ${c.Key} | Default: ${c.Default}`).join('\n'));
    }
  } catch (error) {
    console.error('Error describing tables:', error);
  } finally {
    await db.pool.end();
  }
}

test();
