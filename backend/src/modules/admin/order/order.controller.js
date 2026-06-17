const orderService = require('./order.service');
const { successResponse, errorResponse } = require('../../../utils/response.util');

const orderController = {
  async list(req, res) {
    try {
      const result = await orderService.listOrders(req.query);
      return successResponse(res, result, 'Lấy danh sách đơn hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async detail(req, res) {
    try {
      const result = await orderService.getOrderById(req.params.id);
      return successResponse(res, result, 'Lấy chi tiết đơn hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async updateStatus(req, res) {
    try {
      const result = await orderService.updateStatus(req.params.id, req.body.status, req.user.userId);
      return successResponse(res, result, 'Cập nhật trạng thái đơn hàng thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async updatePaymentStatus(req, res) {
    try {
      const result = await orderService.updatePaymentStatus(req.params.id, req.body.payment_status);
      return successResponse(res, result, 'Cập nhật trạng thái thanh toán thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  }
};

module.exports = orderController;
