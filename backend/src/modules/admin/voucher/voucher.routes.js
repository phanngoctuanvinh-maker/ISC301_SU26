const express = require('express');
const router = express.Router();

const voucherController = require('./voucher.controller');
const { validate } = require('../../../middlewares/validate.middleware');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { requireRole } = require('../../../middlewares/role.middleware');
const {
  createVoucherSchema,
  updateVoucherSchema
} = require('./voucher.validation');

// Tất cả các routes admin đều yêu cầu đăng nhập và có quyền admin
router.use(verifyToken, requireRole('admin'));

// Các endpoints admin
router.get('/', voucherController.getAll);
router.post('/', validate(createVoucherSchema), voucherController.create);
router.get('/:id', voucherController.getById);
router.put('/:id', validate(updateVoucherSchema), voucherController.update);
router.put('/:id/toggle-status', voucherController.toggleStatus);

module.exports = router;
