const db = require('../../config/db');
const { getPagination, buildPagination } = require('../../utils/pagination.util');

const sortableFields = {
  newest: 'p.created_at DESC, p.id DESC',
  popular: 'p.sold_count DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id DESC',
  name_asc: 'p.name ASC, p.id ASC',
  name_desc: 'p.name DESC, p.id DESC'
};

function buildProductSelect() {
  return `
    SELECT
      p.id,
      p.category_id,
      p.brand_id,
      p.name,
      p.slug,
      p.description,
      p.main_image_url,
      COALESCE(MIN(CASE WHEN pv.is_active = true THEN pv.price ELSE NULL END), p.price) AS price,
      MIN(CASE WHEN pv.is_active = true THEN pv.discount_price ELSE NULL END) AS discount_price,
      p.gender,
      p.sport_type,
      p.is_active,
      p.is_featured,
      p.sold_count,
      p.created_at,
      p.updated_at,
      c.name AS category_name,
      c.slug AS category_slug,
      b.name AS brand_name,
      b.logo_url AS brand_logo_url,
      COALESCE(SUM(CASE WHEN pv.is_active = true THEN pv.stock_quantity ELSE 0 END), 0) AS total_stock
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    INNER JOIN brands b ON b.id = p.brand_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
  `;
}

function addFilter(filters, values, condition, value) {
  filters.push(condition);
  values.push(value);
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildPublicFilters(query) {
  const filters = ['p.is_active = true', 'c.is_active = true', 'b.is_active = true'];
  const values = [];

  if (query.search) {
    addFilter(filters, values, '(p.name LIKE ? OR p.description LIKE ?)', `%${query.search.trim()}%`);
    values.push(`%${query.search.trim()}%`);
  }

  if (query.category_id) {
    const categoryId = parsePositiveInt(query.category_id);
    if (categoryId) {
      addFilter(filters, values, '(p.category_id = ? OR c.parent_id = ?)', categoryId);
      values.push(categoryId);
    }
  }

  if (query.category_slug) {
    addFilter(filters, values, '(c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ? LIMIT 1))', query.category_slug.trim());
    values.push(query.category_slug.trim());
  }

  if (query.brand_id) {
    const brandId = parsePositiveInt(query.brand_id);
    if (brandId) {
      addFilter(filters, values, 'p.brand_id = ?', brandId);
    }
  }

  if (query.brand_name) {
    addFilter(filters, values, 'b.name = ?', query.brand_name.trim());
  }

  if (query.gender) {
    addFilter(filters, values, 'p.gender = ?', query.gender);
  }

  if (query.sport_type) {
    addFilter(filters, values, 'p.sport_type = ?', query.sport_type);
  }

  if (query.featured !== undefined || query.is_featured !== undefined) {
    const rawFeatured = query.featured !== undefined ? query.featured : query.is_featured;
    const isFeatured = rawFeatured === true || rawFeatured === 'true' || rawFeatured === '1' ? 1 : 0;
    addFilter(filters, values, 'p.is_featured = ?', isFeatured);
  }

  return { where: filters.join(' AND '), values };
}

async function getProductVariants(productId) {
  return db.query(
    `
      SELECT id, product_id, sku, size, stock_quantity, low_stock_threshold, is_active
      FROM product_variants
      WHERE product_id = ? AND is_active = true
      ORDER BY CAST(size AS DECIMAL(4,1)) ASC, size ASC, id ASC
    `,
    [productId]
  );
}

async function attachVariants(product) {
  const variants = await getProductVariants(product.id);
  return {
    ...product,
    price: Number(product.price || 0),
    discount_price: product.discount_price !== null ? Number(product.discount_price) : null,
    total_stock: Number(product.total_stock || 0),
    available_sizes: variants.filter(item => Number(item.stock_quantity) > 0).map(item => item.size),
    variants
  };
}

async function listPublicProducts(query) {
  const { page, limit, offset } = getPagination(query);
  const { where, values } = buildPublicFilters(query);
  const orderBy = sortableFields[query.sort] || sortableFields.newest;

  const countRows = await db.query(
    `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN brands b ON b.id = p.brand_id
      WHERE ${where}
    `,
    values
  );

  const products = await db.query(
    `
      ${buildProductSelect()}
      WHERE ${where}
      GROUP BY p.id, c.id, b.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `,
    [...values, limit, offset]
  );

  const total = countRows[0] ? countRows[0].total : 0;
  return {
    items: products.map(product => ({
      ...product,
      price: Number(product.price || 0),
      discount_price: product.discount_price !== null ? Number(product.discount_price) : null,
      total_stock: Number(product.total_stock || 0)
    })),
    pagination: buildPagination(page, limit, total)
  };
}

async function getPublicProductBySlug(slug) {
  const product = await db.queryOne(
    `
      ${buildProductSelect()}
      WHERE p.slug = ? AND p.is_active = true AND c.is_active = true AND b.is_active = true
      GROUP BY p.id, c.id, b.id
      LIMIT 1
    `,
    [slug]
  );

  if (!product) {
    throw { status: 404, message: 'Sản phẩm không tồn tại' };
  }

  return attachVariants(product);
}

module.exports = {
  listPublicProducts,
  getPublicProductBySlug,
  getProductVariants
};
