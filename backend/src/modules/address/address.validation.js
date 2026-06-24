const Joi = require('joi');

const addressSchema = Joi.object({
  receiver_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.base': 'Tên người nhận phải là chuỗi ký tự',
      'string.empty': 'Tên người nhận không được để trống',
      'string.min': 'Tên người nhận phải từ 2 đến 100 ký tự',
      'string.max': 'Tên người nhận phải từ 2 đến 100 ký tự',
      'any.required': 'Vui lòng cung cấp tên người nhận'
    }),
  phone: Joi.string()
    .pattern(/^0\d{9}$/)
    .required()
    .messages({
      'string.base': 'Số điện thoại phải là chuỗi ký tự',
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại không hợp lệ, phải bắt đầu bằng số 0 và có đúng 10 chữ số',
      'any.required': 'Vui lòng cung cấp số điện thoại nhận hàng'
    }),
  address_line: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.base': 'Địa chỉ chi tiết phải là chuỗi ký tự',
      'string.empty': 'Địa chỉ chi tiết không được để trống',
      'string.min': 'Địa chỉ chi tiết phải từ 5 đến 255 ký tự',
      'string.max': 'Địa chỉ chi tiết phải từ 5 đến 255 ký tự',
      'any.required': 'Vui lòng cung cấp địa chỉ chi tiết (số nhà, tên đường)'
    }),
  ward: Joi.string()
    .trim()
    .max(100)
    .allow(null, '')
    .optional()
    .messages({
      'string.base': 'Phường/Xã phải là chuỗi ký tự',
      'string.max': 'Phường/Xã tối đa 100 ký tự'
    }),
  district: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.base': 'Quận/Huyện phải là chuỗi ký tự',
      'string.empty': 'Quận/Huyện không được để trống',
      'string.max': 'Quận/Huyện tối đa 100 ký tự',
      'any.required': 'Vui lòng cung cấp Quận/Huyện'
    }),
  city: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.base': 'Tỉnh/Thành phố phải là chuỗi ký tự',
      'string.empty': 'Tỉnh/Thành phố không được để trống',
      'string.max': 'Tỉnh/Thành phố tối đa 100 ký tự',
      'any.required': 'Vui lòng cung cấp Tỉnh/Thành phố'
    })
});

const updateAddressSchema = Joi.object({
  receiver_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.base': 'Tên người nhận phải là chuỗi ký tự',
      'string.empty': 'Tên người nhận không được để trống',
      'string.min': 'Tên người nhận phải từ 2 đến 100 ký tự',
      'string.max': 'Tên người nhận phải từ 2 đến 100 ký tự'
    }),
  phone: Joi.string()
    .pattern(/^0\d{9}$/)
    .optional()
    .messages({
      'string.base': 'Số điện thoại phải là chuỗi ký tự',
      'string.empty': 'Số điện thoại không được để trống',
      'string.pattern.base': 'Số điện thoại không hợp lệ, phải bắt đầu bằng số 0 và có đúng 10 chữ số'
    }),
  address_line: Joi.string()
    .trim()
    .min(5)
    .max(255)
    .optional()
    .messages({
      'string.base': 'Địa chỉ chi tiết phải là chuỗi ký tự',
      'string.empty': 'Địa chỉ chi tiết không được để trống',
      'string.min': 'Địa chỉ chi tiết phải từ 5 đến 255 ký tự',
      'string.max': 'Địa chỉ chi tiết phải từ 5 đến 255 ký tự'
    }),
  ward: Joi.string()
    .trim()
    .max(100)
    .allow(null, '')
    .optional()
    .messages({
      'string.base': 'Phường/Xã phải là chuỗi ký tự',
      'string.max': 'Phường/Xã tối đa 100 ký tự'
    }),
  district: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.base': 'Quận/Huyện phải là chuỗi ký tự',
      'string.empty': 'Quận/Huyện không được để trống',
      'string.max': 'Quận/Huyện tối đa 100 ký tự'
    }),
  city: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.base': 'Tỉnh/Thành phố phải là chuỗi ký tự',
      'string.empty': 'Tỉnh/Thành phố không được để trống',
      'string.max': 'Tỉnh/Thành phố tối đa 100 ký tự'
    })
})
  .min(1)
  .messages({
    'object.min': 'Vui lòng cung cấp ít nhất 1 thông tin cần cập nhật'
  });

module.exports = {
  addressSchema,
  updateAddressSchema
};
