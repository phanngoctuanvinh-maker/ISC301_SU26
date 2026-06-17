const db = require('../src/config/db');

async function check() {
  try {
    const tables = ['users', 'otp_pending', 'categories', 'brands', 'products', 'addresses'];
    for (const table of tables) {
      try {
        const countRes = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`Table '${table}': ${countRes[0].count} rows`);
      } catch (err) {
        console.log(`Table '${table}' query failed:`, err.message);
      }
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await db.pool.end();
  }
}

check();
