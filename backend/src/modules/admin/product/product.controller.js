const productService = require('./product.service');
const { successResponse, errorResponse } = require('../../../utils/response.util');

const productController = {
  async list(req, res) {
    try {
      const result = await productService.listProducts(req.query);
      return successResponse(res, result, 'Lấy danh sách sản phẩm thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async create(req, res) {
    try {
      const result = await productService.createProduct(req.body, req.file);
      return successResponse(res, result, 'Tạo sản phẩm thành công', 201);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async update(req, res) {
    try {
      const result = await productService.updateProduct(req.params.id, req.body, req.file);
      return successResponse(res, result, 'Cập nhật sản phẩm thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async toggleStatus(req, res) {
    try {
      const result = await productService.toggleProductStatus(req.params.id);
      return successResponse(res, result, 'Thay đổi trạng thái thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  }
};

module.exports = productController;
