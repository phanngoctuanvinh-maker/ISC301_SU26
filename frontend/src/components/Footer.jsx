import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer style={{ 
      backgroundColor: 'var(--bg-secondary)', 
      borderTop: '3px solid transparent',
      borderImage: 'linear-gradient(90deg, hsl(262, 83%, 58%), hsl(187, 92%, 46%)) 1',
      backgroundImage: 'radial-gradient(at 100% 0%, hsla(262, 83%, 58%, 0.04) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(187, 92%, 46%, 0.04) 0px, transparent 50%)',
      padding: '4rem 1.5rem 2rem 1.5rem',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div className="grid grid-cols-3" style={{ gap: '3rem', marginBottom: '3rem', gridTemplateColumns: '1.2fr 0.9fr 0.9fr' }}>
          
          {/* Column 1: Branding & Intro */}
          <div>
            <Link to="/" style={{ 
              fontSize: '1.5rem', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, hsl(262, 83%, 58%), hsl(187, 92%, 46%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block',
              marginBottom: '1rem'
            }}>
              SHOES STORE
            </Link>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Chúng tôi cung cấp các sản phẩm giày thể thao và phụ kiện chính hãng từ các thương hiệu hàng đầu thế giới như Nike, Adidas, Puma, Jordan... nâng niu từng bước chân của bạn.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              {/* Fake Social Icons */}
              <span style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '1.2rem' }}>🌐</span>
              <span style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '1.2rem' }}>💬</span>
              <span style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '1.2rem' }}>📷</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Danh mục nổi bật
            </h4>
            <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Giày Chạy Bộ</Link>
            <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Giày Sneaker Thể Thao</Link>
            <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Giày Đá Bóng</Link>
            <Link to="/" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Phụ Kiện Thể Thao</Link>
          </div>

          {/* Column 3: Contact & Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Thông tin liên hệ
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📍 123 Đường Lê Lợi, Bến Thành, Quận 1, TP. HCM
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📞 Hotline: 090 123 4567
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✉ Email: support@shoesstore.com
            </p>
          </div>

        </div>

        {/* Bottom copyright section */}
        <div style={{ 
          borderTop: '1px solid var(--glass-border)', 
          paddingTop: '2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          color: 'var(--text-muted)',
          fontSize: '0.9rem'
        }}>
          <p>© {new Date().getFullYear()} Shoes Store. Bảo lưu mọi quyền.</p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ cursor: 'pointer' }}>Điều khoản sử dụng</span>
            <span style={{ cursor: 'pointer' }}>Chính sách bảo mật</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
