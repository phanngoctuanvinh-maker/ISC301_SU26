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
  // 1. Lấy giỏ hàng của user kèm thông tin variant, brand_id, category_slug
  const cartItems = await db.query(
    `SELECT ci.id as cart_id, ci.variant_id, ci.quantity, ci.is_bought_together,
            COALESCE(pv.price, p.price) AS price, pv.discount_price, pv.stock_quantity, pv.color, pv.size,
            p.name as product_name, p.main_image_url, p.brand_id, p.id as product_id, cat.slug as category_slug
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN product_variants pv ON pv.id = ci.variant_id
     JOIN products p ON p.id = pv.product_id
     JOIN categories cat ON cat.id = p.category_id
     WHERE c.user_id = ?`,
    [userId]
  );

  if (cartItems.length === 0) {
    throw { status: 400, message: 'Giỏ hàng của bạn đang trống' };
  }

  // Override price/stock if under active flash sale
  for (const item of cartItems) {
    const flashSale = await db.queryOne(
      `SELECT fsi.flash_price, fsi.flash_quantity, fsi.sold_quantity
       FROM flash_sale_items fsi
       INNER JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
       WHERE fsi.product_id = ?
         AND fs.is_active = 1
         AND fs.start_time <= NOW()
         AND fs.end_time >= NOW()
         AND fsi.sold_quantity < fsi.flash_quantity
       LIMIT 1`,
      [item.product_id]
    );
    if (flashSale) {
      item.price = Number(flashSale.flash_price);
      item.discount_price = null;
      const remaining = flashSale.flash_quantity - flashSale.sold_quantity;
      item.stock_quantity = Math.min(item.stock_quantity, remaining);
    }
  }

  // Map và áp dụng combo discount
  const mappedItems = cartItems.map(item => ({
    ...item,
    price: Number(item.discount_price || item.price)
  }));
  const { applyComboDiscount } = require('../../utils/combo.util');
  const totalComboDiscount = applyComboDiscount(mappedItems);

  // 2. Tính subtotal
  const subtotal = mappedItems.reduce((sum, item) => sum + item.line_total, 0);

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
    items: mappedItems,
    subtotal,
    combo_discount: totalComboDiscount,
    discount_amount: discountAmount,
    shipping_fee: shippingFee,
    total_amount: totalAmount,
    voucher: voucherInfo || null,
    address,
    is_free_shipping: subtotal >= 500000
  };
};

const createOrder = async (userId, body) => {
  // 1. Lấy giỏ hàng kèm thông tin variant, brand_id, category_slug
  const cartItems = await db.query(
    `SELECT ci.id as cart_id, ci.variant_id, ci.quantity, ci.is_bought_together,
            COALESCE(pv.price, p.price) AS price, pv.discount_price, pv.stock_quantity, pv.color, pv.size,
            p.name as product_name, p.main_image_url, p.brand_id, p.id as product_id, cat.slug as category_slug
     FROM cart_items ci
     JOIN carts c ON c.id = ci.cart_id
     JOIN product_variants pv ON pv.id = ci.variant_id
     JOIN products p ON p.id = pv.product_id
     JOIN categories cat ON cat.id = p.category_id
     WHERE c.user_id = ?`,
    [userId]
  );

  if (cartItems.length === 0) {
    throw { status: 400, message: 'Giỏ hàng của bạn đang trống' };
  }

  // Override price/stock if under active flash sale
  for (const item of cartItems) {
    const flashSale = await db.queryOne(
      `SELECT fsi.flash_price, fsi.flash_quantity, fsi.sold_quantity
       FROM flash_sale_items fsi
       INNER JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
       WHERE fsi.product_id = ?
         AND fs.is_active = 1
         AND fs.start_time <= NOW()
         AND fs.end_time >= NOW()
         AND fsi.sold_quantity < fsi.flash_quantity
       LIMIT 1`,
      [item.product_id]
    );
    if (flashSale) {
      item.price = Number(flashSale.flash_price);
      item.discount_price = null;
      const remaining = flashSale.flash_quantity - flashSale.sold_quantity;
      item.stock_quantity = Math.min(item.stock_quantity, remaining);
    }
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

  // Map và áp dụng combo discount
  const mappedItems = cartItems.map(item => ({
    ...item,
    price: Number(item.discount_price || item.price)
  }));
  const { applyComboDiscount } = require('../../utils/combo.util');
  const totalComboDiscount = applyComboDiscount(mappedItems);

  // 4. Tính subtotal
  const subtotal = mappedItems.reduce((sum, item) => sum + item.line_total, 0);

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
    for (const item of mappedItems) {
      const originalItem = cartItems.find(x => x.variant_id === item.variant_id);
      
      const finalUnitPrice = item.price; // Giá sau khi trừ combo discount
      const discountAtPurchase = finalUnitPrice < originalItem.price ? finalUnitPrice : 0;

      // Lock and update flash sale sold quantity if applicable
      const [flashSaleRows] = await connection.execute(
        `SELECT fsi.id, fsi.flash_quantity, fsi.sold_quantity
         FROM flash_sale_items fsi
         INNER JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
         WHERE fsi.product_id = ?
           AND fs.is_active = 1
           AND fs.start_time <= NOW()
           AND fs.end_time >= NOW()
           AND fsi.sold_quantity < fsi.flash_quantity
         LIMIT 1
         FOR UPDATE`,
        [item.product_id]
      );

      if (flashSaleRows.length > 0) {
        const flashItem = flashSaleRows[0];
        const remaining = flashItem.flash_quantity - flashItem.sold_quantity;
        if (item.quantity > remaining) {
          throw {
            status: 400,
            message: `Sản phẩm "${item.product_name}" trong chương trình Flash Sale chỉ còn lại ${remaining} đôi.`
          };
        }

        await connection.execute(
          `UPDATE flash_sale_items SET sold_quantity = sold_quantity + ? WHERE id = ?`,
          [item.quantity, flashItem.id]
        );
      }

      await connection.execute(
        `INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase, discount_at_purchase)
         VALUES (?, ?, ?, ?, ?)`,
        [
          orderId,
          item.variant_id,
          item.quantity,
          originalItem.price,
          discountAtPurchase
        ]
      );
    }

    // Bước C: Tăng used_count voucher (nếu có)
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

    // Bước F: Ghi bản ghi thanh toán vào bảng payments
    await connection.execute(
      `INSERT INTO payments (order_id, method, amount, status)
       VALUES (?, ?, ?, 'pending')`,
      [orderId, body.payment_method, totalAmount]
    );

    await connection.commit();

    // Gửi email xác nhận đơn hàng sau khi commit thành công (đối với phương thức COD)
    const user = await db.queryOne('SELECT full_name, email FROM users WHERE id = ?', [userId]);
    if (body.payment_method === 'cod' && user && user.email) {
      const { transporter } = require('../../config/mail');
      const { orderConfirmationEmailTemplate } = require('../../utils/email.templates');
      
      const orderObj = {
        id: orderId,
        shipping_address: shippingAddress,
        payment_method: body.payment_method,
        payment_status: 'unpaid',
        subtotal,
        discount_amount: discountAmount,
        shipping_fee: shippingFee,
        total_amount: totalAmount
      };
      
      const { subject, html } = orderConfirmationEmailTemplate(user.full_name, orderObj, mappedItems);
      transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: user.email,
        subject,
        html
      }).catch(err => {
        console.error('Lỗi khi gửi email xác nhận đơn hàng (COD):', err);
      });
    }

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
    `SELECT oi.*, pv.color, pv.size, p.name as product_name, p.main_image_url, p.slug as product_slug, p.category_id,
            c.name as category_name, c.slug as category_slug, c.parent_id as category_parent_id,
            pc.name as parent_category_name, pc.slug as parent_category_slug,
            pr.id as review_id, pr.rating as review_rating, pr.comment as review_comment
     FROM order_items oi
     JOIN product_variants pv ON pv.id = oi.variant_id
     JOIN products p ON p.id = pv.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN categories pc ON pc.id = c.parent_id
     LEFT JOIN product_reviews pr ON pr.order_item_id = oi.id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  order.items = items;
  return order;
};

const getAllOrdersForAdmin = async () => {
  return await db.query(
    `SELECT o.*, u.full_name as user_name, u.email as user_email, COUNT(oi.id) as item_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id
     ORDER BY o.created_at DESC`
  );
};

const getAdminOrderDetail = async (orderId) => {
  const order = await db.queryOne(
    `SELECT o.*, u.full_name as user_name, u.email as user_email 
     FROM orders o 
     JOIN users u ON u.id = o.user_id 
     WHERE o.id = ?`, 
    [orderId]
  );
  if (!order) {
    throw { status: 404, message: 'Đơn hàng không tồn tại' };
  }
  const items = await db.query(
    `SELECT oi.*, pv.color, pv.size, p.name as product_name, p.main_image_url, p.category_id,
            c.name as category_name, c.slug as category_slug, c.parent_id as category_parent_id,
            pc.name as parent_category_name, pc.slug as parent_category_slug
     FROM order_items oi
     JOIN product_variants pv ON pv.id = oi.variant_id
     JOIN products p ON p.id = pv.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN categories pc ON pc.id = c.parent_id
     WHERE oi.order_id = ?`,
    [orderId]
  );
  order.items = items;
  return order;
};

const updateOrderStatusByAdmin = async (orderId, newStatus, trackingNumber) => {
  const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!order) {
    throw { status: 404, message: 'Đơn hàng không tồn tại' };
  }

  const oldStatus = order.status;
  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Tự động trừ kho khi chuyển từ 'pending' sang 'confirmed'
    if (newStatus === 'confirmed' && oldStatus === 'pending') {
      const [items] = await connection.execute(
        `SELECT oi.variant_id, oi.quantity, pv.product_id 
         FROM order_items oi
         JOIN product_variants pv ON pv.id = oi.variant_id
         WHERE oi.order_id = ?`,
        [orderId]
      );
      for (const item of items) {
        // Kiểm tra tồn kho trước khi trừ
        const [variantRows] = await connection.execute('SELECT stock_quantity, sku FROM product_variants WHERE id = ?', [item.variant_id]);
        const variant = variantRows[0];
        if (!variant || variant.stock_quantity < item.quantity) {
          throw { 
            status: 400, 
            message: `Mã biến thể SKU ${variant ? variant.sku : 'không xác định'} không đủ hàng để xác nhận đơn` 
          };
        }
        await connection.execute(
          'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
        await connection.execute(
          'UPDATE products SET sold_count = sold_count + ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    // 2. Hoàn trả kho nếu hủy đơn hàng đã 'confirmed', 'shipping', 'delivered'
    if (newStatus === 'cancelled' && ['confirmed', 'shipping', 'delivered'].includes(oldStatus)) {
      const [items] = await connection.execute(
        `SELECT oi.variant_id, oi.quantity, pv.product_id 
         FROM order_items oi
         JOIN product_variants pv ON pv.id = oi.variant_id
         WHERE oi.order_id = ?`,
        [orderId]
      );
      for (const item of items) {
        await connection.execute(
          'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.variant_id]
        );
        await connection.execute(
          'UPDATE products SET sold_count = GREATEST(0, CAST(sold_count AS SIGNED) - ?) WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
    }

    // 3. Cập nhật trạng thái và mã vận đơn
    const updateFields = [];
    const params = [];
    if (newStatus) {
      updateFields.push('status = ?');
      params.push(newStatus);
      
      if (newStatus === 'delivered') {
        updateFields.push('payment_status = ?');
        params.push('paid');
      }
    }
    if (trackingNumber !== undefined) {
      updateFields.push('tracking_number = ?');
      params.push(trackingNumber || null);
    }

    if (updateFields.length > 0) {
      params.push(orderId);
      await connection.execute(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Tự động cập nhật thanh toán thành công khi đơn hàng được giao thành công
    if (newStatus === 'delivered') {
      await connection.execute(
        `UPDATE payments SET status = 'success', paid_at = CURRENT_TIMESTAMP WHERE order_id = ? AND status = 'pending'`,
        [orderId]
      );
    }

    await connection.commit();
    return { message: 'Cập nhật trạng thái đơn hàng thành công' };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const cancelOrderByCustomer = async (orderId, userId) => {
  const order = await db.queryOne('SELECT * FROM orders WHERE id = ? AND user_id = ?', [orderId, userId]);
  if (!order) {
    throw { status: 404, message: 'Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn' };
  }

  if (order.status !== 'pending') {
    throw { status: 400, message: 'Chỉ có thể hủy đơn hàng ở trạng thái Chờ xử lý' };
  }

  await db.query('UPDATE orders SET status = \'cancelled\' WHERE id = ?', [orderId]);
  
  // Cập nhật trạng thái payment sang failed nếu là chưa thanh toán
  await db.query('UPDATE payments SET status = \'failed\' WHERE order_id = ? AND status = \'pending\'', [orderId]);

  return { message: 'Hủy đơn hàng thành công' };
};

module.exports = {
  previewOrder,
  createOrder,
  getUserOrders,
  getOrderDetail,
  getAllOrdersForAdmin,
  getAdminOrderDetail,
  updateOrderStatusByAdmin,
  cancelOrderByCustomer
};
