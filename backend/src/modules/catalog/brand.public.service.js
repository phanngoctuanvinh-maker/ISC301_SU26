const db = require('../../config/db');

async function getActiveBrands() {
  return db.query(
    `
      SELECT b.id, b.name, b.logo_url, b.description, COUNT(p.id) AS product_count
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id AND p.is_active = true
      WHERE b.is_active = true
      GROUP BY b.id
      ORDER BY b.name ASC
    `
  );
}

module.exports = {
  getActiveBrands
};
