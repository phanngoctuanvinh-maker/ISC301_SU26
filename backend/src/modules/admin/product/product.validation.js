const Joi = require('joi');

const genderSchema = Joi.string().valid('male', 'female', 'unisex').allow(null, '');
const sportTypeSchema = Joi.string().max(50).allow(null, '');

const createProductSchema = Joi.object({
  category_id: Joi.number().integer().positive().required(),
  brand_id: Joi.number().integer().positive().required(),
  name: Joi.string().trim().min(2).max(255).required(),
  description: Joi.string().max(5000).allow(null, ''),
  gender: genderSchema,
  sport_type: sportTypeSchema,
  is_featured: Joi.alternatives().try(
    Joi.boolean(),
    Joi.number().valid(0, 1),
    Joi.string().valid('true', 'false', '0', '1')
  ).optional()
});

const updateProductSchema = Joi.object({
  category_id: Joi.number().integer().positive(),
  brand_id: Joi.number().integer().positive(),
  name: Joi.string().trim().min(2).max(255),
  description: Joi.string().max(5000).allow(null, ''),
  gender: genderSchema,
  sport_type: sportTypeSchema,
  is_featured: Joi.alternatives().try(
    Joi.boolean(),
    Joi.number().valid(0, 1),
    Joi.string().valid('true', 'false', '0', '1')
  ).optional()
}).min(0);

module.exports = {
  createProductSchema,
  updateProductSchema
};
