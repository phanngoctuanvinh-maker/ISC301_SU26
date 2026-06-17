const db = require('../../backend/src/config/db');

async function test() {
  try {
    console.log('Connecting to database...');
    const result = await db.query('SELECT 1 + 1 AS result');
    console.log('Connection successful. Query result:', result);
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await db.pool.end();
  }
}

test();
