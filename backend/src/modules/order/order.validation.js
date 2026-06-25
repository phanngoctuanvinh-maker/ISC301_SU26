const Joi = require('joi');

const createOrderSchema = Joi.object({
  address_id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Vui lòng chọn địa chỉ nhận hàng',
      'number.integer': 'Địa chỉ nhận hàng không hợp lệ',
      'number.positive': 'Địa chỉ nhận hàng không hợp lệ',
      'any.required': 'Vui lòng chọn địa chỉ nhận hàng'
    }),
  payment_method: Joi.string()
    .valid('cod', 'vnpay', 'momo', 'vietqr')
    .required()
    .messages({
      'any.only': 'Phương thức thanh toán không hợp lệ',
      'any.required': 'Phương thức thanh toán không hợp lệ'
    }),
  voucher_code: Joi.string()
    .trim()
    .allow('', null)
    .optional(),
  note: Joi.string()
    .max(500)
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Ghi chú không được quá 500 ký tự'
    })
});

const previewOrderSchema = Joi.object({
  address_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Địa chỉ nhận hàng không hợp lệ',
      'number.integer': 'Địa chỉ nhận hàng không hợp lệ',
      'number.positive': 'Địa chỉ nhận hàng không hợp lệ'
    }),
  voucher_code: Joi.string()
    .trim()
    .allow('', null)
    .optional()
});

module.exports = {
  createOrderSchema,
  previewOrderSchema
};
