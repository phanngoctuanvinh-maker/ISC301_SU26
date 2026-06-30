const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

// API tạo URL thanh toán (Yêu cầu đăng nhập)
router.post('/vnpay-url', verifyToken, paymentController.createPaymentUrl);

// API xác minh chữ ký giao dịch từ VNPAY (Public)
router.get('/vnpay-verify', paymentController.verifyPayment);

// API nhận IPN callback từ VNPAY Server (Public)
router.get('/vnpay-ipn', paymentController.handleIPN);

module.exports = router;
