import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ProductDetail.css';

function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  // Gallery
  const [activeImage, setActiveImage] = useState('');
  const [allImages, setAllImages] = useState([]);

  // Accessories (Mua kèm)
  const [accessories, setAccessories] = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState([]);

  // Wishlist
  const [isFavorite, setIsFavorite] = useState(false);

  // Modals / Status
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Check login token
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProductDetails();
    fetchAccessories();
  }, [slug]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError('');
      setSelectedSize('');
      setSelectedVariant(null);
      setQuantity(1);

      const res = await api.get(`/products/${slug}`);
      const prodData = res.data;
      setProduct(prodData);
      setVariants(prodData.variants || []);

      // Build product gallery
      const mainImg = prodData.main_image_url
        ? `http://localhost:8080${prodData.main_image_url}`
        : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
      
      setActiveImage(mainImg);

      // Generate mock additional angles for premium look
      const angles = [
        mainImg,
        'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
        'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
        'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'
      ];
      setAllImages(angles);

      // Check wishlist status
      if (token) {
        try {
          const wishRes = await api.get('/wishlist');
          const wishlist = wishRes.data || [];
          const found = wishlist.some(item => item.product_id === prodData.id);
          setIsFavorite(found);
        } catch (_) {}
      } else {
        // Fallback local storage for guests
        const localWish = JSON.parse(localStorage.getItem('guest_wishlist') || '[]');
        setIsFavorite(localWish.includes(prodData.id));
      }

    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessories = async () => {
    try {
      const res = await api.get('/products', {
        params: { category_slug: 'phu-kien', limit: 3 }
      });
      // Filter out products without items
      const items = res.data?.items || [];
      
      // Fetch details of each accessory to ensure variants are present
      const detailedAccessories = [];
      for (const item of items) {
        try {
          const detailRes = await api.get(`/products/${item.slug}`);
          detailedAccessories.push(detailRes.data);
        } catch (_) {
          detailedAccessories.push(item);
        }
      }
      
      setAccessories(detailedAccessories);
    } catch (_) {
      // Fallback fallback accessories if API fails
      setAccessories([
        {
          id: 991,
          name: 'Combo Chăm Sóc Giày Myshoes Chuyên Nghiệp',
          price: 190000,
          main_image_url: null,
          variants: [{ id: 9911, size: 'Standard', stock_quantity: 100 }]
        },
        {
          id: 992,
          name: 'Xịt Bọt ION Làm Sạch Giày Myshoes 300ml',
          price: 99000,
          main_image_url: null,
          variants: [{ id: 9921, size: 'Standard', stock_quantity: 100 }]
        },
        {
          id: 993,
          name: 'Xịt Khử Mùi Giày Cao Cấp Myshoes 300ml',
          price: 99000,
          main_image_url: null,
          variants: [{ id: 9931, size: 'Standard', stock_quantity: 100 }]
        }
      ]);
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    const variant = variants.find(v => v.size === size);
    setSelectedVariant(variant || null);
  };

  const handleQuantityChange = (val) => {
    const newQty = quantity + val;
    if (newQty < 1) return;
    if (selectedVariant && newQty > selectedVariant.stock_quantity) {
      setError(`Rất tiếc, chỉ còn ${selectedVariant.stock_quantity} sản phẩm trong kho.`);
      setTimeout(() => setError(''), 4000);
      return;
    }
    setQuantity(newQty);
  };

  const toggleFavorite = async () => {
    if (!product) return;

    if (token) {
      try {
        if (isFavorite) {
          await api.delete(`/wishlist/${product.id}`);
          setIsFavorite(false);
          setSuccessMsg('Đã xóa sản phẩm khỏi danh sách yêu thích');
        } else {
          await api.post('/wishlist', { product_id: product.id });
          setIsFavorite(true);
          setSuccessMsg('Đã thêm sản phẩm vào danh sách yêu thích!');
        }
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        setError(err.message || 'Không thể cập nhật danh sách yêu thích.');
        setTimeout(() => setError(''), 3000);
      }
    } else {
      // Guest local storage fallback
      const localWish = JSON.parse(localStorage.getItem('guest_wishlist') || '[]');
      let updated;
      if (isFavorite) {
        updated = localWish.filter(id => id !== product.id);
        setIsFavorite(false);
        setSuccessMsg('Đã xóa sản phẩm khỏi danh sách yêu thích (Guest)');
      } else {
        updated = [...localWish, product.id];
        setIsFavorite(true);
        setSuccessMsg('Đã lưu sản phẩm vào danh sách yêu thích (Guest)!');
      }
      localStorage.setItem('guest_wishlist', JSON.stringify(updated));
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleAccessoryToggle = (acc) => {
    // Get accessory default variant id
    const variantId = acc.variants?.[0]?.id || acc.id;
    if (selectedAccessories.includes(variantId)) {
      setSelectedAccessories(prev => prev.filter(id => id !== variantId));
    } else {
      setSelectedAccessories(prev => [...prev, variantId]);
    }
  };

  const handleAddToCart = async (redirectOnSuccess = false) => {
    if (!token) {
      setError('Vui lòng đăng nhập để thực hiện thêm sản phẩm vào giỏ hàng.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!selectedSize) {
      setError('Vui lòng chọn size sản phẩm trước khi mua.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      setTimeout(() => setError(''), 4000);
      return;
    }

    try {
      setError('');
      setSuccessMsg('Đang xử lý...');

      // Add main product to cart
      await api.post('/cart/items', {
        variant_id: selectedVariant.id,
        quantity: quantity
      });

      // Add checked accessories to cart in parallel
      if (selectedAccessories.length > 0) {
        await Promise.all(
          selectedAccessories.map(varId =>
            api.post('/cart/items', {
              variant_id: varId,
              quantity: 1
            })
          )
        );
      }

      setSuccessMsg('Đã thêm sản phẩm (và phụ kiện kèm theo) vào giỏ hàng thành công!');
      window.dispatchEvent(new Event('cart-updated'));
      window.dispatchEvent(new Event('open-cart-drawer'));
      
      if (redirectOnSuccess) {
        // Since there is no dedicated checkout page yet, we simulate redirect
        // In real app we would do: navigate('/cart');
        alert('Mua hàng thành công! Bạn có thể xem giỏ hàng của mình.');
      }
      
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Lỗi thêm vào giỏ hàng.');
      setTimeout(() => setError(''), 4000);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '5rem' }}>
        <h3 style={{ color: 'var(--text-secondary)' }}>Đang tải thông tin chi tiết sản phẩm...</h3>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', flex: 1 }}>
        <div className="alert alert-danger">{error}</div>
        <Link to="/" className="btn btn-secondary">Quay lại trang chủ</Link>
      </div>
    );
  }

  const hasDiscount = product.discount_price !== null && product.discount_price > 0;
  const currentPrice = hasDiscount ? product.discount_price : product.price;

  // Compute total value (Main product + accessories)
  const accessoriesTotal = accessories
    .filter(acc => selectedAccessories.includes(acc.variants?.[0]?.id || acc.id))
    .reduce((sum, acc) => sum + (acc.discount_price || acc.price || 0), 0);
  const totalCombinedPrice = (currentPrice * quantity) + accessoriesTotal;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      
      {/* Messages */}
      {error && <div className="alert alert-danger" style={{ position: 'sticky', top: '70px', zIndex: 50 }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ position: 'sticky', top: '70px', zIndex: 50 }}>{successMsg}</div>}

      <div className="product-detail-layout">
        
        {/* Left Column: Premium Photo Gallery */}
        <div className="gallery-container">
          <div className="main-image-wrapper">
            <img src={activeImage} alt={product.name} className="main-image" />
          </div>
          
          <div className="thumbnails-row">
            {allImages.map((imgUrl, i) => (
              <div 
                key={i} 
                className={`thumbnail-item ${activeImage === imgUrl ? 'active' : ''}`}
                onClick={() => setActiveImage(imgUrl)}
              >
                <img src={imgUrl} alt={`${product.name} góc ${i + 1}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive details panel */}
        <div className="detail-info-panel">
          
          <div>
            <div className="brand-badge">{product.brand_name}</div>
            <h1 className="product-title" style={{ marginTop: '0.5rem' }}>{product.name}</h1>
            
            <div className="rating-row" style={{ marginTop: '0.75rem' }}>
              <span>★★★★★</span>
              <span className="rating-text">(4.9/5 • 182 đánh giá)</span>
            </div>
          </div>

          <div className="price-box">
            <span className="price-main">
              {currentPrice ? currentPrice.toLocaleString('vi-VN') + 'đ' : '0đ'}
            </span>
            {hasDiscount && (
              <>
                <span className="price-original">
                  {product.price ? product.price.toLocaleString('vi-VN') + 'đ' : '0đ'}
                </span>
                <span className="discount-tag">
                  -{Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                </span>
              </>
            )}
          </div>

          <div className="section-divider"></div>

          {/* Size Select Option */}
          <div>
            <div className="size-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Chọn kích cỡ (Size):</span>
              <button onClick={() => setShowSizeGuide(true)} className="size-guide-btn">
                📏 Hướng dẫn chọn size
              </button>
            </div>
            
            <div className="size-grid">
              {variants.map((v) => (
                <button
                  key={v.id}
                  disabled={v.stock_quantity <= 0 || !v.is_active}
                  onClick={() => handleSizeSelect(v.size)}
                  className={`size-btn ${selectedSize === v.size ? 'active' : ''}`}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '2px', 
                    padding: '0.5rem 0.85rem',
                    minWidth: '76px'
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: '700' }}>{v.size}</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: '400', opacity: 0.8 }}>
                    {v.stock_quantity > 0 ? `${v.stock_quantity} đôi` : 'Hết hàng'}
                  </span>
                </button>
              ))}
            </div>

            {/* Realtime Stock Display */}
            <div style={{ marginTop: '0.65rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {selectedVariant ? (
                selectedVariant.stock_quantity <= 5 ? (
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                    🔥 Chỉ còn {selectedVariant.stock_quantity} sản phẩm cuối cùng!
                  </span>
                ) : (
                  <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                    ✓ Còn lại {selectedVariant.stock_quantity} sản phẩm trong kho (Size {selectedSize})
                  </span>
                )
              ) : (
                <span>
                  Tổng tồn kho: {variants.reduce((sum, v) => sum + (v.is_active ? v.stock_quantity : 0), 0)} sản phẩm (Vui lòng chọn size)
                </span>
              )}
            </div>
          </div>

          {/* Quick Support Phone consultation */}
          <div className="consultation-card">
            <div className="consult-text">
              <strong>Bạn cần tư vấn size?</strong>
              <br />
              Đội ngũ CSKH chuyên nghiệp luôn sẵn sàng hỗ trợ bạn.
            </div>
            <a href="tel:0973711868" className="consult-phone-btn">
              📞 0973 711 868
            </a>
          </div>

          {/* Quantity Selector & Purchase Actions Row */}
          <div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block', marginBottom: '0.5rem' }}>
              Số lượng:
            </span>
            
            <div className="purchase-row">
              <div className="quantity-wrapper">
                <button onClick={() => handleQuantityChange(-1)} className="quantity-btn">-</button>
                <input type="text" readOnly value={quantity} className="quantity-input" />
                <button onClick={() => handleQuantityChange(1)} className="quantity-btn">+</button>
              </div>

              <button onClick={() => handleAddToCart(false)} className="btn-add-to-cart">
                🛒 THÊM GIỎ
              </button>

              <button onClick={() => handleAddToCart(true)} className="btn-buy-now">
                ⚡ MUA HÀNG NGAY
              </button>

              <button 
                onClick={toggleFavorite} 
                className={`heart-wishlist-btn ${isFavorite ? 'active' : ''}`}
                title={isFavorite ? 'Xóa khỏi danh sách yêu thích' : 'Lưu vào danh sách yêu thích'}
              >
                {isFavorite ? '❤️' : '🤍'}
              </button>
            </div>
          </div>

          {/* bought-together cards (Mua Kèm) */}
          {accessories.length > 0 && (
            <div className="bought-together-card">
              <div className="bought-together-title-row">
                <div className="bought-together-label">
                  Sản phẩm mua kèm <span className="bought-together-tag">Ưu đãi kèm</span>
                </div>
                <span className="bought-together-subtitle">Tiết kiệm hơn khi mua cùng</span>
              </div>

              <div className="bought-together-list">
                {accessories.map((acc) => {
                  const accImg = acc.main_image_url
                    ? `http://localhost:8080${acc.main_image_url}`
                    : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
                  
                  const accVarId = acc.variants?.[0]?.id || acc.id;
                  const isChecked = selectedAccessories.includes(accVarId);

                  return (
                    <div key={acc.id} className="bought-together-item">
                      <input 
                        type="checkbox" 
                        className="bought-together-checkbox"
                        checked={isChecked}
                        onChange={() => handleAccessoryToggle(acc)}
                      />
                      
                      <img src={accImg} alt={acc.name} className="bought-together-img" />
                      
                      <div className="bought-together-info">
                        <span className="bought-together-name">{acc.name}</span>
                        <div className="bought-together-price-row">
                          <span className="bought-together-price">
                            {(acc.discount_price || acc.price || 0).toLocaleString('vi-VN')}đ
                          </span>
                          {(acc.discount_price && acc.price > acc.discount_price) && (
                            <span className="bought-together-oldprice">
                              {acc.price.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => handleAccessoryToggle(acc)}
                        className={`bought-together-btn ${isChecked ? 'checked' : ''}`}
                      >
                        {isChecked ? 'Đã chọn' : 'Chọn thêm'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {selectedAccessories.length > 0 && (
                <div className="bought-together-summary-box">
                  <div>
                    Tổng thanh toán ({quantity} SP chính + {selectedAccessories.length} phụ kiện):
                  </div>
                  <strong style={{ color: 'var(--accent)', fontSize: '1.05rem' }}>
                    {totalCombinedPrice.toLocaleString('vi-VN')}đ
                  </strong>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Privileges (Đặc Quyền Khách Hàng) */}
      <div>
        <h2 className="privileges-title">Đặc quyền khách hàng Myshoes</h2>
        <div className="privilege-row-layout">
          
          <div className="privilege-tier-card diamond">
            <div className="privilege-tier-header">
              <span className="privilege-tier-title" style={{ color: 'var(--accent)' }}>💎 KIM CƯƠNG</span>
              <span className="privilege-tier-badge">VIP TIER</span>
            </div>
            <ul className="privilege-list">
              <li className="privilege-list-item"><span>✓</span> Giảm thêm <strong>5%</strong> đơn hàng</li>
              <li className="privilege-list-item"><span>✓</span> Tích điểm <strong>5%</strong> đơn hàng</li>
              <li className="privilege-list-item"><span>✓</span> Đổi trả trong <strong>365 ngày</strong></li>
            </ul>
          </div>

          <div className="privilege-tier-card gold">
            <div className="privilege-tier-header">
              <span className="privilege-tier-title" style={{ color: 'var(--warning)' }}>⭐ HẠNG VÀNG</span>
              <span className="privilege-tier-badge">GOLD TIER</span>
            </div>
            <ul className="privilege-list">
              <li className="privilege-list-item"><span>✓</span> Giảm thêm <strong>3%</strong> đơn hàng</li>
              <li className="privilege-list-item"><span>✓</span> Tích điểm <strong>3%</strong> đơn hàng</li>
              <li className="privilege-list-item"><span>✓</span> Đổi trả trong <strong>30 ngày</strong></li>
            </ul>
          </div>

          <div className="privilege-tier-card silver">
            <div className="privilege-tier-header">
              <span className="privilege-tier-title" style={{ color: 'var(--text-secondary)' }}>🎖️ HẠNG BẠC</span>
              <span className="privilege-tier-badge">SILVER TIER</span>
            </div>
            <ul className="privilege-list">
              <li className="privilege-list-item"><span>✓</span> Giảm thêm <strong>1%</strong> đơn hàng</li>
              <li className="privilege-list-item"><span>✓</span> Tích điểm <strong>1%</strong> đơn hàng</li>
              <li className="privilege-list-item"><span>✓</span> Đổi trả trong <strong>7 ngày</strong></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Feature Highlights (Đặc điểm nổi bật) */}
      <div className="highlights-card glass-card">
        <div className="highlights-content">
          <h2 className="highlights-title">Đặc điểm nổi bật</h2>
          <p className="highlights-desc">
            Đôi giày thể thao cao cấp được thiết kế để mang lại sự kết hợp hoàn hảo giữa hiệu suất tối đa và phong cách thời trang hiện đại. 
            Từng chi tiết nhỏ đều được gia công tỉ mỉ để tối ưu hóa sự êm ái cho bàn chân trong mọi bước đi chuyển động.
          </p>
          <ul className="highlights-list-bulleted">
            <li className="highlights-bullet-item">
              <strong>Công nghệ đệm FF BLAST™ MAX:</strong> Mang lại khả năng giảm chấn vượt trội, phản hồi lực đàn hồi cực êm ái khi tiếp đất.
            </li>
            <li className="highlights-bullet-item">
              <strong>Cấu trúc FLUIDRIDE™:</strong> Hỗ trợ bước chạy chuyển hướng mượt mà từ gót chân đến mũi chân nhẹ nhàng hơn.
            </li>
            <li className="highlights-bullet-item">
              <strong>Đế ngoài cao su AHAR™ LO:</strong> Cao cấp siêu bền tăng độ bám đường, chống trơn trượt hiệu quả trên các bề mặt.
            </li>
            <li className="highlights-bullet-item">
              <strong>Thân giày dệt lưới Mesh:</strong> Thoáng khí vượt trội, giữ chân luôn khô thoáng và thoải mái suốt ngày dài.
            </li>
          </ul>
        </div>
        
        <div className="highlights-image-wrapper">
          <img src={activeImage} alt={product.name} />
        </div>
      </div>

      {/* Size Guide Modal Dialogue */}
      {showSizeGuide && (
        <div className="modal-overlay" onClick={() => setShowSizeGuide(false)}>
          <div className="glass-card modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <h3 style={{ fontSize: '1.2rem' }}>Bảng Chọn Kích Cỡ Giày (Size Chart)</h3>
              <button className="modal-close-btn" onClick={() => setShowSizeGuide(false)}>✕</button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Hãy đo chiều dài bàn chân của bạn từ gót chân đến ngón dài nhất và đối chiếu bảng dưới đây:
            </p>

            <table className="size-chart-table">
              <thead>
                <tr>
                  <th>EUR Size</th>
                  <th>Chiều dài chân (cm)</th>
                  <th>US Size</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>40</strong></td>
                  <td>25.0 cm</td>
                  <td>7.0</td>
                </tr>
                <tr>
                  <td><strong>40.5</strong></td>
                  <td>25.5 cm</td>
                  <td>7.5</td>
                </tr>
                <tr>
                  <td><strong>41.5</strong></td>
                  <td>26.0 cm</td>
                  <td>8.0</td>
                </tr>
                <tr>
                  <td><strong>42</strong></td>
                  <td>26.5 cm</td>
                  <td>8.5</td>
                </tr>
                <tr>
                  <td><strong>42.5</strong></td>
                  <td>27.0 cm</td>
                  <td>9.0</td>
                </tr>
                <tr>
                  <td><strong>43.5</strong></td>
                  <td>27.5 cm</td>
                  <td>9.5</td>
                </tr>
              </tbody>
            </table>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1.5rem' }} 
              onClick={() => setShowSizeGuide(false)}
            >
              Đóng bảng size
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProductDetail;
