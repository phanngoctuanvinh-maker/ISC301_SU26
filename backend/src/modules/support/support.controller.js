const supportService = require('./support.service');
const { successResponse } = require('../../utils/response.util');
const jwt = require('jsonwebtoken');

const supportController = {
  // 1. Customer sends a message (Public - Optional Auth)
  async sendMessage(req, res, next) {
    try {
      const { session_id, name, email, message } = req.body;
      
      let userId = null;
      // If token is provided, decode and attach user ID
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.userId;
        } catch (_) {
          // Ignore invalid tokens for support chat (treat as guest)
        }
      }

      const saved = await supportService.saveMessage(userId, {
        session_id,
        name,
        email,
        message,
        sender_type: 'customer'
      });

      return successResponse(res, saved, 'Đã gửi tin nhắn thành công', 201);
    } catch (error) {
      next(error);
    }
  },

  // 2. Customer gets messages (Public)
  async getMessages(req, res, next) {
    try {
      const { session_id } = req.query;
      if (!session_id) {
        throw { status: 400, message: 'Thiếu thông tin session_id' };
      }
      const messages = await supportService.getSessionMessages(session_id);
      return successResponse(res, messages, 'Lấy danh sách tin nhắn thành công');
    } catch (error) {
      next(error);
    }
  },

  // 3. Admin: Get all threads
  async adminGetThreads(req, res, next) {
    try {
      const threads = await supportService.getActiveThreads();
      return successResponse(res, threads, 'Lấy danh sách hội thoại thành công');
    } catch (error) {
      next(error);
    }
  },

  // 4. Admin: Get messages of a thread
  async adminGetMessages(req, res, next) {
    try {
      const { sessionId } = req.params;
      const messages = await supportService.getSessionMessages(sessionId);
      return successResponse(res, messages, 'Lấy chi tiết tin nhắn thành công');
    } catch (error) {
      next(error);
    }
  },

  // 5. Admin: Reply to customer
  async adminReply(req, res, next) {
    try {
      const { sessionId } = req.params;
      const { message } = req.body;
      const adminUserId = req.user.userId;

      // Get customer details from latest message in session
      const history = await supportService.getSessionMessages(sessionId);
      const latestCustomerMsg = history.reverse().find(m => m.sender_type === 'customer');
      
      const saved = await supportService.saveMessage(adminUserId, {
        session_id: sessionId,
        name: latestCustomerMsg ? latestCustomerMsg.name : 'Admin Support',
        email: latestCustomerMsg ? latestCustomerMsg.email : '',
        message,
        sender_type: 'admin'
      });

      return successResponse(res, saved, 'Đã phản hồi khách hàng thành công', 201);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = supportController;
