const db = require('./src/config/db');

function toSlug(str) {
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/[^a-z0-9\s-]/g, '');
  str = str.replace(/\s+/g, '-');
  str = str.replace(/-+/g, '-');
  return str.trim();
}

async function seed() {
  try {
    console.log('Fetching active brands...');
    const brands = await db.query('SELECT id, name FROM brands WHERE is_active = 1');
    console.log(`Found ${brands.length} active brands.`);

    for (const brand of brands) {
      const productName = `Dây Giày Thể Thao Cao Cấp ${brand.name}`;
      const slug = toSlug(productName);

      // Check if product already exists
      const existing = await db.queryOne('SELECT id FROM products WHERE slug = ?', [slug]);
      if (existing) {
        console.log(`Laces for brand ${brand.name} already exists.`);
        continue;
      }

      console.log(`Inserting laces product for brand ${brand.name}...`);
      const prodResult = await db.query(
        `INSERT INTO products (
          category_id, brand_id, name, slug, description, main_image_url, 
          gender, sport_type, price, is_active, is_featured, sold_count
        ) VALUES (?, ?, ?, ?, ?, ?, 'unisex', NULL, ?, 1, 0, ?)`,
        [
          12, // Dây Giày Thể Thao (day-giay-the-thao)
          brand.id,
          productName,
          slug,
          `Dây giày thể thao cao cấp chính hãng ${brand.name}, được dệt từ sợi polyester siêu bền, chống xơ xước, độ dài tiêu chuẩn dễ dàng thay thế cho nhiều phom dáng giày.`,
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
          50000,
          Math.floor(Math.random() * 50) + 10
        ]
      );
      
      const productId = prodResult.insertId;

      // Insert standard variant
      const sku = `LACES-${brand.name.substring(0,3).toUpperCase()}-STD`.toUpperCase();
      await db.query(
        `INSERT INTO product_variants (
          product_id, sku, color, size, price, discount_price, stock_quantity, low_stock_threshold, is_active
        ) VALUES (?, ?, 'Trắng', 'Standard', 50000, NULL, 100, 5, 1)`,
        [productId, sku]
      );

      console.log(`Seeded laces for brand ${brand.name} (Product ID: ${productId}) successfully.`);
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    process.exit(0);
  }
}

seed();
