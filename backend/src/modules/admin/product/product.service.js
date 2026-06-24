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

function normalizePrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw { status: 400, message: 'Giá sản phẩm không hợp lệ' };
  }
  return price;
}

function parseVariants(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      throw { status: 400, message: 'Danh sách size/tồn kho không đúng định dạng JSON' };
    }
  }
  return [];
}

function buildSku(productId, size, customSku) {
  if (customSku && String(customSku).trim()) {
    return String(customSku).trim();
  }
  return `SP${productId}-SIZE-${String(size).replace(/\s+/g, '-').toUpperCase()}`;
}

async function ensureCategoryExists(categoryId) {
  const category = await db.queryOne('SELECT id FROM categories WHERE id = ?', [categoryId]);
  if (!category) {
    throw { status: 404, message: 'Danh mục không tồn tại' };
  }
}

async function ensureBrandExists(brandId) {
  const brand = await db.queryOne('SELECT id FROM brands WHERE id = ?', [brandId]);
  if (!brand) {
    throw { status: 404, message: 'Thương hiệu không tồn tại' };
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

async function getProductVariants(productId) {
  return db.query(
    `
      SELECT id, product_id, sku, size, stock_quantity, low_stock_threshold, is_active
      FROM product_variants
      WHERE product_id = ?
      ORDER BY CAST(size AS DECIMAL(4,1)) ASC, size ASC, id ASC
    `,
    [productId]
  );
}

async function getProductById(id) {
  const product = await db.queryOne(
    `
      SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug,
        b.name AS brand_name,
        COALESCE(SUM(CASE WHEN pv.is_active = true THEN pv.stock_quantity ELSE 0 END), 0) AS total_stock
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      WHERE p.id = ?
      GROUP BY p.id, c.id, b.id
    `,
    [id]
  );

  if (!product) {
    throw { status: 404, message: 'Sản phẩm không tồn tại' };
  }

  return {
    ...product,
    price: Number(product.price || 0),
    total_stock: Number(product.total_stock || 0),
    variants: await getProductVariants(product.id)
  };
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
        b.name AS brand_name,
        COALESCE(SUM(CASE WHEN pv.is_active = true THEN pv.stock_quantity ELSE 0 END), 0) AS total_stock
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN brands b ON b.id = p.brand_id
      LEFT JOIN product_variants pv ON pv.product_id = p.id
      ${where}
      GROUP BY p.id, c.id, b.id
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT ? OFFSET ?
    `,
    [...values, limit, offset]
  );

  const total = countRows[0] ? countRows[0].total : 0;
  return {
    items: items.map(item => ({
      ...item,
      price: Number(item.price || 0),
      total_stock: Number(item.total_stock || 0)
    })),
    pagination: buildPagination(page, limit, total)
  };
}

async function upsertVariants(connection, productId, variants, createdBy = null) {
  for (const variant of variants) {
    const size = String(variant.size).trim();
    const stockQuantity = Number(variant.stock_quantity || 0);
    const lowStockThreshold = Number(variant.low_stock_threshold ?? 5);
    const isActive = normalizeBoolean(variant.is_active, 1);
    const sku = buildSku(productId, size, variant.sku);

    const [existingRows] = await connection.execute(
      'SELECT id, stock_quantity FROM product_variants WHERE product_id = ? AND size = ? LIMIT 1',
      [productId, size]
    );

    if (existingRows.length) {
      const existing = existingRows[0];
      await connection.execute(
        `
          UPDATE product_variants
          SET sku = ?, stock_quantity = ?, low_stock_threshold = ?, is_active = ?, updated_at = NOW()
          WHERE id = ?
        `,
        [sku, stockQuantity, lowStockThreshold, isActive, existing.id]
      );

      const diff = stockQuantity - Number(existing.stock_quantity || 0);
      if (diff !== 0) {
        await connection.execute(
          `
            INSERT INTO inventory_movements (variant_id, type, quantity, reference_type, note, created_by)
            VALUES (?, ?, ?, 'manual_adjustment', ?, ?)
          `,
          [existing.id, diff > 0 ? 'in' : 'out', Math.abs(diff), 'Cập nhật tồn kho từ quản trị sản phẩm', createdBy]
        );
      }
      continue;
    }

    const [result] = await connection.execute(
      `
        INSERT INTO product_variants (product_id, sku, size, stock_quantity, low_stock_threshold, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      [productId, sku, size, stockQuantity, lowStockThreshold, isActive]
    );

    if (stockQuantity > 0) {
      await connection.execute(
        `
          INSERT INTO inventory_movements (variant_id, type, quantity, reference_type, note, created_by)
          VALUES (?, 'in', ?, 'initial_stock', ?, ?)
        `,
        [result.insertId, stockQuantity, 'Tạo tồn kho ban đầu', createdBy]
      );
    }
  }
}

async function createProduct(body, file, userId = null) {
  await ensureCategoryExists(body.category_id);
  await ensureBrandExists(body.brand_id);

  const name = body.name.trim();
  const slug = await buildUniqueSlug(name);
  const imageUrl = file ? `/uploads/products/${file.filename}` : null;
  const variants = parseVariants(body.variants);

  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `
        INSERT INTO products (
          category_id, brand_id, name, slug, description, main_image_url,
          price, gender, sport_type, is_active, is_featured, sold_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, ?, 0)
      `,
      [
        body.category_id,
        body.brand_id,
        name,
        slug,
        normalizeNullableString(body.description),
        imageUrl,
        normalizePrice(body.price),
        normalizeNullableString(body.gender),
        normalizeNullableString(body.sport_type),
        normalizeBoolean(body.is_featured)
      ]
    );

    if (variants.length) {
      await upsertVariants(connection, result.insertId, variants, userId);
    }

    await connection.commit();
    return getProductById(result.insertId);
  } catch (err) {
    await connection.rollback();
    throw err.status ? err : { status: 500, message: 'Không thể tạo sản phẩm' };
  } finally {
    connection.release();
  }
}

async function updateProduct(id, body, file, userId = null) {
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

  if (body.price !== undefined) {
    fields.push('price = ?');
    values.push(normalizePrice(body.price));
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

  const variants = parseVariants(body.variants);
  if (fields.length === 0 && variants.length === 0) {
    throw { status: 400, message: 'Vui lòng cung cấp thông tin cần cập nhật' };
  }

  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    if (fields.length) {
      values.push(id);
      await connection.execute(`UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`, values);
    }
    if (variants.length) {
      await upsertVariants(connection, Number(id), variants, userId);
    }
    await connection.commit();
    return getProductById(current.id);
  } catch (err) {
    await connection.rollback();
    throw err.status ? err : { status: 500, message: 'Không thể cập nhật sản phẩm' };
  } finally {
    connection.release();
  }
}

async function replaceProductVariants(productId, variants, userId = null) {
  await getProductById(productId);
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    await upsertVariants(connection, Number(productId), variants, userId);
    await connection.commit();
    return getProductById(productId);
  } catch (err) {
    await connection.rollback();
    throw err.status ? err : { status: 500, message: 'Không thể cập nhật size và tồn kho' };
  } finally {
    connection.release();
  }
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
  replaceProductVariants,
  toggleProductStatus
};
