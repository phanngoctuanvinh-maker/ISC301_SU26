const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const { validate } = require('../../../middlewares/validate.middleware');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { requireRole } = require('../../../middlewares/role.middleware');
const { handleUploadError, uploadProductImage } = require('../../../middlewares/upload.middleware');
const { createProductSchema, updateProductSchema, replaceVariantsSchema } = require('./product.validation');

router.use(verifyToken, requireRole('admin'));

router.get('/', productController.list);
router.post('/', handleUploadError(uploadProductImage), validate(createProductSchema), productController.create);
router.put('/:id', handleUploadError(uploadProductImage), validate(updateProductSchema), productController.update);
router.put('/:id/variants', validate(replaceVariantsSchema), productController.replaceVariants);
router.put('/:id/toggle-status', productController.toggleStatus);

module.exports = router;
