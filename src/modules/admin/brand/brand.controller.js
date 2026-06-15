const brandService = require('./brand.service');
const { successResponse, errorResponse } = require('../../../utils/response.util');

const brandController = {
  /**
   * Lấy danh sách thương hiệu
   */
  async getAll(req, res) {
    try {
      const result = await brandService.getAllBrands();
      return successResponse(res, result, 'Lấy danh sách thương hiệu thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Tạo thương hiệu mới
   */
  async create(req, res) {
    try {
      const result = await brandService.createBrand(req.body, req.file);
      return successResponse(res, result, 'Tạo thương hiệu thành công', 201);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Cập nhật thương hiệu
   */
  async update(req, res) {
    try {
      const result = await brandService.updateBrand(req.params.id, req.body, req.file);
      return successResponse(res, result, 'Cập nhật thương hiệu thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Thay đổi trạng thái ẩn/hiện của thương hiệu
   */
  async toggleStatus(req, res) {
    try {
      const result = await brandService.toggleBrandStatus(req.params.id);
      return successResponse(res, result, 'Thay đổi trạng thái thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = brandController;
