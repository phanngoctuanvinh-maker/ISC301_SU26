const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const { validate } = require('../../../middlewares/validate.middleware');
const { verifyToken } = require('../../../middlewares/auth.middleware');
const { requireRole } = require('../../../middlewares/role.middleware');
const { adjustmentSchema } = require('./inventory.validation');

router.use(verifyToken, requireRole('admin', 'staff'));

router.get('/', inventoryController.list);
router.post('/adjustments', validate(adjustmentSchema), inventoryController.adjust);

module.exports = router;
