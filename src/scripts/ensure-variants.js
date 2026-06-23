const db = require('../config/db');

async function ensureVariants() {
  console.log('Checking for products without variants...');
  try {
    const productsWithoutVariants = await db.query(`
      SELECT p.id, p.name, p.price, b.name AS brand_name
      FROM products p
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE pv.id IS NULL
    `);

    console.log(`Found ${productsWithoutVariants.length} products without variants.`);

    if (productsWithoutVariants.length > 0) {
      for (const p of productsWithoutVariants) {
        const brandClean = (p.brand_name || 'GENERIC')
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '');
        const sku = `${brandClean}-${p.id}-STD`;
        const size = 'Standard';
        
        console.log(`Adding variant for "${p.name}" (ID: ${p.id}, SKU: ${sku})`);
        
        await db.query(
          `INSERT INTO product_variants (product_id, sku, size, stock_quantity, price, is_active)
           VALUES (?, ?, ?, 50, NULL, 1)`,
          [p.id, sku, size]
        );
      }
      console.log('Finished adding variants.');
    } else {
      console.log('All products already have at least one variant.');
    }
  } catch (err) {
    console.error('Error ensuring variants:', err);
    throw err;
  }
}

if (require.main === module) {
  ensureVariants()
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  module.exports = { ensureVariants };
}
