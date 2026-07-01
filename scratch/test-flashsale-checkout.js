const db = require('../backend/src/config/db');
const productService = require('../backend/src/modules/product/product.service');
const cartService = require('../backend/src/modules/cart/cart.service');
const orderService = require('../backend/src/modules/order/order.service');

async function runTests() {
  console.log('=== STARTING AUTOMATED FLASHSALE VERIFICATION ===');
  
  try {
    // 1. Clean up any existing flash sales for clean isolation
    await db.query("DELETE FROM flash_sale_items");
    await db.query("DELETE FROM flash_sales");
    
    // 2. Create a test flash sale session that is ACTIVE right now
    console.log('\nStep 1: Creating active test Flash Sale session...');
    const now = new Date();
    const startTime = new Date(now.getTime() - 5 * 60 * 1000); // 5 mins ago
    const endTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    
    const fsRes = await db.query(
      "INSERT INTO flash_sales (name, start_time, end_time, is_active) VALUES ('TEST_FLASHSALE', ?, ?, 1)",
      [startTime, endTime]
    );
    const flashSaleId = fsRes.insertId;
    
    const productId = 26; // Nike Air Max 90
    const flashPrice = 1500000;
    const flashQuantity = 20;
    
    await db.query(
      "INSERT INTO flash_sale_items (flash_sale_id, product_id, flash_price, flash_quantity, sold_quantity) VALUES (?, ?, ?, ?, 0)",
      [flashSaleId, productId, flashPrice, flashQuantity]
    );
    console.log(`Active Flash Sale created successfully (ID: ${flashSaleId}) with Nike Air Max 90 limit: ${flashQuantity}.`);

    // 3. Test public product detail fetching
    console.log('\nStep 2: Testing product detail query (getPublicProductBySlug)...');
    const product = await productService.getPublicProductBySlug('nike-air-max-90');
    
    console.log(`Product Name: ${product.name}`);
    console.log(`Product Original Price: ${product.price}`);
    console.log(`Product Discount Price: ${product.discount_price}`);
    console.log(`Has Flash Sale attached: ${!!product.flash_sale}`);
    console.log(`Flash Sale Status: ${product.flash_sale?.status}`);
    console.log(`Flash Sale Price: ${product.flash_sale?.flash_price}`);
    
    if (product.discount_price !== flashPrice) {
      throw new Error(`Expected product discount price to be ${flashPrice}, got ${product.discount_price}`);
    }
    console.log('✓ Product pricing successfully updated to flash price!');

    // Check variant stock capping
    const minVariantStock = Math.min(...product.variants.map(v => v.stock_quantity));
    console.log(`Variants stock quantity (should be capped at ${flashQuantity}): ${minVariantStock}`);
    if (minVariantStock > flashQuantity) {
      throw new Error(`Expected variant stock to be capped at ${flashQuantity}, got ${minVariantStock}`);
    }
    console.log('✓ Product variants stock successfully capped at flash sale quantity!');

    // 4. Test Cart pricing
    console.log('\nStep 3: Testing cart item pricing updates...');
    const userId = 3; // Nguyễn Văn An
    
    // Clear cart first
    await cartService.clearCart(userId);
    
    const targetVariant = product.variants[0];
    console.log(`Adding variant SKU: ${targetVariant.sku} (ID: ${targetVariant.id}) to cart...`);
    
    const cartRes = await cartService.addItem(userId, {
      variant_id: targetVariant.id,
      quantity: 2
    });
    
    const addedItem = cartRes.items.find(item => item.variant_id === targetVariant.id);
    console.log(`Cart item price: ${addedItem.price} (Expected: ${flashPrice})`);
    if (Number(addedItem.price) !== flashPrice) {
      throw new Error(`Expected cart item price to be ${flashPrice}, got ${addedItem.price}`);
    }
    console.log('✓ Cart item pricing updated successfully to flash price!');

    // 5. Test Order preview
    console.log('\nStep 4: Testing checkout order preview...');
    const preview = await orderService.previewOrder(userId, { address_id: 1 });
    console.log(`Subtotal: ${preview.subtotal}`);
    console.log(`Total amount: ${preview.total_amount}`);
    
    const expectedSubtotal = flashPrice * 2;
    if (preview.subtotal !== expectedSubtotal) {
      throw new Error(`Expected preview subtotal to be ${expectedSubtotal}, got ${preview.subtotal}`);
    }
    console.log('✓ Checkout order preview calculated successfully using flash price!');

    // 6. Test checkout order creation and realtime sold quantity decrement
    console.log('\nStep 5: Creating order and checking realtime sold quantity...');
    const orderResult = await orderService.createOrder(userId, {
      address_id: 1,
      payment_method: 'cod',
      note: 'Test Flash Sale order'
    });
    
    console.log(`Order created successfully! ID: ${orderResult.order_id}`);
    
    // Query flash sale item to check sold quantity
    const updatedFlashItem = await db.queryOne(
      "SELECT sold_quantity FROM flash_sale_items WHERE flash_sale_id = ? AND product_id = ? LIMIT 1",
      [flashSaleId, productId]
    );
    console.log(`Sold quantity: ${updatedFlashItem.sold_quantity} (Expected: 2)`);
    if (updatedFlashItem.sold_quantity !== 2) {
      throw new Error(`Expected sold quantity to be 2, got ${updatedFlashItem.sold_quantity}`);
    }
    console.log('✓ Flash sale sold quantity successfully incremented in real time!');

    // Clean up
    await db.query("DELETE FROM flash_sales WHERE name = 'TEST_FLASHSALE'");
    // Note: order is saved, but we don't need to delete it since it is COD and is a valid testing order in the DB
    console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! ===');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  } finally {
    await db.pool.end();
  }
}

runTests();
