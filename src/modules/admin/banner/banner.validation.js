const Joi = require('joi');

const idSchema = Joi.alternatives().try(
  Joi.number().integer().positive(),
  Joi.string().pattern(/^\d+$/).custom((val) => parseInt(val, 10))
).allow(null, '');

const createBannerSchema = Joi.object({
  title: Joi.string().max(255).allow(null, '').optional(),
  link_type: Joi.string().valid('category', 'brand', 'voucher', 'url', 'none').required().messages({
    'any.only': 'Loại liên kết không hợp lệ, phải là category, brand, voucher, url hoặc none',
    'any.required': 'Loại liên kết là bắt buộc'
  }),
  link_url: Joi.string().max(500).allow(null, '').optional(),
  category_id: idSchema,
  brand_id: idSchema,
  voucher_id: idSchema,
  start_date: Joi.string().allow(null, '', 'null').optional(),
  end_date: Joi.string().allow(null, '', 'null').optional(),
  sort_order: Joi.alternatives().try(
    Joi.number().integer(),
    Joi.string().pattern(/^-?\d+$/).custom((val) => parseInt(val, 10))
  ).default(0).optional()
}).custom((value, helpers) => {
  const { link_type, link_url, category_id, brand_id, voucher_id, start_date, end_date } = value;

  // Bắt buộc điền thông tin tương ứng với loại liên kết
  if (link_type === 'url' && (!link_url || !link_url.trim())) {
    return helpers.error('any.custom', { message: 'Vui lòng nhập đường dẫn URL khi chọn loại liên kết là url' });
  }
  if (link_type === 'category' && (category_id === null || category_id === '')) {
    return helpers.error('any.custom', { message: 'Vui lòng chọn danh mục khi chọn loại liên kết là category' });
  }
  if (link_type === 'brand' && (brand_id === null || brand_id === '')) {
    return helpers.error('any.custom', { message: 'Vui lòng chọn thương hiệu khi chọn loại liên kết là brand' });
  }
  if (link_type === 'voucher' && (voucher_id === null || voucher_id === '')) {
    return helpers.error('any.custom', { message: 'Vui lòng chọn voucher khi chọn loại liên kết là voucher' });
  }

  // Kiểm tra định dạng URL
  if (link_type === 'url' && link_url) {
    const trimmed = link_url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      return helpers.error('any.custom', { message: 'Đường dẫn URL phải bắt đầu bằng http://, https:// hoặc /' });
    }
  }

  // Kiểm tra ngày bắt đầu / kết thúc
  if (start_date && end_date && start_date !== 'null' && end_date !== 'null' && start_date !== '' && end_date !== '') {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
      return helpers.error('any.custom', { message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }
  }

  return value;
}).messages({
  'any.custom': '{{#message}}'
});

const updateBannerSchema = Joi.object({
  title: Joi.string().max(255).allow(null, '').optional(),
  link_type: Joi.string().valid('category', 'brand', 'voucher', 'url', 'none').optional().messages({
    'any.only': 'Loại liên kết không hợp lệ, phải là category, brand, voucher, url hoặc none'
  }),
  link_url: Joi.string().max(500).allow(null, '').optional(),
  category_id: idSchema,
  brand_id: idSchema,
  voucher_id: idSchema,
  start_date: Joi.string().allow(null, '', 'null').optional(),
  end_date: Joi.string().allow(null, '', 'null').optional(),
  sort_order: Joi.alternatives().try(
    Joi.number().integer(),
    Joi.string().pattern(/^-?\d+$/).custom((val) => parseInt(val, 10))
  ).optional()
}).custom((value, helpers) => {
  const { link_type, link_url, category_id, brand_id, voucher_id, start_date, end_date } = value;

  // Kiểm tra định dạng URL nếu có gửi
  if (link_url) {
    const trimmed = link_url.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      return helpers.error('any.custom', { message: 'Đường dẫn URL phải bắt đầu bằng http://, https:// hoặc /' });
    }
  }

  // Kiểm tra ngày bắt đầu / kết thúc nếu cả hai đều được truyền hoặc có giá trị
  if (start_date && end_date && start_date !== 'null' && end_date !== 'null' && start_date !== '' && end_date !== '') {
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
      return helpers.error('any.custom', { message: 'Ngày kết thúc phải sau ngày bắt đầu' });
    }
  }

  return value;
}).messages({
  'any.custom': '{{#message}}'
});

const reorderBannerSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().required(),
      sort_order: Joi.number().integer().required()
    })
  ).min(1).required()
});

module.exports = {
  createBannerSchema,
  updateBannerSchema,
  reorderBannerSchema
};
