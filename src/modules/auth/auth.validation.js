const Joi = require('joi');

const registerSchema = Joi.object({
  full_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'Họ và tên phải là chuỗi ký tự',
      'string.empty': 'Họ và tên không được để trống',
      'string.min': 'Họ và tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ và tên không được vượt quá 100 ký tự',
      'any.required': 'Họ và tên là bắt buộc'
    }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.base': 'Email phải là chuỗi ký tự',
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.base': 'Mật khẩu phải là chuỗi ký tự',
      'string.empty': 'Mật khẩu không được để trống',
      'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
      'string.pattern.base': 'Mật khẩu phải có ít nhất 8 ký tự, 1 chữ hoa và 1 số',
      'any.required': 'Mật khẩu là bắt buộc'
    }),
  phone: Joi.string()
    .pattern(/^0\d{9}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.base': 'Số điện thoại phải là chuỗi ký tự',
      'string.pattern.base': 'Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và có 10 chữ số)'
    })
});

const verifyOtpSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      'string.base': 'Email phải là chuỗi ký tự',
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc'
    }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.base': 'OTP phải là chuỗi ký tự',
      'string.empty': 'OTP không được để trống',
      'string.length': 'OTP phải là 6 chữ số',
      'string.pattern.base': 'OTP phải là 6 chữ số',
      'any.required': 'OTP là bắt buộc'
    })
});

const resendOtpSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      'string.base': 'Email phải là chuỗi ký tự',
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là bắt buộc'
    })
});
const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .required()
    .messages({
      'string.base': 'Email phải là chuỗi ký tự',
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc'
    }),
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.base': 'Mật khẩu phải là chuỗi ký tự',
      'string.empty': 'Vui lòng nhập mật khẩu',
      'any.required': 'Vui lòng nhập mật khẩu'
    })
});
const googleLoginSchema = Joi.object({
  credential: Joi.string()
    .required()
    .messages({
      'string.base': 'Thông tin xác thực Google phải là chuỗi ký tự',
      'string.empty': 'Thiếu thông tin xác thực từ Google',
      'any.required': 'Thiếu thông tin xác thực từ Google'
    })
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  googleLoginSchema
};
