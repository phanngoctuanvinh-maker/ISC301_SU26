const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlist.controller');
const { verifyToken } = require('../../middlewares/auth.middleware');

router.use(verifyToken);

router.get('/', wishlistController.get);
router.post('/', wishlistController.add);
router.delete('/:productId', wishlistController.remove);

module.exports = router;
