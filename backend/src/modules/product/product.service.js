const db = require('../../config/db');
const { getPagination, buildPagination } = require('../../utils/pagination.util');

const sortableFields = {
  newest: 'p.created_at DESC, p.id DESC',
  popular: 'p.sold_count DESC, p.id DESC',
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
      b.logo_url AS brand_logo_url
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    INNER JOIN brands b ON b.id = p.brand_id
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

  if (query.featured !== undefined) {
    const isFeatured = query.featured === true || query.featured === 'true' || query.featured === '1' ? 1 : 0;
    addFilter(filters, values, 'p.is_featured = ?', isFeatured);
  }

  return { where: filters.join(' AND '), values };
}

async function listPublicProducts(query) {
  const { page, limit, offset } = getPagination(query);
  const { where, values } = buildPublicFilters(query);
  const orderBy = sortableFields[query.sort] || sortableFields.newest;

  const countRows = await db.query(
    `
      SELECT COUNT(*) AS total
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
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `,
    [...values, limit, offset]
  );

  const total = countRows[0] ? countRows[0].total : 0;
  return {
    items: products,
    pagination: buildPagination(page, limit, total)
  };
}

async function getPublicProductBySlug(slug) {
  const product = await db.queryOne(
    `
      ${buildProductSelect()}
      WHERE p.slug = ? AND p.is_active = true AND c.is_active = true AND b.is_active = true
      LIMIT 1
    `,
    [slug]
  );

  if (!product) {
    throw { status: 404, message: 'San pham khong ton tai' };
  }

  return product;
}

module.exports = {
  listPublicProducts,
  getPublicProductBySlug
};
