const express = require('express');
const router = express.Router();
const orderController = require('./order.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { checkoutSchema } = require('./order.validation');

router.get('/vnpay/return', orderController.vnpayReturn);

router.use(verifyToken);

router.post('/checkout', validate(checkoutSchema), orderController.checkout);
router.get('/', orderController.list);
router.get('/:id', orderController.detail);
router.post('/:id/cancel', orderController.cancel);

module.exports = router;
