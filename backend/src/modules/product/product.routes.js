const express = require('express');
const router = express.Router();
const productController = require('./product.controller');

router.get('/', productController.list);
router.get('/:slug', productController.detail);

module.exports = router;
