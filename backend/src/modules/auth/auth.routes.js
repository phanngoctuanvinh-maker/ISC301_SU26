const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { validate } = require('../../middlewares/validate.middleware');
const { registerSchema, verifyOtpSchema, resendOtpSchema, loginSchema, googleLoginSchema, forgotPasswordSchema, resetPasswordSchema } = require('./auth.validation');

router.post('/register', validate(registerSchema), authController.register);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp);
router.post('/login', validate(loginSchema), authController.login);
router.post('/google', validate(googleLoginSchema), authController.googleLogin);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
