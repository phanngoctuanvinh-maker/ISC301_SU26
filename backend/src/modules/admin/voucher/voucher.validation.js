const Joi = require('joi');

const createVoucherSchema = Joi.object({
  code: Joi.string()
    .min(3)
    .max(50)
    .trim()
    .uppercase()
    .required()
    .messages({
      'string.base': 'Mã voucher phải là chuỗi ký tự',
      'string.empty': 'Mã voucher không được để trống',
      'string.min': 'Mã voucher phải từ 3 đến 50 ký tự',
      'string.max': 'Mã voucher phải từ 3 đến 50 ký tự',
      'any.required': 'Mã voucher là bắt buộc'
    }),
  description: Joi.string()
    .max(255)
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Mô tả phải là chuỗi ký tự',
      'string.max': 'Mô tả không được vượt quá 255 ký tự'
    }),
  discount_type: Joi.string()
    .valid('percent', 'fixed')
    .required()
    .messages({
      'any.only': 'Loại giảm giá phải là percent hoặc fixed',
      'any.required': 'Loại giảm giá là bắt buộc'
    }),
  discount_value: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Giá trị giảm phải là số',
      'number.integer': 'Giá trị giảm phải là số nguyên',
      'number.positive': 'Giá trị giảm phải là số dương',
      'any.required': 'Giá trị giảm là bắt buộc'
    }),
  min_order_value: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .optional()
    .messages({
      'number.base': 'Giá trị đơn hàng tối thiểu phải là số',
      'number.integer': 'Giá trị đơn hàng tối thiểu phải là số nguyên',
      'number.min': 'Giá trị đơn hàng tối thiểu không được nhỏ hơn 0'
    }),
  max_discount: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Giới hạn giảm tối đa phải là số',
      'number.integer': 'Giới hạn giảm tối đa phải là số nguyên',
      'number.positive': 'Giới hạn giảm tối đa phải là số dương'
    }),
  usage_limit: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Giới hạn lượt dùng phải là số',
      'number.integer': 'Giới hạn lượt dùng phải là số nguyên',
      'number.positive': 'Giới hạn lượt dùng phải là số nguyên dương'
    }),
  start_date: Joi.string()
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Ngày bắt đầu không hợp lệ'
    }),
  expiry_date: Joi.string()
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Ngày hết hạn không hợp lệ'
    })
}).custom((value, helpers) => {
  const { discount_type, discount_value, start_date, expiry_date } = value;

  if (discount_type === 'percent' && discount_value > 100) {
    return helpers.error('any.custom', { message: 'Phần trăm giảm không được vượt quá 100%' });
  }

  if (start_date && expiry_date && start_date !== 'null' && expiry_date !== 'null' && start_date !== '' && expiry_date !== '') {
    const start = new Date(start_date);
    const expiry = new Date(expiry_date);
    if (!isNaN(start.getTime()) && !isNaN(expiry.getTime()) && expiry <= start) {
      return helpers.error('any.custom', { message: 'Ngày hết hạn phải sau ngày bắt đầu' });
    }
  }

  return value;
}).messages({
  'any.custom': '{{#message}}'
});

const updateVoucherSchema = Joi.object({
  code: Joi.string()
    .min(3)
    .max(50)
    .trim()
    .uppercase()
    .optional()
    .messages({
      'string.base': 'Mã voucher phải là chuỗi ký tự',
      'string.min': 'Mã voucher phải từ 3 đến 50 ký tự',
      'string.max': 'Mã voucher phải từ 3 đến 50 ký tự'
    }),
  description: Joi.string()
    .max(255)
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Mô tả phải là chuỗi ký tự',
      'string.max': 'Mô tả không được vượt quá 255 ký tự'
    }),
  discount_type: Joi.string()
    .valid('percent', 'fixed')
    .optional()
    .messages({
      'any.only': 'Loại giảm giá phải là percent hoặc fixed'
    }),
  discount_value: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Giá trị giảm phải là số',
      'number.integer': 'Giá trị giảm phải là số nguyên',
      'number.positive': 'Giá trị giảm phải là số dương'
    }),
  min_order_value: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Giá trị đơn hàng tối thiểu phải là số',
      'number.integer': 'Giá trị đơn hàng tối thiểu phải là số nguyên',
      'number.min': 'Giá trị đơn hàng tối thiểu không được nhỏ hơn 0'
    }),
  max_discount: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Giới hạn giảm tối đa phải là số',
      'number.integer': 'Giới hạn giảm tối đa phải là số nguyên',
      'number.positive': 'Giới hạn giảm tối đa phải là số dương'
    }),
  usage_limit: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Giới hạn lượt dùng phải là số',
      'number.integer': 'Giới hạn lượt dùng phải là số nguyên',
      'number.positive': 'Giới hạn lượt dùng phải là số nguyên dương'
    }),
  start_date: Joi.string()
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Ngày bắt đầu không hợp lệ'
    }),
  expiry_date: Joi.string()
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Ngày hết hạn không hợp lệ'
    })
}).min(1).custom((value, helpers) => {
  const { discount_type, discount_value, start_date, expiry_date } = value;

  if (discount_type === 'percent' && discount_value > 100) {
    return helpers.error('any.custom', { message: 'Phần trăm giảm không được vượt quá 100%' });
  }

  if (start_date && expiry_date && start_date !== 'null' && expiry_date !== 'null' && start_date !== '' && expiry_date !== '') {
    const start = new Date(start_date);
    const expiry = new Date(expiry_date);
    if (!isNaN(start.getTime()) && !isNaN(expiry.getTime()) && expiry <= start) {
      return helpers.error('any.custom', { message: 'Ngày hết hạn phải sau ngày bắt đầu' });
    }
  }

  return value;
}).messages({
  'any.custom': '{{#message}}',
  'object.min': 'Vui lòng cung cấp ít nhất một trường thông tin để cập nhật'
});

const applyVoucherSchema = Joi.object({
  code: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập mã giảm giá',
      'any.required': 'Vui lòng nhập mã giảm giá'
    }),
  subtotal: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Giá trị đơn hàng không hợp lệ',
      'number.integer': 'Giá trị đơn hàng không hợp lệ',
      'number.positive': 'Giá trị đơn hàng không hợp lệ',
      'any.required': 'Giá trị đơn hàng không hợp lệ'
    })
});

module.exports = {
  createVoucherSchema,
  updateVoucherSchema,
  applyVoucherSchema
};
