const express = require('express');
const router = express.Router();
const addressController = require('./address.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { addressSchema, updateAddressSchema } = require('./address.validation');

// Tất cả các route bên dưới bắt buộc phải có token đăng nhập hợp lệ
router.use(verifyToken);

router.get('/', addressController.getAll);
router.post('/', validate(addressSchema), addressController.create);
router.put('/:id', validate(updateAddressSchema), addressController.update);
router.delete('/:id', addressController.remove);
router.put('/:id/default', addressController.setDefault);

module.exports = router;
