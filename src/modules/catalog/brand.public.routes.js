const express = require('express');
const router = express.Router();
const brandController = require('./brand.public.controller');

router.get('/', brandController.getAll);

module.exports = router;
