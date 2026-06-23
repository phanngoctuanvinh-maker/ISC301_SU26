const express = require('express');
const router = express.Router();

const bannerController = require('./banner.controller');
const { validate } = require('../../../middlewares/validate.middleware');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { requireRole } = require('../../../middlewares/role.middleware');
const { uploadBannerImage, handleUploadError } = require('../../../middlewares/upload.middleware');
const { createBannerSchema, updateBannerSchema, reorderBannerSchema } = require('./banner.validation');

// Tất cả route đều yêu cầu đăng nhập và có role admin
router.use(verifyToken, requireRole('admin'));

// Định nghĩa các endpoints
router.get('/', bannerController.getAll);

// handleUploadError(uploadBannerImage) phải chạy TRƯỚC validate(...) để Multer parse form-data trước
router.post(
  '/',
  handleUploadError(uploadBannerImage),
  validate(createBannerSchema),
  bannerController.create
);

// Lưu ý thứ tự: Route /reorder phải đặt trước /:id để tránh Express hiểu nhầm reorder là id
router.put(
  '/reorder',
  validate(reorderBannerSchema),
  bannerController.reorder
);

router.put(
  '/:id',
  handleUploadError(uploadBannerImage),
  validate(updateBannerSchema),
  bannerController.update
);

router.put('/:id/toggle-status', bannerController.toggleStatus);

router.delete('/:id', bannerController.delete);

module.exports = router;
