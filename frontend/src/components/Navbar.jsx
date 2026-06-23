import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');

  const [cart, setCart] = useState({ items: [], summary: { total_items: 0, subtotal: 0 } });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
    setCart({ items: [], summary: { total_items: 0, subtotal: 0 } });
    setIsDrawerOpen(false);
    navigate('/');
  };

  const fetchCart = async () => {
    if (!token) return;
    try {
      const res = await api.get('/cart');
      setCart(res.data || { items: [], summary: { total_items: 0, subtotal: 0 } });
    } catch (_) {}
  };

  useEffect(() => {
    fetchCart();

    const handleCartUpdate = () => {
      fetchCart();
    };

    const handleOpenDrawer = () => {
      setIsDrawerOpen(true);
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    window.addEventListener('open-cart-drawer', handleOpenDrawer);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      window.removeEventListener('open-cart-drawer', handleOpenDrawer);
    };
  }, [token]);

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      await api.put(`/cart/items/${itemId}`, { quantity: newQty });
      fetchCart();
      window.dispatchEvent(new Event('cart-updated')); // Sync others
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật số lượng');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      fetchCart();
      window.dispatchEvent(new Event('cart-updated')); // Sync others
    } catch (err) {
      alert(err.message || 'Lỗi xóa sản phẩm');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) return;
    try {
      await api.delete('/cart');
      fetchCart();
      window.dispatchEvent(new Event('cart-updated')); // Sync others
    } catch (err) {
      alert(err.message || 'Lỗi xóa giỏ hàng');
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="container flex justify-between items-center">
          <div className="flex items-center" style={{ gap: '2rem' }}>
            <Link to="/" className="logo-text">
              SHOES STORE
            </Link>
          </div>
          
          <div className="user-menu">
            {token ? (
              <>
                {/* Cart Trigger Button */}
                <button className="cart-nav-btn" onClick={() => setIsDrawerOpen(true)} style={{ marginRight: '0.5rem' }}>
                  🛒 Giỏ hàng
                  {cart.summary?.total_items > 0 && (
                    <span className="cart-badge-count">{cart.summary.total_items}</span>
                  )}
                </button>

                {user?.role === 'admin' && (
                  <Link to="/admin" className="nav-link" style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    ⚙️ Quản trị
                  </Link>
                )}
                <Link to="/wishlist" className="nav-link">❤️ Yêu thích</Link>
                <Link to="/addresses" className="nav-link">📍 Địa chỉ</Link>
                <Link to="/profile" className="nav-link">👤 Cá nhân</Link>

                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0 0.25rem' }}>
                  Chào, <strong style={{ color: 'var(--text-primary)' }}>{user?.full_name?.split(' ').pop() || 'User'}</strong>
                </span>
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', borderColor: 'hsla(262, 60%, 80%, 0.4)' }}>
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

      {/* Cart Side Drawer Overlay */}
      <div className={`cart-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)}>
        <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="cart-drawer-header">
            <h3 className="cart-drawer-title">🛒 Giỏ hàng của bạn</h3>
            <button className="cart-drawer-close" onClick={() => setIsDrawerOpen(false)}>✕</button>
          </div>

          <div className="cart-drawer-body">
            {cart.items.length === 0 ? (
              <div className="cart-drawer-empty">
                <div style={{ fontSize: '2.5rem' }}>🛒</div>
                <p>Giỏ hàng của bạn đang trống</p>
                <button className="btn btn-primary" onClick={() => setIsDrawerOpen(false)} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  Mua sắm ngay
                </button>
              </div>
            ) : (
              cart.items.map((item) => {
                const imgUrl = item.main_image_url
                  ? `http://localhost:8080${item.main_image_url}`
                  : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';

                return (
                  <div key={item.id} className="cart-item-card">
                    <div className="cart-item-img-box">
                      <img src={imgUrl} alt={item.name} />
                    </div>

                    <div className="cart-item-detail">
                      <Link 
                        to={`/product/${item.slug}`} 
                        className="cart-item-name"
                        onClick={() => setIsDrawerOpen(false)}
                      >
                        {item.name}
                      </Link>
                      <div className="cart-item-meta">
                        Thương hiệu: {item.brand_name} | Size: {item.size}
                      </div>
                      
                      <div className="cart-item-price-qty">
                        <span className="cart-item-price-sum">
                          {item.line_total ? item.line_total.toLocaleString('vi-VN') + 'đ' : '0đ'}
                        </span>

                        <div className="cart-item-qty-selector">
                          <button 
                            onClick={() => handleUpdateQty(item.id, item.quantity - 1)} 
                            className="cart-item-qty-btn"
                          >-</button>
                          <input type="text" readOnly value={item.quantity} className="cart-item-qty-val" />
                          <button 
                            onClick={() => handleUpdateQty(item.id, item.quantity + 1)} 
                            className="cart-item-qty-btn"
                          >+</button>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRemoveItem(item.id)} 
                      className="cart-item-delete-btn" 
                      style={{ alignSelf: 'flex-start', margin: '-4px' }}
                      title="Xóa"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="cart-drawer-footer">
              <div className="cart-footer-row">
                <span className="cart-subtotal-title">Tổng tiền:</span>
                <span className="cart-subtotal-val">
                  {cart.summary?.subtotal ? cart.summary.subtotal.toLocaleString('vi-VN') + 'đ' : '0đ'}
                </span>
              </div>

              <div className="cart-footer-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                  <button onClick={handleClearCart} className="cart-clear-btn" style={{ flex: 1 }}>
                    Xóa tất cả
                  </button>
                  <button 
                    onClick={() => {
                      setIsDrawerOpen(false);
                      navigate('/cart');
                    }} 
                    className="cart-clear-btn"
                    style={{ flex: 1, color: 'var(--accent)' }}
                  >
                    Xem chi tiết
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate('/cart');
                  }} 
                  className="cart-checkout-btn"
                  style={{ width: '100%', padding: '0.85rem' }}
                >
                  Thanh toán ngay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Navbar;
