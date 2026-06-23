const db = require('../../../config/db');

const variantService = {
  /**
   * Lấy chi tiết biến thể theo ID
   * @param {number} variantId
   * @returns {Promise<Object>}
   */
  async getVariantById(variantId) {
    const variant = await db.queryOne('SELECT * FROM product_variants WHERE id = ?', [variantId]);
    if (!variant) {
      throw { status: 404, message: 'Biến thể không tồn tại' };
    }
    return variant;
  },

  /**
   * Lấy tất cả biến thể của sản phẩm
   * @param {number} productId
   * @returns {Promise<Array>}
   */
  async getVariantsByProduct(productId) {
    // Check product exists (using alias 'p' for consistency with mock database patterns)
    const product = await db.queryOne('SELECT p.id FROM products p WHERE p.id = ?', [productId]);
    if (!product) {
      throw { status: 404, message: 'Sản phẩm không tồn tại' };
    }

    const variants = await db.query(
      'SELECT * FROM product_variants WHERE product_id = ? ORDER BY color ASC, size ASC',
      [productId]
    );

    return variants.map(v => ({
      ...v,
      price: Number(v.price),
      discount_price: v.discount_price !== null ? Number(v.discount_price) : null,
      stock_quantity: Number(v.stock_quantity)
    }));
  },

  /**
   * Tạo 1 biến thể mới
   * @param {number} productId
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  async createVariant(productId, body) {
    // 1. Kiểm tra sản phẩm tồn tại
    const product = await db.queryOne('SELECT p.id FROM products p WHERE p.id = ?', [productId]);
    if (!product) {
      throw { status: 404, message: 'Sản phẩm không tồn tại' };
    }

    const { size, price, discount_price, stock_quantity, sku } = body;
    const color = body.color && body.color.trim() !== '' ? body.color.trim() : null;
    const finalSize = size.trim();
    const finalPrice = parseFloat(price);
    const finalDiscountPrice = discount_price !== undefined && discount_price !== null && discount_price !== '' ? parseFloat(discount_price) : null;
    const finalStock = stock_quantity !== undefined ? parseInt(stock_quantity, 10) : 0;

    // 2. Kiểm tra tổ hợp color + size trùng lặp trong cùng sản phẩm
    const existing = await db.queryOne(
      'SELECT id FROM product_variants WHERE product_id = ? AND (color = ? OR (color IS NULL AND ? IS NULL)) AND size = ?',
      [productId, color, color, finalSize]
    );
    if (existing) {
      throw { status: 409, message: 'Biến thể với màu sắc và kích cỡ này đã tồn tại cho sản phẩm' };
    }

    // 3. Kiểm tra SKU trùng lặp toàn hệ thống
    let finalSku = sku && sku.trim() !== '' ? sku.trim() : null;
    if (finalSku) {
      const existingSku = await db.queryOne('SELECT id FROM product_variants WHERE sku = ?', [finalSku]);
      if (existingSku) {
        throw { status: 409, message: 'Mã SKU này đã được sử dụng' };
      }
    } else {
      // Tự sinh SKU duy nhất
      finalSku = `SP${productId}-${Date.now()}`;
    }

    // 4. Insert vào CSDL
    const result = await db.query(
      `
      INSERT INTO product_variants (
        product_id, sku, color, size, price, discount_price, stock_quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [productId, finalSku, color, finalSize, finalPrice, finalDiscountPrice, finalStock]
    );

    return this.getVariantById(result.insertId);
  },

  /**
   * Tạo hàng loạt biến thể (Bulk Create)
   * @param {number} productId
   * @param {Array} variantsArray
   * @returns {Promise<Array>}
   */
  async bulkCreateVariants(productId, variantsArray) {
    // 1. Kiểm tra sản phẩm tồn tại
    const product = await db.queryOne('SELECT p.id FROM products p WHERE p.id = ?', [productId]);
    if (!product) {
      throw { status: 404, message: 'Sản phẩm không tồn tại' };
    }

    // 2. Kiểm tra trùng lặp ngay trong mảng gửi lên
    const seen = new Set();
    for (const v of variantsArray) {
      const colorKey = v.color && v.color.trim() !== '' ? v.color.trim().toLowerCase() : 'null';
      const sizeKey = v.size ? v.size.trim().toLowerCase() : '';
      const key = `${colorKey}_${sizeKey}`;
      if (seen.has(key)) {
        throw { status: 400, message: 'Danh sách biến thể có tổ hợp màu sắc và kích cỡ bị trùng lặp' };
      }
      seen.add(key);
    }

    // 3. Kiểm tra trùng lặp với CSDL & SKU
    for (const v of variantsArray) {
      const color = v.color && v.color.trim() !== '' ? v.color.trim() : null;
      const size = v.size.trim();
      
      const existing = await db.queryOne(
        'SELECT id FROM product_variants WHERE product_id = ? AND (color = ? OR (color IS NULL AND ? IS NULL)) AND size = ?',
        [productId, color, color, size]
      );
      if (existing) {
        throw { status: 409, message: `Biến thể (màu: ${color || 'không có'}, size: ${size}) đã tồn tại` };
      }

      if (v.sku && v.sku.trim() !== '') {
        const existingSku = await db.queryOne('SELECT id FROM product_variants WHERE sku = ?', [v.sku.trim()]);
        if (existingSku) {
          throw { status: 409, message: `Mã SKU ${v.sku} này đã được sử dụng` };
        }
      }
    }

    // 4. Tiến hành insert tuần tự
    const createdIds = [];
    for (let i = 0; i < variantsArray.length; i++) {
      const v = variantsArray[i];
      const color = v.color && v.color.trim() !== '' ? v.color.trim() : null;
      const size = v.size.trim();
      const price = parseFloat(v.price);
      const discountPrice = v.discount_price !== undefined && v.discount_price !== null && v.discount_price !== '' ? parseFloat(v.discount_price) : null;
      const stock = v.stock_quantity !== undefined ? parseInt(v.stock_quantity, 10) : 0;
      
      let sku = v.sku && v.sku.trim() !== '' ? v.sku.trim() : null;
      if (!sku) {
        sku = `SP${productId}-${Date.now()}-${i}`;
      }

      const res = await db.query(
        `
        INSERT INTO product_variants (
          product_id, sku, color, size, price, discount_price, stock_quantity
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [productId, sku, color, size, price, discountPrice, stock]
      );
      createdIds.push(res.insertId);
    }

    // 5. Query trả về danh sách các biến thể vừa tạo
    const results = await db.query(
      `SELECT * FROM product_variants WHERE id IN (${createdIds.join(',')}) ORDER BY id ASC`
    );

    return results.map(v => ({
      ...v,
      price: Number(v.price),
      discount_price: v.discount_price !== null ? Number(v.discount_price) : null,
      stock_quantity: Number(v.stock_quantity)
    }));
  },

  /**
   * Cập nhật thông tin chi tiết biến thể
   * @param {number} variantId
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  async updateVariant(variantId, body) {
    // 1. Kiểm tra tồn tại
    const current = await db.queryOne('SELECT * FROM product_variants WHERE id = ?', [variantId]);
    if (!current) {
      throw { status: 404, message: 'Biến thể không tồn tại' };
    }

    // 2. Kiểm tra duy nhất color + size mới
    const color = body.color !== undefined 
      ? (body.color && body.color.trim() !== '' ? body.color.trim() : null) 
      : current.color;
    const size = body.size !== undefined ? body.size.trim() : current.size;

    if (color !== current.color || size !== current.size) {
      const existing = await db.queryOne(
        'SELECT id FROM product_variants WHERE product_id = ? AND id != ? AND (color = ? OR (color IS NULL AND ? IS NULL)) AND size = ?',
        [current.product_id, variantId, color, color, size]
      );
      if (existing) {
        throw { status: 409, message: 'Biến thể với màu sắc và kích cỡ này đã tồn tại cho sản phẩm' };
      }
    }

    // 3. Kiểm tra trùng SKU
    if (body.sku !== undefined && body.sku !== null && body.sku.trim() !== current.sku) {
      const skuVal = body.sku.trim();
      if (skuVal !== '') {
        const existingSku = await db.queryOne(
          'SELECT id FROM product_variants WHERE sku = ? AND id != ?',
          [skuVal, variantId]
        );
        if (existingSku) {
          throw { status: 409, message: 'Mã SKU này đã được sử dụng' };
        }
      }
    }

    // 4. Kiểm tra discount_price < price (nếu 1 trong 2 hoặc cả hai thay đổi)
    const finalPrice = body.price !== undefined ? parseFloat(body.price) : parseFloat(current.price);
    const finalDiscountPrice = body.discount_price !== undefined 
      ? (body.discount_price !== null && body.discount_price !== '' ? parseFloat(body.discount_price) : null) 
      : (current.discount_price !== null ? parseFloat(current.discount_price) : null);

    if (finalDiscountPrice !== null && finalDiscountPrice >= finalPrice) {
      throw { status: 400, message: 'Giá khuyến mãi phải nhỏ hơn giá bán' };
    }

    // 5. Cập nhật động
    const fields = [];
    const values = [];

    if (body.color !== undefined) {
      fields.push('color = ?');
      values.push(color);
    }
    if (body.size !== undefined) {
      fields.push('size = ?');
      values.push(size);
    }
    if (body.price !== undefined) {
      fields.push('price = ?');
      values.push(finalPrice);
    }
    if (body.discount_price !== undefined) {
      fields.push('discount_price = ?');
      values.push(finalDiscountPrice);
    }
    if (body.stock_quantity !== undefined) {
      fields.push('stock_quantity = ?');
      values.push(parseInt(body.stock_quantity, 10));
    }
    if (body.sku !== undefined) {
      fields.push('sku = ?');
      values.push(body.sku && body.sku.trim() !== '' ? body.sku.trim() : null);
    }

    if (fields.length > 0) {
      values.push(variantId);
      await db.query(`UPDATE product_variants SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return this.getVariantById(variantId);
  },

  /**
   * Cập nhật nhanh số lượng tồn kho
   * @param {number} variantId
   * @param {number} stockQuantity
   * @returns {Promise<Object>}
   */
  async updateStock(variantId, stockQuantity) {
    const current = await db.queryOne('SELECT id FROM product_variants WHERE id = ?', [variantId]);
    if (!current) {
      throw { status: 404, message: 'Biến thể không tồn tại' };
    }

    const finalStock = parseInt(stockQuantity, 10);
    await db.query('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [finalStock, variantId]);

    return { id: Number(variantId), stock_quantity: finalStock };
  },

  /**
   * Xóa biến thể
   * @param {number} variantId
   * @returns {Promise<Object>}
   */
  async deleteVariant(variantId) {
    const current = await db.queryOne('SELECT id FROM product_variants WHERE id = ?', [variantId]);
    if (!current) {
      throw { status: 404, message: 'Biến thể không tồn tại' };
    }

    // Kiểm tra xem biến thể đã nằm trong đơn hàng nào chưa
    const orderCountRes = await db.queryOne(
      'SELECT COUNT(*) as count FROM order_items WHERE variant_id = ?',
      [variantId]
    );
    const orderCount = orderCountRes ? orderCountRes.count : 0;

    if (orderCount > 0) {
      // Đã được đặt hàng -> Không xóa cứng mà đưa tồn kho về 0
      await db.query('UPDATE product_variants SET stock_quantity = 0 WHERE id = ?', [variantId]);
      return { 
        message: 'Biến thể đã từng được đặt hàng nên không thể xoá hoàn toàn — đã tự động đưa tồn kho về 0 để ngừng bán', 
        deleted: false 
      };
    } else {
      // Chưa được đặt hàng -> Xóa cứng
      await db.query('DELETE FROM product_variants WHERE id = ?', [variantId]);
      return { 
        message: 'Xoá biến thể thành công', 
        deleted: true 
      };
    }
  }
};

module.exports = variantService;
