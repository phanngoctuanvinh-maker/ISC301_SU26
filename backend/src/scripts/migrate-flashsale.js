const db = require('../config/db');

async function migrate() {
  console.log('Starting Flash Sale migration...');
  
  try {
    // 1. Create flash_sales table
    console.log('Creating table flash_sales...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS flash_sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    console.log('Created table flash_sales successfully.');

    // 2. Create flash_sale_items table
    console.log('Creating table flash_sale_items...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS flash_sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flash_sale_id INT NOT NULL,
        product_id INT NOT NULL,
        flash_price DECIMAL(12,2) NOT NULL,
        flash_quantity INT NOT NULL,
        sold_quantity INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (flash_sale_id) REFERENCES flash_sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_sale_product (flash_sale_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
    `);
    console.log('Created table flash_sale_items successfully.');

    // 3. Seed product "Nike Air Max 90" if not exists
    console.log('Checking for product "Nike Air Max 90"...');
    const existing = await db.queryOne('SELECT id FROM products WHERE slug = ? LIMIT 1', ['nike-air-max-90']);
    
    if (!existing) {
      console.log('Product "Nike Air Max 90" does not exist. Seeding...');
      
      // Get brand ID for Nike
      let brand = await db.queryOne("SELECT id FROM brands WHERE name = 'Nike' LIMIT 1");
      let brandId = brand ? brand.id : 1;
      
      // Get category ID for Giày Sneaker Cổ Thấp or Giày Chạy Bộ or any category
      let category = await db.queryOne("SELECT id FROM categories WHERE slug = 'giay-sneaker-co-thap' LIMIT 1");
      if (!category) {
        category = await db.queryOne("SELECT id FROM categories WHERE slug = 'giay-chay-bo' LIMIT 1");
      }
      let categoryId = category ? category.id : 1;

      // Insert Nike Air Max 90
      await db.query(
        `INSERT INTO products (
          category_id, brand_id, name, slug, description, main_image_url, price, gender, sport_type, is_active, is_featured, sold_count
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 0)`,
        [
          categoryId,
          brandId,
          'Nike Air Max 90',
          'nike-air-max-90',
          'Giày thể thao Nike Air Max 90 huyền thoại mang lại sự êm ái tối đa với đế đệm khí Air Max cổ điển và chất liệu da bền bỉ.',
          '/uploads/products/nike-air-max-90.png',
          2500000,
          'unisex',
          'lifestyle'
        ]
      );
      
      const newProd = await db.queryOne('SELECT id FROM products WHERE slug = ? LIMIT 1', ['nike-air-max-90']);
      const productId = newProd.id;
      console.log(`Seeded Nike Air Max 90 (ID: ${productId}).`);

      // Seed size variants (40, 41, 42)
      console.log('Seeding variants for Nike Air Max 90...');
      const sizes = ['40', '41', '42'];
      for (const size of sizes) {
        const sku = `NIKE-AM90-${size}`;
        await db.query(
          `INSERT INTO product_variants (product_id, sku, size, stock_quantity, price, is_active)
           VALUES (?, ?, ?, 50, NULL, 1)`,
          [productId, sku, size]
        );
      }
      console.log('Seeded variants successfully.');
    } else {
      console.log('Product "Nike Air Max 90" already exists.');
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();
