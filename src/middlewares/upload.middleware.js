const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { errorResponse } = require('../utils/response.util');

// Cấu hình thư mục lưu trữ và tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars/';
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const userId = req.user ? req.user.userId : 'unknown';
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(3).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${userId}_${timestamp}_${randomHex}${ext}`);
  }
});

// Bộ lọc định dạng file ảnh
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh JPG, PNG hoặc WEBP'), false);
  }
};

// Giới hạn kích thước file (Tối đa 2MB)
const limits = {
  fileSize: 2 * 1024 * 1024
};

// Khởi tạo multer middleware cho trường "avatar"
const uploadAvatar = multer({ storage, fileFilter, limits }).single('avatar');

// Cấu hình lưu trữ riêng cho danh mục
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/categories/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(3).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `category_${timestamp}_${randomHex}${ext}`);
  }
});

// Khởi tạo multer middleware cho trường "image"
const uploadCategoryImage = multer({ storage: categoryStorage, fileFilter, limits }).single('image');

// Cấu hình lưu trữ riêng cho logo thương hiệu
const brandStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/brands/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(3).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `brand_${timestamp}_${randomHex}${ext}`);
  }
});

// Khởi tạo multer middleware cho trường "logo"
const uploadBrandLogo = multer({ storage: brandStorage, fileFilter, limits }).single('logo');

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/products/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(3).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `product_${timestamp}_${randomHex}${ext}`);
  }
});

const uploadProductImage = multer({ storage: productStorage, fileFilter, limits }).single('image');

// Cấu hình tải nhiều ảnh sản phẩm (tối đa 8 ảnh)
const uploadProductImages = multer({
  storage: productStorage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB mỗi file
    files: 8 // Tối đa 8 files
  }
}).array('images', 8);

// Cấu hình lưu trữ riêng cho banner
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/banners/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(3).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `banner_${timestamp}_${randomHex}${ext}`);
  }
});

// Khởi tạo multer cho banner (Tối đa 3MB)
const uploadBannerImage = multer({
  storage: bannerStorage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 }
}).single('image');

// Middleware bọc lỗi để bắt lỗi của Multer và định dạng lại response lỗi
const handleUploadError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        let message = 'File không được vượt quá 2MB';
        if (err.field === 'avatar') {
          message = 'Ảnh đại diện không được vượt quá 2MB';
        } else if (err.field === 'logo') {
          message = 'Logo thương hiệu không được vượt quá 2MB';
        } else if (err.field === 'image') {
          if (req.originalUrl && req.originalUrl.includes('banners')) {
            message = 'Ảnh banner không được vượt quá 3MB';
          } else {
            message = 'Ảnh danh mục không được vượt quá 2MB';
          }
        } else if (err.field === 'images') {
          message = 'Ảnh sản phẩm không được vượt quá 2MB';
        }
        return errorResponse(res, message, 400);
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return errorResponse(res, 'Chỉ được upload tối đa 8 ảnh', 400);
      }
      return errorResponse(res, err.message, 400);
    } else if (err) {
      return errorResponse(res, err.message, 400);
    }
    next();
  });
};

module.exports = {
  uploadAvatar,
  uploadBrandLogo,
  uploadCategoryImage,
  uploadProductImage,
  uploadProductImages,
  uploadBannerImage,
  handleUploadError
};
