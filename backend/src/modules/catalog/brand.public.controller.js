const brandService = require('./brand.public.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const brandPublicController = {
  async getAll(req, res) {
    try {
      const result = await brandService.getActiveBrands();
      return successResponse(res, result, 'Lay danh sach thuong hieu thanh cong', 200);
    } catch (err) {
      return errorResponse(res, 'Loi he thong', 500, err.message || err);
    }
  }
};

module.exports = brandPublicController;
