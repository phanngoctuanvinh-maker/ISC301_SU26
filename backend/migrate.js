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

    console.log('Creating product_reviews table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS product_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        order_item_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NULL,
        is_verified BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
        UNIQUE KEY unique_order_item_review (order_item_id)
      )
    `);
    console.log('Created product_reviews table successfully.');

    console.log('Creating support_messages table...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        name VARCHAR(255) NULL,
        email VARCHAR(255) NULL,
        sender_type ENUM('customer', 'admin') NOT NULL,
        message TEXT NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('Created support_messages table successfully.');

    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();

