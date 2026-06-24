const Joi = require('joi');

const adjustmentSchema = Joi.object({
  variant_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Vui lòng chọn size sản phẩm'
  }),
  type: Joi.string().valid('in', 'out', 'adjustment').required().messages({
    'any.only': 'Loại điều chỉnh tồn kho không hợp lệ',
    'any.required': 'Vui lòng chọn loại điều chỉnh tồn kho'
  }),
  quantity: Joi.number().integer().min(0).required().messages({
    'number.min': 'Số lượng không được âm',
    'any.required': 'Vui lòng cung cấp số lượng'
  }),
  note: Joi.string().max(500).allow(null, '')
});

module.exports = {
  adjustmentSchema
};
