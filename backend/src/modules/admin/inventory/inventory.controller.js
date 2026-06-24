const inventoryService = require('./inventory.service');
const { successResponse, errorResponse } = require('../../../utils/response.util');

const inventoryController = {
  async list(req, res) {
    try {
      const result = await inventoryService.listInventory(req.query);
      return successResponse(res, result, 'Lấy danh sách tồn kho thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  },

  async adjust(req, res) {
    try {
      const result = await inventoryService.adjustInventory(req.body, req.user.userId);
      return successResponse(res, result, 'Điều chỉnh tồn kho thành công', 200);
    } catch (err) {
      return errorResponse(res, err.message || 'Lỗi hệ thống', err.status || 500, err.message || err);
    }
  }
};

module.exports = inventoryController;
