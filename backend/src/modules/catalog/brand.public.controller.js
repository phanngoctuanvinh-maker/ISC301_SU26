const brandService = require('./brand.public.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const brandPublicController = {
  async getAll(req, res) {
    try {
      const result = await brandService.getActiveBrands();
      return successResponse(res, result, 'Lấy danh sách thương hiệu thành công', 200);
    } catch (err) {
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = brandPublicController;
