const express = require('express');
const router = express.Router();
const productController = require('./product.controller');

// Lấy danh sách sản phẩm public
router.get('/', productController.getPublicProducts);

// Lấy chi tiết sản phẩm theo slug
router.get('/:slug', productController.getPublicProductBySlug);

module.exports = router;
