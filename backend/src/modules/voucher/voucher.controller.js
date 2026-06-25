const { voucherService } = require('../admin/voucher/voucher.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const publicVoucherController = {
  /**
   * Áp dụng mã giảm giá khi checkout
   */
  async apply(req, res) {
    try {
      const { code, subtotal } = req.body;
      const result = await voucherService.applyVoucher(code, subtotal);
      return successResponse(res, result, 'Áp dụng mã giảm giá thành công', 200);
    } catch (err) {
      if (err.status) {
        // Trả kèm min_order_value nếu có (để Front-end hiển thị điều kiện)
        const errors = err.min_order_value ? { min_order_value: err.min_order_value } : null;
        return errorResponse(res, err.message, err.status, errors);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = {
  publicVoucherController
};
