const db = require('./src/config/db');

async function migrate() {
  try {
    console.log('Adding address_type to addresses...');
    try {
      await db.query(`ALTER TABLE addresses ADD COLUMN address_type VARCHAR(50) DEFAULT 'Nhà'`);
      console.log('Added address_type successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column address_type already exists.');
      } else {
        throw err;
      }
    }

    console.log('Adding created_at to vouchers...');
    try {
      await db.query(`ALTER TABLE vouchers ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('Added created_at successfully.');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column created_at already exists.');
      } else {
        throw err;
      }
    }

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();

