const variantService = require('./variant.service');
const { successResponse, errorResponse } = require('../../../utils/response.util');

const variantController = {
  /**
   * Lấy danh sách biến thể của sản phẩm
   */
  async getByProduct(req, res) {
    try {
      const result = await variantService.getVariantsByProduct(req.params.productId);
      return successResponse(res, result, 'Lấy danh sách biến thể thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Tạo 1 biến thể mới
   */
  async create(req, res) {
    try {
      const result = await variantService.createVariant(req.params.productId, req.body);
      return successResponse(res, result, 'Tạo biến thể thành công', 201);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Tạo hàng loạt biến thể (Bulk Create)
   */
  async bulkCreate(req, res) {
    try {
      const result = await variantService.bulkCreateVariants(req.params.productId, req.body.variants);
      return successResponse(res, result, 'Tạo hàng loạt biến thể thành công', 201);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Cập nhật thông tin chi tiết biến thể
   */
  async update(req, res) {
    try {
      const result = await variantService.updateVariant(req.params.id, req.body);
      return successResponse(res, result, 'Cập nhật biến thể thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Cập nhật nhanh số lượng tồn kho của biến thể
   */
  async updateStock(req, res) {
    try {
      const result = await variantService.updateStock(req.params.id, req.body.stock_quantity);
      return successResponse(res, result, 'Cập nhật tồn kho thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  /**
   * Xóa biến thể (Xóa cứng hoặc Đưa tồn kho về 0)
   */
  async remove(req, res) {
    try {
      const result = await variantService.deleteVariant(req.params.id);
      return successResponse(res, result, result.message, 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = variantController;
