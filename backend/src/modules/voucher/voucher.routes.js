const express = require('express');
const router = express.Router();

const { publicVoucherController } = require('./voucher.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { applyVoucherSchema } = require('../admin/voucher/voucher.validation');

// Public endpoint để áp dụng mã giảm giá khi Checkout (không cần verifyToken)
router.post('/apply', validate(applyVoucherSchema), publicVoucherController.apply);

module.exports = router;
