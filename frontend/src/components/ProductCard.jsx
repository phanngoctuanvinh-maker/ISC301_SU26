import React from 'react';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  // Determine product main image url
  const imageUrl = product.main_image_url
    ? `http://localhost:8080${product.main_image_url}`
    : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400';

  // Format pricing
  const hasDiscount = product.discount_price !== null && product.discount_price > 0;

  return (
    <Link 
      to={`/product/${product.slug}`} 
      className="glass-card address-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '1.25rem',
        textDecoration: 'none',
        color: 'inherit',
        overflow: 'hidden',
        gap: '0.75rem',
        height: '100%',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
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
            <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--danger)' }}>
              {product.discount_price.toLocaleString('vi-VN')}đ
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              {product.price.toLocaleString('vi-VN')}đ
            </span>
          </>
        ) : (
          <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {product.price ? product.price.toLocaleString('vi-VN') + 'đ' : '0đ'}
          </span>
        )}
      </div>
    </Link>
  );
}

export default ProductCard;
