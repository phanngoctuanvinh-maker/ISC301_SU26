const express = require('express');
const router = express.Router();

const categoryController = require('./category.controller');
const { validate } = require('../../../middlewares/validate.middleware');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { requireRole } = require('../../../middlewares/role.middleware');
const { uploadCategoryImage, handleUploadError } = require('../../../middlewares/upload.middleware');
const {
  createCategorySchema,
  updateCategorySchema,
  reorderCategorySchema
} = require('./category.validation');

// Tất cả route đều yêu cầu đăng nhập và có role admin
router.use(verifyToken, requireRole('admin'));

// Định nghĩa các endpoints
router.get('/', categoryController.getTree);
router.post('/', handleUploadError(uploadCategoryImage), validate(createCategorySchema), categoryController.create);

// Lưu ý: PUT /reorder phải đặt TRƯỚC PUT /:id để tránh trùng khớp tham số route
router.put('/reorder', validate(reorderCategorySchema), categoryController.reorder);
router.put('/:id', handleUploadError(uploadCategoryImage), validate(updateCategorySchema), categoryController.update);
router.put('/:id/toggle-status', categoryController.toggleStatus);

module.exports = router;
