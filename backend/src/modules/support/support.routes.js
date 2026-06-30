const express = require('express');
const router = express.Router();
const supportController = require('./support.controller');
const { verifyToken, isAdmin } = require('../../middlewares/auth.middleware');

// Public endpoints (Customer side)
router.post('/messages', supportController.sendMessage);
router.get('/messages', supportController.getMessages);

// Admin endpoints (Admin side)
router.get('/admin/threads', verifyToken, isAdmin, supportController.adminGetThreads);
router.get('/admin/messages/:sessionId', verifyToken, isAdmin, supportController.adminGetMessages);
router.post('/admin/messages/:sessionId', verifyToken, isAdmin, supportController.adminReply);

module.exports = router;
