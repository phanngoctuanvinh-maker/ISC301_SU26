import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Retrieve user details from localStorage
  const userString = localStorage.getItem('user');
  let user = null;
  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      console.error(e);
    }
  }

  // Handle Logout action
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Determine current page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Bảng Điều Khiển';
    if (path.includes('/admin/products') && path.includes('/variants')) return 'Quản Lý Biến Thể';
    if (path.includes('/admin/products')) return 'Quản Lý Sản Phẩm';
    if (path.includes('/admin/categories')) return 'Quản Lý Danh Mục';
    if (path.includes('/admin/brands')) return 'Quản Lý Thương Hiệu';
    if (path.includes('/admin/banners')) return 'Quản Lý Banner';
    if (path.includes('/admin/vouchers')) return 'Quản Lý Voucher';
    if (path.includes('/admin/flashsales')) return 'Quản Lý Flash Sale';
    if (path.includes('/admin/orders')) return 'Quản Lý Đơn Hàng';
    if (path.includes('/admin/support')) return 'Chăm Sóc Khách Hàng';
    return 'Trang Quản Trị';
  };

  return (
    <div className="admin-layout-container">
      {/* Mobile Sidebar Backdrop */}
      <div 
        className={`admin-sidebar-backdrop ${sidebarOpen ? 'show' : ''}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar Panel */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          SHOES STORE
        </div>

        <nav className="admin-sidebar-menu">
          <NavLink 
            to="/admin" 
            end 
            className={({ isActive }) => `admin-menu-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9"></rect>
              <rect x="14" y="3" width="7" height="5"></rect>
              <rect x="14" y="12" width="7" height="9"></rect>
              <rect x="3" y="16" width="7" height="5"></rect>
            </svg>
            Tổng Quan
          </NavLink>

          <NavLink 
            to="/admin/products" 
            className={({ isActive }) => `admin-menu-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="9" x2="15" y2="9"></line>
              <line x1="9" y1="13" x2="15" y2="13"></line>
              <line x1="9" y1="17" x2="15" y2="17"></line>
            </svg>
            Quản Lý Sản Phẩm
          </NavLink>

          <NavLink 
            to="/admin/categories" 
            className={({ isActive }) => `admin-menu-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
            Quản Lý Danh Mục
          </NavLink>

          <NavLink 
            to="/admin/brands" 
            className={({ isActive }) => `admin-menu-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            Quản Lý Thương Hiệu
          </NavLink>

          <NavLink 
            to="/admin/banners" 
            className={({ isActive }) => `admin-menu-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
            Quản Lý Banner
          </NavLink>

          <NavLink 
            to="/admin/vouchers" 
            className={({ isActive }) => `admin-menu-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M12 5v14"/>
              <path d="M2 9a3 3 0 0 1 0 6"/>
              <path d="M22 9a3 3 0 0 0 0 6"/>
            </svg>
            Quản Lý Voucher
          </NavLink>

          <NavLink 
            to="/admin/flashsales" 
            className={({ isActive }) => `admin-menu-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Quản Lý Flash Sale
          </NavLink>

          <NavLink 
            to="/admin/orders" 
            className={({ isActive }) => `admin-menu-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Quản Lý Đơn Hàng
          </NavLink>

          <NavLink 
            to="/admin/support" 
            className={({ isActive }) => `admin-menu-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            Chăm Sóc Khách Hàng
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <button 
            onClick={() => navigate('/profile')} 
            className="btn btn-secondary" 
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 1rem', justifyContent: 'flex-start' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Quay lại cửa hàng
          </button>
          
          <button 
            onClick={handleLogout} 
            className="btn btn-danger" 
            style={{ width: '100%', fontSize: '0.85rem', padding: '0.5rem 1rem', justifyContent: 'flex-start', boxShadow: 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main-viewport">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button 
              className="admin-mobile-toggle" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle Sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="admin-topbar-title">{getPageTitle()}</h2>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-user-profile">
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.full_name || 'Admin'}</span>
              <span className="admin-role-badge">Admin</span>
            </div>
          </div>
        </header>

        {/* Dynamic Nested Page Content */}
        <main className="admin-content-scroller">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
