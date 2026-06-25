const brandService = require('../admin/brand/brand.service');
const { successResponse } = require('../../utils/response.util');

const brandPublicController = {
  async getBrands(req, res, next) {
    try {
      const brands = await brandService.getAllBrands();
      // Lọc các brand is_active = true
      const activeBrands = brands.filter(b => b.is_active);
      return successResponse(res, activeBrands, 'Lấy danh sách thương hiệu thành công');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = brandPublicController;
