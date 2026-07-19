const db = require('./src/config/db');

async function main() {
  try {
    const cats = await db.query('SELECT id, name, slug FROM categories');
    console.log('Categories:', cats);
    const prodCounts = await db.query('SELECT category_id, COUNT(*) as count FROM products GROUP BY category_id');
    console.log('Product counts by Category ID:', prodCounts);
    
    // Check if there are any socks or laces
    const socks = await db.query("SELECT * FROM categories WHERE slug IN ('vo-tat-the-thao', 'vo-tat')");
    console.log('Socks categories:', socks);
    
    const laces = await db.query("SELECT * FROM categories WHERE slug IN ('day-giay-the-thao', 'day-giay')");
    console.log('Laces categories:', laces);

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
