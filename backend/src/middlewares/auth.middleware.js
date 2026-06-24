const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response.util');
require('../config/env');

function verifyToken(req, res, next) {
  // 1. Đọc header Authorization từ request
  const authHeader = req.headers['authorization'];

  // 2. Kiểm tra định dạng Authorization Header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Vui lòng đăng nhập để tiếp tục', 401);
  }

  // 3. Tách lấy token
  const token = authHeader.split(' ')[1];

  // 4. Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 5. Gán thông tin giải mã vào req.user
    req.user = decoded;
    
    // 6. Cho phép đi tiếp
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 401);
    }
    return errorResponse(res, 'Token không hợp lệ', 401);
  }
}

module.exports = {
  verifyToken
};
