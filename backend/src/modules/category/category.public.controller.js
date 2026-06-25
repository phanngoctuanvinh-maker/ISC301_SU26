const categoryService = require('../admin/category/category.service');
const { successResponse } = require('../../utils/response.util');

const categoryPublicController = {
  async getCategories(req, res, next) {
    try {
      const tree = await categoryService.getCategoryTree();
      // Lọc các danh mục is_active = true
      const activeTree = tree.filter(c => c.is_active).map(c => ({
        ...c,
        children: c.children.filter(child => child.is_active)
      }));
      return successResponse(res, activeTree, 'Lấy danh mục thành công');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = categoryPublicController;
