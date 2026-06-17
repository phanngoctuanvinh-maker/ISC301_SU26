const db = require('../src/config/db');

async function test() {
  try {
    console.log('Truncating tables to simulate empty database...');
    await db.query('SET FOREIGN_KEY_CHECKS = 0');
    await db.query('TRUNCATE TABLE users');
    await db.query('TRUNCATE TABLE categories');
    await db.query('TRUNCATE TABLE brands');
    await db.query('TRUNCATE TABLE products');
    await db.query('TRUNCATE TABLE addresses');
    await db.query('TRUNCATE TABLE otp_pending');
    await db.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('Database truncated. Importing server to boot and trigger auto-seed...');
    process.env.PORT = '9090';
    const app = require('../server.js');
    
    // Wait for 3 seconds for the seeder to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Now check row count
    const userCountRes = await db.query('SELECT COUNT(*) as count FROM users');
    console.log(`Verified user count after auto-seed: ${userCountRes[0].count} rows`);
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();
