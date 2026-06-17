const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorResponse } = require('./utils/response.util');
const { registerSwagger } = require('./docs/swagger');

function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  registerSwagger(app);
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  app.use('/api/auth', require('./modules/auth/auth.routes'));
  app.use('/api/profile', require('./modules/profile/profile.routes'));
  app.use('/api/addresses', require('./modules/address/address.routes'));
  app.use('/api/products', require('./modules/product/product.routes'));
  app.use('/api/categories', require('./modules/catalog/category.public.routes'));
  app.use('/api/brands', require('./modules/catalog/brand.public.routes'));
  app.use('/api/admin/products', require('./modules/admin/product/product.routes'));
  app.use('/api/admin/categories', require('./modules/admin/category/category.routes'));
  app.use('/api/admin/brands', require('./modules/admin/brand/brand.routes'));

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  app.use((err, req, res, next) => {
    console.error('[Global Error Handler]:', err);
    const statusCode = err.status || 500;
    const message = err.message || 'Lỗi hệ thống';
    const errors = err.errors || null;
    return errorResponse(res, message, statusCode, errors);
  });

  return app;
}

module.exports = {
  createApp
};
