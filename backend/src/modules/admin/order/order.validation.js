const Joi = require('joi');

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'shipping', 'completed', 'cancelled').required().messages({
    'any.only': 'Trạng thái đơn hàng không hợp lệ',
    'any.required': 'Vui lòng cung cấp trạng thái đơn hàng'
  })
});

const updatePaymentStatusSchema = Joi.object({
  payment_status: Joi.string().valid('unpaid', 'pending', 'paid', 'failed', 'refunded').required().messages({
    'any.only': 'Trạng thái thanh toán không hợp lệ',
    'any.required': 'Vui lòng cung cấp trạng thái thanh toán'
  })
});

module.exports = {
  updateOrderStatusSchema,
  updatePaymentStatusSchema
};
