const express = require('express');
const router = express.Router();
const flashSaleController = require('./flashsale.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');

// Public route to get active/upcoming flash sale
router.get('/active', flashSaleController.handleGetActiveOrUpcoming);

// Admin routes (require login and admin role)
router.post('/admin', verifyToken, requireRole('admin'), flashSaleController.handleCreate);
router.get('/admin', verifyToken, requireRole('admin'), flashSaleController.handleListAll);
router.put('/admin/:id', verifyToken, requireRole('admin'), flashSaleController.handleUpdate);
router.delete('/admin/:id', verifyToken, requireRole('admin'), flashSaleController.handleDelete);

module.exports = router;
