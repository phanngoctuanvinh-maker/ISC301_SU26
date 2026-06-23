const express = require('express');
const router = express.Router();
const variantController = require('./variant.controller');
const { validate } = require('../../../middlewares/validate.middleware');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { requireRole } = require('../../../middlewares/role.middleware');
const {
  createVariantSchema,
  updateVariantSchema,
  bulkCreateVariantSchema,
  updateStockSchema
} = require('./variant.validation');

// Tất cả các endpoints trong router này bắt buộc phải có quyền Admin
router.use(verifyToken, requireRole('admin'));

// Nhóm đường dẫn gắn với productId
router.get('/products/:productId/variants', variantController.getByProduct);
router.post('/products/:productId/variants', validate(createVariantSchema), variantController.create);
router.post('/products/:productId/variants/bulk', validate(bulkCreateVariantSchema), variantController.bulkCreate);

// Nhóm đường dẫn trực tiếp với variantId
router.put('/variants/:id', validate(updateVariantSchema), variantController.update);
router.put('/variants/:id/stock', validate(updateStockSchema), variantController.updateStock);
router.delete('/variants/:id', variantController.remove);

module.exports = router;
