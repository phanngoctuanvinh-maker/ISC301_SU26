const productService = require('./product.service');
const { successResponse } = require('../../utils/response.util');

const productController = {
  /**
   * Lấy danh sách sản phẩm public có phân trang, lọc, sắp xếp
   */
  async getPublicProducts(req, res, next) {
    try {
      const result = await productService.listPublicProducts(req.query, req.user);
      return successResponse(res, result, 'Lấy danh sách sản phẩm thành công');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Lấy chi tiết sản phẩm theo slug
   */
  async getPublicProductBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const product = await productService.getPublicProductBySlug(slug, req.user);
      return successResponse(res, product, 'Lấy chi tiết sản phẩm thành công');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;
