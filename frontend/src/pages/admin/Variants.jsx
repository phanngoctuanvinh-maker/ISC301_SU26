import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';

function Variants() {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [sku, setSku] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProductAndVariants();
  }, [productId]);

  const fetchProductAndVariants = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch product detail for heading
      const productRes = await api.get(`/admin/products/${productId}`);
      setProduct(productRes.data);

      // Fetch variants
      const variantsRes = await api.get(`/admin/products/${productId}/variants`);
      setVariants(variantsRes.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin biến thể sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setColor('');
    setSize('');
    // Use base product price as initial price if available
    setPrice(product ? String(product.price || '') : '');
    setDiscountPrice('');
    setStockQuantity('10');
    setSku('');
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEdit = (variant) => {
    setEditingId(variant.id);
    setColor(variant.color || '');
    setSize(variant.size || '');
    setPrice(String(variant.price || ''));
    setDiscountPrice(variant.discount_price !== null ? String(variant.discount_price) : '');
    setStockQuantity(String(variant.stock_quantity || 0));
    setSku(variant.sku || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    if (!size.trim()) return setFormError('Size không được để trống');
    if (!price || Number(price) <= 0) return setFormError('Giá bán phải là số dương');
    if (discountPrice && Number(discountPrice) <= 0) return setFormError('Giá khuyến mãi phải là số dương');
    if (discountPrice && Number(discountPrice) >= Number(price)) {
      return setFormError('Giá khuyến mãi phải nhỏ hơn giá bán gốc');
    }
    if (Number(stockQuantity) < 0) return setFormError('Tồn kho không được là số âm');

    const payload = {
      color: color.trim() || null,
      size: size.trim(),
      price: Number(price),
      discount_price: discountPrice ? Number(discountPrice) : null,
      stock_quantity: Number(stockQuantity),
      sku: sku.trim() || null
    };

    try {
      setSaving(true);
      if (editingId) {
        // PUT /api/admin/variants/:id
        await api.put(`/admin/variants/${editingId}`, payload);
        setSuccess('Cập nhật biến thể thành công!');
      } else {
        // POST /api/admin/products/:productId/variants
        await api.post(`/admin/products/${productId}/variants`, payload);
        setSuccess('Tạo biến thể mới thành công!');
      }
      setShowForm(false);
      fetchProductAndVariants();
    } catch (err) {
      setFormError(err.message || 'Không thể lưu biến thể');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá biến thể này?')) return;
    setError('');
    setSuccess('');
    try {
      // DELETE /api/admin/variants/:id
      await api.delete(`/admin/variants/${id}`);
      setSuccess('Xoá biến thể thành công!');
      fetchProductAndVariants();
    } catch (err) {
      setError(err.message || 'Lỗi khi xoá biến thể');
    }
  };

  if (loading && !product) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
        <h3>Đang tải thông tin biến thể...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      {/* Product Summary Header */}
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <Link to="/admin/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            ← Quay lại danh sách sản phẩm
          </Link>
          {product && (
            <h1 style={{ fontSize: '2rem', marginTop: '0.25rem' }}>
              Biến Thể: {product.name}
            </h1>
          )}
          {product && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Thương hiệu: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{product.brand_name}</span> | Giá niêm yết: {product.price.toLocaleString('vi-VN')}đ
            </p>
          )}
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          + Thêm Biến Thể Mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form Section */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            {editingId ? 'Chỉnh sửa biến thể' : 'Thêm biến thể mới'}
          </h2>
          {formError && <div className="alert alert-danger">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Màu sắc</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  placeholder="Ví dụ: Trắng, Đen, Đỏ..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kích thước (Size)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={size} 
                  onChange={(e) => setSize(e.target.value)} 
                  placeholder="Ví dụ: 40, 41, M, L..."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Giá bán (vnđ)</label>
                <input 
                  type="number" 
                  min="1"
                  className="form-control" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Giá khuyến mãi (vnđ - Không bắt buộc)</label>
                <input 
                  type="number" 
                  min="0"
                  className="form-control" 
                  value={discountPrice} 
                  onChange={(e) => setDiscountPrice(e.target.value)} 
                  placeholder="Nhỏ hơn giá bán"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Số lượng tồn kho</label>
                <input 
                  type="number" 
                  min="0"
                  className="form-control" 
                  value={stockQuantity} 
                  onChange={(e) => setStockQuantity(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mã SKU (Không bắt buộc)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={sku} 
                  onChange={(e) => setSku(e.target.value)} 
                  placeholder="Ví dụ: NAF1-WHITE-40"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Tạo mới')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary" disabled={saving}>
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Variants List Table */}
      {variants.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Sản phẩm này chưa có biến thể nào. Vui lòng nhấn Thêm Biến Thể Mới.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem 0.75rem' }}>Mã SKU</th>
                <th style={{ padding: '1rem 0.75rem' }}>Màu sắc</th>
                <th style={{ padding: '1rem 0.75rem' }}>Kích thước (Size)</th>
                <th style={{ padding: '1rem 0.75rem' }}>Giá bán gốc</th>
                <th style={{ padding: '1rem 0.75rem' }}>Giá khuyến mãi</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>Tồn kho</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.95rem' }}>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 600 }}>
                    {v.sku || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 'normal' }}>Chưa thiết lập</span>}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {v.color || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không màu</span>}
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                    <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px' }}>
                      {v.size}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                    {v.price ? v.price.toLocaleString('vi-VN') + 'đ' : '0đ'}
                  </td>
                  <td style={{ padding: '0.75rem', color: v.discount_price ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: v.discount_price ? 700 : 'normal' }}>
                    {v.discount_price ? v.discount_price.toLocaleString('vi-VN') + 'đ' : 'Không có'}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 700, color: v.stock_quantity === 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {v.stock_quantity}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleOpenEdit(v)} 
                        className="btn btn-secondary" 
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleDelete(v.id)} 
                        className="btn btn-danger" 
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', boxShadow: 'none' }}
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Variants;
