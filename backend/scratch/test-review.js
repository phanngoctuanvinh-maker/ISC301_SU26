const db = require('../src/config/db');
const reviewService = require('../src/modules/review/review.service');

async function runTests() {
  console.log('--- STARTING PRODUCT REVIEW SERVICE TESTS ---');
  try {
    // 1. Fetch a customer and a product variant
    const user = await db.queryOne("SELECT id, email FROM users WHERE role = 'customer' LIMIT 1");
    if (!user) throw new Error('No customer found in DB to test with.');
    console.log(`Using customer: ${user.email} (ID: ${user.id})`);

    const variant = await db.queryOne("SELECT id, product_id FROM product_variants WHERE is_active = true LIMIT 1");
    if (!variant) throw new Error('No product variant found in DB to test with.');
    console.log(`Using variant: ID ${variant.id}, Product ID: ${variant.product_id}`);

    // 2. Create a test order with status 'pending' to verify that reviews fail
    console.log('\nTest Case 1: Submitting review on pending order (Should fail)...');
    const pendingOrderResult = await db.query(
      `INSERT INTO orders (user_id, shipping_address, subtotal, discount_amount, shipping_fee, total_amount, status, payment_method, payment_status)
       VALUES (?, 'Test Address', 100000, 0, 20000, 120000, 'pending', 'cod', 'unpaid')`,
      [user.id]
    );
    const pendingOrderId = pendingOrderResult.insertId;

    const pendingOrderItemResult = await db.query(
      `INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase, discount_at_purchase)
       VALUES (?, ?, 1, 100000, 0)`,
      [pendingOrderId, variant.id]
    );
    const pendingOrderItemId = pendingOrderItemResult.insertId;

    try {
      await reviewService.createReview(user.id, {
        order_item_id: pendingOrderItemId,
        rating: 5,
        comment: 'Great product!'
      });
      console.error('FAIL: Review submission succeeded on a pending order!');
    } catch (err) {
      console.log('SUCCESS (Expected failure):', err.message);
    }

    // Clean up pending order
    await db.query('DELETE FROM order_items WHERE id = ?', [pendingOrderItemId]);
    await db.query('DELETE FROM orders WHERE id = ?', [pendingOrderId]);

    // 3. Create a test order with status 'delivered' to verify that reviews succeed
    console.log('\nTest Case 2: Submitting review on delivered order (Should succeed)...');
    const deliveredOrderResult = await db.query(
      `INSERT INTO orders (user_id, shipping_address, subtotal, discount_amount, shipping_fee, total_amount, status, payment_method, payment_status)
       VALUES (?, 'Test Address', 100000, 0, 20000, 120000, 'delivered', 'cod', 'paid')`,
      [user.id]
    );
    const deliveredOrderId = deliveredOrderResult.insertId;

    const deliveredOrderItemResult = await db.query(
      `INSERT INTO order_items (order_id, variant_id, quantity, price_at_purchase, discount_at_purchase)
       VALUES (?, ?, 1, 100000, 0)`,
      [deliveredOrderId, variant.id]
    );
    const deliveredOrderItemId = deliveredOrderItemResult.insertId;

    const review = await reviewService.createReview(user.id, {
      order_item_id: deliveredOrderItemId,
      rating: 4,
      comment: 'Very nice shoes! Fit perfectly.'
    });
    console.log('SUCCESS: Review created successfully:', review);

    // 4. Try to submit a duplicate review (Should fail)
    console.log('\nTest Case 3: Submitting duplicate review (Should fail)...');
    try {
      await reviewService.createReview(user.id, {
        order_item_id: deliveredOrderItemId,
        rating: 3,
        comment: 'Try to submit again.'
      });
      console.error('FAIL: Duplicate review submission succeeded!');
    } catch (err) {
      console.log('SUCCESS (Expected failure):', err.message);
    }

    // 5. Test stats update
    console.log('\nTest Case 4: Checking product review statistics...');
    const stats = await reviewService.getProductReviewStats(variant.product_id);
    console.log('Stats:', stats);
    if (stats.count > 0 && stats.average === 4) {
      console.log('SUCCESS: Statistics are correct.');
    } else {
      console.error('FAIL: Statistics mismatch.');
    }

    // 6. Test getting reviews list
    console.log('\nTest Case 5: Fetching product reviews list...');
    const reviewsList = await reviewService.getProductReviews(variant.product_id);
    console.log(`Fetched ${reviewsList.length} reviews. First review:`, reviewsList[0]);

    // Clean up delivered order and review
    console.log('\nCleaning up database changes...');
    await db.query('DELETE FROM product_reviews WHERE order_item_id = ?', [deliveredOrderItemId]);
    await db.query('DELETE FROM order_items WHERE id = ?', [deliveredOrderItemId]);
    await db.query('DELETE FROM orders WHERE id = ?', [deliveredOrderId]);
    console.log('Cleaned up successfully.');

  } catch (error) {
    console.error('Test suite failed with error:', error);
  } finally {
    await db.pool.end();
  }
}

runTests();
