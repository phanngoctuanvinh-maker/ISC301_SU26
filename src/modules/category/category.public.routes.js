const express = require('express');
const router = express.Router();
const categoryPublicController = require('./category.public.controller');

router.get('/', categoryPublicController.getCategories);

module.exports = router;
