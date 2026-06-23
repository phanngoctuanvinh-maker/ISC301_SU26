const productService = require('./product.service');
const { successResponse, errorResponse } = require('../../../utils/response.util');

const productController = {
  /**
   * Lấy danh sách sản phẩm (Admin)
   */
  async getAll(req, res) {
    try {
      const result = await productService.getAllProducts(req.query);
      return successResponse(res, result, 'Lấy danh sách sản phẩm thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Lấy chi tiết sản phẩm
   */
  async getDetail(req, res) {
    try {
      const result = await productService.getProductDetail(req.params.id);
      return successResponse(res, result, 'Lấy chi tiết sản phẩm thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Tạo sản phẩm mới
   */
  async create(req, res) {
    try {
      const result = await productService.createProduct(req.body, req.files);
      return successResponse(res, result, 'Tạo sản phẩm thành công', 201);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Cập nhật thông tin sản phẩm
   */
  async update(req, res) {
    try {
      const result = await productService.updateProduct(req.params.id, req.body, req.files);
      return successResponse(res, result, 'Cập nhật sản phẩm thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Xóa một hình ảnh cụ thể khỏi sản phẩm
   */
  async deleteImage(req, res) {
    try {
      const result = await productService.deleteProductImage(req.params.id, req.params.imageId);
      return successResponse(res, result, 'Xoá ảnh thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Đặt hình ảnh cụ thể làm ảnh đại diện chính (main_image_url)
   */
  async setMainImage(req, res) {
    try {
      const result = await productService.setMainImage(req.params.id, req.body.image_id);
      return successResponse(res, result, 'Đặt ảnh đại diện thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Bật / tắt ẩn hiện sản phẩm (is_active)
   */
  async toggleStatus(req, res) {
    try {
      const result = await productService.toggleProductStatus(req.params.id);
      return successResponse(res, result, 'Thay đổi trạng thái thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Bật / tắt cờ nổi bật (is_featured)
   */
  async toggleFeatured(req, res) {
    try {
      const result = await productService.toggleFeatured(req.params.id);
      return successResponse(res, result, 'Thay đổi trạng thái nổi bật thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = productController;
