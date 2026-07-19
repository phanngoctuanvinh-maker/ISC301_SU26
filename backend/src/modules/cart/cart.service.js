const db = require('../../config/db');

async function getOrCreateCart(userId) {
  const existing = await db.queryOne('SELECT id, user_id FROM carts WHERE user_id = ? LIMIT 1', [userId]);
  if (existing) return existing;

  const result = await db.query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
  return { id: result.insertId, user_id: userId };
}

async function getVariantForCart(variantId) {
  const variant = await db.queryOne(
    `
      SELECT
        pv.id AS variant_id,
        pv.product_id,
        pv.sku,
        pv.size,
        pv.stock_quantity,
        pv.is_active AS variant_active,
        p.name,
        p.slug,
        p.main_image_url,
        COALESCE(pv.discount_price, pv.price, p.price) AS price,
        p.is_active AS product_active,
        b.name AS brand_name
      FROM product_variants pv
      INNER JOIN products p ON p.id = pv.product_id
      INNER JOIN brands b ON b.id = p.brand_id
      WHERE pv.id = ?
      LIMIT 1
    `,
    [variantId]
  );

  if (!variant || !variant.variant_active || !variant.product_active) {
    throw { status: 404, message: 'Size sản phẩm không tồn tại hoặc đang tạm ẩn' };
  }

  // Override price/stock if under active flash sale
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
    [variant.product_id]
  );

  if (flashSale) {
    variant.price = Number(flashSale.flash_price);
    variant.is_flash_sale = true;
    const remaining = flashSale.flash_quantity - flashSale.sold_quantity;
    variant.stock_quantity = Math.min(variant.stock_quantity, remaining);
  }

  return variant;
}

function mapCartItem(item) {
  const price = Number(item.price || 0);
  const quantity = Number(item.quantity || 0);
  return {
    id: item.id,
    variant_id: item.variant_id,
    product_id: item.product_id,
    name: item.name,
    slug: item.slug,
    brand_name: item.brand_name,
    brand_id: item.brand_id,
    category_slug: item.category_slug,
    main_image_url: item.main_image_url,
    sku: item.sku,
    size: item.size,
    price,
    quantity,
    stock_quantity: Number(item.stock_quantity || 0),
    is_bought_together: item.is_bought_together ? 1 : 0,
    is_flash_sale: item.is_flash_sale ? true : false,
    line_total: price * quantity
  };
}

function buildCartResponse(items) {
  const mappedItems = items.map(mapCartItem);
  return {
    items: mappedItems,
    summary: {
      total_items: mappedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: mappedItems.reduce((sum, item) => sum + item.line_total, 0),
      combo_discount: 0
    }
  };
}

async function getCart(userId) {
  const cart = await getOrCreateCart(userId);
  const rows = await db.query(
    `
      SELECT
        ci.id,
        ci.variant_id,
        ci.quantity,
        ci.is_bought_together,
        pv.product_id,
        pv.sku,
        pv.size,
        pv.stock_quantity,
        p.name,
        p.slug,
        p.main_image_url,
        COALESCE(pv.discount_price, pv.price, p.price) AS price,
        b.name AS brand_name,
        p.brand_id,
        c.slug AS category_slug
      FROM cart_items ci
      INNER JOIN product_variants pv ON pv.id = ci.variant_id
      INNER JOIN products p ON p.id = pv.product_id
      INNER JOIN brands b ON b.id = p.brand_id
      INNER JOIN categories c ON c.id = p.category_id
      WHERE ci.cart_id = ?
      ORDER BY ci.id DESC
    `,
    [cart.id]
  );

  // Apply active flash sale prices and stock limits to cart items
  for (const row of rows) {
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
      [row.product_id]
    );

    if (flashSale) {
      row.price = Number(flashSale.flash_price);
      row.is_flash_sale = true;
      const remaining = flashSale.flash_quantity - flashSale.sold_quantity;
      row.stock_quantity = Math.min(row.stock_quantity, remaining);
    }
  }

  const mappedItems = rows.map(mapCartItem);
  const { applyComboDiscount } = require('../../utils/combo.util');
  const totalComboDiscount = applyComboDiscount(mappedItems);

  return {
    items: mappedItems,
    summary: {
      total_items: mappedItems.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: mappedItems.reduce((sum, item) => sum + item.line_total, 0),
      combo_discount: totalComboDiscount
    }
  };
}

async function addItem(userId, body) {
  const cart = await getOrCreateCart(userId);
  const variant = await getVariantForCart(body.variant_id);
  const requestedQuantity = Number(body.quantity);
  const isBoughtTogether = body.is_bought_together ? 1 : 0;

  const existing = await db.queryOne(
    'SELECT id, quantity, is_bought_together FROM cart_items WHERE cart_id = ? AND variant_id = ? LIMIT 1',
    [cart.id, body.variant_id]
  );
  const nextQuantity = existing ? Number(existing.quantity) + requestedQuantity : requestedQuantity;

  if (nextQuantity > Number(variant.stock_quantity)) {
    throw { status: 400, message: 'Số lượng trong giỏ hàng vượt quá tồn kho hiện có' };
  }

  if (existing) {
    await db.query(
      'UPDATE cart_items SET quantity = ?, is_bought_together = ?, updated_at = NOW() WHERE id = ?', 
      [nextQuantity, isBoughtTogether || existing.is_bought_together, existing.id]
    );
  } else {
    await db.query(
      'INSERT INTO cart_items (cart_id, variant_id, quantity, is_bought_together) VALUES (?, ?, ?, ?)', 
      [cart.id, body.variant_id, requestedQuantity, isBoughtTogether]
    );
  }

  return getCart(userId);
}

async function updateItem(userId, itemId, body) {
  const cart = await getOrCreateCart(userId);
  const item = await db.queryOne(
    'SELECT id, variant_id FROM cart_items WHERE id = ? AND cart_id = ? LIMIT 1',
    [itemId, cart.id]
  );
  if (!item) {
    throw { status: 404, message: 'Sản phẩm trong giỏ hàng không tồn tại' };
  }

  const variant = await getVariantForCart(item.variant_id);
  if (Number(body.quantity) > Number(variant.stock_quantity)) {
    throw { status: 400, message: 'Số lượng trong giỏ hàng vượt quá tồn kho hiện có' };
  }

  await db.query('UPDATE cart_items SET quantity = ?, updated_at = NOW() WHERE id = ?', [Number(body.quantity), itemId]);
  return getCart(userId);
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  await db.query('DELETE FROM cart_items WHERE id = ? AND cart_id = ?', [itemId, cart.id]);
  return getCart(userId);
}

async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);
  await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
  return buildCartResponse([]);
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  getOrCreateCart
};
