const aiService = require('./ai.service');
const { successResponse } = require('../../utils/response.util');

const aiController = {
  /**
   * Lấy hồ sơ kích cỡ chân AI của người dùng
   */
  async getAIProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const profile = await aiService.getAIProfile(userId);
      return successResponse(res, profile, 'Lấy hồ sơ kích cỡ chân thành công');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Đo size chân qua ảnh hiệu chuẩn
   */
  async measureFoot(req, res, next) {
    try {
      const userId = req.user ? req.user.userId : null;
      const { paperPoints, footPoints, widthPoints, stylePreference } = req.body;

      if (!paperPoints || !footPoints || !widthPoints) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ các điểm hiệu chuẩn tờ giấy và bàn chân.'
        });
      }

      const result = await aiService.measureFoot(userId, {
        paperPoints,
        footPoints,
        widthPoints,
        stylePreference
      });

      return successResponse(res, result, 'Đo kích thước chân thành công');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Trò chuyện tư vấn giày thông minh
   */
  async chatWithAI(req, res, next) {
    try {
      const userId = req.user ? req.user.userId : null;
      const { messages } = req.body;

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Hội thoại chat không được để trống.'
        });
      }

      // Lấy hồ sơ chân của người dùng nếu họ đã đăng nhập để cung cấp ngữ cảnh cá nhân
      let userProfile = null;
      if (userId) {
        userProfile = await aiService.getAIProfile(userId);
      }

      const result = await aiService.chatWithAI(messages, userProfile);
      return successResponse(res, result, 'AI trả lời thành công');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = aiController;
