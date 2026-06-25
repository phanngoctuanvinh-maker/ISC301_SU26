const db = require('../../config/db');
const { voucherService } = require('../admin/voucher/voucher.service');

const calculateShippingFee = (city) => {
  if (!city) return 45000;
  const c = city.toLowerCase();
  if (c.includes('hồ chí minh') || c.includes('ho chi minh') ||
      c.includes('hcm') || c.includes('tp.hcm') || c.includes('tphcm')) {
    return 25000;
  }
  if (c.includes('hà nội') || c.includes('ha noi') || c.includes('hanoi')) {
    return 30000;
  }
  return 45000;
};

const previewOrder = async (userId, body) => {
  // 1. Lấy giỏ hàng của user kèm thông tin variant
  const cartItems = await db.query(
    `SELECT ci.id as cart_id, ci.variant_id, ci.quantity,
            COALESCE(pv.price, p.price) AS price, pv.discount_price, pv.stock_quantity, pv.color, pv.size,
            p.name as product_name, p.main_image_url
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN product_variants pv ON pv.id = ci.variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE c.user_id = ?`,
    [userId]
  );

  if (cartItems.length === 0) {
    throw { status: 400, message: 'Giỏ hàng của bạn đang trống' };
  }

  // 2. Tính subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.discount_price || item.price;
    return sum + itemPrice * item.quantity;
  }, 0);
  // 3. Lấy địa chỉ để tính phí ship
  let address = null;
  let shippingFee = 0;
  if (body.address_id) {
    address = await db.queryOne(
      `SELECT * FROM addresses WHERE id = ? AND user_id = ?`,
      [body.address_id, userId]
    );
    if (!address) {
      throw { status: 404, message: 'Địa chỉ không tồn tại' };
    }
    shippingFee = calculateShippingFee(address.city);
  }

  // 4. Tính phí ship
  if (subtotal >= 500000) {
    shippingFee = 0;
  }

  // 5. Tính giảm giá nếu có voucher_code
  let discountAmount = 0;
  let voucherInfo = null;
  if (body.voucher_code) {
    const voucherResult = await voucherService.applyVoucher(body.voucher_code, subtotal);
    discountAmount = voucherResult.discount_amount;
    voucherInfo = voucherResult;
  }

  // 6. Tổng tiền
  const totalAmount = subtotal - discountAmount + shippingFee;

  return {
    items: cartItems,
    subtotal,
    discount_amount: discountAmount,
    shipping_fee: shippingFee,
    total_amount: totalAmount,
    voucher: voucherInfo || null,
    address,
    is_free_shipping: subtotal >= 500000
  };
};

const createOrder = async (userId, body) => {
  // 1. Lấy giỏ hàng kèm thông tin variant
  const cartItems = await db.query(
    `SELECT ci.id as cart_id, ci.variant_id, ci.quantity,
            COALESCE(pv.price, p.price) AS price, pv.discount_price, pv.stock_quantity, pv.color, pv.size,
            p.name as product_name, p.main_image_url
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN product_variants pv ON pv.id = ci.variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE c.user_id = ?`,
    [userId]
  );

  if (cartItems.length === 0) {
    throw { status: 400, message: 'Giỏ hàng của bạn đang trống' };
  }

  // 2. Lấy địa chỉ
  const address = await db.queryOne(
    `SELECT * FROM addresses WHERE id = ? AND user_id = ?`,
    [body.address_id, userId]
  );

  if (!address) {
    throw { status: 404, message: 'Địa chỉ không tồn tại' };
  }

  // 3. Kiểm tra tồn kho từng item
  for (const item of cartItems) {
    if (item.stock_quantity < item.quantity) {
      throw {
        status: 400,
        message: `Sản phẩm "${item.product_name}" (${item.color || ''} - Size ${item.size}) không đủ số lượng. Còn lại: ${item.stock_quantity}`
      };
    }
  }

  // 4. Tính subtotal
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.discount_price || item.price;
    return sum + price * item.quantity;
  }, 0);

  // 5. Tính shipping fee
  let shippingFee = calculateShippingFee(address.city);
  if (subtotal >= 500000) {
    shippingFee = 0;
  }

  // 6. Validate voucher nếu có voucher_code
  let discountAmount = 0;
  let voucherId = null;
  if (body.voucher_code) {
    const voucherResult = await voucherService.applyVoucher(body.voucher_code, subtotal);
    discountAmount = voucherResult.discount_amount;
    voucherId = voucherResult.voucher_id;
  }

  // 7. Tính totalAmount
  const totalAmount = subtotal - discountAmount + shippingFee;

  // 8. Tạo shippingAddress snapshot
  const shippingAddress = [
    address.receiver_name,
    address.phone,
    [address.address_line, address.ward, address.district, address.city].filter(Boolean).join(', ')
  ].join(' | ');

  // 9. Thực hiện trong TRANSACTION
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    // Bước A: INSERT orders
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, voucher_id, address_id, shipping_address,
        subtotal, discount_amount, shipping_fee, total_amount,
        status, payment_method, payment_status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'unpaid', ?)`,
      [
        userId,
        voucherId,
        body.address_id,
        shippingAddress,
        subtotal,
        discountAmount,
        shippingFee,
        totalAmount,
        body.payment_method,
        body.note || null
      ]
    );
    const orderId = orderResult.insertId;

    // Bước B: INSERT order_items
    for (const item of cartItems) {
      await connection.execute(
        `INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase, discount_at_purchase)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.variant_id,
          item.quantity,
          item.price,
          item.discount_price || 0
        ]
      );
    }

    // Bước C: Giảm stock_quantity
    for (const item of cartItems) {
      await connection.execute(
        `UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?`,
        [item.quantity, item.variant_id]
      );
    }

    // Bước D: Tăng used_count voucher (nếu có)
    if (voucherId) {
      await connection.execute(
        `UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?`,
        [voucherId]
      );
    }

    // Bước E: Xoá giỏ hàng
    const [cartRows] = await connection.execute('SELECT id FROM carts WHERE user_id = ? LIMIT 1', [userId]);
    if (cartRows.length) {
      await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [cartRows[0].id]);
    }

    await connection.commit();

    return {
      order_id: orderId,
      total_amount: totalAmount,
      payment_method: body.payment_method
    };

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const getUserOrders = async (userId) => {
  const rows = await db.query(
    `SELECT o.*, COUNT(oi.id) as item_count
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ?
     GROUP BY o.id
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return rows;
};

const getOrderDetail = async (orderId, userId) => {
  const order = await db.queryOne(
    `SELECT * FROM orders WHERE id = ? AND user_id = ?`,
    [orderId, userId]
  );

  if (!order) {
    throw { status: 404, message: 'Đơn hàng không tồn tại' };
  }

  const items = await db.query(
    `SELECT oi.*, pv.color, pv.size, p.name as product_name, p.main_image_url, p.slug as product_slug
     FROM order_items oi
     JOIN product_variants pv ON pv.id = oi.variant_id
     JOIN products p ON p.id = pv.product_id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  order.items = items;
  return order;
};

module.exports = {
  previewOrder,
  createOrder,
  getUserOrders,
  getOrderDetail
};
