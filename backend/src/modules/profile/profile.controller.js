const profileService = require('./profile.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const profileController = {
  async getProfile(req, res) {
    try {
      const result = await profileService.getProfile(req.user.userId);
      return successResponse(res, result, 'Lấy thông tin thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  async updateProfile(req, res) {
    try {
      const result = await profileService.updateProfile(req.user.userId, req.body);
      return successResponse(res, result, 'Cập nhật thông tin thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  async changePassword(req, res) {
    try {
      const result = await profileService.changePassword(req.user.userId, req.body);
      return successResponse(res, null, result.message, 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  async updateAvatar(req, res) {
    try {
      const result = await profileService.updateAvatar(req.user.userId, req.file);
      return successResponse(res, result, 'Cập nhật ảnh đại diện thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = profileController;
