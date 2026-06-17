const db = require('../../../config/db');

const allowedTransitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed'],
  completed: [],
  cancelled: []
};

async function getOrderItems(orderId) {
  return db.query('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC', [orderId]);
}

async function getOrderById(orderId) {
  const order = await db.queryOne(
    `
      SELECT o.*, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
      LIMIT 1
    `,
    [orderId]
  );
  if (!order) {
    throw { status: 404, message: 'Đơn hàng không tồn tại' };
  }
  return {
    ...order,
    subtotal_amount: Number(order.subtotal_amount || 0),
    shipping_fee: Number(order.shipping_fee || 0),
    total_amount: Number(order.total_amount || 0),
    items: await getOrderItems(order.id)
  };
}

async function listOrders(query = {}) {
  const filters = [];
  const values = [];
  if (query.status) {
    filters.push('o.status = ?');
    values.push(query.status);
  }
  if (query.payment_status) {
    filters.push('o.payment_status = ?');
    values.push(query.payment_status);
  }
  if (query.search) {
    filters.push('(o.order_code LIKE ? OR u.email LIKE ? OR u.full_name LIKE ?)');
    values.push(`%${query.search.trim()}%`, `%${query.search.trim()}%`, `%${query.search.trim()}%`);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  return db.query(
    `
      SELECT
        o.id,
        o.order_code,
        o.status,
        o.payment_status,
        o.payment_method,
        o.total_amount,
        o.receiver_name,
        o.receiver_phone,
        o.created_at,
        u.full_name AS customer_name,
        u.email AS customer_email
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      ${where}
      ORDER BY o.created_at DESC, o.id DESC
      LIMIT 100
    `,
    values
  );
}

async function restoreInventoryForCancelledOrder(connection, orderId, userId) {
  const [items] = await connection.execute('SELECT variant_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
  for (const item of items) {
    await connection.execute(
      'UPDATE product_variants SET stock_quantity = stock_quantity + ?, updated_at = NOW() WHERE id = ?',
      [Number(item.quantity), item.variant_id]
    );
    await connection.execute(
      `
        INSERT INTO inventory_movements (variant_id, type, quantity, reference_type, reference_id, note, created_by)
        VALUES (?, 'in', ?, 'order_cancel', ?, ?, ?)
      `,
      [item.variant_id, Number(item.quantity), orderId, 'Hoàn kho do admin hủy đơn', userId]
    );
  }
}

async function increaseSoldCountForCompletedOrder(connection, orderId) {
  const [items] = await connection.execute('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [orderId]);
  for (const item of items) {
    await connection.execute(
      'UPDATE products SET sold_count = sold_count + ?, updated_at = NOW() WHERE id = ?',
      [Number(item.quantity), item.product_id]
    );
  }
}

async function updateStatus(orderId, nextStatus, userId) {
  const order = await getOrderById(orderId);
  const current = order.status;
  if (current === nextStatus) {
    return order;
  }
  if (!allowedTransitions[current] || !allowedTransitions[current].includes(nextStatus)) {
    throw { status: 400, message: 'Không thể chuyển đơn hàng sang trạng thái này' };
  }

  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [nextStatus, orderId]);
    if (nextStatus === 'cancelled') {
      await restoreInventoryForCancelledOrder(connection, orderId, userId);
    }
    if (nextStatus === 'completed') {
      await increaseSoldCountForCompletedOrder(connection, orderId);
    }
    await connection.commit();
    return getOrderById(orderId);
  } catch (err) {
    await connection.rollback();
    throw err.status ? err : { status: 500, message: 'Không thể cập nhật trạng thái đơn hàng' };
  } finally {
    connection.release();
  }
}

async function updatePaymentStatus(orderId, paymentStatus) {
  await getOrderById(orderId);
  await db.query('UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?', [paymentStatus, orderId]);
  await db.query('UPDATE payments SET status = ? WHERE order_id = ?', [paymentStatus, orderId]);
  return getOrderById(orderId);
}

module.exports = {
  listOrders,
  getOrderById,
  updateStatus,
  updatePaymentStatus
};
