const querystring = require('querystring');
const db = require('../../config/db');
const { createSecureHash, formatVnpayDate, verifySecureHash } = require('../../utils/vnpay.util');

const ORDER_STATUS = {
  PENDING: 'pending',
  CANCELLED: 'cancelled'
};

function mapOrder(row, items = []) {
  return {
    ...row,
    subtotal_amount: Number(row.subtotal_amount || 0),
    shipping_fee: Number(row.shipping_fee || 0),
    total_amount: Number(row.total_amount || 0),
    items
  };
}

function createOrderCode(orderId) {
  return `ORD${String(orderId).padStart(8, '0')}`;
}

function getVnpayConfig() {
  return {
    tmnCode: process.env.VNPAY_TMN_CODE || process.env.VNP_TMNCODE,
    secret: process.env.VNPAY_HASH_SECRET || process.env.VNP_HASH_SECRET,
    payUrl: process.env.VNPAY_PAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:8080/api/orders/vnpay/return'
  };
}

function createVnpayPaymentUrl(order, req) {
  const config = getVnpayConfig();
  if (!config.tmnCode || !config.secret) {
    return null;
  }

  const now = new Date();
  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: Math.round(Number(order.total_amount) * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: order.order_code,
    vnp_OrderInfo: `Thanh toan don hang ${order.order_code}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: req.ip || '127.0.0.1',
    vnp_CreateDate: formatVnpayDate(now)
  };
  params.vnp_SecureHash = createSecureHash(params, config.secret);
  return `${config.payUrl}?${querystring.stringify(params)}`;
}

async function getOrderItems(orderId) {
  return db.query(
    `
      SELECT
        id,
        order_id,
        product_id,
        variant_id,
        product_name,
        sku,
        size,
        image_url,
        unit_price,
        quantity,
        line_total
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
    `,
    [orderId]
  );
}

async function getOrderById(orderId, userId = null) {
  const params = [orderId];
  let ownerFilter = '';
  if (userId) {
    ownerFilter = 'AND user_id = ?';
    params.push(userId);
  }

  const order = await db.queryOne(
    `
      SELECT *
      FROM orders
      WHERE id = ? ${ownerFilter}
      LIMIT 1
    `,
    params
  );
  if (!order) {
    throw { status: 404, message: 'Đơn hàng không tồn tại' };
  }

  return mapOrder(order, await getOrderItems(order.id));
}

async function checkout(userId, body, req) {
  const paymentMethod = body.payment_method || 'cod';
  const connection = await db.pool.getConnection();

  try {
    await connection.beginTransaction();

    const [addressRows] = await connection.execute(
      'SELECT * FROM addresses WHERE id = ? AND user_id = ? LIMIT 1',
      [body.address_id, userId]
    );
    if (!addressRows.length) {
      throw { status: 404, message: 'Địa chỉ giao hàng không tồn tại' };
    }
    const address = addressRows[0];

    const [cartRows] = await connection.execute('SELECT id FROM carts WHERE user_id = ? LIMIT 1', [userId]);
    if (!cartRows.length) {
      throw { status: 400, message: 'Giỏ hàng đang trống' };
    }
    const cart = cartRows[0];

    const [items] = await connection.execute(
      `
        SELECT
          ci.id AS cart_item_id,
          ci.quantity,
          pv.id AS variant_id,
          pv.product_id,
          pv.sku,
          pv.size,
          pv.stock_quantity,
          pv.is_active AS variant_active,
          p.name,
          p.main_image_url,
          COALESCE(pv.discount_price, pv.price, p.price) AS price,
          p.is_active AS product_active
        FROM cart_items ci
        INNER JOIN product_variants pv ON pv.id = ci.variant_id
        INNER JOIN products p ON p.id = pv.product_id
        WHERE ci.cart_id = ?
        FOR UPDATE
      `,
      [cart.id]
    );

    if (!items.length) {
      throw { status: 400, message: 'Giỏ hàng đang trống' };
    }

    for (const item of items) {
      if (!item.product_active || !item.variant_active) {
        throw { status: 400, message: `Sản phẩm ${item.name} hiện không thể đặt hàng` };
      }
      if (Number(item.quantity) > Number(item.stock_quantity)) {
        throw { status: 400, message: `Sản phẩm ${item.name} size ${item.size} không đủ tồn kho` };
      }
    }

    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const shippingFee = 0;
    const total = subtotal + shippingFee;

    const [orderResult] = await connection.execute(
      `
        INSERT INTO orders (
          user_id, order_code, status, payment_status, payment_method,
          receiver_name, receiver_phone, shipping_address_line, shipping_ward,
          shipping_district, shipping_city, subtotal_amount, shipping_fee, total_amount, note
        ) VALUES (?, '', 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        paymentMethod === 'cod' ? 'unpaid' : 'pending',
        paymentMethod,
        address.receiver_name,
        address.phone,
        address.address_line,
        address.ward,
        address.district,
        address.city,
        subtotal,
        shippingFee,
        total,
        body.note || null
      ]
    );

    const orderId = orderResult.insertId;
    const orderCode = createOrderCode(orderId);
    await connection.execute('UPDATE orders SET order_code = ? WHERE id = ?', [orderCode, orderId]);

    for (const item of items) {
      const lineTotal = Number(item.price) * Number(item.quantity);
      await connection.execute(
        `
          INSERT INTO order_items (
            order_id, product_id, variant_id, product_name, sku, size, image_url,
            unit_price, quantity, line_total
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          orderId,
          item.product_id,
          item.variant_id,
          item.name,
          item.sku,
          item.size,
          item.main_image_url,
          Number(item.price),
          Number(item.quantity),
          lineTotal
        ]
      );
      await connection.execute(
        'UPDATE product_variants SET stock_quantity = stock_quantity - ?, updated_at = NOW() WHERE id = ?',
        [Number(item.quantity), item.variant_id]
      );
      await connection.execute(
        `
          INSERT INTO inventory_movements (variant_id, type, quantity, reference_type, reference_id, note, created_by)
          VALUES (?, 'out', ?, 'order', ?, ?, ?)
        `,
        [item.variant_id, Number(item.quantity), orderId, `Trừ kho cho đơn hàng ${orderCode}`, userId]
      );
    }

    const [paymentResult] = await connection.execute(
      `
        INSERT INTO payments (order_id, method, status, amount)
        VALUES (?, ?, ?, ?)
      `,
      [orderId, paymentMethod, paymentMethod === 'cod' ? 'unpaid' : 'pending', total]
    );

    await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
    await connection.commit();

    const order = await getOrderById(orderId, userId);
    const paymentUrl = paymentMethod === 'vnpay' ? createVnpayPaymentUrl(order, req) : null;
    return {
      order,
      payment: {
        id: paymentResult.insertId,
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'unpaid' : 'pending',
        payment_url: paymentUrl
      }
    };
  } catch (err) {
    await connection.rollback();
    throw err.status ? err : { status: 500, message: 'Không thể tạo đơn hàng' };
  } finally {
    connection.release();
  }
}

async function listOrders(userId, query = {}) {
  const rows = await db.query(
    `
      SELECT *
      FROM orders
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
      LIMIT 50
    `,
    [userId]
  );
  return rows.map(row => mapOrder(row));
}

async function cancelOrder(userId, orderId) {
  const order = await getOrderById(orderId, userId);
  if (!['pending', 'confirmed'].includes(order.status)) {
    throw { status: 400, message: 'Không thể hủy đơn hàng ở trạng thái hiện tại' };
  }

  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ? AND user_id = ?",
      [orderId, userId]
    );

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
        [item.variant_id, Number(item.quantity), orderId, 'Hoàn kho do khách hủy đơn', userId]
      );
    }

    await connection.commit();
    return getOrderById(orderId, userId);
  } catch (err) {
    await connection.rollback();
    throw err.status ? err : { status: 500, message: 'Không thể hủy đơn hàng' };
  } finally {
    connection.release();
  }
}

async function handleVnpayReturn(query) {
  const config = getVnpayConfig();
  if (!config.secret || !verifySecureHash(query, config.secret)) {
    throw { status: 400, message: 'Chữ ký thanh toán không hợp lệ' };
  }

  const orderCode = query.vnp_TxnRef;
  const responseCode = query.vnp_ResponseCode;
  const transactionNo = query.vnp_TransactionNo || null;
  const status = responseCode === '00' ? 'paid' : 'failed';

  const order = await db.queryOne('SELECT id FROM orders WHERE order_code = ? LIMIT 1', [orderCode]);
  if (!order) {
    throw { status: 404, message: 'Đơn hàng không tồn tại' };
  }

  await db.query(
    `
      UPDATE payments
      SET status = ?, transaction_code = ?, raw_response = ?, paid_at = CASE WHEN ? = 'paid' THEN NOW() ELSE paid_at END
      WHERE order_id = ?
    `,
    [status, transactionNo, JSON.stringify(query), status, order.id]
  );
  await db.query('UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ?', [status, order.id]);

  return getOrderById(order.id);
}

module.exports = {
  ORDER_STATUS,
  checkout,
  listOrders,
  getOrderById,
  cancelOrder,
  handleVnpayReturn
};
