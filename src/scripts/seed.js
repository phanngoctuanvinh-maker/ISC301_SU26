const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper to convert Vietnamese name to slug
function toSlug(str) {
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/[^a-z0-9\s-]/g, '');
  str = str.replace(/\s+/g, '-');
  str = str.replace(/-+/g, '-');
  return str.trim();
}

async function seed() {
  console.log('Starting database seeding...');
  
  // Disable foreign key checks
  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  
  // Truncate tables
  console.log('Truncating existing tables...');
  await db.query('TRUNCATE TABLE addresses');
  await db.query('TRUNCATE TABLE products');
  await db.query('TRUNCATE TABLE otp_pending');
  await db.query('TRUNCATE TABLE users');
  await db.query('TRUNCATE TABLE categories');
  await db.query('TRUNCATE TABLE brands');
  
  // 1. Seed Brands (15 rows)
  console.log('Seeding brands...');
  const brandNames = [
    'Nike', 'Adidas', 'Puma', 'Reebok', 'Jordan', 
    'Under Armour', 'Asics', 'New Balance', 'Mizuno', 'Salomon', 
    'Skechers', 'Fila', 'Converse', 'Vans', 'Li-Ning'
  ];
  
  const brandIds = [];
  for (const name of brandNames) {
    const desc = `Thương hiệu thể thao ${name} nổi tiếng toàn cầu.`;
    const slug = toSlug(name);
    await db.query(
      'INSERT INTO brands (name, logo_url, description, is_active) VALUES (?, ?, ?, ?)',
      [name, `/uploads/brands/${slug}-logo.png`, desc, true]
    );
    const res = await db.query('SELECT LAST_INSERT_ID() as id');
    brandIds.push(res[0].id);
  }
  console.log(`Seeded ${brandIds.length} brands.`);

  // 2. Seed Categories (2-level parent-child tree)
  console.log('Seeding categories...');
  const parentCategories = [
    { name: 'Giày Thể Thao', slug: 'giay-the-thao', sort_order: 1 },
    { name: 'Phụ Kiện Thể Thao', slug: 'phu-kien', sort_order: 2 },
    { name: 'Sandal & Dép Thể Thao', slug: 'sandal-dep-the-thao', sort_order: 3 }
  ];

  const parentIds = [];
  for (const cat of parentCategories) {
    await db.query(
      'INSERT INTO categories (parent_id, name, slug, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [null, cat.name, cat.slug, `/uploads/categories/${cat.slug}.png`, cat.sort_order, true]
    );
    const res = await db.query('SELECT LAST_INSERT_ID() as id');
    parentIds.push(res[0].id);
  }

  const childCategories = [
    // Under Giày Thể Thao (parentIds[0])
    { parentIdx: 0, name: 'Giày Chạy Bộ', slug: 'giay-chay-bo', sort_order: 1 },
    { parentIdx: 0, name: 'Giày Bóng Rổ', slug: 'giay-bong-ro', sort_order: 2 },
    { parentIdx: 0, name: 'Giày Đá Bóng', slug: 'giay-da-bong', sort_order: 3 },
    { parentIdx: 0, name: 'Giày Tập Luyện', slug: 'giay-tap-luyen', sort_order: 4 },
    { parentIdx: 0, name: 'Giày Tennis', slug: 'giay-tennis', sort_order: 5 },
    { parentIdx: 0, name: 'Giày Sneaker Thể Thao', slug: 'giay-sneaker-the-thao', sort_order: 6 },

    // Under Phụ Kiện Thể Thao (parentIds[1])
    { parentIdx: 1, name: 'Vớ & Tất Thể Thao', slug: 'vo-tat-the-thao', sort_order: 1 },
    { parentIdx: 1, name: 'Lót Giày Thể Thao', slug: 'lot-giay-the-thao', sort_order: 2 },
    { parentIdx: 1, name: 'Dây Giày Thể Thao', slug: 'day-giay-the-thao', sort_order: 3 },
    { parentIdx: 1, name: 'Chai Xịt Khử Mùi', slug: 'chai-xit-khu-mui', sort_order: 4 },

    // Under Sandal & Dép Thể Thao (parentIds[2])
    { parentIdx: 2, name: 'Dép Slide Thể Thao', slug: 'dep-slide-the-thao', sort_order: 1 },
    { parentIdx: 2, name: 'Sandal Dã Ngoại', slug: 'sandal-da-ngoai', sort_order: 2 }
  ];

  const childIds = [];
  for (const cat of childCategories) {
    const parentId = parentIds[cat.parentIdx];
    await db.query(
      'INSERT INTO categories (parent_id, name, slug, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [parentId, cat.name, cat.slug, `/uploads/categories/${cat.slug}.png`, cat.sort_order, true]
    );
    const res = await db.query('SELECT LAST_INSERT_ID() as id');
    childIds.push(res[0].id);
  }
  console.log(`Seeded ${parentIds.length + childIds.length} categories.`);

  // 3. Seed Products (25 rows, linked to categories & brands)
  console.log('Seeding products...');
  const productData = [
    { name: 'Nike Air Force 1', categoryIdx: 5, gender: 'unisex', sport_type: 'lifestyle' }, // Giày Sneaker Thể Thao
    { name: 'Adidas Ultraboost 22', categoryIdx: 0, gender: 'unisex', sport_type: 'running' }, // Giày Chạy Bộ
    { name: 'Puma Suede Classic', categoryIdx: 5, gender: 'unisex', sport_type: 'lifestyle' }, // Giày Sneaker Thể Thao
    { name: 'Reebok Club C 85', categoryIdx: 5, gender: 'unisex', sport_type: 'lifestyle' }, // Giày Sneaker Thể Thao
    { name: 'Vans Old Skool', categoryIdx: 5, gender: 'unisex', sport_type: 'lifestyle' }, // Giày Sneaker Thể Thao
    { name: 'Converse Chuck Taylor', categoryIdx: 5, gender: 'unisex', sport_type: 'lifestyle' }, // Giày Sneaker Thể Thao
    { name: 'New Balance 574', categoryIdx: 5, gender: 'unisex', sport_type: 'lifestyle' }, // Giày Sneaker Thể Thao
    { name: 'Air Jordan 1 Retro', categoryIdx: 1, gender: 'unisex', sport_type: 'basketball' }, // Giày Bóng Rổ
    { name: 'Under Armour Curry 9', categoryIdx: 1, gender: 'male', sport_type: 'basketball' }, // Giày Bóng Rổ
    { name: 'Asics Gel-Kayano 28', categoryIdx: 0, gender: 'unisex', sport_type: 'running' }, // Giày Chạy Bộ
    { name: 'Mizuno Wave Rider 25', categoryIdx: 0, gender: 'male', sport_type: 'running' }, // Giày Chạy Bộ
    { name: 'Salomon Speedcross 5', categoryIdx: 0, gender: 'unisex', sport_type: 'running' }, // Giày Chạy Bộ
    { name: 'Skechers D\'Lites', categoryIdx: 3, gender: 'female', sport_type: 'training' }, // Giày Tập Luyện
    { name: 'Nike Mercurial Superfly', categoryIdx: 2, gender: 'male', sport_type: 'football' }, // Giày Đá Bóng
    { name: 'Adidas Predator Edge', categoryIdx: 2, gender: 'unisex', sport_type: 'football' }, // Giày Đá Bóng
    { name: 'Vớ Nike Cushion Socks', categoryIdx: 6, gender: null, sport_type: null }, // Vớ & Tất Thể Thao
    { name: 'Vớ Adidas Crew Socks', categoryIdx: 6, gender: null, sport_type: null }, // Vớ & Tất Thể Thao
    { name: 'Lót Giày Phục Hồi', categoryIdx: 7, gender: null, sport_type: null }, // Lót Giày Thể Thao
    { name: 'Dây Giày Co Giãn', categoryIdx: 8, gender: null, sport_type: null }, // Dây Giày Thể Thao
    { name: 'Xịt Khử Mùi Cao Cấp', categoryIdx: 9, gender: null, sport_type: null }, // Chai Xịt Khử Mùi
    { name: 'Dép Slide Nike Benassi', categoryIdx: 10, gender: 'unisex', sport_type: null }, // Dép Slide Thể Thao
    { name: 'Dép Adilette Shower', categoryIdx: 10, gender: 'unisex', sport_type: null }, // Dép Slide Thể Thao
    { name: 'Sandal Puma Evolve', categoryIdx: 11, gender: 'unisex', sport_type: null }, // Sandal Dã Ngoại
    { name: 'Giày Tennis Asics Resolution', categoryIdx: 4, gender: 'unisex', sport_type: 'tennis' }, // Giày Tennis
    { name: 'Nike Court Lite 2', categoryIdx: 4, gender: 'unisex', sport_type: 'tennis' } // Giày Tennis
  ];
  
  for (let i = 0; i < productData.length; i++) {
    const prod = productData[i];
    const brandId = brandIds[i % brandIds.length];
    const categoryId = childIds[prod.categoryIdx];
    const slug = toSlug(prod.name);
    const desc = `Sản phẩm ${prod.name} chất lượng cao từ nhà sản xuất uy tín.`;
    const image = `/uploads/products/${slug}.png`;
    const soldCount = Math.floor(Math.random() * 100);
    const isFeatured = i % 5 === 0 ? 1 : 0;

    await db.query(
      `INSERT INTO products (
        category_id, brand_id, name, slug, description, main_image_url, gender, sport_type, is_active, is_featured, sold_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [categoryId, brandId, prod.name, slug, desc, image, prod.gender, prod.sport_type, isFeatured, soldCount]
    );
  }
  console.log(`Seeded ${productData.length} products.`);

  // 4. Seed Users (25 rows)
  console.log('Generating password hash...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  console.log('Seeding users...');
  const usersToSeed = [
    // 2 Admins
    { full_name: 'Admin Demo', email: 'admin@example.com', phone: '0901234567', role: 'admin', gender: 'male', dob: '1990-01-01' },
    { full_name: 'Nguyễn Văn Admin', email: 'admin2@example.com', phone: '0907654321', role: 'admin', gender: 'male', dob: '1992-05-10' },
  ];

  // 23 Customers
  const vnNames = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Hoàng Cường', 'Phạm Minh Duy', 'Hoàng Thu Giang',
    'Vũ Hải Nam', 'Đặng Ngọc Hân', 'Bùi Quốc Khánh', 'Đỗ Thùy Linh', 'Ngô Thanh Sơn',
    'Dương Hồng Ngọc', 'Lý Quốc Bảo', 'Phan Văn Đức', 'Tống Khánh Huyền', 'Võ Hoài Nam',
    'Trịnh Gia Bảo', 'Đoàn Minh Triết', 'Đinh Công Tráng', 'Lâm Gia Tuệ', 'Mai Phương Chi',
    'Phùng Hữu Phước', 'Diệp Anh Thư', 'Quách Thái Sơn'
  ];

  for (let i = 0; i < vnNames.length; i++) {
    const name = vnNames[i];
    const email = `user${i + 1}@example.com`;
    const phone = `09123456${(i + 10).toString().slice(-2)}`;
    const gender = i % 2 === 0 ? 'male' : 'female';
    const dob = `199${i % 10}-0${(i % 9) + 1}-15`;
    usersToSeed.push({ full_name: name, email, phone, role: 'customer', gender, dob });
  }

  const userIds = [];
  for (const user of usersToSeed) {
    await db.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, gender, date_of_birth, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [user.full_name, user.email, user.phone, passwordHash, user.role, user.gender, user.dob, true]
    );
    const res = await db.query('SELECT LAST_INSERT_ID() as id');
    userIds.push({ id: res[0].id, role: user.role });
  }
  console.log(`Seeded ${usersToSeed.length} users.`);

  // 5. Seed Addresses (25 rows linked to customer users)
  console.log('Seeding addresses...');
  const customerIds = userIds.filter(u => u.role === 'customer').map(u => u.id);
  
  const adrPool = [
    { receiver_name: 'Nguyễn Văn An', phone: '0912345610', address_line: '123 Đường Lê Lợi', ward: 'Bến Thành', district: 'Quận 1', city: 'Hồ Chí Minh' },
    { receiver_name: 'Trần Thị Bình', phone: '0912345611', address_line: '456 Phố Huế', ward: 'Ngô Thì Nhậm', district: 'Hai Bà Trưng', city: 'Hà Nội' },
    { receiver_name: 'Lê Hoàng Cường', phone: '0912345612', address_line: '789 Nguyễn Văn Linh', ward: 'Nam Dương', district: 'Hải Châu', city: 'Đà Nẵng' },
    { receiver_name: 'Phạm Minh Duy', phone: '0912345613', address_line: '12 Đại lộ Bình Dương', ward: 'Phú Cường', district: 'Thủ Dầu Một', city: 'Bình Dương' },
    { receiver_name: 'Hoàng Thu Giang', phone: '0912345614', address_line: '34 Lê Hồng Phong', ward: 'Đông Khê', district: 'Ngô Quyền', city: 'Hải Phòng' },
    { receiver_name: 'Vũ Hải Nam', phone: '0912345615', address_line: '56 Trần Hưng Đạo', ward: 'Vĩnh Thanh Vân', district: 'Rạch Giá', city: 'Kiên Giang' },
    { receiver_name: 'Đặng Ngọc Hân', phone: '0912345616', address_line: '78 Hùng Vương', ward: 'Thới Bình', district: 'Ninh Kiều', city: 'Cần Thơ' },
    { receiver_name: 'Bùi Quốc Khánh', phone: '0912345617', address_line: '90 Quang Trung', ward: 'Lộc Thọ', district: 'Nha Trang', city: 'Khánh Hòa' },
    { receiver_name: 'Đỗ Thùy Linh', phone: '0912345618', address_line: '101 Nguyễn Thị Minh Khai', ward: 'Phường 5', district: 'Đà Lạt', city: 'Lâm Đồng' },
    { receiver_name: 'Ngô Thanh Sơn', phone: '0912345619', address_line: '202 Trần Phú', ward: 'Cẩm Tây', district: 'Cẩm Phả', city: 'Quảng Ninh' },
    { receiver_name: 'Dương Hồng Ngọc', phone: '0912345620', address_line: '303 Phan Đình Phùng', ward: 'Quyết Thắng', district: 'Kon Tum', city: 'Kon Tum' },
    { receiver_name: 'Lý Quốc Bảo', phone: '0912345621', address_line: '404 Nguyễn Huệ', ward: 'Phường 1', district: 'Vĩnh Long', city: 'Vĩnh Long' },
    { receiver_name: 'Phan Văn Đức', phone: '0912345622', address_line: '505 Lê Duẩn', ward: 'Tự An', district: 'Buôn Ma Thuột', city: 'Đắk Lắk' },
    { receiver_name: 'Tống Khánh Huyền', phone: '0912345623', address_line: '606 Bà Triệu', ward: 'Trường Thi', district: 'Thanh Hóa', city: 'Thanh Hóa' },
    { receiver_name: 'Võ Hoài Nam', phone: '0912345624', address_line: '707 Nguyễn Sinh Cung', ward: 'Vỹ Dạ', district: 'Huế', city: 'Thừa Thiên Huế' },
    { receiver_name: 'Trịnh Gia Bảo', phone: '0912345625', address_line: '808 Cách Mạng Tháng 8', ward: 'Phường 3', district: 'Tây Ninh', city: 'Tây Ninh' },
    { receiver_name: 'Đoàn Minh Triết', phone: '0912345626', address_line: '909 Hùng Vương', ward: 'Quang Trung', district: 'Uông Bí', city: 'Quảng Ninh' },
    { receiver_name: 'Đinh Công Tráng', phone: '0912345627', address_line: '111 Nguyễn Du', ward: 'Trung Đô', district: 'Vinh', city: 'Nghệ An' },
    { receiver_name: 'Lâm Gia Tuệ', phone: '0912345628', address_line: '222 Lê Lợi', ward: 'Vĩnh Mỹ', district: 'Châu Đốc', city: 'An Giang' },
    { receiver_name: 'Mai Phương Chi', phone: '0912345629', address_line: '333 Nguyễn Trãi', ward: 'Thanh Xuân Nam', district: 'Thanh Xuân', city: 'Hà Nội' },
    { receiver_name: 'Phùng Hữu Phước', phone: '0912345630', address_line: '444 Nguyễn Văn Cừ', ward: 'An Hòa', district: 'Ninh Kiều', city: 'Cần Thơ' },
    { receiver_name: 'Diệp Anh Thư', phone: '0912345631', address_line: '555 Trần Hưng Đạo', ward: 'An Hải Tây', district: 'Sơn Trà', city: 'Đà Nẵng' },
    { receiver_name: 'Quách Thái Sơn', phone: '0912345632', address_line: '666 Nguyễn Đình Chiểu', ward: 'Phường 3', district: 'Quận 3', city: 'Hồ Chí Minh' },
    { receiver_name: 'Nguyễn Văn An (Cơ quan)', phone: '0912345610', address_line: '99 Tôn Đức Thắng', ward: 'Bến Nghé', district: 'Quận 1', city: 'Hồ Chí Minh' },
    { receiver_name: 'Trần Thị Bình (Nhà riêng)', phone: '0912345611', address_line: '88 Kim Mã', ward: 'Kim Mã', district: 'Ba Đình', city: 'Hà Nội' }
  ];

  for (let i = 0; i < adrPool.length; i++) {
    const adr = adrPool[i];
    // Map to a customer. If i < customerIds.length, map 1-to-1, otherwise cycle.
    const userId = customerIds[i % customerIds.length];
    // Set is_default to true for the first address of each user
    const hasDefault = await db.queryOne('SELECT id FROM addresses WHERE user_id = ? AND is_default = true', [userId]);
    const isDefault = !hasDefault ? true : false;

    await db.query(
      'INSERT INTO addresses (user_id, receiver_name, phone, address_line, ward, district, city, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, adr.receiver_name, adr.phone, adr.address_line, adr.ward, adr.district, adr.city, isDefault]
    );
  }
  console.log(`Seeded ${adrPool.length} addresses.`);

  // 6. Seed OTP Pending (25 rows)
  console.log('Seeding OTP pending registration requests...');
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year expiry so cron job doesn't delete them
  
  for (let i = 1; i <= 25; i++) {
    const email = `pending${i}@example.com`;
    const name = `Khách Hàng Chờ ${i}`;
    const phone = `0999999${(i + 10).toString().slice(-2)}`;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await db.query(
      'INSERT INTO otp_pending (email, full_name, phone, hashed_password, otp, resend_count, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, name, phone, passwordHash, otp, 0, expiresAt]
    );
  }
  console.log('Seeded 25 OTP pending registration requests.');

  // Re-enable foreign key checks
  await db.query('SET FOREIGN_KEY_CHECKS = 1');
  
  console.log('Database seeding completed successfully!');
}

if (require.main === module) {
  seed()
    .catch(err => {
      console.error('Error seeding database:', err);
      process.exit(1);
    })
    .finally(() => {
      db.pool.end();
    });
} else {
  module.exports = { seed };
}
