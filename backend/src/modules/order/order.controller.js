const orderService = require('./order.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const orderController = {
  async preview(req, res) {
    try {
      const result = await orderService.previewOrder(req.user.userId, req.body);
      return successResponse(res, result, 'Xem trước đơn hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.errors || null);
    }
  },

  async create(req, res) {
    try {
      const result = await orderService.createOrder(req.user.userId, req.body);
      return successResponse(res, result, 'Đặt hàng thành công', 201);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.errors || null);
    }
  },

  async getMyOrders(req, res) {
    try {
      const result = await orderService.getUserOrders(req.user.userId);
      return successResponse(res, result, 'Lấy danh sách đơn hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.errors || null);
    }
  },

  async getOrderDetail(req, res) {
    try {
      const result = await orderService.getOrderDetail(req.params.id, req.user.userId);
      return successResponse(res, result, 'Lấy chi tiết đơn hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.errors || null);
    }
  }
};

module.exports = orderController;
