const express = require('express');
const router = express.Router();

const brandController = require('./brand.controller');
const { validate } = require('../../../middlewares/validate.middleware');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { requireRole } = require('../../../middlewares/role.middleware');
const { uploadBrandLogo, handleUploadError } = require('../../../middlewares/upload.middleware');
const { createBrandSchema, updateBrandSchema } = require('./brand.validation');

// Tất cả route đều yêu cầu đăng nhập và có role admin
router.use(verifyToken, requireRole('admin'));

// Định nghĩa các endpoints
router.get('/', brandController.getAll);

// handleUploadError(uploadBrandLogo) phải chạy TRƯỚC validate(...) để Multer parse form-data trước
router.post(
  '/',
  handleUploadError(uploadBrandLogo),
  validate(createBrandSchema),
  brandController.create
);

router.put(
  '/:id',
  handleUploadError(uploadBrandLogo),
  validate(updateBrandSchema),
  brandController.update
);

router.put('/:id/toggle-status', brandController.toggleStatus);

module.exports = router;
