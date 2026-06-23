const Joi = require('joi');

const createVariantSchema = Joi.object({
  color: Joi.string().max(50).allow('', null).optional(),
  size: Joi.string().trim().min(1).max(10).required().messages({
    'string.empty': 'Vui lòng nhập size',
    'any.required': 'Vui lòng nhập size'
  }),
  price: Joi.number().positive().required().messages({
    'number.base': 'Giá bán phải là số dương',
    'number.positive': 'Giá bán phải là số dương',
    'any.required': 'Giá bán là bắt buộc'
  }),
  discount_price: Joi.number().positive().allow(null).optional().messages({
    'number.base': 'Giá khuyến mãi phải là số dương',
    'number.positive': 'Giá khuyến mãi phải là số dương'
  }),
  stock_quantity: Joi.number().integer().min(0).optional().default(0).messages({
    'number.base': 'Số lượng tồn kho phải là số nguyên không âm',
    'number.min': 'Số lượng tồn kho phải là số nguyên không âm'
  }),
  sku: Joi.string().max(100).allow('', null).optional()
}).custom((value, helpers) => {
  if (value.discount_price !== undefined && value.discount_price !== null && value.discount_price >= value.price) {
    return helpers.message('Giá khuyến mãi phải nhỏ hơn giá bán');
  }
  return value;
});

const updateVariantSchema = Joi.object({
  color: Joi.string().max(50).allow('', null).optional(),
  size: Joi.string().trim().min(1).max(10).optional().messages({
    'string.empty': 'Vui lòng nhập size'
  }),
  price: Joi.number().positive().optional().messages({
    'number.base': 'Giá bán phải là số dương',
    'number.positive': 'Giá bán phải là số dương'
  }),
  discount_price: Joi.number().positive().allow(null).optional().messages({
    'number.base': 'Giá khuyến mãi phải là số dương',
    'number.positive': 'Giá khuyến mãi phải là số dương'
  }),
  stock_quantity: Joi.number().integer().min(0).optional().messages({
    'number.base': 'Số lượng tồn kho phải là số nguyên không âm',
    'number.min': 'Số lượng tồn kho phải là số nguyên không âm'
  }),
  sku: Joi.string().max(100).allow('', null).optional()
}).custom((value, helpers) => {
  if (value.discount_price !== undefined && value.discount_price !== null && value.price !== undefined && value.price !== null && value.discount_price >= value.price) {
    return helpers.message('Giá khuyến mãi phải nhỏ hơn giá bán');
  }
  return value;
}).min(1).messages({
  'object.min': 'Vui lòng cung cấp ít nhất 1 thông tin cần cập nhật'
});

const bulkCreateVariantSchema = Joi.object({
  variants: Joi.array().items(createVariantSchema).min(1).required().messages({
    'array.base': 'Danh sách biến thể không hợp lệ',
    'array.min': 'Danh sách biến thể không hợp lệ',
    'any.required': 'Danh sách biến thể không hợp lệ'
  })
});

const updateStockSchema = Joi.object({
  stock_quantity: Joi.number().integer().min(0).required().messages({
    'number.base': 'Số lượng tồn kho phải là số nguyên không âm',
    'number.min': 'Số lượng tồn kho phải là số nguyên không âm',
    'any.required': 'Số lượng tồn kho phải là số nguyên không âm'
  })
});

module.exports = {
  createVariantSchema,
  updateVariantSchema,
  bulkCreateVariantSchema,
  updateStockSchema
};
