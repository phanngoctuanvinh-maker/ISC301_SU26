-- Shoes Store Database Dump & Initialization Schema
-- Generated dynamically to match actual schema and seeded data.

SET FOREIGN_KEY_CHECKS = 0;

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'customer' COMMENT 'customer | admin | staff',
  `gender` varchar(10) DEFAULT NULL COMMENT 'male | female | other',
  `date_of_birth` date DEFAULT NULL,
  `social_provider` varchar(20) DEFAULT NULL COMMENT 'google | facebook | null',
  `social_id` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `categories`
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parent_id` int DEFAULT NULL COMMENT 'Self-ref: danh mục cha',
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Hỗ trợ 2 nhóm song song: Giày (Nike, Adidas... -> Nam/Nữ) và Phụ kiện (Tất, Dây giày, Lót giày, Túi/Hộp đựng, Xi đánh giày...)';

-- Table structure for table `brands`
DROP TABLE IF EXISTS `brands`;
CREATE TABLE `brands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `products`
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `brand_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(280) NOT NULL COMMENT 'URL SEO-friendly',
  `description` text,
  `main_image_url` varchar(500) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL COMMENT 'male | female | unisex | null (để null nếu là Phụ kiện không phân giới tính)',
  `sport_type` varchar(50) DEFAULT NULL COMMENT 'running | training | tennis | lifestyle | ... (chỉ áp dụng cho Giày, để null với Phụ kiện)',
  `is_active` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0' COMMENT 'Hiển thị trang chủ',
  `sold_count` int DEFAULT '0' COMMENT 'Tổng đã bán (cache)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_products_category` (`category_id`),
  KEY `fk_products_brand` (`brand_id`),
  CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `addresses`
DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `receiver_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address_line` varchar(255) NOT NULL,
  `ward` varchar(100) DEFAULT NULL,
  `district` varchar(100) NOT NULL,
  `city` varchar(100) NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_addresses_user` (`user_id`),
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `otp_pending`
DROP TABLE IF EXISTS `otp_pending`;
CREATE TABLE `otp_pending` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(150) NOT NULL COMMENT 'Email đang chờ xác thực',
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `hashed_password` varchar(255) NOT NULL COMMENT 'Đã hash bằng bcrypt trước khi lưu',
  `otp` varchar(6) NOT NULL COMMENT '6 số, sinh bằng SecureRandom',
  `resend_count` int DEFAULT '0' COMMENT 'Giới hạn tối đa 3 lần gửi lại',
  `expires_at` timestamp NOT NULL COMMENT 'now() + 5 phút',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bảng tạm — xóa hàng ngay sau khi verify OTP thành công. Job dọn dẹp mỗi 10 phút.';

-- Dumping data for table `users`
INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `avatar_url`, `password_hash`, `role`, `gender`, `date_of_birth`, `social_provider`, `social_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Admin Demo', 'admin@example.com', '0901234567', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'admin', 'male', '1989-12-31 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(2, 'Nguyễn Văn Admin', 'admin2@example.com', '0907654321', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'admin', 'male', '1992-05-09 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(3, 'Nguyễn Văn An', 'user1@example.com', '0912345610', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1990-01-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(4, 'Trần Thị Bình', 'user2@example.com', '0912345611', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1991-02-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(5, 'Lê Hoàng Cường', 'user3@example.com', '0912345612', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1992-03-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(6, 'Phạm Minh Duy', 'user4@example.com', '0912345613', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1993-04-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(7, 'Hoàng Thu Giang', 'user5@example.com', '0912345614', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1994-05-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(8, 'Vũ Hải Nam', 'user6@example.com', '0912345615', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1995-06-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(9, 'Đặng Ngọc Hân', 'user7@example.com', '0912345616', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1996-07-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(10, 'Bùi Quốc Khánh', 'user8@example.com', '0912345617', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1997-08-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55');
INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `avatar_url`, `password_hash`, `role`, `gender`, `date_of_birth`, `social_provider`, `social_id`, `is_active`, `created_at`, `updated_at`) VALUES
(11, 'Đỗ Thùy Linh', 'user9@example.com', '0912345618', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1998-09-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(12, 'Ngô Thanh Sơn', 'user10@example.com', '0912345619', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1999-01-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(13, 'Dương Hồng Ngọc', 'user11@example.com', '0912345620', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1990-02-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(14, 'Lý Quốc Bảo', 'user12@example.com', '0912345621', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1991-03-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(15, 'Phan Văn Đức', 'user13@example.com', '0912345622', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1992-04-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(16, 'Tống Khánh Huyền', 'user14@example.com', '0912345623', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1993-05-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(17, 'Võ Hoài Nam', 'user15@example.com', '0912345624', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1994-06-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(18, 'Trịnh Gia Bảo', 'user16@example.com', '0912345625', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1995-07-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(19, 'Đoàn Minh Triết', 'user17@example.com', '0912345626', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1996-08-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(20, 'Đinh Công Tráng', 'user18@example.com', '0912345627', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1997-09-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55');
INSERT INTO `users` (`id`, `full_name`, `email`, `phone`, `avatar_url`, `password_hash`, `role`, `gender`, `date_of_birth`, `social_provider`, `social_id`, `is_active`, `created_at`, `updated_at`) VALUES
(21, 'Lâm Gia Tuệ', 'user19@example.com', '0912345628', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1998-01-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(22, 'Mai Phương Chi', 'user20@example.com', '0912345629', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1999-02-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(23, 'Phùng Hữu Phước', 'user21@example.com', '0912345630', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1990-03-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(24, 'Diệp Anh Thư', 'user22@example.com', '0912345631', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'female', '1991-04-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(25, 'Quách Thái Sơn', 'user23@example.com', '0912345632', NULL, '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', 'customer', 'male', '1992-05-14 17:00:00', NULL, NULL, 1, '2026-06-17 13:42:55', '2026-06-17 13:42:55');

-- Dumping data for table `categories`
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `image_url`, `sort_order`, `is_active`) VALUES
(1, NULL, 'Giày Thể Thao', 'giay-the-thao', '/uploads/categories/giay-the-thao.png', 1, 1),
(2, NULL, 'Giày Tây & Công Sở', 'giay-tay-cong-so', '/uploads/categories/giay-tay-cong-so.png', 2, 1),
(3, NULL, 'Giày Casual & Hằng Ngày', 'giay-casual-hang-ngay', '/uploads/categories/giay-casual-hang-ngay.png', 3, 1),
(4, NULL, 'Phụ Kiện Giày', 'phu-kien-giay', '/uploads/categories/phu-kien-giay.png', 4, 1),
(5, NULL, 'Giày Sandal & Dép', 'giay-sandal-dep', '/uploads/categories/giay-sandal-dep.png', 5, 1),
(6, 1, 'Giày Chạy Bộ', 'giay-chay-bo', '/uploads/categories/giay-chay-bo.png', 1, 1),
(7, 1, 'Giày Bóng Rổ', 'giay-bong-ro', '/uploads/categories/giay-bong-ro.png', 2, 1),
(8, 1, 'Giày Đá Bóng', 'giay-da-bong', '/uploads/categories/giay-da-bong.png', 3, 1),
(9, 1, 'Giày Tập Luyện', 'giay-tap-luyen', '/uploads/categories/giay-tap-luyen.png', 4, 1),
(10, 1, 'Giày Tennis', 'giay-tennis', '/uploads/categories/giay-tennis.png', 5, 1);
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `image_url`, `sort_order`, `is_active`) VALUES
(11, 2, 'Giày Oxford', 'giay-oxford', '/uploads/categories/giay-oxford.png', 1, 1),
(12, 2, 'Giày Derby', 'giay-derby', '/uploads/categories/giay-derby.png', 2, 1),
(13, 2, 'Giày Loafer', 'giay-loafer', '/uploads/categories/giay-loafer.png', 3, 1),
(14, 2, 'Giày Chelsea Boot', 'giay-chelsea-boot', '/uploads/categories/giay-chelsea-boot.png', 4, 1),
(15, 3, 'Giày Sneaker Cổ Thấp', 'giay-sneaker-co-thap', '/uploads/categories/giay-sneaker-co-thap.png', 1, 1),
(16, 3, 'Giày Sneaker Cổ Cao', 'giay-sneaker-co-cao', '/uploads/categories/giay-sneaker-co-cao.png', 2, 1),
(17, 3, 'Giày Slip-on', 'giay-slip-on', '/uploads/categories/giay-slip-on.png', 3, 1),
(18, 3, 'Giày Da Lộn', 'giay-da-lon', '/uploads/categories/giay-da-lon.png', 4, 1),
(19, 4, 'Vớ & Tất', 'vo-tat', '/uploads/categories/vo-tat.png', 1, 1),
(20, 4, 'Lót Giày Thể Thao', 'lot-giay-the-thao', '/uploads/categories/lot-giay-the-thao.png', 2, 1);
INSERT INTO `categories` (`id`, `parent_id`, `name`, `slug`, `image_url`, `sort_order`, `is_active`) VALUES
(21, 4, 'Dây Giày Tròn', 'day-giay-tron', '/uploads/categories/day-giay-tron.png', 3, 1),
(22, 4, 'Dây Giày Dẹt', 'day-giay-det', '/uploads/categories/day-giay-det.png', 4, 1),
(23, 4, 'Chai Xịt Khử Mùi', 'chai-xit-khu-mui', '/uploads/categories/chai-xit-khu-mui.png', 5, 1),
(24, 5, 'Dép Bánh Mì', 'dep-banh-mi', '/uploads/categories/dep-banh-mi.png', 1, 1),
(25, 5, 'Sandal Thể Thao', 'sandal-the-thao', '/uploads/categories/sandal-the-thao.png', 2, 1);

-- Dumping data for table `brands`
INSERT INTO `brands` (`id`, `name`, `logo_url`, `description`, `is_active`) VALUES
(1, 'Nike', '/uploads/brands/nike-logo.png', 'Thương hiệu giày và thời trang Nike nổi tiếng toàn cầu.', 1),
(2, 'Adidas', '/uploads/brands/adidas-logo.png', 'Thương hiệu giày và thời trang Adidas nổi tiếng toàn cầu.', 1),
(3, 'Puma', '/uploads/brands/puma-logo.png', 'Thương hiệu giày và thời trang Puma nổi tiếng toàn cầu.', 1),
(4, 'Reebok', '/uploads/brands/reebok-logo.png', 'Thương hiệu giày và thời trang Reebok nổi tiếng toàn cầu.', 1),
(5, 'Vans', '/uploads/brands/vans-logo.png', 'Thương hiệu giày và thời trang Vans nổi tiếng toàn cầu.', 1),
(6, 'Converse', '/uploads/brands/converse-logo.png', 'Thương hiệu giày và thời trang Converse nổi tiếng toàn cầu.', 1),
(7, 'New Balance', '/uploads/brands/new-balance-logo.png', 'Thương hiệu giày và thời trang New Balance nổi tiếng toàn cầu.', 1),
(8, 'Jordan', '/uploads/brands/jordan-logo.png', 'Thương hiệu giày và thời trang Jordan nổi tiếng toàn cầu.', 1),
(9, 'Under Armour', '/uploads/brands/under-armour-logo.png', 'Thương hiệu giày và thời trang Under Armour nổi tiếng toàn cầu.', 1),
(10, 'Asics', '/uploads/brands/asics-logo.png', 'Thương hiệu giày và thời trang Asics nổi tiếng toàn cầu.', 1);
INSERT INTO `brands` (`id`, `name`, `logo_url`, `description`, `is_active`) VALUES
(11, 'Balenciaga', '/uploads/brands/balenciaga-logo.png', 'Thương hiệu giày và thời trang Balenciaga nổi tiếng toàn cầu.', 1),
(12, 'Yeezy', '/uploads/brands/yeezy-logo.png', 'Thương hiệu giày và thời trang Yeezy nổi tiếng toàn cầu.', 1),
(13, 'Fila', '/uploads/brands/fila-logo.png', 'Thương hiệu giày và thời trang Fila nổi tiếng toàn cầu.', 1),
(14, 'Crocs', '/uploads/brands/crocs-logo.png', 'Thương hiệu giày và thời trang Crocs nổi tiếng toàn cầu.', 1),
(15, 'Skechers', '/uploads/brands/skechers-logo.png', 'Thương hiệu giày và thời trang Skechers nổi tiếng toàn cầu.', 1),
(16, 'Mizuno', '/uploads/brands/mizuno-logo.png', 'Thương hiệu giày và thời trang Mizuno nổi tiếng toàn cầu.', 1),
(17, 'Timberland', '/uploads/brands/timberland-logo.png', 'Thương hiệu giày và thời trang Timberland nổi tiếng toàn cầu.', 1),
(18, 'Dr. Martens', '/uploads/brands/dr-martens-logo.png', 'Thương hiệu giày và thời trang Dr. Martens nổi tiếng toàn cầu.', 1),
(19, 'Supreme', '/uploads/brands/supreme-logo.png', 'Thương hiệu giày và thời trang Supreme nổi tiếng toàn cầu.', 1),
(20, 'Gucci', '/uploads/brands/gucci-logo.png', 'Thương hiệu giày và thời trang Gucci nổi tiếng toàn cầu.', 1);
INSERT INTO `brands` (`id`, `name`, `logo_url`, `description`, `is_active`) VALUES
(21, 'Prada', '/uploads/brands/prada-logo.png', 'Thương hiệu giày và thời trang Prada nổi tiếng toàn cầu.', 1),
(22, 'Alexander McQueen', '/uploads/brands/alexander-mcqueen-logo.png', 'Thương hiệu giày và thời trang Alexander McQueen nổi tiếng toàn cầu.', 1),
(23, 'Off-White', '/uploads/brands/off-white-logo.png', 'Thương hiệu giày và thời trang Off-White nổi tiếng toàn cầu.', 1),
(24, 'Salomon', '/uploads/brands/salomon-logo.png', 'Thương hiệu giày và thời trang Salomon nổi tiếng toàn cầu.', 1),
(25, 'Lacoste', '/uploads/brands/lacoste-logo.png', 'Thương hiệu giày và thời trang Lacoste nổi tiếng toàn cầu.', 1);

-- Dumping data for table `products`
INSERT INTO `products` (`id`, `category_id`, `brand_id`, `name`, `slug`, `description`, `main_image_url`, `gender`, `sport_type`, `is_active`, `is_featured`, `sold_count`, `created_at`, `updated_at`) VALUES
(1, 15, 1, 'Nike Air Force 1', 'nike-air-force-1', 'Sản phẩm Nike Air Force 1 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/nike-air-force-1.png', 'unisex', 'lifestyle', 1, 1, 39, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(2, 6, 2, 'Adidas Ultraboost 22', 'adidas-ultraboost-22', 'Sản phẩm Adidas Ultraboost 22 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/adidas-ultraboost-22.png', 'unisex', 'running', 1, 0, 37, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(3, 15, 3, 'Puma Suede Classic', 'puma-suede-classic', 'Sản phẩm Puma Suede Classic chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/puma-suede-classic.png', 'unisex', 'lifestyle', 1, 0, 71, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(4, 15, 4, 'Reebok Club C 85', 'reebok-club-c-85', 'Sản phẩm Reebok Club C 85 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/reebok-club-c-85.png', 'unisex', 'lifestyle', 1, 0, 46, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(5, 15, 5, 'Vans Old Skool', 'vans-old-skool', 'Sản phẩm Vans Old Skool chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/vans-old-skool.png', 'unisex', 'lifestyle', 1, 0, 62, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(6, 16, 6, 'Converse Chuck Taylor All Star', 'converse-chuck-taylor-all-star', 'Sản phẩm Converse Chuck Taylor All Star chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/converse-chuck-taylor-all-star.png', 'unisex', 'lifestyle', 1, 1, 7, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(7, 15, 7, 'New Balance 574', 'new-balance-574', 'Sản phẩm New Balance 574 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/new-balance-574.png', 'unisex', 'lifestyle', 1, 0, 79, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(8, 7, 8, 'Air Jordan 1 Retro High', 'air-jordan-1-retro-high', 'Sản phẩm Air Jordan 1 Retro High chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/air-jordan-1-retro-high.png', 'unisex', 'basketball', 1, 0, 58, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(9, 7, 9, 'Under Armour Curry Flow 9', 'under-armour-curry-flow-9', 'Sản phẩm Under Armour Curry Flow 9 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/under-armour-curry-flow-9.png', 'male', 'basketball', 1, 0, 6, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(10, 6, 10, 'Asics Gel-Kayano 28', 'asics-gel-kayano-28', 'Sản phẩm Asics Gel-Kayano 28 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/asics-gel-kayano-28.png', 'unisex', 'running', 1, 0, 95, '2026-06-17 13:42:55', '2026-06-17 13:42:55');
INSERT INTO `products` (`id`, `category_id`, `brand_id`, `name`, `slug`, `description`, `main_image_url`, `gender`, `sport_type`, `is_active`, `is_featured`, `sold_count`, `created_at`, `updated_at`) VALUES
(11, 15, 11, 'Balenciaga Triple S', 'balenciaga-triple-s', 'Sản phẩm Balenciaga Triple S chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/balenciaga-triple-s.png', 'unisex', 'lifestyle', 1, 1, 79, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(12, 15, 12, 'Yeezy Boost 350 V2', 'yeezy-boost-350-v2', 'Sản phẩm Yeezy Boost 350 V2 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/yeezy-boost-350-v2.png', 'unisex', 'lifestyle', 1, 0, 4, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(13, 15, 13, 'Fila Disruptor II', 'fila-disruptor-ii', 'Sản phẩm Fila Disruptor II chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/fila-disruptor-ii.png', 'unisex', 'lifestyle', 1, 0, 18, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(14, 24, 14, 'Crocs Classic Clog', 'crocs-classic-clog', 'Sản phẩm Crocs Classic Clog chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/crocs-classic-clog.png', 'unisex', NULL, 1, 0, 44, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(15, 9, 15, 'Skechers D\'Lites', 'skechers-dlites', 'Sản phẩm Skechers D\'Lites chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/skechers-dlites.png', 'female', 'training', 1, 0, 27, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(16, 6, 16, 'Mizuno Wave Rider 25', 'mizuno-wave-rider-25', 'Sản phẩm Mizuno Wave Rider 25 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/mizuno-wave-rider-25.png', 'male', 'running', 1, 1, 87, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(17, 16, 17, 'Timberland 6-Inch Premium Boot', 'timberland-6-inch-premium-boot', 'Sản phẩm Timberland 6-Inch Premium Boot chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/timberland-6-inch-premium-boot.png', 'male', NULL, 1, 0, 36, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(18, 14, 18, 'Dr. Martens 1460 8-Eye Boot', 'dr-martens-1460-8-eye-boot', 'Sản phẩm Dr. Martens 1460 8-Eye Boot chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/dr-martens-1460-8-eye-boot.png', 'unisex', NULL, 1, 0, 50, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(19, 15, 19, 'Supreme x Nike SB Dunk Low', 'supreme-x-nike-sb-dunk-low', 'Sản phẩm Supreme x Nike SB Dunk Low chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/supreme-x-nike-sb-dunk-low.png', 'unisex', 'lifestyle', 1, 0, 71, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(20, 15, 20, 'Gucci Ace Sneaker', 'gucci-ace-sneaker', 'Sản phẩm Gucci Ace Sneaker chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/gucci-ace-sneaker.png', 'unisex', 'lifestyle', 1, 0, 46, '2026-06-17 13:42:55', '2026-06-17 13:42:55');
INSERT INTO `products` (`id`, `category_id`, `brand_id`, `name`, `slug`, `description`, `main_image_url`, `gender`, `sport_type`, `is_active`, `is_featured`, `sold_count`, `created_at`, `updated_at`) VALUES
(21, 15, 21, 'Prada Cloudbust Thunder', 'prada-cloudbust-thunder', 'Sản phẩm Prada Cloudbust Thunder chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/prada-cloudbust-thunder.png', 'unisex', 'lifestyle', 1, 1, 47, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(22, 15, 22, 'Alexander McQueen Oversized Sneaker', 'alexander-mcqueen-oversized-sneaker', 'Sản phẩm Alexander McQueen Oversized Sneaker chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/alexander-mcqueen-oversized-sneaker.png', 'unisex', 'lifestyle', 1, 0, 98, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(23, 15, 23, 'Off-White ODSY-1000', 'off-white-odsy-1000', 'Sản phẩm Off-White ODSY-1000 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/off-white-odsy-1000.png', 'unisex', 'lifestyle', 1, 0, 94, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(24, 6, 24, 'Salomon Speedcross 5', 'salomon-speedcross-5', 'Sản phẩm Salomon Speedcross 5 chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/salomon-speedcross-5.png', 'unisex', 'running', 1, 0, 13, '2026-06-17 13:42:55', '2026-06-17 13:42:55'),
(25, 15, 25, 'Lacoste Carnaby Cool', 'lacoste-carnaby-cool', 'Sản phẩm Lacoste Carnaby Cool chất lượng cao từ nhà sản xuất uy tín.', '/uploads/products/lacoste-carnaby-cool.png', 'unisex', 'lifestyle', 1, 0, 64, '2026-06-17 13:42:55', '2026-06-17 13:42:55');

-- Dumping data for table `addresses`
INSERT INTO `addresses` (`id`, `user_id`, `receiver_name`, `phone`, `address_line`, `ward`, `district`, `city`, `is_default`) VALUES
(1, 3, 'Nguyễn Văn An', '0912345610', '123 Đường Lê Lợi', 'Bến Thành', 'Quận 1', 'Hồ Chí Minh', 1),
(2, 4, 'Trần Thị Bình', '0912345611', '456 Phố Huế', 'Ngô Thì Nhậm', 'Hai Bà Trưng', 'Hà Nội', 1),
(3, 5, 'Lê Hoàng Cường', '0912345612', '789 Nguyễn Văn Linh', 'Nam Dương', 'Hải Châu', 'Đà Nẵng', 1),
(4, 6, 'Phạm Minh Duy', '0912345613', '12 Đại lộ Bình Dương', 'Phú Cường', 'Thủ Dầu Một', 'Bình Dương', 1),
(5, 7, 'Hoàng Thu Giang', '0912345614', '34 Lê Hồng Phong', 'Đông Khê', 'Ngô Quyền', 'Hải Phòng', 1),
(6, 8, 'Vũ Hải Nam', '0912345615', '56 Trần Hưng Đạo', 'Vĩnh Thanh Vân', 'Rạch Giá', 'Kiên Giang', 1),
(7, 9, 'Đặng Ngọc Hân', '0912345616', '78 Hùng Vương', 'Thới Bình', 'Ninh Kiều', 'Cần Thơ', 1),
(8, 10, 'Bùi Quốc Khánh', '0912345617', '90 Quang Trung', 'Lộc Thọ', 'Nha Trang', 'Khánh Hòa', 1),
(9, 11, 'Đỗ Thùy Linh', '0912345618', '101 Nguyễn Thị Minh Khai', 'Phường 5', 'Đà Lạt', 'Lâm Đồng', 1),
(10, 12, 'Ngô Thanh Sơn', '0912345619', '202 Trần Phú', 'Cẩm Tây', 'Cẩm Phả', 'Quảng Ninh', 1);
INSERT INTO `addresses` (`id`, `user_id`, `receiver_name`, `phone`, `address_line`, `ward`, `district`, `city`, `is_default`) VALUES
(11, 13, 'Dương Hồng Ngọc', '0912345620', '303 Phan Đình Phùng', 'Quyết Thắng', 'Kon Tum', 'Kon Tum', 1),
(12, 14, 'Lý Quốc Bảo', '0912345621', '404 Nguyễn Huệ', 'Phường 1', 'Vĩnh Long', 'Vĩnh Long', 1),
(13, 15, 'Phan Văn Đức', '0912345622', '505 Lê Duẩn', 'Tự An', 'Buôn Ma Thuột', 'Đắk Lắk', 1),
(14, 16, 'Tống Khánh Huyền', '0912345623', '606 Bà Triệu', 'Trường Thi', 'Thanh Hóa', 'Thanh Hóa', 1),
(15, 17, 'Võ Hoài Nam', '0912345624', '707 Nguyễn Sinh Cung', 'Vỹ Dạ', 'Huế', 'Thừa Thiên Huế', 1),
(16, 18, 'Trịnh Gia Bảo', '0912345625', '808 Cách Mạng Tháng 8', 'Phường 3', 'Tây Ninh', 'Tây Ninh', 1),
(17, 19, 'Đoàn Minh Triết', '0912345626', '909 Hùng Vương', 'Quang Trung', 'Uông Bí', 'Quảng Ninh', 1),
(18, 20, 'Đinh Công Tráng', '0912345627', '111 Nguyễn Du', 'Trung Đô', 'Vinh', 'Nghệ An', 1),
(19, 21, 'Lâm Gia Tuệ', '0912345628', '222 Lê Lợi', 'Vĩnh Mỹ', 'Châu Đốc', 'An Giang', 1),
(20, 22, 'Mai Phương Chi', '0912345629', '333 Nguyễn Trãi', 'Thanh Xuân Nam', 'Thanh Xuân', 'Hà Nội', 1);
INSERT INTO `addresses` (`id`, `user_id`, `receiver_name`, `phone`, `address_line`, `ward`, `district`, `city`, `is_default`) VALUES
(21, 23, 'Phùng Hữu Phước', '0912345630', '444 Nguyễn Văn Cừ', 'An Hòa', 'Ninh Kiều', 'Cần Thơ', 1),
(22, 24, 'Diệp Anh Thư', '0912345631', '555 Trần Hưng Đạo', 'An Hải Tây', 'Sơn Trà', 'Đà Nẵng', 1),
(23, 25, 'Quách Thái Sơn', '0912345632', '666 Nguyễn Đình Chiểu', 'Phường 3', 'Quận 3', 'Hồ Chí Minh', 1),
(24, 3, 'Nguyễn Văn An (Cơ quan)', '0912345610', '99 Tôn Đức Thắng', 'Bến Nghé', 'Quận 1', 'Hồ Chí Minh', 0),
(25, 4, 'Trần Thị Bình (Nhà riêng)', '0912345611', '88 Kim Mã', 'Kim Mã', 'Ba Đình', 'Hà Nội', 0);

-- Dumping data for table `otp_pending`
INSERT INTO `otp_pending` (`id`, `email`, `full_name`, `phone`, `hashed_password`, `otp`, `resend_count`, `expires_at`, `created_at`) VALUES
(1, 'pending1@example.com', 'Khách Hàng Chờ 1', '099999911', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '378653', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(2, 'pending2@example.com', 'Khách Hàng Chờ 2', '099999912', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '339914', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(3, 'pending3@example.com', 'Khách Hàng Chờ 3', '099999913', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '797422', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(4, 'pending4@example.com', 'Khách Hàng Chờ 4', '099999914', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '348862', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(5, 'pending5@example.com', 'Khách Hàng Chờ 5', '099999915', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '453165', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(6, 'pending6@example.com', 'Khách Hàng Chờ 6', '099999916', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '866940', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(7, 'pending7@example.com', 'Khách Hàng Chờ 7', '099999917', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '573748', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(8, 'pending8@example.com', 'Khách Hàng Chờ 8', '099999918', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '268629', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(9, 'pending9@example.com', 'Khách Hàng Chờ 9', '099999919', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '247057', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(10, 'pending10@example.com', 'Khách Hàng Chờ 10', '099999920', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '740339', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55');
INSERT INTO `otp_pending` (`id`, `email`, `full_name`, `phone`, `hashed_password`, `otp`, `resend_count`, `expires_at`, `created_at`) VALUES
(11, 'pending11@example.com', 'Khách Hàng Chờ 11', '099999921', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '623951', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(12, 'pending12@example.com', 'Khách Hàng Chờ 12', '099999922', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '748123', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(13, 'pending13@example.com', 'Khách Hàng Chờ 13', '099999923', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '867286', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(14, 'pending14@example.com', 'Khách Hàng Chờ 14', '099999924', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '632081', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(15, 'pending15@example.com', 'Khách Hàng Chờ 15', '099999925', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '798605', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(16, 'pending16@example.com', 'Khách Hàng Chờ 16', '099999926', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '245530', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(17, 'pending17@example.com', 'Khách Hàng Chờ 17', '099999927', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '897970', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(18, 'pending18@example.com', 'Khách Hàng Chờ 18', '099999928', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '220601', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(19, 'pending19@example.com', 'Khách Hàng Chờ 19', '099999929', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '478344', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(20, 'pending20@example.com', 'Khách Hàng Chờ 20', '099999930', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '421971', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55');
INSERT INTO `otp_pending` (`id`, `email`, `full_name`, `phone`, `hashed_password`, `otp`, `resend_count`, `expires_at`, `created_at`) VALUES
(21, 'pending21@example.com', 'Khách Hàng Chờ 21', '099999931', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '304165', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(22, 'pending22@example.com', 'Khách Hàng Chờ 22', '099999932', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '507910', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(23, 'pending23@example.com', 'Khách Hàng Chờ 23', '099999933', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '498249', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(24, 'pending24@example.com', 'Khách Hàng Chờ 24', '099999934', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '213677', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55'),
(25, 'pending25@example.com', 'Khách Hàng Chờ 25', '099999935', '$2a$10$wbor.uyK.K6BPcYNsJOrqe8IJRFI9gKGG0cC6I7K9X/g.wm.DWeh6', '334978', 0, '2027-06-17 13:42:55', '2026-06-17 13:42:55');

SET FOREIGN_KEY_CHECKS = 1;
