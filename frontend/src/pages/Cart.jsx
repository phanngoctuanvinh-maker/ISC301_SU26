import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Cart.css';

function Cart() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [cart, setCart] = useState({ items: [], summary: { total_items: 0, subtotal: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Checkout states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutNote, setCheckoutNote] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Vui lòng đăng nhập để xem giỏ hàng của bạn.');
      setLoading(false);
      setTimeout(() => navigate('/login'), 2500);
      return;
    }
    fetchCart();
    fetchAddresses();
  }, [token]);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data || []);
      const defaultAddr = res.data?.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (res.data?.length > 0) {
        setSelectedAddressId(res.data[0].id);
      }
    } catch (err) {
      console.error('Lỗi tải địa chỉ:', err);
    }
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      setCart(res.data || { items: [], summary: { total_items: 0, subtotal: 0 } });
    } catch (err) {
      setError(err.message || 'Lỗi khi tải thông tin giỏ hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      await api.put(`/cart/items/${itemId}`, { quantity: newQty });
      
      // Update local cart state instantly for fluid UX
      setCart(prev => {
        const updatedItems = prev.items.map(item => {
          if (item.id === itemId) {
            const nextQty = newQty;
            return {
              ...item,
              quantity: nextQty,
              line_total: item.price * nextQty
            };
          }
          return item;
        });

        return {
          items: updatedItems,
          summary: {
            total_items: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: updatedItems.reduce((sum, i) => sum + i.line_total, 0)
          }
        };
      });

      // Dispatch global cart event to sync navbar badge count
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setError(err.message || 'Lỗi cập nhật số lượng');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      setCart(prev => {
        const updatedItems = prev.items.filter(item => item.id !== itemId);
        return {
          items: updatedItems,
          summary: {
            total_items: updatedItems.reduce((sum, i) => sum + i.quantity, 0),
            subtotal: updatedItems.reduce((sum, i) => sum + i.line_total, 0)
          }
        };
      });
      setSuccess('Đã xóa sản phẩm khỏi giỏ hàng.');
      setTimeout(() => setSuccess(''), 3000);

      // Sync navbar cart
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setError(err.message || 'Lỗi xóa sản phẩm');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?')) return;
    try {
      await api.delete('/cart');
      setCart({ items: [], summary: { total_items: 0, subtotal: 0 } });
      setSuccess('Đã xóa toàn bộ giỏ hàng.');
      setTimeout(() => setSuccess(''), 3000);

      // Sync navbar cart
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setError(err.message || 'Lỗi xóa giỏ hàng');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Vui lòng chọn địa chỉ nhận hàng');
      return;
    }
    try {
      setCheckoutLoading(true);
      const res = await api.post('/orders/checkout', {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        note: checkoutNote
      });
      setShowCheckoutModal(false);
      setCart({ items: [], summary: { total_items: 0, subtotal: 0 } });
      window.dispatchEvent(new Event('cart-updated'));
      
      if (res.data?.payment?.payment_url) {
        window.location.href = res.data.payment.payment_url;
      } else {
        alert('Đặt hàng thành công!');
        navigate('/profile');
      }
    } catch (err) {
      setError(err.message || 'Lỗi đặt hàng');
      setTimeout(() => setError(''), 4000);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '5rem' }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>Đang tải thông tin giỏ hàng...</h3>
      </div>
    );
  }

  // Cost calculations
  const subtotal = cart.summary?.subtotal || 0;
  const shippingFee = subtotal > 2000000 || subtotal === 0 ? 0 : 30000;
  const totalAmount = subtotal + shippingFee;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      
      {/* Blue Header Bar similar to screenshot */}
      <header className="cart-page-header">
        <button className="cart-back-btn" onClick={() => navigate(-1)} title="Quay lại">
          ‹
        </button>
        <span className="cart-page-title">Giỏ hàng của bạn</span>
      </header>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {cart.items.length === 0 ? (
        /* Glassmorphic Empty Cart block similar to screenshot but premium style */
        <div className="glass-card cart-empty-card">
          <div className="cart-empty-icon-wrapper">
            🛒
          </div>
          <h3 className="cart-empty-title">Giỏ hàng trống</h3>
          <p className="cart-empty-desc">
            Chưa có sản phẩm nào trong giỏ hàng. 
            Hãy khám phá hàng ngàn đôi giày chính hãng mới nhất của chúng tôi ngay!
          </p>
          <Link to="/" className="btn btn-primary" style={{ padding: '0.85rem 2.25rem' }}>
            TIẾP TỤC MUA SẮM
          </Link>
        </div>
      ) : (
        /* Filled Cart Dual Column */
        <div className="cart-filled-layout">
          
          {/* Left: Cart Items List */}
          <div className="cart-items-column">
            {cart.items.map((item) => {
              const imgUrl = item.main_image_url
                ? `http://localhost:8080${item.main_image_url}`
                : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200';

              return (
                <div key={item.id} className="cart-page-item-card">
                  <div className="cart-page-item-img">
                    <img src={imgUrl} alt={item.name} />
                  </div>

                  <div className="cart-page-item-info">
                    <div className="flex justify-between items-start" style={{ gap: '1rem' }}>
                      <Link to={`/product/${item.slug}`} className="cart-page-item-name">
                        {item.name}
                      </Link>
                      
                      <button 
                        onClick={() => handleRemoveItem(item.id)} 
                        className="cart-page-delete-btn"
                        title="Xóa sản phẩm"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="cart-page-item-meta" style={{ marginTop: '0.2rem' }}>
                      Thương hiệu: <span style={{ color: 'var(--text-primary)' }}>{item.brand_name}</span> 
                      {item.size && (
                        <>
                          {' '}| Size: <span style={{ color: 'var(--text-primary)' }}>{item.size}</span>
                        </>
                      )}
                    </div>

                    <div className="cart-page-item-controls">
                      <span className="cart-page-item-price">
                        {(item.price || 0).toLocaleString('vi-VN')}đ
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
                </div>
              );
            })}

            <div style={{ alignSelf: 'flex-start' }}>
              <button onClick={handleClearCart} className="btn btn-secondary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem' }}>
                Xóa toàn bộ giỏ hàng
              </button>
            </div>
          </div>

          {/* Right: Order Summary Details */}
          <div className="cart-summary-column">
            <div className="glass-card cart-summary-card">
              <h3 className="cart-summary-title">Tóm tắt đơn hàng</h3>
              
              <div className="cart-summary-row">
                <span>Số lượng sản phẩm:</span>
                <strong>{cart.summary?.total_items || 0} sản phẩm</strong>
              </div>

              <div className="cart-summary-row">
                <span>Tạm tính:</span>
                <strong>{subtotal.toLocaleString('vi-VN')}đ</strong>
              </div>

              <div className="cart-summary-row">
                <span>Phí vận chuyển:</span>
                <strong>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}đ`}</strong>
              </div>

              {shippingFee > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '-0.25rem', marginBottom: '0.75rem' }}>
                  * Miễn phí vận chuyển cho đơn hàng từ 2.000.000đ
                </div>
              )}

              <div className="cart-summary-row total">
                <span>Tổng thanh toán:</span>
                <strong style={{ color: 'var(--accent)' }}>{totalAmount.toLocaleString('vi-VN')}đ</strong>
              </div>

              <button onClick={handleCheckout} className="btn-cart-checkout">
                TIẾN HÀNH THANH TOÁN
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <Link to="/" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  ← Tiếp tục chọn giày
                </Link>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Xác nhận Đơn Hàng</h2>
            
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Địa chỉ nhận hàng (Tự động điền)</label>
              {addresses.map(addr => (
                <div 
                  key={addr.id} 
                  style={{ 
                    border: selectedAddressId === addr.id ? '2px solid var(--accent)' : '1px solid var(--glass-border)', 
                    backgroundColor: selectedAddressId === addr.id ? 'rgba(255, 107, 107, 0.05)' : 'transparent',
                    padding: '1rem', 
                    borderRadius: '8px', 
                    marginBottom: '0.75rem', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }} 
                  onClick={() => setSelectedAddressId(addr.id)}
                >
                  <div className="flex justify-between items-center">
                    <strong>{addr.receiver_name} - {addr.phone}</strong>
                    {addr.address_type && <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{addr.address_type}</span>}
                  </div>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {addr.address_line}{addr.ward ? `, ${addr.ward}` : ''}, {addr.district}, {addr.city}
                  </p>
                </div>
              ))}
              <Link to="/addresses" style={{ display: 'inline-block', marginTop: '0.5rem', color: 'var(--accent)', fontSize: '0.9rem', textDecoration: 'underline' }}>
                + Quản lý Sổ địa chỉ
              </Link>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Phương thức thanh toán</label>
              <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                <option value="vnpay">Thanh toán qua VNPAY</option>
              </select>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label className="form-label">Ghi chú (tùy chọn)</label>
              <input 
                type="text" 
                className="form-control" 
                value={checkoutNote} 
                onChange={(e) => setCheckoutNote(e.target.value)} 
                placeholder="Ghi chú cho đơn vị vận chuyển..." 
              />
            </div>

            <div className="flex gap-4" style={{ marginTop: '2rem' }}>
              <button className="btn btn-primary" style={{ flex: 1, padding: '1rem' }} onClick={handlePlaceOrder} disabled={checkoutLoading}>
                {checkoutLoading ? 'Đang xử lý...' : `Đặt hàng (${totalAmount.toLocaleString('vi-VN')}đ)`}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCheckoutModal(false)} disabled={checkoutLoading}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Cart;
