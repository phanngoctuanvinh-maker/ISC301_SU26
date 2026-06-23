const bannerService = require('../admin/banner/banner.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const publicBannerController = {
  /**
   * Lấy danh sách banner đang hoạt động và trong thời hạn hiển thị cho trang chủ
   */
  async getActive(req, res) {
    try {
      const result = await bannerService.getActiveBanners();
      return successResponse(res, result, 'Lấy danh sách banner thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = publicBannerController;
