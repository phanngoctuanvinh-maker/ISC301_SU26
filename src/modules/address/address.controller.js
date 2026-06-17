const addressService = require('./address.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const addressController = {
  /**
   * Lấy danh sách tất cả địa chỉ của người dùng
   */
  async getAll(req, res) {
    try {
      const result = await addressService.getAddresses(req.user.userId);
      return successResponse(res, result, 'Lấy danh sách địa chỉ thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Thêm một địa chỉ mới
   */
  async create(req, res) {
    try {
      const result = await addressService.createAddress(req.user.userId, req.body);
      return successResponse(res, result, 'Thêm địa chỉ thành công', 201);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Cập nhật địa chỉ
   */
  async update(req, res) {
    try {
      const addressId = parseInt(req.params.id);
      if (isNaN(addressId)) {
        return errorResponse(res, 'ID địa chỉ không hợp lệ', 400);
      }
      const result = await addressService.updateAddress(req.user.userId, addressId, req.body);
      return successResponse(res, result, 'Cập nhật địa chỉ thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Xóa địa chỉ
   */
  async remove(req, res) {
    try {
      const addressId = parseInt(req.params.id);
      if (isNaN(addressId)) {
        return errorResponse(res, 'ID địa chỉ không hợp lệ', 400);
      }
      const result = await addressService.deleteAddress(req.user.userId, addressId);
      return successResponse(res, null, result.message, 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Đặt địa chỉ làm mặc định
   */
  async setDefault(req, res) {
    try {
      const addressId = parseInt(req.params.id);
      if (isNaN(addressId)) {
        return errorResponse(res, 'ID địa chỉ không hợp lệ', 400);
      }
      const result = await addressService.setDefaultAddress(req.user.userId, addressId);
      return successResponse(res, null, result.message, 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = addressController;
