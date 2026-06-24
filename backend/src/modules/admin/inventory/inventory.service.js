const db = require('../../../config/db');

async function listInventory(query = {}) {
  const filters = [];
  const values = [];

  if (query.search) {
    filters.push('(p.name LIKE ? OR pv.sku LIKE ?)');
    values.push(`%${query.search.trim()}%`, `%${query.search.trim()}%`);
  }
  if (query.low_stock === 'true' || query.low_stock === '1') {
    filters.push('pv.stock_quantity <= pv.low_stock_threshold');
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  return db.query(
    `
      SELECT
        pv.id,
        pv.product_id,
        p.name AS product_name,
        p.slug,
        p.main_image_url,
        p.price,
        b.name AS brand_name,
        pv.sku,
        pv.size,
        pv.stock_quantity,
        pv.low_stock_threshold,
        pv.is_active,
        pv.updated_at
      FROM product_variants pv
      INNER JOIN products p ON p.id = pv.product_id
      INNER JOIN brands b ON b.id = p.brand_id
      ${where}
      ORDER BY p.name ASC, CAST(pv.size AS DECIMAL(4,1)) ASC, pv.size ASC
      LIMIT 200
    `,
    values
  );
}

async function adjustInventory(body, userId) {
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      'SELECT id, stock_quantity FROM product_variants WHERE id = ? FOR UPDATE',
      [body.variant_id]
    );
    if (!rows.length) {
      throw { status: 404, message: 'Size sản phẩm không tồn tại' };
    }

    const current = Number(rows[0].stock_quantity || 0);
    const quantity = Number(body.quantity);
    let nextStock = current;
    if (body.type === 'in') {
      nextStock = current + quantity;
    } else if (body.type === 'out') {
      nextStock = current - quantity;
    } else {
      nextStock = quantity;
    }

    if (nextStock < 0) {
      throw { status: 400, message: 'Tồn kho không được âm' };
    }

    await connection.execute(
      'UPDATE product_variants SET stock_quantity = ?, updated_at = NOW() WHERE id = ?',
      [nextStock, body.variant_id]
    );

    const movementQuantity = body.type === 'adjustment' ? Math.abs(nextStock - current) : quantity;
    const movementType = body.type === 'adjustment'
      ? (nextStock >= current ? 'in' : 'out')
      : body.type;

    if (movementQuantity > 0) {
      await connection.execute(
        `
          INSERT INTO inventory_movements (variant_id, type, quantity, reference_type, note, created_by)
          VALUES (?, ?, ?, 'manual_adjustment', ?, ?)
        `,
        [body.variant_id, movementType, movementQuantity, body.note || 'Điều chỉnh tồn kho thủ công', userId]
      );
    }

    await connection.commit();
    const inventory = await db.queryOne(
      `
        SELECT
          pv.id,
          pv.product_id,
          p.name AS product_name,
          pv.sku,
          pv.size,
          pv.stock_quantity,
          pv.low_stock_threshold,
          pv.is_active
        FROM product_variants pv
        INNER JOIN products p ON p.id = pv.product_id
        WHERE pv.id = ?
      `,
      [body.variant_id]
    );
    return inventory;
  } catch (err) {
    await connection.rollback();
    throw err.status ? err : { status: 500, message: 'Không thể điều chỉnh tồn kho' };
  } finally {
    connection.release();
  }
}

module.exports = {
  listInventory,
  adjustInventory
};
