const Joi = require('joi');

const updateProfileSchema = Joi.object({
  full_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.base': 'Họ tên phải là chuỗi ký tự',
      'string.empty': 'Họ tên không được để trống',
      'string.min': 'Họ tên phải từ 2 đến 100 ký tự',
      'string.max': 'Họ tên phải từ 2 đến 100 ký tự'
    }),
  phone: Joi.string()
    .pattern(/^0\d{9}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.base': 'Số điện thoại phải là chuỗi ký tự',
      'string.pattern.base': 'Số điện thoại không hợp lệ'
    }),
  email: Joi.string()
    .trim()
    .lowercase()
    .email()
    .optional()
    .messages({
      'string.base': 'Email phải là chuỗi ký tự',
      'string.email': 'Email không hợp lệ'
    }),
  gender: Joi.string()
    .valid('male', 'female', 'other')
    .optional()
    .messages({
      'string.base': 'Giới tính phải là chuỗi ký tự',
      'any.only': 'Giới tính không hợp lệ'
    }),
  date_of_birth: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.base': 'Ngày sinh phải là chuỗi ký tự',
      'string.pattern.base': 'Ngày sinh không hợp lệ, định dạng YYYY-MM-DD'
    })
})
  .min(1)
  .messages({
    'object.min': 'Vui lòng cung cấp ít nhất 1 thông tin cần cập nhật'
  });

const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.base': 'Mật khẩu hiện tại phải là chuỗi ký tự',
      'string.empty': 'Vui lòng nhập mật khẩu hiện tại',
      'any.required': 'Vui lòng nhập mật khẩu hiện tại'
    }),
  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
    .required()
    .messages({
      'string.base': 'Mật khẩu mới phải là chuỗi ký tự',
      'string.empty': 'Vui lòng nhập mật khẩu mới',
      'string.min': 'Mật khẩu mới phải có ít nhất 8 ký tự, 1 chữ hoa và 1 số',
      'string.pattern.base': 'Mật khẩu mới phải có ít nhất 8 ký tự, 1 chữ hoa và 1 số',
      'any.required': 'Vui lòng nhập mật khẩu mới'
    }),
  confirm_password: Joi.any()
    .equal(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp',
      'any.required': 'Xác nhận mật khẩu không khớp'
    })
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema
};
