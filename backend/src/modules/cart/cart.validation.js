const Joi = require('joi');

const cartItemSchema = Joi.object({
  variant_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Vui lòng chọn size sản phẩm'
  }),
  quantity: Joi.number().integer().min(1).max(99).required().messages({
    'number.min': 'Số lượng phải lớn hơn 0',
    'number.max': 'Số lượng tối đa cho mỗi lần thêm là 99',
    'any.required': 'Vui lòng cung cấp số lượng'
  })
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).max(99).required().messages({
    'number.min': 'Số lượng phải lớn hơn 0',
    'number.max': 'Số lượng tối đa cho mỗi sản phẩm là 99',
    'any.required': 'Vui lòng cung cấp số lượng'
  })
});

module.exports = {
  cartItemSchema,
  updateCartItemSchema
};
