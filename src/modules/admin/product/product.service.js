const db = require('../../../config/db');
const { toSlug } = require('../../../utils/slug.util');
const { getPagination, buildPagination } = require('../../../utils/pagination.util');

function normalizeBoolean(value, fallback = 0) {
  if (value === undefined) return fallback;
  if (value === true || value === 'true' || value === '1' || value === 1) return 1;
  return 0;
}

function normalizeNullableString(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  return String(value).trim();
}

async function ensureCategoryExists(categoryId) {
  const category = await db.queryOne('SELECT id FROM categories WHERE id = ?', [categoryId]);
  if (!category) {
    throw { status: 404, message: 'Danh muc khong ton tai' };
  }
}

async function ensureBrandExists(brandId) {
  const brand = await db.queryOne('SELECT id FROM brands WHERE id = ?', [brandId]);
  if (!brand) {
    throw { status: 404, message: 'Thuong hieu khong ton tai' };
  }
}

async function buildUniqueSlug(name, productId = null) {
  const baseSlug = toSlug(name);
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = productId
      ? await db.queryOne('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, productId])
      : await db.queryOne('SELECT id FROM products WHERE slug = ?', [slug]);

    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function getProductById(id) {
  const product = await db.queryOne(
    `
      SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        b.name AS brand_name
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN brands b ON b.id = p.brand_id
      WHERE p.id = ?
    `,
    [id]
  );

  if (!product) {
    throw { status: 404, message: 'San pham khong ton tai' };
  }

  return product;
}

async function listProducts(query) {
  const { page, limit, offset } = getPagination(query);
  const filters = [];
  const values = [];

  if (query.search) {
    filters.push('(p.name LIKE ? OR p.description LIKE ?)');
    values.push(`%${query.search.trim()}%`, `%${query.search.trim()}%`);
  }
  if (query.category_id) {
    filters.push('p.category_id = ?');
    values.push(Number(query.category_id));
  }
  if (query.brand_id) {
    filters.push('p.brand_id = ?');
    values.push(Number(query.brand_id));
  }
  if (query.is_active !== undefined) {
    filters.push('p.is_active = ?');
    values.push(normalizeBoolean(query.is_active));
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const countRows = await db.query(
    `
      SELECT COUNT(*) AS total
      FROM products p
      ${where}
    `,
    values
  );

  const items = await db.query(
    `
      SELECT
        p.*,
        c.name AS category_name,
        b.name AS brand_name
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN brands b ON b.id = p.brand_id
      ${where}
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ? OFFSET ?
    `,
    [...values, limit, offset]
  );

  const total = countRows[0] ? countRows[0].total : 0;
  return {
    items,
    pagination: buildPagination(page, limit, total)
  };
}

async function createProduct(body, file) {
  await ensureCategoryExists(body.category_id);
  await ensureBrandExists(body.brand_id);

  const name = body.name.trim();
  const slug = await buildUniqueSlug(name);
  const imageUrl = file ? `/uploads/products/${file.filename}` : null;

  const result = await db.query(
    `
      INSERT INTO products (
        category_id, brand_id, name, slug, description, main_image_url,
        gender, sport_type, is_active, is_featured, sold_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, ?, 0)
    `,
    [
      body.category_id,
      body.brand_id,
      name,
      slug,
      normalizeNullableString(body.description),
      imageUrl,
      normalizeNullableString(body.gender),
      normalizeNullableString(body.sport_type),
      normalizeBoolean(body.is_featured)
    ]
  );

  return getProductById(result.insertId);
}

async function updateProduct(id, body, file) {
  const current = await getProductById(id);
  const fields = [];
  const values = [];

  if (body.category_id !== undefined) {
    await ensureCategoryExists(body.category_id);
    fields.push('category_id = ?');
    values.push(body.category_id);
  }

  if (body.brand_id !== undefined) {
    await ensureBrandExists(body.brand_id);
    fields.push('brand_id = ?');
    values.push(body.brand_id);
  }

  if (body.name !== undefined) {
    const name = body.name.trim();
    fields.push('name = ?', 'slug = ?');
    values.push(name, await buildUniqueSlug(name, id));
  }

  if (body.description !== undefined) {
    fields.push('description = ?');
    values.push(normalizeNullableString(body.description));
  }

  if (body.gender !== undefined) {
    fields.push('gender = ?');
    values.push(normalizeNullableString(body.gender));
  }

  if (body.sport_type !== undefined) {
    fields.push('sport_type = ?');
    values.push(normalizeNullableString(body.sport_type));
  }

  if (body.is_featured !== undefined) {
    fields.push('is_featured = ?');
    values.push(normalizeBoolean(body.is_featured));
  }

  if (file) {
    fields.push('main_image_url = ?');
    values.push(`/uploads/products/${file.filename}`);
  }

  if (fields.length === 0) {
    throw { status: 400, message: 'Vui long cung cap thong tin can cap nhat' };
  }

  values.push(id);
  await db.query(`UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
  return getProductById(current.id);
}

async function toggleProductStatus(id) {
  const product = await getProductById(id);
  const newStatus = product.is_active ? 0 : 1;
  await db.query('UPDATE products SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);
  return { id: Number(id), is_active: newStatus };
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleProductStatus
};
