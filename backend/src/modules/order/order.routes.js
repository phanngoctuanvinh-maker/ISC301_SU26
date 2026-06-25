const express = require('express');
const router = express.Router();

const orderController = require('./order.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createOrderSchema, previewOrderSchema } = require('./order.validation');

// All order endpoints require authentication
router.use(verifyToken);

router.post('/preview', validate(previewOrderSchema), orderController.preview);
router.post('/', validate(createOrderSchema), orderController.create);
router.post('/checkout', validate(createOrderSchema), orderController.create);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderDetail);

module.exports = router;
