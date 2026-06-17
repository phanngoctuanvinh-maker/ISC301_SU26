import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  
  let user = null;
  if (userString) {
    try {
      user = JSON.parse(userString);
    } catch (e) {
      console.error(e);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container flex justify-between items-center">
        <Link to="/" className="logo-text">
          SHOES STORE
        </Link>
        
        <div className="user-menu">
          {token ? (
            <>
              {user?.role === 'admin' && (
                <Link to="/admin" style={{ marginRight: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
                  Quản trị viên
                </Link>
              )}
              <Link to="/addresses" style={{ marginRight: '1rem', fontWeight: 500 }}>
                Địa chỉ nhận hàng
              </Link>
              <Link to="/profile" style={{ marginRight: '1rem', fontWeight: 500 }}>
                Trang cá nhân
              </Link>
              <span style={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                Chào, {user?.full_name || 'User'}
              </span>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', marginRight: '0.5rem' }}>
                Đăng nhập
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
