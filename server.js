require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorResponse } = require('./src/utils/response.util');
const { startOtpCleanupJob } = require('./src/jobs/otp.cleanup.job');

const app = express();

// 1. parse body JSON
app.use(express.json());

// 2. parse form data
app.use(express.urlencoded({ extended: true }));

// 3. CORS configuration
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Mount routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', require('./src/modules/auth/auth.routes'));
app.use('/api/profile', require('./src/modules/profile/profile.routes'));
app.use('/api/admin/categories', require('./src/modules/admin/category/category.routes'));
app.use('/api/admin/brands', require('./src/modules/admin/brand/brand.routes'));

// 5. Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]:', err);
  const statusCode = err.status || 500;
  const message = err.message || 'Lỗi hệ thống';
  const errors = err.errors || null;
  return errorResponse(res, message, statusCode, errors);
});

// 6. Listen port
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

// 7. Khởi động cron job dọn dẹp OTP hết hạn
startOtpCleanupJob();

module.exports = app;
