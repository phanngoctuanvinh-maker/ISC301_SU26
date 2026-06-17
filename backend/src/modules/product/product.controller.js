const productService = require('./product.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const productController = {
  async list(req, res) {
    try {
      const result = await productService.listPublicProducts(req.query);
      return successResponse(res, result, 'Lay danh sach san pham thanh cong', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Loi he thong', 500, err.message || err);
    }
  },

  async detail(req, res) {
    try {
      const result = await productService.getPublicProductBySlug(req.params.slug);
      return successResponse(res, result, 'Lay chi tiet san pham thanh cong', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Loi he thong', 500, err.message || err);
    }
  }
};

module.exports = productController;
