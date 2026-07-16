const db = require('../config/db');

async function main() {
  try {
    const productsCount = await db.query('SELECT COUNT(*) as count FROM products');
    const variantsCount = await db.query('SELECT COUNT(*) as count FROM product_variants');
    const imagesCount = await db.query('SELECT COUNT(*) as count FROM product_images');
    const brandsCount = await db.query('SELECT COUNT(*) as count FROM brands');
    const categoriesCount = await db.query('SELECT COUNT(*) as count FROM categories');

    console.log('=== DATABASE VERIFICATION REPORT ===');
    console.log(`Total Brands: ${brandsCount[0].count}`);
    console.log(`Total Categories: ${categoriesCount[0].count}`);
    console.log(`Total Products: ${productsCount[0].count}`);
    console.log(`Total Variants: ${variantsCount[0].count}`);
    console.log(`Total Product Images: ${imagesCount[0].count}`);

    console.log('\n=== PRODUCTS BY BRAND ===');
    const productsByBrand = await db.query(`
      SELECT b.name as brand_name, COUNT(p.id) as product_count 
      FROM products p 
      JOIN brands b ON b.id = p.brand_id 
      GROUP BY p.brand_id 
      ORDER BY product_count DESC
    `);
    console.table(productsByBrand);

    console.log('\n=== PRODUCTS BY CATEGORY ===');
    const productsByCat = await db.query(`
      SELECT c.name as category_name, COUNT(p.id) as product_count 
      FROM products p 
      JOIN categories c ON c.id = p.category_id 
      GROUP BY p.category_id 
      ORDER BY product_count DESC
    `);
    console.table(productsByCat);

    console.log('\n=== SAMPLE PRODUCT DETAIL ===');
    const sampleProduct = await db.queryOne(`
      SELECT p.id, p.name, p.slug, p.gender, p.sport_type, p.price, p.main_image_url, p.description
      FROM products p 
      ORDER BY p.id DESC 
      LIMIT 1
    `);
    if (sampleProduct) {
      console.log('Sample Product:', sampleProduct);
      
      const sampleVariants = await db.query(`
        SELECT sku, color, size, price, stock_quantity 
        FROM product_variants 
        WHERE product_id = ?
        LIMIT 5
      `, [sampleProduct.id]);
      console.log('Sample Variants for this Product:');
      console.table(sampleVariants);
    }
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    db.pool.end();
  }
}

main();
