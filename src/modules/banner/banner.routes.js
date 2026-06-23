const express = require('express');
const router = express.Router();
const publicBannerController = require('./banner.controller');

router.get('/', publicBannerController.getActive);

module.exports = router;
