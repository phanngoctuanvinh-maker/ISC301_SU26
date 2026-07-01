const express = require('express');
const router = express.Router();
const productController = require('./product.controller');
const { verifyTokenOptional } = require('../../middlewares/auth.middleware');

// Lấy danh sách sản phẩm public
router.get('/', verifyTokenOptional, productController.getPublicProducts);

// Lấy chi tiết sản phẩm theo slug
router.get('/:slug', verifyTokenOptional, productController.getPublicProductBySlug);

module.exports = router;
