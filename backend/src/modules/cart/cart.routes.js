const express = require('express');
const router = express.Router();
const cartController = require('./cart.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { cartItemSchema, updateCartItemSchema } = require('./cart.validation');

router.use(verifyToken);

router.get('/', cartController.get);
router.post('/items', validate(cartItemSchema), cartController.addItem);
router.put('/items/:id', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:id', cartController.removeItem);
router.delete('/', cartController.clear);

module.exports = router;
