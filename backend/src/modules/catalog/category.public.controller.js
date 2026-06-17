const categoryService = require('./category.public.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const categoryPublicController = {
  async getTree(req, res) {
    try {
      const result = await categoryService.getActiveCategoryTree();
      return successResponse(res, result, 'Lay danh sach danh muc thanh cong', 200);
    } catch (err) {
      return errorResponse(res, 'Loi he thong', 500, err.message || err);
    }
  }
};

module.exports = categoryPublicController;
