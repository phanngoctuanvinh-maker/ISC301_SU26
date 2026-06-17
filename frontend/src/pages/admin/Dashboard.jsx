import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bảng Điều Khiển Quản Trị</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Chào mừng bạn đến với trang quản lý cửa hàng giày.</p>
      </div>

      <div className="grid grid-cols-2 gap-6" style={{ marginTop: '2rem' }}>
        {/* Card 1: Categories */}
        <div className="glass-card flex flex-col justify-between gap-4" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Quản Lý Danh Mục</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Quản lý các danh mục sản phẩm theo cây thư mục 2 tầng (Cha &rarr; Con). Sắp xếp lại thứ tự hiển thị của các danh mục.
            </p>
          </div>
          <Link to="/admin/categories" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Đi tới quản lý danh mục →
          </Link>
        </div>

        {/* Card 2: Brands */}
        <div className="glass-card flex flex-col justify-between gap-4" style={{ borderLeft: '4px solid var(--accent)' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Quản Lý Thương Hiệu</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Xem danh sách, thêm mới, cập nhật mô tả và tải lên logo cho các hãng giày (Nike, Adidas, Puma, v.v.).
            </p>
          </div>
          <Link to="/admin/brands" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            Đi tới quản lý thương hiệu →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
