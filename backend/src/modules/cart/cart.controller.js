const cartService = require('./cart.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const cartController = {
  async get(req, res) {
    try {
      const result = await cartService.getCart(req.user.userId);
      return successResponse(res, result, 'Lấy giỏ hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async addItem(req, res) {
    try {
      const result = await cartService.addItem(req.user.userId, req.body);
      return successResponse(res, result, 'Thêm sản phẩm vào giỏ hàng thành công', 201);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async updateItem(req, res) {
    try {
      const result = await cartService.updateItem(req.user.userId, req.params.id, req.body);
      return successResponse(res, result, 'Cập nhật giỏ hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async removeItem(req, res) {
    try {
      const result = await cartService.removeItem(req.user.userId, req.params.id);
      return successResponse(res, result, 'Xóa sản phẩm khỏi giỏ hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async clear(req, res) {
    try {
      const result = await cartService.clearCart(req.user.userId);
      return successResponse(res, result, 'Xóa giỏ hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  }
};

module.exports = cartController;
