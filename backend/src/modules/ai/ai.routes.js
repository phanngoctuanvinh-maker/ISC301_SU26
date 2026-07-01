const express = require('express');
const router = express.Router();
const aiController = require('./ai.controller');
const { verifyToken, verifyTokenOptional } = require('../../middlewares/auth.middleware');

// Lấy hồ sơ chân của User (yêu cầu đăng nhập)
router.get('/profile', verifyToken, aiController.getAIProfile);

// Đo chân qua ảnh (không bắt buộc đăng nhập để khách vãng lai trải nghiệm được)
router.post('/measure', verifyTokenOptional, aiController.measureFoot);

// Tư vấn giày AI (không bắt buộc đăng nhập)
router.post('/chat', verifyTokenOptional, aiController.chatWithAI);

module.exports = router;
