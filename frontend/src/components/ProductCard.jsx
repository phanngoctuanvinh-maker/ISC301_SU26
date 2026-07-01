import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  // Determine product main image url
  const imageUrl = product.main_image_url
    ? product.main_image_url
    : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';

  // Format pricing
  const hasDiscount = product.discount_price !== null && product.discount_price > 0;

  return (
    <Link 
      to={`/product/${product.slug}`} 
      className="glass-card product-card address-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '1.25rem',
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
        gap: '0.75rem',
        height: '100%',
        borderRadius: '12px',
        position: 'relative'
      }}
    >
      {product.flash_sale ? (
        <span 
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            backgroundColor: product.flash_sale.status === 'active' ? '#ef4444' : '#f59e0b',
            color: '#ffffff',
            fontSize: '0.65rem',
            fontWeight: '800',
            padding: '3px 8px',
            borderRadius: '20px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: product.flash_sale.status === 'active' 
              ? '0 2px 8px rgba(239, 68, 68, 0.5)' 
              : '0 2px 8px rgba(245, 158, 11, 0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}
        >
          {product.flash_sale.status === 'active' ? '⚡ SIÊU SALE' : '⏰ SẮP SALE'}
        </span>
      ) : (product.is_featured === 1 || product.is_featured === true) && (
        <span 
          style={{
            position: 'absolute',
            top: '0.75rem',
            left: '0.75rem',
            backgroundColor: 'rgba(245, 158, 11, 0.95)', // Premium amber/gold
            color: '#ffffff',
            fontSize: '0.65rem',
            fontWeight: '700',
            padding: '3px 8px',
            borderRadius: '20px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.45)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em'
          }}
        >
          ⭐ Nổi bật
        </span>
      )}
      {product.match_score !== undefined && product.match_score !== null && (
        <span 
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            backgroundColor: 'rgba(6, 182, 212, 0.95)',
            color: '#ffffff',
            fontSize: '0.65rem',
            fontWeight: '800',
            padding: '3px 8px',
            borderRadius: '20px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            boxShadow: '0 2px 8px rgba(6, 182, 212, 0.45)',
            textTransform: 'uppercase'
          }}
          title="Độ tương thích bàn chân đo bằng AI"
        >
          ✨ {product.match_score}% Fit
        </span>
      )}
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
          alt={product.name} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            transition: 'transform var(--transition-normal)'
          }}
          className="product-card-image"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      </div>

      {/* Product Metadata Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {/* Brand Badge & Category */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: '700', 
            textTransform: 'uppercase', 
            color: 'var(--accent)',
            backgroundColor: 'var(--accent-light)',
            padding: '0.15rem 0.4rem',
            borderRadius: '4px'
          }}>
            {product.brand_name}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {product.category_name}
          </span>
        </div>

        {/* Product Title */}
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
          {product.name}
        </h3>

        {/* Rating and Sales Count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
            ★ {Number(product.rating_average || 5.0).toFixed(1)}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            Đã bán {product.sold_count || 0}
          </span>
        </div>
        
        {/* Gender / Sport Type tags (Optional) */}
        {(product.gender || product.sport_type) && (
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
            {product.gender && (
              <span style={{ fontSize: '0.65rem', color: 'hsl(262, 83%, 55%)', backgroundColor: 'hsla(262, 83%, 58%, 0.08)', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                {product.gender === 'male' ? '♂ Nam' : product.gender === 'female' ? '♀ Nữ' : '⚡ Unisex'}
              </span>
            )}
            {product.sport_type && (
              <span style={{ fontSize: '0.65rem', color: 'hsl(187, 92%, 35%)', backgroundColor: 'hsla(187, 92%, 46%, 0.1)', padding: '2px 6px', borderRadius: '3px', fontWeight: 600 }}>
                {product.sport_type}
              </span>
            )}
          </div>
        )}
        {/* Flash Sale Progress bar or Upcoming pre-order price */}
        {product.flash_sale && product.flash_sale.status === 'active' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '0.5rem', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontWeight: 800 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tiến độ:</span>
              <span style={{ color: '#ef4444' }}>Đã bán {product.flash_sale.sold_quantity}/{product.flash_sale.flash_quantity}</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
              <div 
                style={{ 
                  height: '100%', 
                  background: 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)', 
                  width: `${Math.min(100, (product.flash_sale.sold_quantity / product.flash_sale.flash_quantity) * 100)}%`,
                  borderRadius: '3px'
                }} 
              />
            </div>
          </div>
        )}
        
        {product.flash_sale && product.flash_sale.status === 'upcoming' && (
          <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
            ⏰ Sắp bán: {product.flash_sale.flash_price.toLocaleString('vi-VN')}₫
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'baseline', 
        gap: '0.5rem', 
        marginTop: 'auto',
        paddingTop: '0.5rem',
        borderTop: '1px solid var(--glass-border)'
      }}>
        {hasDiscount ? (
          <>
            <span className="product-card-price product-card-price-discount" style={{ fontSize: '1.15rem', fontWeight: '700', color: product.flash_sale && product.flash_sale.status === 'active' ? '#ef4444' : 'inherit' }}>
              {product.discount_price.toLocaleString('vi-VN')}đ
            </span>
            <span className="product-card-price-original" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              {product.price.toLocaleString('vi-VN')}đ
            </span>
          </>
        ) : (
          <span className="product-card-price product-card-price-regular" style={{ fontSize: '1.15rem', fontWeight: '700' }}>
            {product.price ? product.price.toLocaleString('vi-VN') + 'đ' : '0đ'}
          </span>
        )}
      </div>
    </Link>
  );
}

export default ProductCard;
