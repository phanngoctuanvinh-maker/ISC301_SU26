import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function Brands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/brands');
      setBrands(response.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setLogoFile(null);
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEdit = (brand) => {
    setEditingId(brand.id);
    setName(brand.name || '');
    setDescription(brand.description || '');
    setLogoFile(null);
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    if (!name.trim()) {
      return setFormError('Tên thương hiệu không được để trống');
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('description', description.trim());
    if (logoFile) {
      formData.append('logo', logoFile);
    }

    try {
      if (editingId) {
        await api.put(`/admin/brands/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Cập nhật thương hiệu thành công!');
      } else {
        await api.post('/admin/brands', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Tạo thương hiệu mới thành công!');
      }
      setShowForm(false);
      fetchBrands();
    } catch (err) {
      setFormError(err.message || 'Không thể lưu thương hiệu');
    }
  };

  const handleToggleStatus = async (id) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/admin/brands/${id}/toggle-status`);
      setSuccess('Thay đổi trạng thái thương hiệu thành công!');
      fetchBrands();
    } catch (err) {
      setError(err.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
        <h3>Đang tải danh sách thương hiệu...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Quản Lý Thương Hiệu</h1>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          + Tạo Thương Hiệu Mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form Section */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            {editingId ? 'Chỉnh sửa thương hiệu' : 'Tạo thương hiệu mới'}
          </h2>
          {formError && <div className="alert alert-danger">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Tên thương hiệu</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ví dụ: Nike, Adidas..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Logo thương hiệu</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="form-control" 
                  onChange={(e) => setLogoFile(e.target.files[0])} 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Mô tả chi tiết</label>
              <textarea 
                className="form-control" 
                rows="3"
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Nhập giới thiệu ngắn về hãng giày..."
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Cập nhật' : 'Tạo mới'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brands List */}
      {brands.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Không tìm thấy thương hiệu nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {brands.map((brand) => {
            const logoUrl = brand.logo_url 
              ? `http://localhost:8080${brand.logo_url}` 
              : 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=150';

            return (
              <div key={brand.id} className="glass-card flex flex-col justify-between gap-4" style={{ borderLeft: brand.is_active ? '4px solid var(--accent)' : '4px solid var(--text-muted)' }}>
                <div>
                  <div className="flex justify-between items-start" style={{ marginBottom: '1rem', gap: '1rem' }}>
                    <div className="flex items-center gap-4">
                      <img 
                        src={logoUrl} 
                        alt={brand.name} 
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)', backgroundColor: '#fff', padding: '2px' }} 
                      />
                      <div>
                        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {brand.name}
                          <span className={`badge ${brand.is_active ? 'badge-success' : 'badge-secondary'}`}>
                            {brand.is_active ? 'Kinh doanh' : 'Tạm ẩn'}
                          </span>
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                          Số lượng sản phẩm: {brand.product_count || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontStyle: brand.description ? 'normal' : 'italic' }}>
                    {brand.description || 'Chưa có mô tả chi tiết cho hãng này.'}
                  </p>
                </div>

                <div className="flex gap-2" style={{ alignSelf: 'flex-end', marginTop: '1rem' }}>
                  <button onClick={() => handleOpenEdit(brand)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                    Sửa
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(brand.id)} 
                    className={`btn ${brand.is_active ? 'btn-danger' : 'btn-primary'}`} 
                    style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: brand.is_active ? 'var(--danger)' : 'var(--success)', boxShadow: 'none' }}
                  >
                    {brand.is_active ? 'Ẩn' : 'Hiện'}
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

export default Brands;
