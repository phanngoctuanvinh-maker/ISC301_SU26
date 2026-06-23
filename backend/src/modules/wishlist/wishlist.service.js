const db = require('../../config/db');

async function getWishlist(userId) {
  const rows = await db.query(
    `
      SELECT 
        w.product_id,
        p.name,
        p.slug,
        p.main_image_url,
        p.price,
        b.name AS brand_name
      FROM wishlists w
      INNER JOIN products p ON p.id = w.product_id
      INNER JOIN brands b ON b.id = p.brand_id
      WHERE w.user_id = ?
      ORDER BY w.id DESC
    `,
    [userId]
  );
  return rows || [];
}

async function addWishlist(userId, productId) {
  // Check if product exists first
  const productExists = await db.queryOne('SELECT id FROM products WHERE id = ? LIMIT 1', [productId]);
  if (!productExists) {
    throw { status: 404, message: 'Sản phẩm không tồn tại' };
  }

  await db.query(
    'INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)',
    [userId, productId]
  );
  return { success: true };
}

async function removeWishlist(userId, productId) {
  await db.query(
    'DELETE FROM wishlists WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return { success: true };
}

module.exports = {
  getWishlist,
  addWishlist,
  removeWishlist
};
