const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');

async function main() {
  console.log('--- BẮT ĐẦU SETUP & KIỂM TRA HỆ THỐNG ---');

  // 1. Tạo các thư mục uploads nếu chưa tồn tại
  const dirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/avatars'),
    path.join(__dirname, '../uploads/brands')
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[Thư mục] Đã tạo thư mục: ${dir}`);
    } else {
      console.log(`[Thư mục] Thư mục đã tồn tại: ${dir}`);
    }
  }

  // 2. Kiểm thử kết nối và tạo bảng database
  try {
    console.log('[Database] Đang thử kết nối database...');
    
    // Tạo bảng categories
    const createCategoriesTableSql = `
      CREATE TABLE IF NOT EXISTS categories (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        parent_id   INT DEFAULT NULL,
        name        VARCHAR(100) NOT NULL,
        slug        VARCHAR(120) NOT NULL UNIQUE,
        image_url   VARCHAR(500),
        sort_order  INT DEFAULT 0,
        is_active   BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (parent_id) REFERENCES categories(id)
      );
    `;
    await db.query(createCategoriesTableSql);
    console.log('[Database] Bảng "categories" đã sẵn sàng.');

    // Tạo bảng brands
    const createBrandsTableSql = `
      CREATE TABLE IF NOT EXISTS brands (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(100) NOT NULL UNIQUE,
        logo_url    VARCHAR(500),
        description TEXT,
        is_active   BOOLEAN DEFAULT TRUE
      );
    `;
    await db.query(createBrandsTableSql);
    console.log('[Database] Bảng "brands" đã sẵn sàng.');

    console.log('[Kết quả] Setup database thành công.');
  } catch (err) {
    console.error('[Lỗi] Lỗi kết nối hoặc thực thi SQL:', err);
  } finally {
    // Đóng pool kết nối để chương trình kết thúc
    db.pool.end();
  }
}

main();
