const brandService = require('../admin/brand/brand.service');
const { successResponse } = require('../../utils/response.util');

const brandPublicController = {
  async getBrands(req, res, next) {
    try {
      const brands = await brandService.getAllBrands();
      // Lọc các brand is_active = true hoặc 1
      const activeBrands = brands.filter(b => b.is_active === 1 || b.is_active === true);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return successResponse(res, activeBrands, 'Lấy danh sách thương hiệu thành công');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = brandPublicController;
