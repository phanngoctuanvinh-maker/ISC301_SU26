const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { validate } = require('../../../middlewares/validate.middleware');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { requireRole } = require('../../../middlewares/role.middleware');
const { updateOrderStatusSchema, updatePaymentStatusSchema } = require('./order.validation');

router.use(verifyToken, requireRole('admin', 'staff'));

router.get('/', orderController.list);
router.get('/:id', orderController.detail);
router.put('/:id/status', validate(updateOrderStatusSchema), orderController.updateStatus);
router.put('/:id/payment-status', validate(updatePaymentStatusSchema), orderController.updatePaymentStatus);

module.exports = router;
