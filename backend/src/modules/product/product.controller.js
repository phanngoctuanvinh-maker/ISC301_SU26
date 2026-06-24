const productService = require('./product.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const productController = {
  async list(req, res) {
    try {
      const result = await productService.listPublicProducts(req.query);
      return successResponse(res, result, 'Lấy danh sách sản phẩm thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  async detail(req, res) {
    try {
      const result = await productService.getPublicProductBySlug(req.params.slug);
      return successResponse(res, result, 'Lấy chi tiết sản phẩm thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = productController;
