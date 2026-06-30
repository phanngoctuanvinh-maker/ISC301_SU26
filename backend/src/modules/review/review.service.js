const db = require('../../config/db');

const reviewService = {
  async createReview(userId, { order_item_id, rating, comment }) {
    // 1. Validate rating
    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      throw { status: 400, message: 'Đánh giá phải từ 1 đến 5 sao' };
    }

    // 2. Fetch order item and ensure it exists and belongs to the user
    const orderItem = await db.queryOne(
      `SELECT oi.id, oi.order_id, oi.variant_id, o.user_id, o.status, pv.product_id
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN product_variants pv ON pv.id = oi.variant_id
       WHERE oi.id = ?`,
      [order_item_id]
    );

    if (!orderItem) {
      throw { status: 404, message: 'Sản phẩm trong đơn hàng không tồn tại' };
    }

    if (orderItem.user_id !== userId) {
      throw { status: 403, message: 'Bạn không có quyền đánh giá sản phẩm này' };
    }

    // 3. Check order status is delivered
    if (orderItem.status !== 'delivered') {
      throw { status: 400, message: 'Chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã được giao thành công' };
    }

    // 4. Check if review already exists for this order_item_id
    const existingReview = await db.queryOne(
      'SELECT id FROM product_reviews WHERE order_item_id = ?',
      [order_item_id]
    );
    if (existingReview) {
      throw { status: 400, message: 'Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi' };
    }

    // 5. Insert review (is_verified is true because it's linked to order_item and order.status = delivered)
    await db.query(
      `INSERT INTO product_reviews (product_id, user_id, order_item_id, rating, comment, is_verified)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderItem.product_id, userId, order_item_id, parsedRating, comment || null, true]
    );

    const inserted = await db.queryOne('SELECT LAST_INSERT_ID() as id');
    return {
      id: inserted.id,
      product_id: orderItem.product_id,
      user_id: userId,
      order_item_id,
      rating: parsedRating,
      comment: comment || null,
      is_verified: true
    };
  },

  async getProductReviews(productId) {
    const reviews = await db.query(
      `SELECT pr.id, pr.rating, pr.comment, pr.is_verified, pr.created_at,
              u.full_name as user_name, u.avatar_url as user_avatar
       FROM product_reviews pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.product_id = ?
       ORDER BY pr.created_at DESC`,
      [productId]
    );
    return reviews;
  },

  async getProductReviewStats(productId) {
    const stats = await db.queryOne(
      `SELECT COUNT(*) as count, COALESCE(ROUND(AVG(rating), 1), 5.0) as average
       FROM product_reviews
       WHERE product_id = ?`,
      [productId]
    );
    return {
      count: stats ? stats.count : 0,
      average: stats ? Number(stats.average) : 5.0
    };
  }
};

module.exports = reviewService;
