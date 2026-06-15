const { errorResponse } = require('../utils/response.util');

/**
 * Middleware factory dùng để phân quyền truy cập theo role.
 * Phải được dùng sau verifyToken middleware.
 * 
 * Cách dùng:
 * 1. Chỉ admin được phép truy cập:
 *    router.get('/admin/dashboard', verifyToken, requireRole('admin'), controller.dashboard);
 * 
 * 2. Cả admin và customer đều được phép truy cập:
 *    router.get('/profile', verifyToken, requireRole('admin', 'customer'), controller.profile);
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // 1. Đảm bảo req.user đã tồn tại (đã đi qua verifyToken)
    if (!req.user) {
      return errorResponse(res, 'Vui lòng đăng nhập để tiếp tục', 401);
    }

    // 2. Kiểm tra xem role của user có nằm trong danh sách được phép truy cập không
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 'Bạn không có quyền truy cập chức năng này', 403);
    }

    // 3. Nếu hợp lệ, cho phép đi tiếp
    next();
  };
}

module.exports = {
  requireRole
};
