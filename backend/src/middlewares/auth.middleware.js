const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response.util');
require('dotenv').config();

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

function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return errorResponse(res, 'Quyền truy cập bị từ chối. Chỉ dành cho Admin.', 403);
  }
}

function verifyTokenOptional(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    // Bỏ qua lỗi vì đây là xác thực không bắt buộc
  }
  next();
}

module.exports = {
  verifyToken,
  verifyTokenOptional,
  isAdmin
};
