const express = require('express');
const router = express.Router();
const categoryController = require('./category.public.controller');

router.get('/', categoryController.getTree);

module.exports = router;
