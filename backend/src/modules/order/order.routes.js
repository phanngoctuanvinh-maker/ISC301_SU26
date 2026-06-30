const express = require('express');
const router = express.Router();

const orderController = require('./order.controller');
const { verifyToken, isAdmin } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createOrderSchema, previewOrderSchema } = require('./order.validation');

// All order endpoints require authentication
router.use(verifyToken);

// Customer Routes
router.post('/preview', validate(previewOrderSchema), orderController.preview);
router.post('/', validate(createOrderSchema), orderController.create);
router.post('/checkout', validate(createOrderSchema), orderController.create);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderDetail);
router.put('/:id/cancel', orderController.cancelOrder);

// Admin Routes (require isAdmin check)
router.get('/admin/all', isAdmin, orderController.getAdminOrders);
router.get('/admin/:id', isAdmin, orderController.getAdminOrderDetail);
router.put('/:id/status', isAdmin, orderController.updateStatus);

module.exports = router;
