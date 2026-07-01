import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import Addresses from './pages/Addresses';
import Dashboard from './pages/admin/Dashboard';
import Categories from './pages/admin/Categories';
import Brands from './pages/admin/Brands';
import Products from './pages/admin/Products';
import Variants from './pages/admin/Variants';
import Banners from './pages/admin/Banners';
import Vouchers from './pages/admin/Vouchers';
import Flashsales from './pages/admin/Flashsales';
import AdminOrders from './pages/admin/Orders';

import AdminSupport from './pages/admin/Support';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import VNPayReturn from './pages/VNPayReturn';

// Layout components
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from './layouts/AuthLayout';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Layout (Centered forms, no navbars) */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* User / Customer Layout (Persistent storefront header) */}
        <Route element={<UserLayout />}>
          {/* Homepage */}
          <Route path="/" element={<Home />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          
          {/* Protected Customer Routes */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/addresses" 
            element={
              <ProtectedRoute>
                <Addresses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wishlist" 
            element={
              <ProtectedRoute>
                <Wishlist />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/cart" 
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/checkout" 
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/order-success/:id" 
            element={
              <ProtectedRoute>
                <OrderSuccess />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment/vnpay-return" 
            element={
              <ProtectedRoute>
                <VNPayReturn />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Admin Layout (Dedicated sidebar navigation dashboard) */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          {/* Admin nested routes */}
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:productId/variants" element={<Variants />} />
          <Route path="categories" element={<Categories />} />
          <Route path="brands" element={<Brands />} />
          <Route path="banners" element={<Banners />} />
          <Route path="vouchers" element={<Vouchers />} />
          <Route path="flashsales" element={<Flashsales />} />
          <Route path="orders" element={<AdminOrders />} />

          <Route path="support" element={<AdminSupport />} />
        </Route>
        
        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

