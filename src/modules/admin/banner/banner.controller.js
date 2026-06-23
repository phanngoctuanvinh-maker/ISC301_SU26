const bannerService = require('./banner.service');
const { successResponse, errorResponse } = require('../../../utils/response.util');

const bannerController = {
  /**
   * Lấy toàn bộ danh sách banner (kể cả hết hạn/đang ẩn)
   */
  async getAll(req, res) {
    try {
      const result = await bannerService.getAllBanners();
      return successResponse(res, result, 'Lấy danh sách banner thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Tạo banner mới
   */
  async create(req, res) {
    try {
      const result = await bannerService.createBanner(req.body, req.file);
      return successResponse(res, result, 'Tạo banner thành công', 201);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Cập nhật banner
   */
  async update(req, res) {
    try {
      const result = await bannerService.updateBanner(req.params.id, req.body, req.file);
      return successResponse(res, result, 'Cập nhật banner thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Thay đổi trạng thái ẩn/hiện của banner
   */
  async toggleStatus(req, res) {
    try {
      const result = await bannerService.toggleBannerStatus(req.params.id);
      return successResponse(res, result, 'Thay đổi trạng thái thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Sắp xếp lại thứ tự các banner hàng loạt
   */
  async reorder(req, res) {
    try {
      const result = await bannerService.reorderBanners(req.body.items);
      return successResponse(res, result, 'Sắp xếp lại thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Xóa banner
   */
  async delete(req, res) {
    try {
      const result = await bannerService.deleteBanner(req.params.id);
      return successResponse(res, result, 'Xóa banner thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = bannerController;
