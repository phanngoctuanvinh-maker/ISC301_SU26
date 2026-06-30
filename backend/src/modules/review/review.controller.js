const reviewService = require('./review.service');
const { successResponse } = require('../../utils/response.util');

const reviewController = {
  async createReview(req, res, next) {
    try {
      const userId = req.user.userId;
      const { order_item_id, rating, comment } = req.body;

      if (!order_item_id) {
        throw { status: 400, message: 'Thiếu thông tin chi tiết đơn hàng (order_item_id)' };
      }

      const review = await reviewService.createReview(userId, { order_item_id, rating, comment });
      return successResponse(res, review, 'Đánh giá sản phẩm thành công', 201);
    } catch (error) {
      next(error);
    }
  },

  async getProductReviews(req, res, next) {
    try {
      const { productId } = req.params;
      const reviews = await reviewService.getProductReviews(productId);
      const stats = await reviewService.getProductReviewStats(productId);
      
      return successResponse(res, { reviews, stats }, 'Lấy danh sách đánh giá thành công');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reviewController;
