const express = require('express');
const router = express.Router();
const profileController = require('./profile.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { verifyToken } = require('../../middlewares/auth.middleware');
const { uploadAvatar, handleUploadError } = require('../../middlewares/upload.middleware');
const { updateProfileSchema, changePasswordSchema } = require('./profile.validation');

// Tất cả các route bên dưới đều bắt buộc người dùng đăng nhập trước
router.use(verifyToken);

router.get('/', profileController.getProfile);
router.put('/', validate(updateProfileSchema), profileController.updateProfile);
router.put('/change-password', validate(changePasswordSchema), profileController.changePassword);
router.put('/avatar', handleUploadError(uploadAvatar), profileController.updateAvatar);

module.exports = router;
