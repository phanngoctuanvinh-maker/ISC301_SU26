const categoryService = require('./category.public.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const categoryPublicController = {
  async getTree(req, res) {
    try {
      const result = await categoryService.getActiveCategoryTree();
      return successResponse(res, result, 'Lấy danh sách danh mục thành công', 200);
    } catch (err) {
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = categoryPublicController;
