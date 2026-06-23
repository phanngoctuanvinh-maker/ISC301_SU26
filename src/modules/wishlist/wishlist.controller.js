const wishlistService = require('./wishlist.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const wishlistController = {
  async get(req, res) {
    try {
      const result = await wishlistService.getWishlist(req.user.userId);
      return successResponse(res, result, 'Lấy danh sách yêu thích thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async add(req, res) {
    try {
      const productId = req.body.product_id;
      if (!productId) {
        return errorResponse(res, 'Thiếu product_id', 400);
      }
      const result = await wishlistService.addWishlist(req.user.userId, productId);
      return successResponse(res, result, 'Thêm sản phẩm yêu thích thành công', 201);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async remove(req, res) {
    try {
      const productId = req.params.productId;
      if (!productId) {
        return errorResponse(res, 'Thiếu productId', 400);
      }
      const result = await wishlistService.removeWishlist(req.user.userId, productId);
      return successResponse(res, result, 'Xóa sản phẩm yêu thích thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  }
};

module.exports = wishlistController;
