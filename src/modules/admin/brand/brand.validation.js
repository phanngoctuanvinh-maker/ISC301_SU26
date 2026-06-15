const Joi = require('joi');

const createBrandSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .required()
    .messages({
      'string.base': 'Tên thương hiệu phải là chuỗi ký tự',
      'string.empty': 'Tên thương hiệu không được để trống',
      'string.min': 'Tên thương hiệu phải từ 2 đến 100 ký tự',
      'string.max': 'Tên thương hiệu phải từ 2 đến 100 ký tự',
      'any.required': 'Tên thương hiệu là bắt buộc'
    }),
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.base': 'Mô tả phải là chuỗi ký tự',
      'string.max': 'Mô tả không được vượt quá 1000 ký tự'
    })
});

const updateBrandSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .messages({
      'string.base': 'Tên thương hiệu phải là chuỗi ký tự',
      'string.empty': 'Tên thương hiệu không được để trống',
      'string.min': 'Tên thương hiệu phải từ 2 đến 100 ký tự',
      'string.max': 'Tên thương hiệu phải từ 2 đến 100 ký tự'
    }),
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .messages({
      'string.base': 'Mô tả phải là chuỗi ký tự',
      'string.max': 'Mô tả không được vượt quá 1000 ký tự'
    })
})
  .min(0) // Cho phép body rỗng khi chỉ cập nhật logo mới
  .messages({
    'object.min': 'Vui lòng cung cấp thông tin cần cập nhật'
  });

module.exports = {
  createBrandSchema,
  updateBrandSchema
};
