const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.base': 'Tên sản phẩm phải là chuỗi ký tự',
      'string.empty': 'Tên sản phẩm không được để trống',
      'string.min': 'Tên sản phẩm phải từ 3 đến 255 ký tự',
      'string.max': 'Tên sản phẩm phải từ 3 đến 255 ký tự',
      'any.required': 'Tên sản phẩm là bắt buộc'
    }),
  price: Joi.alternatives().try(
    Joi.number().min(0),
    Joi.string().regex(/^\d+(\.\d+)?$/)
  )
    .optional()
    .default(0)
    .messages({
      'alternatives.types': 'Giá sản phẩm phải là số',
      'alternatives.match': 'Giá sản phẩm phải là số'
    }),
  description: Joi.string()
    .max(5000)
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Mô tả sản phẩm phải là chuỗi ký tự',
      'string.max': 'Mô tả sản phẩm tối đa 5000 ký tự'
    }),
  category_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().regex(/^\d+$/)
  )
    .required()
    .messages({
      'any.required': 'Vui lòng chọn danh mục',
      'alternatives.types': 'Vui lòng chọn danh mục hợp lệ',
      'alternatives.match': 'Vui lòng chọn danh mục hợp lệ'
    }),
  brand_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().regex(/^\d+$/)
  )
    .required()
    .messages({
      'any.required': 'Vui lòng chọn thương hiệu',
      'alternatives.types': 'Vui lòng chọn thương hiệu hợp lệ',
      'alternatives.match': 'Vui lòng chọn thương hiệu hợp lệ'
    }),
  gender: Joi.string()
    .valid('male', 'female', 'unisex', '', null)
    .optional()
    .messages({
      'any.only': 'Giới tính không hợp lệ'
    }),
  sport_type: Joi.string()
    .max(50)
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Loại thể thao phải là chuỗi ký tự',
      'string.max': 'Loại thể thao tối đa 50 ký tự'
    }),
  is_featured: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false')
  )
    .optional()
    .default(false)
});

const updateProductSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(255)
    .trim()
    .optional()
    .messages({
      'string.base': 'Tên sản phẩm phải là chuỗi ký tự',
      'string.empty': 'Tên sản phẩm không được để trống',
      'string.min': 'Tên sản phẩm phải từ 3 đến 255 ký tự',
      'string.max': 'Tên sản phẩm phải từ 3 đến 255 ký tự'
    }),
  price: Joi.alternatives().try(
    Joi.number().min(0),
    Joi.string().regex(/^\d+(\.\d+)?$/)
  )
    .optional()
    .messages({
      'alternatives.types': 'Giá sản phẩm phải là số',
      'alternatives.match': 'Giá sản phẩm phải là số'
    }),
  description: Joi.string()
    .max(5000)
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Mô tả sản phẩm phải là chuỗi ký tự',
      'string.max': 'Mô tả sản phẩm tối đa 5000 ký tự'
    }),
  category_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().regex(/^\d+$/)
  )
    .optional()
    .messages({
      'alternatives.types': 'Vui lòng chọn danh mục hợp lệ',
      'alternatives.match': 'Vui lòng chọn danh mục hợp lệ'
    }),
  brand_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().regex(/^\d+$/)
  )
    .optional()
    .messages({
      'alternatives.types': 'Vui lòng chọn thương hiệu hợp lệ',
      'alternatives.match': 'Vui lòng chọn thương hiệu hợp lệ'
    }),
  gender: Joi.string()
    .valid('male', 'female', 'unisex', '', null)
    .optional()
    .messages({
      'any.only': 'Giới tính không hợp lệ'
    }),
  sport_type: Joi.string()
    .max(50)
    .allow('', null)
    .optional()
    .messages({
      'string.base': 'Loại thể thao phải là chuỗi ký tự',
      'string.max': 'Loại thể thao tối đa 50 ký tự'
    }),
  is_featured: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid('true', 'false')
  )
    .optional()
}).min(0);

const deleteImageSchema = Joi.object({
  image_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().regex(/^\d+$/)
  )
    .required()
    .messages({
      'any.required': 'Vui lòng chỉ định ảnh cần xoá',
      'alternatives.types': 'Vui lòng chỉ định ảnh hợp lệ',
      'alternatives.match': 'Vui lòng chỉ định ảnh hợp lệ'
    })
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  deleteImageSchema
};
