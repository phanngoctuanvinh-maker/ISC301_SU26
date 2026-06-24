const Joi = require('joi');

const genderSchema = Joi.string().valid('male', 'female', 'unisex').allow(null, '');
const sportTypeSchema = Joi.string().max(50).allow(null, '');
const booleanSchema = Joi.alternatives().try(
  Joi.boolean(),
  Joi.number().valid(0, 1),
  Joi.string().valid('true', 'false', '0', '1')
);

const variantSchema = Joi.object({
  sku: Joi.string().trim().max(100).allow(null, ''),
  size: Joi.string().trim().max(20).required().messages({
    'any.required': 'Vui lòng cung cấp size sản phẩm'
  }),
  stock_quantity: Joi.number().integer().min(0).required().messages({
    'number.min': 'Tồn kho không được âm',
    'any.required': 'Vui lòng cung cấp số lượng tồn kho'
  }),
  low_stock_threshold: Joi.number().integer().min(0).default(5),
  is_active: booleanSchema.optional()
});

const variantsSchema = Joi.alternatives().try(
  Joi.array().items(variantSchema).min(1),
  Joi.string().allow('')
);

const createProductSchema = Joi.object({
  category_id: Joi.number().integer().positive().required(),
  brand_id: Joi.number().integer().positive().required(),
  name: Joi.string().trim().min(2).max(255).required(),
  price: Joi.number().precision(2).min(0).required().messages({
    'any.required': 'Vui lòng cung cấp giá sản phẩm',
    'number.min': 'Giá sản phẩm không được âm'
  }),
  description: Joi.string().max(5000).allow(null, ''),
  gender: genderSchema,
  sport_type: sportTypeSchema,
  is_featured: booleanSchema.optional(),
  variants: variantsSchema.optional()
});

const updateProductSchema = Joi.object({
  category_id: Joi.number().integer().positive(),
  brand_id: Joi.number().integer().positive(),
  name: Joi.string().trim().min(2).max(255),
  price: Joi.number().precision(2).min(0),
  description: Joi.string().max(5000).allow(null, ''),
  gender: genderSchema,
  sport_type: sportTypeSchema,
  is_featured: booleanSchema.optional(),
  variants: variantsSchema.optional()
}).min(1);

const replaceVariantsSchema = Joi.object({
  variants: Joi.array().items(variantSchema).min(1).required()
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  replaceVariantsSchema
};
