const authService = require('./auth.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

const authController = {
  async register(req, res) {
    try {
      const result = await authService.register(req.body);
      return successResponse(res, null, result.message, 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  async verifyOtp(req, res) {
    try {
      const result = await authService.verifyOtp(req.body);
      return successResponse(res, result, 'Xác thực tài khoản thành công', 201);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  async resendOtp(req, res) {
    try {
      const result = await authService.resendOtp(req.body);
      return successResponse(res, null, result.message, 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  async login(req, res) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, result, 'Đăng nhập thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  },

  async googleLogin(req, res) {
    try {
      const result = await authService.googleLogin(req.body);
      return successResponse(res, result, 'Đăng nhập Google thành công', 200);
    } catch (err) {
      if (err.status) {
        return errorResponse(res, err.message, err.status);
      }
      return errorResponse(res, 'Lỗi hệ thống', 500, err.message || err);
    }
  }
};

module.exports = authController;
