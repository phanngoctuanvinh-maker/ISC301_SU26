const db = require('../src/config/db');
const productService = require('../src/modules/product/product.service');
const cartService = require('../src/modules/cart/cart.service');
const orderService = require('../src/modules/order/order.service');

async function test() {
  console.log('--- STARTING COMBO DISCOUNT TESTING ---');
  try {
    // 1. Check product details combo field
    console.log('\n1. Fetching product details for Nike Pegasus (slug: "giay-nike-pegasus-42-nam")...');
    const product = await productService.getPublicProductBySlug('giay-nike-pegasus-42-nam');
    console.log('Product brand:', product.brand_name);
    if (product.combo) {
      console.log('Combo found! Details:');
      console.log('- Socks:', product.combo.socks.name, 'Price:', product.combo.socks.price);
      console.log('- Laces:', product.combo.laces.name, 'Price:', product.combo.laces.price);
      console.log('- Original Total:', product.combo.original_total);
      console.log('- Combo Total (15% off):', product.combo.combo_total);
      console.log('- Discount Amount:', product.combo.discount_amount);
    } else {
      console.log('❌ No combo found for product Pegasus!');
    }

    // 2. Setup items in cart for test user
    const userId = 3; // Nguyễn Văn An
    console.log(`\n2. Setting up cart for user ${userId}...`);
    // Clear existing cart
    await cartService.clearCart(userId);

    // Get variant IDs to insert
    // A. Shoe: Nike Pegasus 42 variant
    const shoeVariants = await productService.getProductVariants(product.id);
    const shoeVariantId = shoeVariants[0].id;
    const shoePrice = Number(product.discount_price || product.price);

    // B. Socks: Nike Cushion Socks variant
    const socksVariants = await productService.getProductVariants(product.combo.socks.id);
    const socksVariantId = socksVariants[0].id;
    const socksPrice = Number(product.combo.socks.discount_price || product.combo.socks.price);

    // C. Laces: Reebok Lace variant (fallback since Nike laces don't exist)
    const lacesVariants = await productService.getProductVariants(product.combo.laces.id);
    const lacesVariantId = lacesVariants[0].id;
    const lacesPrice = Number(product.combo.laces.discount_price || product.combo.laces.price);

    console.log(`Adding to cart:\n- Shoe variant ${shoeVariantId} (Price: ${shoePrice})\n- Socks variant ${socksVariantId} (Price: ${socksPrice})\n- Laces variant ${lacesVariantId} (Price: ${lacesPrice})`);
    
    await cartService.addItem(userId, { variant_id: shoeVariantId, quantity: 1 });
    await cartService.addItem(userId, { variant_id: socksVariantId, quantity: 1 });
    await cartService.addItem(userId, { variant_id: lacesVariantId, quantity: 1 });

    // 3. Inspect Cart Response
    console.log('\n3. Fetching cart details...');
    const cart = await cartService.getCart(userId);
    console.log('Cart subtotal returned:', cart.summary.subtotal);
    console.log('Cart combo discount returned:', cart.summary.combo_discount);
    
    const expectedOriginalTotal = shoePrice + socksPrice + lacesPrice;
    const expectedDiscount = Math.round(shoePrice * 0.15) + Math.round(socksPrice * 0.15) + Math.round(lacesPrice * 0.15);
    const expectedSubtotal = expectedOriginalTotal - expectedDiscount;
    
    console.log(`- Expected Original Sum: ${expectedOriginalTotal}`);
    console.log(`- Expected 15% Combo Discount Sum: ${expectedDiscount}`);
    console.log(`- Expected Net Subtotal: ${expectedSubtotal}`);
    
    if (cart.summary.subtotal === expectedSubtotal && cart.summary.combo_discount === expectedDiscount) {
      console.log('✅ Cart combo calculations match expectations perfectly!');
    } else {
      console.log('❌ Cart combo calculation mismatch!');
    }

    // 4. Test Checkout Preview Order
    console.log('\n4. Testing checkout preview...');
    const preview = await orderService.previewOrder(userId, { address_id: 1 });
    console.log('- Preview subtotal:', preview.subtotal);
    console.log('- Preview combo_discount:', preview.combo_discount);
    console.log('- Preview total_amount:', preview.total_amount);
    if (preview.subtotal === expectedSubtotal && preview.combo_discount === expectedDiscount) {
      console.log('✅ Checkout preview calculations match expectations perfectly!');
    } else {
      console.log('❌ Checkout preview mismatch!');
    }

    // 5. Test Order Creation
    console.log('\n5. Creating test order...');
    const orderResult = await orderService.createOrder(userId, {
      address_id: 1,
      payment_method: 'cod',
      note: 'Test combo order'
    });
    console.log('Created Order ID:', orderResult.order_id);
    console.log('Order Total Amount:', orderResult.total_amount);

    // Retrieve order items from database to check price and discount saved
    const orderItems = await db.query('SELECT * FROM order_items WHERE order_id = ?', [orderResult.order_id]);
    console.log('\n6. Checking saved order items in database:');
    for (const item of orderItems) {
      console.log(`- Variant ${item.variant_id}: Qty ${item.quantity}, Price ${item.price_at_purchase}, Discount price saved ${item.discount_at_purchase}`);
      
      let expectedFinalPrice = 0;
      if (item.variant_id === shoeVariantId) expectedFinalPrice = Math.round(shoePrice * 0.85);
      else if (item.variant_id === socksVariantId) expectedFinalPrice = Math.round(socksPrice * 0.85);
      else if (item.variant_id === lacesVariantId) expectedFinalPrice = Math.round(lacesPrice * 0.85);

      if (Number(item.discount_at_purchase) === expectedFinalPrice) {
        console.log(`  ✅ Price matches expected combo discounted price (${expectedFinalPrice})!`);
      } else {
        console.log(`  ❌ Price mismatch! Expected: ${expectedFinalPrice}, Saved: ${item.discount_at_purchase}`);
      }
    }

  } catch (err) {
    console.error('❌ Test failed with error:', err);
  } finally {
    await db.pool.end();
    console.log('\n--- COMBO DISCOUNT TESTING COMPLETED ---');
  }
}

test();
