const db = require('../config/db');

async function columnExists(table, column) {
  const rows = await db.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [table, column]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function tableExists(table) {
  const rows = await db.query(
    `
      SELECT COUNT(*) AS count
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    [table]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function ensurePriceColumn() {
  if (!(await columnExists('products', 'price'))) {
    await db.query('ALTER TABLE products ADD COLUMN price decimal(12,2) NOT NULL DEFAULT 0.00 AFTER main_image_url');
  }
}

async function ensureTables() {
  if (await tableExists('product_variants')) {
    const hasPrice = await columnExists('product_variants', 'price');
    if (!hasPrice) {
      console.log('[Migration] Old product_variants table detected (lacks price column). Dropping it to recreate...');
      await db.query('SET FOREIGN_KEY_CHECKS = 0');
      await db.query('DROP TABLE IF EXISTS product_variants');
      await db.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS product_variants (
      id int NOT NULL AUTO_INCREMENT,
      product_id int NOT NULL,
      sku varchar(100) NOT NULL,
      color varchar(100) DEFAULT NULL,
      size varchar(20) NOT NULL,
      price decimal(12,2) DEFAULT NULL,
      discount_price decimal(12,2) DEFAULT NULL,
      stock_quantity int NOT NULL DEFAULT 0,
      low_stock_threshold int NOT NULL DEFAULT 5,
      is_active tinyint(1) DEFAULT 1,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_product_variant_color_size (product_id, color, size),
      UNIQUE KEY uq_product_variant_sku (sku)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS product_images (
      id int NOT NULL AUTO_INCREMENT,
      product_id int NOT NULL,
      image_url varchar(500) NOT NULL,
      sort_order int NOT NULL DEFAULT 0,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id int NOT NULL AUTO_INCREMENT,
      variant_id int NOT NULL,
      type varchar(20) NOT NULL COMMENT 'in | out',
      quantity int NOT NULL,
      reference_type varchar(50) DEFAULT NULL,
      reference_id int DEFAULT NULL,
      note varchar(500) DEFAULT NULL,
      created_by int DEFAULT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS carts (
      id int NOT NULL AUTO_INCREMENT,
      user_id int NOT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_carts_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id int NOT NULL AUTO_INCREMENT,
      user_id int NOT NULL,
      product_id int NOT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_wishlists_user_product (user_id, product_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id int NOT NULL AUTO_INCREMENT,
      cart_id int NOT NULL,
      variant_id int NOT NULL,
      quantity int NOT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_cart_items_variant (cart_id, variant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id int NOT NULL AUTO_INCREMENT,
      user_id int NOT NULL,
      order_code varchar(50) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending',
      payment_status varchar(20) NOT NULL DEFAULT 'unpaid',
      payment_method varchar(20) NOT NULL DEFAULT 'cod',
      receiver_name varchar(100) NOT NULL,
      receiver_phone varchar(20) NOT NULL,
      shipping_address_line varchar(255) NOT NULL,
      shipping_ward varchar(100) DEFAULT NULL,
      shipping_district varchar(100) NOT NULL,
      shipping_city varchar(100) NOT NULL,
      subtotal_amount decimal(12,2) NOT NULL DEFAULT 0.00,
      shipping_fee decimal(12,2) NOT NULL DEFAULT 0.00,
      total_amount decimal(12,2) NOT NULL DEFAULT 0.00,
      note varchar(500) DEFAULT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_orders_code (order_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id int NOT NULL AUTO_INCREMENT,
      order_id int NOT NULL,
      product_id int NOT NULL,
      variant_id int NOT NULL,
      product_name varchar(255) NOT NULL,
      sku varchar(100) NOT NULL,
      size varchar(20) NOT NULL,
      image_url varchar(500) DEFAULT NULL,
      unit_price decimal(12,2) NOT NULL,
      quantity int NOT NULL,
      line_total decimal(12,2) NOT NULL,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id int NOT NULL AUTO_INCREMENT,
      order_id int NOT NULL,
      method varchar(20) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending',
      amount decimal(12,2) NOT NULL,
      transaction_code varchar(100) DEFAULT NULL,
      raw_response json DEFAULT NULL,
      paid_at timestamp NULL DEFAULT NULL,
      created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id int AUTO_INCREMENT PRIMARY KEY,
      code varchar(50) UNIQUE NOT NULL,
      discount_amount decimal(12,2) DEFAULT 0.00,
      is_active boolean DEFAULT true
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      title       VARCHAR(255),
      image_url   VARCHAR(500) NOT NULL,
      link_type   VARCHAR(20) COMMENT 'category | brand | voucher | url',
      link_url    VARCHAR(500) COMMENT 'Dùng khi link_type = url',
      category_id INT DEFAULT NULL,
      brand_id    INT DEFAULT NULL,
      voucher_id  INT DEFAULT NULL,
      start_date  TIMESTAMP NULL,
      end_date    TIMESTAMP NULL,
      sort_order  INT DEFAULT 0,
      is_active   BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

async function seedPricesAndVariants() {
  const variantCount = await db.queryOne('SELECT COUNT(*) AS count FROM product_variants');
  if (Number(variantCount?.count || 0) === 0) {
    await db.query(
      `
        INSERT INTO product_variants (product_id, sku, size, stock_quantity, low_stock_threshold, is_active) VALUES
        (1, 'NIKE-AF1-40', '40', 12, 3, 1),
        (1, 'NIKE-AF1-41', '41', 18, 3, 1),
        (2, 'ADIDAS-UB22-40', '40', 10, 3, 1),
        (2, 'ADIDAS-UB22-41', '41', 9, 3, 1),
        (3, 'PUMA-SC-40', '40', 8, 3, 1),
        (4, 'REEBOK-C85-40', '40', 7, 3, 1),
        (5, 'VANS-OS-40', '40', 14, 3, 1),
        (6, 'CONVERSE-CTAS-40', '40', 11, 3, 1),
        (7, 'NB-574-40', '40', 16, 3, 1),
        (8, 'AJ1-40', '40', 6, 3, 1),
        (10, 'ASICS-GK28-40', '40', 13, 3, 1)
      `
    );
  }

  await db.query(
    `
      UPDATE products SET price = CASE id
        WHEN 1 THEN 3200000
        WHEN 2 THEN 4500000
        WHEN 3 THEN 2600000
        WHEN 4 THEN 2400000
        WHEN 5 THEN 1800000
        WHEN 6 THEN 2200000
        WHEN 7 THEN 2800000
        WHEN 8 THEN 4300000
        WHEN 9 THEN 3900000
        WHEN 10 THEN 4100000
        WHEN 11 THEN 12500000
        WHEN 12 THEN 7200000
        WHEN 13 THEN 1900000
        WHEN 14 THEN 1200000
        WHEN 15 THEN 2100000
        WHEN 16 THEN 3500000
        WHEN 17 THEN 4200000
        WHEN 18 THEN 6800000
        WHEN 19 THEN 4900000
        WHEN 20 THEN 15500000
        WHEN 21 THEN 18200000
        WHEN 22 THEN 20500000
        WHEN 23 THEN 16500000
        WHEN 24 THEN 3000000
        WHEN 25 THEN 4500000
        ELSE price
      END
    `
  );
}

async function migrateMvpSchema() {
  await ensurePriceColumn();
  await ensureTables();
  await seedPricesAndVariants();
}

module.exports = {
  migrateMvpSchema,
  tableExists,
  columnExists
};
