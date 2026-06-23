import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await api.get('/wishlist');
      setWishlist(res.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sản phẩm yêu thích.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setWishlist(prev => prev.filter(item => item.product_id !== productId));
      setSuccess('Đã xóa sản phẩm khỏi danh sách yêu thích.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Lỗi khi xóa sản phẩm khỏi danh sách yêu thích.');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>Đang tải danh sách yêu thích...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1.5rem', flex: 1 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Sản Phẩm Yêu Thích</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Quản lý các sản phẩm bạn đã lưu để theo dõi và mua sau.
          </p>
        </div>
        <Link to="/" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          Tiếp tục mua sắm
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {wishlist.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '5rem 3rem', border: '1px dashed var(--glass-border)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>❤️</div>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Danh sách yêu thích trống</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Hãy duyệt qua các sản phẩm và nhấn nút Trái Tim để lưu lại những đôi giày bạn yêu thích nhất!
          </p>
          <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
            Khám phá sản phẩm ngay
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {wishlist.map((item) => {
            const imageUrl = item.main_image_url
              ? `http://localhost:8080${item.main_image_url}`
              : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';

            return (
              <div 
                key={item.product_id} 
                className="glass-card address-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  padding: '1.25rem',
                  gap: '0.75rem',
                  borderRadius: '12px',
                  border: '1px solid var(--glass-border)',
                  position: 'relative'
                }}
              >
                {/* Product Image Container */}
                <div style={{ 
                  width: '100%', 
                  aspectRatio: '1/1', 
                  overflow: 'hidden', 
                  borderRadius: '8px', 
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img 
                    src={imageUrl} 
                    alt={item.name} 
                    style={{ 
                      width: '90%', 
                      height: '90%', 
                      objectFit: 'contain'
                    }}
                  />
                </div>

                {/* Metadata */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: '700', 
                    textTransform: 'uppercase', 
                    color: 'var(--accent)',
                    backgroundColor: 'var(--accent-light)',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    width: 'fit-content'
                  }}>
                    {item.brand_name}
                  </span>

                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    lineHeight: '1.4', 
                    margin: '0.25rem 0',
                    color: 'var(--text-primary)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '2.8rem'
                  }}>
                    {item.name}
                  </h3>

                  <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', marginTop: 'auto' }}>
                    {item.price ? item.price.toLocaleString('vi-VN') + 'đ' : '0đ'}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <Link 
                    to={`/product/${item.slug}`} 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    Xem sản phẩm
                  </Link>
                  <button 
                    onClick={() => handleRemove(item.product_id)} 
                    className="btn btn-secondary" 
                    style={{ 
                      padding: '0.5rem', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      color: 'var(--danger)'
                    }}
                    title="Xóa khỏi yêu thích"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
