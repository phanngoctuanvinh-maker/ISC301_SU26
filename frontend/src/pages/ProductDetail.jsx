import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './ProductDetail.css';
import ProductCard from '../components/ProductCard';

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

  // Reviews
  const [reviews, setReviews] = useState([]);

  // Recommended Products
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // Modals / Status
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected combo accessory sizes
  const [selectedSocksSize, setSelectedSocksSize] = useState('');
  const [selectedLacesSize, setSelectedLacesSize] = useState('');

  // Flash sale countdown state
  const [flashTimeLeft, setFlashTimeLeft] = useState({ hours: '00', minutes: '00', seconds: '00' });

  useEffect(() => {
    if (!product || !product.flash_sale) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(product.flash_sale.start_time).getTime();
      const end = new Date(product.flash_sale.end_time).getTime();

      let target = product.flash_sale.status === 'active' ? end : start;
      let diff = target - now;

      if (diff <= 0) {
        fetchProductDetails();
        return;
      }

      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setFlashTimeLeft({
        hours: String(hrs).padStart(2, '0'),
        minutes: String(mins).padStart(2, '0'),
        seconds: String(secs).padStart(2, '0')
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [product?.flash_sale]);

  // Check login token
  const token = localStorage.getItem('token');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    fetchProductDetails();
    fetchAccessories();
  }, [slug]);

  useEffect(() => {
    const syncAccessoriesWithCart = async () => {
      if (!token) return;
      try {
        const cartRes = await api.get('/cart');
        const cartItems = cartRes.data?.items || [];
        const accessoryIdsInCart = cartItems
          .filter(item => item.is_bought_together === 1)
          .map(item => item.variant_id);
        
        const activeAccessories = accessories
          .map(acc => acc.variants?.[0]?.id || acc.id)
          .filter(varId => accessoryIdsInCart.includes(varId));
          
        setSelectedAccessories(activeAccessories);
      } catch (_) {}
    };

    if (accessories.length > 0) {
      syncAccessoriesWithCart();
    }

    window.addEventListener('cart-updated', syncAccessoriesWithCart);
    return () => {
      window.removeEventListener('cart-updated', syncAccessoriesWithCart);
    };
  }, [accessories, token]);

  const fetchRecommendedProducts = async (prodData) => {
    try {
      // 1. Lấy sản phẩm cùng danh mục (category_id)
      let recommendRes = await api.get('/products', {
        params: {
          category_id: prodData.category_id,
          limit: 6
        }
      });
      let items = (recommendRes.data?.items || []).filter(item => item.id !== prodData.id);
      
      // 2. Nếu không đủ 4 đôi, lấy thêm sản phẩm cùng thương hiệu (brand_id)
      if (items.length < 4 && prodData.brand_id) {
        const brandRes = await api.get('/products', {
          params: {
            brand_id: prodData.brand_id,
            limit: 6
          }
        });
        const brandItems = (brandRes.data?.items || []).filter(
          item => item.id !== prodData.id && !items.some(i => i.id === item.id)
        );
        items = [...items, ...brandItems];
      }
      
      // 3. Nếu vẫn không đủ 4 đôi, lấy sản phẩm ngẫu nhiên/mới nhất chung chung
      if (items.length < 4) {
        const generalRes = await api.get('/products', {
          params: { limit: 6 }
        });
        const generalItems = (generalRes.data?.items || []).filter(
          item => item.id !== prodData.id && !items.some(i => i.id === item.id)
        );
        items = [...items, ...generalItems];
      }
      
      setRecommendedProducts(items.slice(0, 4));
    } catch (err) {
      console.error('Lỗi khi lấy sản phẩm đề xuất:', err);
    }
  };

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
      fetchRecommendedProducts(prodData);
      // Lọc các variant để mỗi size chỉ xuất hiện duy nhất 1 lần (chọn variant có tồn kho lớn nhất của size đó)
      const rawVariants = prodData.variants || [];
      const uniqueSizeMap = {};
      rawVariants.forEach(v => {
        if (!uniqueSizeMap[v.size] || v.stock_quantity > uniqueSizeMap[v.size].stock_quantity) {
          uniqueSizeMap[v.size] = v;
        }
      });
      const uniqueVariants = Object.values(uniqueSizeMap).sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
      setVariants(uniqueVariants);

      if (prodData.combo) {
        if (prodData.combo.socks?.available_sizes?.length > 0) {
          setSelectedSocksSize(prodData.combo.socks.available_sizes[0]);
        }
        if (prodData.combo.laces?.available_sizes?.length > 0) {
          setSelectedLacesSize(prodData.combo.laces.available_sizes[0]);
        }
      }

      // Fetch reviews
      try {
        const revRes = await api.get(`/reviews/product/${prodData.id}`);
        setReviews(revRes.data?.reviews || []);
      } catch (revErr) {
        console.error('Error fetching reviews:', revErr);
      }

      // Build product gallery
      const mainImg = prodData.main_image_url
        ? prodData.main_image_url
        : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600';
      
      setActiveImage(mainImg);

      if (prodData.images && prodData.images.length > 0) {
        const gallery = prodData.images.map(img => img.image_url);
        setAllImages(gallery);
      } else {
        // Generate mock additional angles for premium look
        const angles = [
          mainImg,
          'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600'
        ];
        setAllImages(angles);
      }

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
        params: { category_slug: 'phu-kien', limit: 12 }
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

  const handleAccessoryToggle = async (acc) => {
    if (!token) {
      setError('Vui lòng đăng nhập để chọn sản phẩm mua kèm.');
      setTimeout(() => setError(''), 4000);
      return;
    }

    const variantId = acc.variants?.[0]?.id || acc.id;
    const isChecked = selectedAccessories.includes(variantId);

    try {
      if (isChecked) {
        // Unticked: Remove from cart
        const cartRes = await api.get('/cart');
        const cartItem = (cartRes.data?.items || []).find(item => item.variant_id === variantId);
        if (cartItem) {
          await api.delete(`/cart/items/${cartItem.id}`);
        }
        setSelectedAccessories(prev => prev.filter(id => id !== variantId));
      } else {
        // Ticked: Add to cart
        await api.post('/cart/items', {
          variant_id: variantId,
          quantity: 1,
          is_bought_together: true
        });
        setSelectedAccessories(prev => [...prev, variantId]);
      }
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      setError(err.message || 'Lỗi cập nhật sản phẩm mua kèm.');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleBuyCombo = async () => {
    if (!token) {
      setError('Vui lòng đăng nhập để thực hiện mua combo.');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (!selectedSize) {
      setError('Vui lòng chọn size giày của bạn trước khi mua combo.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      setTimeout(() => setError(''), 4000);
      return;
    }

    if (!product.combo) return;

    try {
      setError('');
      setSuccessMsg('Đang xử lý thêm combo vào giỏ hàng...');

      const mainVariantId = selectedVariant.id;
      
      const socksVar = product.combo.socks.variants.find(v => v.size === selectedSocksSize);
      const lacesVar = product.combo.laces.variants.find(v => v.size === selectedLacesSize);

      if (!socksVar || !lacesVar) {
        throw new Error('Không tìm thấy kích cỡ phù hợp cho phụ kiện combo.');
      }

      // Add all three in parallel
      await Promise.all([
        api.post('/cart/items', { variant_id: mainVariantId, quantity: quantity }),
        api.post('/cart/items', { variant_id: socksVar.id, quantity: 1 }),
        api.post('/cart/items', { variant_id: lacesVar.id, quantity: 1 })
      ]);

      setSuccessMsg('Đã thêm trọn bộ Combo hoàn chỉnh (Giảm giá 15%) vào giỏ hàng thành công!');
      window.dispatchEvent(new Event('cart-updated'));
      window.dispatchEvent(new Event('open-cart-drawer'));
      
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Lỗi thêm combo vào giỏ hàng.');
      setTimeout(() => setError(''), 4000);
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

      setSuccessMsg('Đã thêm sản phẩm vào giỏ hàng thành công!');
      window.dispatchEvent(new Event('cart-updated'));
      window.dispatchEvent(new Event('open-cart-drawer'));
      
      if (redirectOnSuccess) {
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

  const hasDiscount = selectedVariant
    ? (selectedVariant.discount_price !== null && selectedVariant.discount_price > 0)
    : (product.discount_price !== null && product.discount_price > 0);
  const currentPrice = selectedVariant
    ? (selectedVariant.discount_price !== null && selectedVariant.discount_price > 0 ? selectedVariant.discount_price : selectedVariant.price)
    : (product.discount_price !== null && product.discount_price > 0 ? product.discount_price : product.price);

  const displayOriginalPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayDiscountPrice = selectedVariant ? selectedVariant.discount_price : product.discount_price;

  const sockPrice = product.combo ? (product.combo.socks.discount_price || product.combo.socks.price || 0) : 0;
  const lacePrice = product.combo ? (product.combo.laces.discount_price || product.combo.laces.price || 0) : 0;
  const displayComboOriginalTotal = currentPrice + sockPrice + lacePrice;
  const displayComboNewTotal = currentPrice + Math.round(sockPrice * 0.90) + Math.round(lacePrice * 0.90);

  // Compute total value (Main product + accessories with 20% discount or 10% discount if full combo is formed)
  const selectedAccItems = accessories.filter(item => 
    selectedAccessories.includes(item.variants?.[0]?.id || item.id)
  );
  const hasSocksSelected = selectedAccItems.some(item => item.category_slug === 'vo-tat-the-thao');
  const hasLacesSelected = selectedAccItems.some(item => item.category_slug === 'day-giay-the-thao');
  const isFullComboFormed = hasSocksSelected && hasLacesSelected;

  const accessoriesTotal = selectedAccItems.reduce((sum, item) => {
    const basePrice = item.discount_price || item.price || 0;
    const isComboItem = item.category_slug === 'vo-tat-the-thao' || item.category_slug === 'day-giay-the-thao';
    const discountMultiplier = (isFullComboFormed && isComboItem) ? 0.90 : 0.8;
    return sum + Math.round(basePrice * discountMultiplier);
  }, 0);
  const totalCombinedPrice = (currentPrice * quantity) + accessoriesTotal;

  return (
    <div className="container product-detail-container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      
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
              <span style={{ color: 'var(--warning)' }}>
                {'★'.repeat(Math.round(product.rating_average || 5))}
                {'☆'.repeat(5 - Math.round(product.rating_average || 5))}
              </span>
              <span className="rating-text">
                ({product.rating_average ? Number(product.rating_average).toFixed(1) : '5.0'}/5 • {product.rating_count || 0} đánh giá)
              </span>
            </div>
          </div>

          {/* Flash Sale Banner & Countdown */}
          {product.flash_sale && (
            <div 
              style={{
                background: product.flash_sale.status === 'active' 
                  ? 'linear-gradient(90deg, #ef4444 0%, #f59e0b 100%)' 
                  : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: 'white',
                marginTop: '1rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.9rem' }}>
                <span>{product.flash_sale.status === 'active' ? '⚡ FLASH SALE ĐANG DIỄN RA' : '⏰ FLASH SALE SẮP DIỄN RA'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 700 }}>
                  {product.flash_sale.status === 'active' ? 'Kết thúc sau:' : 'Bắt đầu sau:'}
                </span>
                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  <span style={{ background: 'black', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{flashTimeLeft.hours}</span>:
                  <span style={{ background: 'black', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{flashTimeLeft.minutes}</span>:
                  <span style={{ background: 'black', padding: '2px 5px', borderRadius: '4px', fontWeight: 'bold' }}>{flashTimeLeft.seconds}</span>
                </div>
              </div>
            </div>
          )}

          {/* Flash Sale Remaining Stock Progress Bar */}
          {product.flash_sale && product.flash_sale.status === 'active' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Số lượng giới hạn:</span>
                <span style={{ color: '#ef4444' }}>Đã bán {product.flash_sale.sold_quantity} / {product.flash_sale.flash_quantity} đôi</span>
              </div>
              <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)', 
                    width: `${Math.min(100, (product.flash_sale.sold_quantity / product.flash_sale.flash_quantity) * 100)}%`,
                    borderRadius: '5px'
                  }} 
                />
              </div>
            </div>
          )}

          {/* Flash Sale Upcoming Pre-announcement details */}
          {product.flash_sale && product.flash_sale.status === 'upcoming' && (
            <div 
              style={{ 
                backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                border: '1px solid rgba(245, 158, 11, 0.3)', 
                padding: '0.75rem', 
                borderRadius: '8px', 
                fontSize: '0.9rem', 
                marginBottom: '1.25rem',
                color: '#f59e0b'
              }}
            >
              🎉 Sản phẩm sẽ được mở bán với giá Flash Sale cực sốc: 
              <strong style={{ marginLeft: '4px', fontSize: '1rem', color: '#ef4444' }}>
                {product.flash_sale.flash_price.toLocaleString('vi-VN')}₫
              </strong> (Giới hạn {product.flash_sale.flash_quantity} đôi)
            </div>
          )}

          <div className="price-box">
            {product.flash_sale && product.flash_sale.status === 'active' && (
              <span style={{ 
                fontSize: '0.75rem', 
                background: '#ef4444', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: '4px', 
                fontWeight: 'bold',
                alignSelf: 'center',
                marginRight: '0.5rem'
              }}>
                ⚡ GIÁ FLASH SALE
              </span>
            )}
            <span className="price-main">
              {currentPrice ? currentPrice.toLocaleString('vi-VN') + 'đ' : '0đ'}
            </span>
            {hasDiscount && (
              <>
                <span className="price-original">
                  {displayOriginalPrice ? displayOriginalPrice.toLocaleString('vi-VN') + 'đ' : '0đ'}
                </span>
                <span className="discount-tag">
                  -{Math.round(((displayOriginalPrice - displayDiscountPrice) / displayOriginalPrice) * 100)}%
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

          {/* Smart Proposed Combo (Combo Hoàn Chỉnh) */}
          {product.combo && (
            <div className="product-combo-card glass-card">
              <div className="combo-card-header">
                <div className="combo-title-badge">🔥 COMBO HOÀN CHỈNH</div>
                <div className="combo-save-tag">Tiết kiệm 10%</div>
              </div>
              <p className="combo-subtitle">
                Đề xuất trọn bộ phối màu và phụ kiện cùng thương hiệu <strong>{product.brand_name}</strong> để tối ưu hóa phong cách của bạn.
              </p>
              
              <div className="combo-visual-connector">
                {/* 1. Shoe */}
                <div className="combo-item-node">
                  <div className="combo-img-wrapper">
                    <img src={activeImage} alt={product.name} />
                  </div>
                  <span className="combo-node-name">{product.name}</span>
                  <span className="combo-node-price">{currentPrice.toLocaleString('vi-VN')}₫</span>
                  <span className="combo-node-size-label">
                    {selectedSize ? `Size: ${selectedSize}` : 'Chưa chọn size'}
                  </span>
                </div>
                
                <div className="combo-plus-sign">+</div>
                
                {/* 2. Socks */}
                <div className="combo-item-node">
                  <div className="combo-img-wrapper">
                    <img 
                      src={product.combo.socks.main_image_url ? product.combo.socks.main_image_url : 'https://images.unsplash.com/photo-1582966772680-860e372bb558?w=100'} 
                      alt={product.combo.socks.name} 
                    />
                  </div>
                  <span className="combo-node-name">{product.combo.socks.name}</span>
                  <span className="combo-node-price">{(product.combo.socks.discount_price || product.combo.socks.price).toLocaleString('vi-VN')}₫</span>
                  
                  {product.combo.socks.available_sizes.length > 0 && (
                    <select 
                      value={selectedSocksSize} 
                      onChange={(e) => setSelectedSocksSize(e.target.value)}
                      className="combo-size-select"
                    >
                      {product.combo.socks.available_sizes.map(sz => (
                        <option key={sz} value={sz}>Size: {sz}</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="combo-plus-sign">+</div>
                
                {/* 3. Laces */}
                <div className="combo-item-node">
                  <div className="combo-img-wrapper">
                    <img 
                      src={product.combo.laces.main_image_url ? product.combo.laces.main_image_url : '/uploads/products/sg-11134201-22100-kgwlbm2x8yivc3.webp'} 
                      alt={product.combo.laces.name} 
                    />
                  </div>
                  <span className="combo-node-name">{product.combo.laces.name}</span>
                  <span className="combo-node-price">{(product.combo.laces.discount_price || product.combo.laces.price).toLocaleString('vi-VN')}₫</span>
                  
                  {product.combo.laces.available_sizes.length > 0 && (
                    <select 
                      value={selectedLacesSize} 
                      onChange={(e) => setSelectedLacesSize(e.target.value)}
                      className="combo-size-select"
                    >
                      {product.combo.laces.available_sizes.map(sz => (
                        <option key={sz} value={sz}>Size: {sz}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="combo-price-summary-box">
                <div className="combo-price-breakdown">
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giá mua lẻ: </span>
                    <span className="combo-old-price">{displayComboOriginalTotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div style={{ marginTop: '0.2rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Combo chỉ: </span>
                    <span className="combo-new-price">{displayComboNewTotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>
                
                <button onClick={handleBuyCombo} className="btn-buy-combo">
                  ⚡ MUA COMBO (GIẢM 10%)
                </button>
              </div>
            </div>
          )}

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
                    ? acc.main_image_url
                    : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';
                  
                  const accVarId = acc.variants?.[0]?.id || acc.id;
                  const isChecked = selectedAccessories.includes(accVarId);

                  const baseAccPrice = acc.discount_price || acc.price || 0;
                  const isComboItem = acc.category_slug === 'vo-tat-the-thao' || acc.category_slug === 'day-giay-the-thao';
                  const discountPercent = (isFullComboFormed && isComboItem) ? 10 : 20;
                  const boughtTogetherPrice = Math.round(baseAccPrice * (1 - discountPercent / 100));

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
                            {boughtTogetherPrice.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="bought-together-oldprice">
                            {baseAccPrice.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="discount-tag" style={{ fontSize: '0.65rem', padding: '1px 4px', marginLeft: '0.25rem' }}>
                            -{discountPercent}%
                          </span>
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

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <div className="recommended-section">
          <h2 className="recommended-title">Có thể bạn cũng thích</h2>
          <div className="products-display-grid">
            {recommendedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* Product Reviews Section */}
      <div className="glass-card" style={{ marginTop: '3rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '2px solid var(--accent)', width: 'fit-content', paddingBottom: '0.5rem' }}>
          Đánh giá sản phẩm ({reviews.length})
        </h2>

        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Chưa có đánh giá nào cho sản phẩm này. Đặt mua ngay để trở thành người đánh giá đầu tiên!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {reviews.map((rev) => {
              const userAvatarUrl = rev.user_avatar 
                ? (rev.user_avatar.startsWith('http') ? rev.user_avatar : rev.user_avatar)
                : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80';

              return (
                <div key={rev.id} style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                  <img 
                    src={userAvatarUrl} 
                    alt="User avatar" 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} 
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>{rev.user_name}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(rev.created_at).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
                      <span style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>
                        {'★'.repeat(rev.rating)}
                        {'☆'.repeat(5 - rev.rating)}
                      </span>
                      {rev.is_verified && (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          background: 'rgba(31, 173, 83, 0.1)', 
                          color: '#16a34a', 
                          border: '1px solid rgba(31, 173, 83, 0.2)', 
                          padding: '1px 6px', 
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}>
                          ✓ Đã mua hàng
                        </span>
                      )}
                    </div>

                    <p style={{ margin: '0.5rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                      {rev.comment || 'Không có bình luận.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
