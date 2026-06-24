const Joi = require('joi');

const checkoutSchema = Joi.object({
  address_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Vui lòng chọn địa chỉ giao hàng'
  }),
  payment_method: Joi.string().valid('cod', 'vnpay').default('cod'),
  note: Joi.string().max(500).allow(null, '')
});

module.exports = {
  checkoutSchema
};
