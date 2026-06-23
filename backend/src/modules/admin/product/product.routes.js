const express = require('express');
const router = express.Router();

const productController = require('./product.controller');
const { validate } = require('../../../middlewares/validate.middleware');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { requireRole } = require('../../../middlewares/role.middleware');
const { uploadProductImages, handleUploadError } = require('../../../middlewares/upload.middleware');
const {
  createProductSchema,
  updateProductSchema,
  deleteImageSchema
} = require('./product.validation');

// Tất cả route đều yêu cầu đăng nhập và có role admin
router.use(verifyToken, requireRole('admin'));

// Định nghĩa các endpoints
router.get('/', productController.getAll);
router.get('/:id', productController.getDetail);

router.post(
  '/',
  handleUploadError(uploadProductImages),
  validate(createProductSchema),
  productController.create
);

router.put(
  '/:id',
  handleUploadError(uploadProductImages),
  validate(updateProductSchema),
  productController.update
);

router.delete('/:id/images/:imageId', productController.deleteImage);

router.put(
  '/:id/main-image',
  validate(deleteImageSchema),
  productController.setMainImage
);

router.put('/:id/toggle-status', productController.toggleStatus);
router.put('/:id/toggle-featured', productController.toggleFeatured);

module.exports = router;
