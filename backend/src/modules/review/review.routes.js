const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.post('/', verifyToken, reviewController.createReview);
router.get('/product/:productId', reviewController.getProductReviews);

module.exports = router;
