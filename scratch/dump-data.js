const db = require('../src/config/db');

async function dump() {
  try {
    const tables = ['users', 'categories', 'brands', 'products', 'addresses'];
    for (const table of tables) {
      try {
        const rows = await db.query(`SELECT * FROM ${table} LIMIT 5`);
        console.log(`--- Table ${table} ---`);
        console.log(JSON.stringify(rows, null, 2));
      } catch (err) {
        console.log(`Table '${table}' failed:`, err.message);
      }
    }
  } finally {
    await db.pool.end();
  }
}

dump();
