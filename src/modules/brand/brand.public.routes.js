const express = require('express');
const router = express.Router();
const brandPublicController = require('./brand.public.controller');

router.get('/', brandPublicController.getBrands);

module.exports = router;
