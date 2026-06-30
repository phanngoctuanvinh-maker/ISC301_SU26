const paymentService = require('./payment.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const paymentController = {
  /**
   * API tạo URL thanh toán VNPAY
   */
  async createPaymentUrl(req, res) {
    try {
      const { order_id } = req.body;
      if (!order_id) {
        return errorResponse(res, 'Thiếu thông tin order_id', 400);
      }
      
      const ipAddr = req.headers['x-forwarded-for'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress || 
                     req.connection.socket.remoteAddress;

      const result = await paymentService.createVNPayUrl(req.user.userId, order_id, ipAddr);
      return successResponse(res, result, 'Tạo URL thanh toán VNPAY thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500);
    }
  },

  /**
   * API xác thực chữ ký phản hồi từ VNPAY (cho Client-side return page)
   */
  async verifyPayment(req, res) {
    try {
      const result = await paymentService.verifyVNPayReturn(req.query);
      if (result.success) {
        return successResponse(res, result, 'Xác minh giao dịch thành công', 200);
      } else {
        return errorResponse(res, result.message, 400, result);
      }
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', 500);
    }
  },

  /**
   * API nhận IPN callback từ VNPAY Server
   * Lưu ý: Trả về trực tiếp JSON dạng { RspCode, Message } không bọc qua response utility
   */
  async handleIPN(req, res) {
    try {
      const result = await paymentService.handleVNPayIPN(req.query);
      return res.status(200).json(result);
    } catch (err) {
      console.error('IPN Controller Error:', err);
      return res.status(500).json({ RspCode: '99', Message: 'Internal server error' });
    }
  }
};

module.exports = paymentController;
