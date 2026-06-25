const db = require('../backend/src/config/db');
const orderService = require('../backend/src/modules/order/order.service');

async function runTest() {
  console.log('=== STARTING CHECKOUT INTEGRATION TEST ===');
  const userId = 3; // Nguyễn Văn An

  try {
    // 1. Lấy 2 variant ngẫu nhiên có tồn kho kèm fallback price
    const variants = await db.query(
      `SELECT pv.id, pv.stock_quantity, 
              COALESCE(pv.price, p.price) AS original_price,
              pv.price AS pv_price,
              p.price AS p_price,
              pv.discount_price
       FROM product_variants pv
       JOIN products p ON p.id = pv.product_id
       WHERE pv.stock_quantity >= 10 LIMIT 2`
    );
    if (variants.length < 2) {
      throw new Error('Không đủ variant có tồn kho >= 10 để thực hiện test');
    }
    const var1 = variants[0];
    const var2 = variants[1];
    
    // Tính selling price từng item
    const sellingPrice1 = var1.discount_price || var1.original_price;
    const sellingPrice2 = var2.discount_price || var2.original_price;

    console.log(`- Selected Variant 1 (ID: ${var1.id}): Base Price: ${var1.original_price}, Discount: ${var1.discount_price}, Selling Price: ${sellingPrice1}, Stock: ${var1.stock_quantity}`);
    console.log(`- Selected Variant 2 (ID: ${var2.id}): Base Price: ${var2.original_price}, Discount: ${var2.discount_price}, Selling Price: ${sellingPrice2}, Stock: ${var2.stock_quantity}`);

    const origStock1 = var1.stock_quantity;
    const origStock2 = var2.stock_quantity;

    // 2. Đảm bảo user có cart và làm sạch cart items cũ
    let cart = await db.queryOne('SELECT id FROM carts WHERE user_id = ?', [userId]);
    if (!cart) {
      const insCart = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
      cart = { id: insCart.insertId };
    }
    await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);

    // 3. Thêm các items vào cart
    const qty1 = 2;
    const qty2 = 1;
    await db.query(
      'INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?), (?, ?, ?)',
      [cart.id, var1.id, qty1, cart.id, var2.id, qty2]
    );
    console.log('- Seeded test cart items.');

    // 4. Test previewOrder
    console.log('\n--- Testing previewOrder ---');
    const previewResult = await orderService.previewOrder(userId, {
      address_id: 1,
      voucher_code: 'GIAM50K'
    });

    console.log('Preview Result Summary:');
    console.log(`- Subtotal: ${previewResult.subtotal}`);
    console.log(`- Discount Amount: ${previewResult.discount_amount}`);
    console.log(`- Shipping Fee: ${previewResult.shipping_fee}`);
    console.log(`- Total Amount: ${previewResult.total_amount}`);

    // Verify subtotal
    const expectedSubtotal = Number(sellingPrice1) * qty1 + Number(sellingPrice2) * qty2;
    console.log(`- Expected Subtotal: ${expectedSubtotal}`);
    if (Number(previewResult.subtotal) !== Number(expectedSubtotal)) {
      throw new Error(`Subtotal không khớp: ${previewResult.subtotal} vs ${expectedSubtotal}`);
    }

    // Verify shipping fee (HCM address, subtotal check)
    let expectedShip = 25000;
    if (expectedSubtotal >= 500000) expectedShip = 0;
    console.log(`- Expected Ship Fee: ${expectedShip}`);
    if (previewResult.shipping_fee !== expectedShip) {
      throw new Error(`Shipping fee không khớp: ${previewResult.shipping_fee} vs ${expectedShip}`);
    }

    // Verify discount (GIAM50K gives flat 50000)
    const expectedDiscount = 50000;
    console.log(`- Expected Discount: ${expectedDiscount}`);
    if (previewResult.discount_amount !== expectedDiscount) {
      throw new Error(`Discount amount không khớp: ${previewResult.discount_amount} vs ${expectedDiscount}`);
    }

    // Verify total
    const expectedTotal = expectedSubtotal - expectedDiscount + expectedShip;
    console.log(`- Expected Total: ${expectedTotal}`);
    if (previewResult.total_amount !== expectedTotal) {
      throw new Error(`Total amount không khớp: ${previewResult.total_amount} vs ${expectedTotal}`);
    }
    console.log('✔ previewOrder test passed successfully!');

    // 5. Test createOrder (Transaction)
    console.log('\n--- Testing createOrder (Transaction) ---');
    const orderResult = await orderService.createOrder(userId, {
      address_id: 1,
      payment_method: 'cod',
      voucher_code: 'GIAM50K',
      note: 'Integration Test Note'
    });

    const orderId = orderResult.order_id;
    console.log(`✔ Order placed successfully. Order ID: ${orderId}`);

    // 6. Verify Database states post-order
    console.log('\n--- Verifying database changes ---');

    // A. Check order record
    const order = await db.queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      throw new Error('Không tìm thấy bản ghi order vừa tạo trong DB');
    }
    console.log('✔ Order record exists in DB.');
    console.log(`- Shipping Address snapshot: "${order.shipping_address}"`);
    console.log(`- Subtotal: ${order.subtotal}`);
    console.log(`- Discount: ${order.discount_amount}`);
    console.log(`- Total: ${order.total_amount}`);

    // B. Check order items
    const orderItems = await db.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    if (orderItems.length !== 2) {
      throw new Error(`Số lượng order items không khớp: ${orderItems.length} vs 2`);
    }
    console.log('✔ Order items records exist in DB.');

    // C. Check stocks are reduced
    const updatedVar1 = await db.queryOne('SELECT stock_quantity FROM product_variants WHERE id = ?', [var1.id]);
    const updatedVar2 = await db.queryOne('SELECT stock_quantity FROM product_variants WHERE id = ?', [var2.id]);
    console.log(`- Variant 1 Stock: ${origStock1} -> ${updatedVar1.stock_quantity} (Expected reduction by ${qty1})`);
    console.log(`- Variant 2 Stock: ${origStock2} -> ${updatedVar2.stock_quantity} (Expected reduction by ${qty2})`);

    if (updatedVar1.stock_quantity !== origStock1 - qty1) {
      throw new Error(`Tồn kho Variant 1 giảm sai: ${updatedVar1.stock_quantity} vs ${origStock1 - qty1}`);
    }
    if (updatedVar2.stock_quantity !== origStock2 - qty2) {
      throw new Error(`Tồn kho Variant 2 giảm sai: ${updatedVar2.stock_quantity} vs ${origStock2 - qty2}`);
    }
    console.log('✔ Stocks reduced correctly.');

    // D. Check cart is cleared
    const postCartItems = await db.query('SELECT * FROM cart_items WHERE cart_id = ?', [cart.id]);
    if (postCartItems.length !== 0) {
      throw new Error(`Giỏ hàng không được xóa sạch, số lượng items còn: ${postCartItems.length}`);
    }
    console.log('✔ Cart cleared successfully.');

    // E. Check voucher usage_limit
    const voucher = await db.queryOne("SELECT used_count FROM vouchers WHERE code = 'GIAM50K'");
    console.log(`- Voucher used_count: ${voucher.used_count}`);
    if (voucher.used_count !== 1) {
      throw new Error(`Voucher used_count không tăng: ${voucher.used_count}`);
    }
    console.log('✔ Voucher used_count incremented.');

    // 7. Cleanup test data
    console.log('\n--- Cleaning up test records ---');
    await db.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
    await db.query('DELETE FROM orders WHERE id = ?', [orderId]);
    await db.query('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [origStock1, var1.id]);
    await db.query('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [origStock2, var2.id]);
    await db.query("UPDATE vouchers SET used_count = 0 WHERE code = 'GIAM50K'");
    console.log('✔ Cleanup completed successfully.');

    console.log('\n=======================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! 🚀');
    console.log('=======================================');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
  } finally {
    await db.pool.end();
  }
}

runTest();
