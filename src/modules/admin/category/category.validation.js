const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.base': 'Tên danh mục phải là chuỗi ký tự',
      'string.empty': 'Tên danh mục không được để trống',
      'string.min': 'Tên danh mục phải từ 2 đến 100 ký tự',
      'string.max': 'Tên danh mục phải từ 2 đến 100 ký tự',
      'any.required': 'Tên danh mục là bắt buộc'
    }),
  parent_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().valid('', 'null'),
    Joi.any().valid(null)
  ).optional().messages({
    'alternatives.match': 'parent_id không hợp lệ',
    'alternatives.types': 'parent_id không hợp lệ',
    'any.only': 'parent_id không hợp lệ',
    'number.base': 'parent_id không hợp lệ',
    'number.integer': 'parent_id không hợp lệ',
    'number.positive': 'parent_id không hợp lệ'
  }),
  sort_order: Joi.alternatives().try(
    Joi.number().integer().min(0),
    Joi.string().regex(/^\d+$/)
  ).default(0).optional().messages({
    'alternatives.match': 'Thứ tự sắp xếp phải là số',
    'alternatives.types': 'Thứ tự sắp xếp phải là số',
    'number.base': 'Thứ tự sắp xếp phải là số',
    'number.integer': 'Thứ tự sắp xếp phải là số nguyên',
    'number.min': 'Thứ tự sắp xếp không được nhỏ hơn 0',
    'string.pattern.base': 'Thứ tự sắp xếp phải là số'
  })
});

const updateCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.base': 'Tên danh mục phải là chuỗi ký tự',
      'string.empty': 'Tên danh mục không được để trống',
      'string.min': 'Tên danh mục phải từ 2 đến 100 ký tự',
      'string.max': 'Tên danh mục phải từ 2 đến 100 ký tự'
    }),
  parent_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().valid('', 'null'),
    Joi.any().valid(null)
  ).optional().messages({
    'alternatives.match': 'parent_id không hợp lệ',
    'alternatives.types': 'parent_id không hợp lệ',
    'any.only': 'parent_id không hợp lệ',
    'number.base': 'parent_id không hợp lệ',
    'number.integer': 'parent_id không hợp lệ',
    'number.positive': 'parent_id không hợp lệ'
  }),
  sort_order: Joi.alternatives().try(
    Joi.number().integer().min(0),
    Joi.string().regex(/^\d+$/)
  ).optional().messages({
    'alternatives.match': 'Thứ tự sắp xếp phải là số',
    'alternatives.types': 'Thứ tự sắp xếp phải là số',
    'number.base': 'Thứ tự sắp xếp phải là số',
    'number.integer': 'Thứ tự sắp xếp phải là số nguyên',
    'number.min': 'Thứ tự sắp xếp không được nhỏ hơn 0',
    'string.pattern.base': 'Thứ tự sắp xếp phải là số'
  })
});

const reorderCategorySchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.number().integer().positive().required().messages({
          'any.required': 'id của danh mục là bắt buộc',
          'number.base': 'id danh mục không hợp lệ'
        }),
        sort_order: Joi.number().integer().min(0).required().messages({
          'any.required': 'Thứ tự sắp xếp là bắt buộc',
          'number.base': 'Thứ tự sắp xếp không hợp lệ'
        })
      })
    )
    .required()
    .messages({
      'array.base': 'Danh sách sắp xếp không hợp lệ',
      'any.required': 'Danh sách sắp xếp không hợp lệ'
    })
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  reorderCategorySchema
};
