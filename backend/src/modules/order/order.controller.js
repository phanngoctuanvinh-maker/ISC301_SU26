const orderService = require('./order.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const orderController = {
  async checkout(req, res) {
    try {
      const result = await orderService.checkout(req.user.userId, req.body, req);
      return successResponse(res, result, 'Tạo đơn hàng thành công', 201);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async list(req, res) {
    try {
      const result = await orderService.listOrders(req.user.userId, req.query);
      return successResponse(res, result, 'Lấy danh sách đơn hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async detail(req, res) {
    try {
      const result = await orderService.getOrderById(req.params.id, req.user.userId);
      return successResponse(res, result, 'Lấy chi tiết đơn hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async cancel(req, res) {
    try {
      const result = await orderService.cancelOrder(req.user.userId, req.params.id);
      return successResponse(res, result, 'Hủy đơn hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async vnpayReturn(req, res) {
    try {
      const result = await orderService.handleVnpayReturn(req.query);
      return successResponse(res, result, 'Cập nhật thanh toán VNPAY thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi thanh toán', err.status || 500, err.message || err);
    }
  }
};

module.exports = orderController;
