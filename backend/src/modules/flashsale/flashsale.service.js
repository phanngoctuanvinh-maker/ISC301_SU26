const db = require('../../config/db');

async function createFlashSale(data) {
  const { name, start_time, end_time, items } = data;
  
  if (!name || !start_time || !end_time || !items || !items.length) {
    throw { status: 400, message: 'Thiếu thông tin tạo Flash Sale' };
  }

  const connection = await db.pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Create the flash sale session
    const [result] = await connection.execute(
      'INSERT INTO flash_sales (name, start_time, end_time, is_active) VALUES (?, ?, ?, 1)',
      [name, new Date(start_time), new Date(end_time)]
    );
    const flashSaleId = result.insertId;

    // 2. Insert the flash sale items
    for (const item of items) {
      const { product_id, flash_price, flash_quantity } = item;
      
      // Verify product exists
      const [prodRows] = await connection.execute('SELECT id FROM products WHERE id = ? LIMIT 1', [product_id]);
      if (!prodRows.length) {
        throw { status: 404, message: `Sản phẩm với ID ${product_id} không tồn tại` };
      }

      await connection.execute(
        'INSERT INTO flash_sale_items (flash_sale_id, product_id, flash_price, flash_quantity, sold_quantity) VALUES (?, ?, ?, ?, 0)',
        [flashSaleId, product_id, flash_price, flash_quantity]
      );
    }

    await connection.commit();
    return { message: 'Tạo chương trình Flash Sale thành công', id: flashSaleId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listAllFlashSales() {
  const sessions = await db.query('SELECT * FROM flash_sales ORDER BY start_time DESC');
  
  const result = [];
  for (const session of sessions) {
    const items = await db.query(
      `SELECT fsi.*, p.name AS product_name, p.slug AS product_slug, p.main_image_url, p.price AS original_price
       FROM flash_sale_items fsi
       INNER JOIN products p ON p.id = fsi.product_id
       WHERE fsi.flash_sale_id = ?`,
      [session.id]
    );
    
    result.push({
      ...session,
      items: items.map(item => ({
        ...item,
        flash_price: Number(item.flash_price),
        original_price: Number(item.original_price)
      }))
    });
  }
  
  return result;
}

async function deleteFlashSale(id) {
  const session = await db.queryOne('SELECT id FROM flash_sales WHERE id = ? LIMIT 1', [id]);
  if (!session) {
    throw { status: 404, message: 'Chương trình Flash Sale không tồn tại' };
  }
  await db.query('DELETE FROM flash_sales WHERE id = ?', [id]);
  return { message: 'Xoá chương trình Flash Sale thành công' };
}

async function getActiveOrUpcomingFlashSale() {
  // Try to find the currently active session
  let session = await db.queryOne(
    `SELECT * FROM flash_sales 
     WHERE is_active = 1 AND start_time <= NOW() AND end_time >= NOW()
     ORDER BY start_time ASC LIMIT 1`
  );
  
  let status = 'active';
  if (!session) {
    // Try to find the nearest upcoming session
    session = await db.queryOne(
      `SELECT * FROM flash_sales 
       WHERE is_active = 1 AND start_time > NOW()
       ORDER BY start_time ASC LIMIT 1`
    );
    status = 'upcoming';
  }
  
  if (!session) {
    return null;
  }
  
  const items = await db.query(
    `SELECT fsi.*, p.name AS product_name, p.slug AS product_slug, p.main_image_url, p.price AS original_price
     FROM flash_sale_items fsi
     INNER JOIN products p ON p.id = fsi.product_id
     WHERE fsi.flash_sale_id = ?`,
    [session.id]
  );
  
  return {
    ...session,
    status,
    items: items.map(item => ({
      ...item,
      flash_price: Number(item.flash_price),
      original_price: Number(item.original_price),
      flash_quantity: Number(item.flash_quantity),
      sold_quantity: Number(item.sold_quantity)
    }))
  };
}

module.exports = {
  createFlashSale,
  listAllFlashSales,
  deleteFlashSale,
  getActiveOrUpcomingFlashSale
};
