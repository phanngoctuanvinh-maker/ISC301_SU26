const categoryService = require('./category.service');
const { successResponse, errorResponse } = require('../../../utils/response.util');

const categoryController = {
  /**
   * Lấy cây danh mục
   */
  async getTree(req, res) {
    try {
      const result = await categoryService.getCategoryTree();
      return successResponse(res, result, 'Lấy danh sách danh mục thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Tạo danh mục mới
   */
  async create(req, res) {
    try {
      const result = await categoryService.createCategory(req.body, req.file);
      return successResponse(res, result, 'Tạo danh mục thành công', 201);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Cập nhật danh mục
   */
  async update(req, res) {
    try {
      const result = await categoryService.updateCategory(req.params.id, req.body, req.file);
      return successResponse(res, result, 'Cập nhật danh mục thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Thay đổi trạng thái ẩn/hiện của danh mục
   */
  async toggleStatus(req, res) {
    try {
      const result = await categoryService.toggleCategoryStatus(req.params.id);
      return successResponse(res, result, 'Thay đổi trạng thái thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Thay đổi thứ tự sắp xếp của mảng danh mục
   */
  async reorder(req, res) {
    try {
      const result = await categoryService.reorderCategories(req.body.items);
      return successResponse(res, null, 'Sắp xếp lại thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = categoryController;
