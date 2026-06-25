const { voucherService } = require('./voucher.service');
const { successResponse, errorResponse } = require('../../../utils/response.util');

const voucherController = {
  /**
   * Lấy danh sách tất cả voucher
   */
  async getAll(req, res) {
    try {
      const result = await voucherService.getAllVouchers(req.query);
      return successResponse(res, result, 'Lấy danh sách voucher thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Lấy chi tiết voucher theo ID
   */
  async getById(req, res) {
    try {
      const result = await voucherService.getVoucherById(req.params.id);
      return successResponse(res, result, 'Lấy thông tin voucher thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Tạo voucher mới
   */
  async create(req, res) {
    try {
      const result = await voucherService.createVoucher(req.body);
      return successResponse(res, result, 'Tạo voucher thành công', 201);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Cập nhật voucher
   */
  async update(req, res) {
    try {
      const result = await voucherService.updateVoucher(req.params.id, req.body);
      return successResponse(res, result, 'Cập nhật voucher thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Kích hoạt hoặc hủy kích hoạt voucher
   */
  async toggleStatus(req, res) {
    try {
      const result = await voucherService.toggleVoucherStatus(req.params.id);
      return successResponse(res, result, 'Thay đổi trạng thái thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = voucherController;
