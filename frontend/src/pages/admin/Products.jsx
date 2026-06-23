import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters State
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [gender, setGender] = useState('unisex');
  const [sportType, setSportType] = useState('');
  const [description, setDescription] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [editingImages, setEditingImages] = useState([]);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, brandFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [catRes, brandRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/brands')
      ]);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
      await fetchProducts();
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu danh mục hoặc thương hiệu');
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = {};
      if (categoryFilter) params.category_id = categoryFilter;
      if (brandFilter) params.brand_id = brandFilter;
      if (keyword.trim()) params.keyword = keyword.trim();

      const response = await api.get('/admin/products', { params });
      setProducts(response.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setPrice('0');
    // Set default category to first child if available
    const childCats = getChildCategories();
    setCategoryId(childCats.length > 0 ? String(childCats[0].id) : '');
    setBrandId(brands.length > 0 ? String(brands[0].id) : '');
    setGender('unisex');
    setSportType('');
    setDescription('');
    setIsFeatured(false);
    setImageFiles([]);
    setEditingImages([]);
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEdit = async (product) => {
    try {
      setFormError('');
      // Fetch full detail of product including images
      const response = await api.get(`/admin/products/${product.id}`);
      const detail = response.data;
      
      setEditingId(detail.id);
      setName(detail.name || '');
      setPrice(String(detail.price || 0));
      setCategoryId(String(detail.category_id || ''));
      setBrandId(String(detail.brand_id || ''));
      setGender(detail.gender || 'unisex');
      setSportType(detail.sport_type || '');
      setDescription(detail.description || '');
      setIsFeatured(!!detail.is_featured);
      setImageFiles([]);
      setEditingImages(detail.images || []);
      setShowForm(true);
      
      // Scroll to form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Không thể tải chi tiết sản phẩm');
    }
  };

  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  const getChildCategories = () => {
    const list = [];
    categories.forEach(parent => {
      if (parent.children && parent.children.length > 0) {
        parent.children.forEach(child => {
          list.push({ ...child, parentName: parent.name });
        });
      } else if (parent.parent_id !== null) {
        list.push(parent);
      }
    });
    return list;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    if (!name.trim()) return setFormError('Tên sản phẩm là bắt buộc');
    if (!categoryId) return setFormError('Vui lòng chọn danh mục con');
    if (!brandId) return setFormError('Vui lòng chọn thương hiệu');
    if (Number(price) < 0) return setFormError('Giá sản phẩm không được âm');
    if (!editingId && imageFiles.length === 0) {
      return setFormError('Vui lòng chọn ít nhất 1 hình ảnh khi tạo mới sản phẩm');
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('price', price);
    formData.append('category_id', categoryId);
    formData.append('brand_id', brandId);
    formData.append('gender', gender);
    formData.append('sport_type', sportType.trim());
    formData.append('description', description.trim());
    formData.append('is_featured', isFeatured);
    
    imageFiles.forEach(file => {
      formData.append('images', file);
    });

    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Cập nhật sản phẩm thành công!');
      } else {
        await api.post('/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Tạo sản phẩm mới thành công!');
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.message || 'Không thể lưu sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id) => {
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/admin/products/${id}/toggle-status`);
      setSuccess('Cập nhật trạng thái hiển thị thành công!');
      
      // Update local state
      setProducts(products.map(p => 
        p.id === id ? { ...p, is_active: response.data.is_active === 1 } : p
      ));
    } catch (err) {
      setError(err.message || 'Lỗi khi thay đổi trạng thái sản phẩm');
    }
  };

  const handleToggleFeatured = async (id) => {
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/admin/products/${id}/toggle-featured`);
      setSuccess('Cập nhật trạng thái nổi bật thành công!');
      
      // Update local state
      setProducts(products.map(p => 
        p.id === id ? { ...p, is_featured: response.data.is_featured === 1 } : p
      ));
    } catch (err) {
      setError(err.message || 'Lỗi khi thay đổi trạng thái nổi bật');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá ảnh này?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/admin/products/${editingId}/images/${imageId}`);
      setSuccess('Xoá ảnh thành công!');
      // Update current image state in modal
      setEditingImages(editingImages.filter(img => img.id !== imageId));
    } catch (err) {
      setFormError(err.message || 'Lỗi khi xoá ảnh');
    }
  };

  const handleSetMainImage = async (imageId) => {
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/admin/products/${editingId}/main-image`, { image_id: imageId });
      setSuccess('Đặt ảnh chính thành công!');
      // Fetch details again to refresh image cover
      const detailRes = await api.get(`/admin/products/${editingId}`);
      setEditingImages(detailRes.data.images || []);
      fetchProducts();
    } catch (err) {
      setFormError(err.message || 'Lỗi khi đặt ảnh chính');
    }
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
        <h3>Đang tải danh sách sản phẩm...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Quản Lý Sản Phẩm</h1>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          + Thêm Sản Phẩm Mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form Section */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            {editingId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
          </h2>
          {formError && <div className="alert alert-danger">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Tên sản phẩm</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ví dụ: Nike Air Force 1"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Giá cơ bản (vnđ)</label>
                <input 
                  type="number" 
                  min="0"
                  className="form-control" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Danh mục (Chọn danh mục con)</label>
                <select 
                  className="form-control" 
                  value={categoryId} 
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn danh mục con --</option>
                  {getChildCategories().map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.parentName ? `${cat.parentName} → ` : ''}{cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Thương hiệu</label>
                <select 
                  className="form-control" 
                  value={brandId} 
                  onChange={(e) => setBrandId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Phù hợp giới tính</label>
                <select 
                  className="form-control" 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="unisex">Unisex (Nam & Nữ)</option>
                  <option value="">Không phân loại (Ví dụ: Phụ kiện)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Loại thể thao</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={sportType} 
                  onChange={(e) => setSportType(e.target.value)} 
                  placeholder="Ví dụ: running, basketball, lifestyle..."
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả sản phẩm</label>
              <textarea 
                className="form-control" 
                rows="4"
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Mô tả chi tiết sản phẩm giày/phụ kiện..."
                style={{ resize: 'vertical', minHeight: '100px' }}
              />
            </div>

            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="checkbox" 
                id="isFeatured"
                checked={isFeatured} 
                onChange={(e) => setIsFeatured(e.target.checked)} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isFeatured" style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                Đánh dấu là Sản phẩm Nổi bật (Featured Product)
              </label>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Tải lên hình ảnh {editingId ? '(Ảnh mới)' : ''}</label>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                className="form-control" 
                onChange={handleImageChange} 
              />
              <small style={{ color: 'var(--text-secondary)' }}>Bạn có thể chọn cùng lúc nhiều ảnh (Tối đa 8 ảnh. File JPG/PNG/WEBP &lt; 2MB)</small>
            </div>

            {/* Editing Product Images Grid */}
            {editingId && editingImages.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>Quản lý ảnh hiện tại</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                  {editingImages.map((img) => (
                    <div 
                      key={img.id} 
                      className="glass-card" 
                      style={{ 
                        padding: '0.5rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        position: 'relative',
                        border: products.find(p => p.id === editingId)?.main_image_url === img.image_url ? '2px solid var(--accent)' : '1px solid var(--glass-border)'
                      }}
                    >
                      <img 
                        src={`http://localhost:8080${img.image_url}`} 
                        alt="Product" 
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                      <div className="flex gap-1" style={{ width: '100%', justifyContent: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => handleSetMainImage(img.id)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', flex: 1 }}
                          disabled={products.find(p => p.id === editingId)?.main_image_url === img.image_url}
                        >
                          Chính
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteImage(img.id)}
                          className="btn btn-danger" 
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', flex: 1, boxShadow: 'none' }}
                        >
                          Xoá
                        </button>
                      </div>
                      {products.find(p => p.id === editingId)?.main_image_url === img.image_url && (
                        <span style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'var(--accent)', color: '#000', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold' }}>
                          Bìa
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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

      {/* Filter Section */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem' }}>
        <form onSubmit={handleSearchSubmit} className="flex" style={{ flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: '200px' }}>
            <label className="form-label">Tìm kiếm sản phẩm</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Nhập tên sản phẩm..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '200px' }}>
            <label className="form-label">Danh mục</label>
            <select 
              className="form-control" 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, width: '200px' }}>
            <label className="form-label">Thương hiệu</label>
            <select 
              className="form-control" 
              value={brandFilter} 
              onChange={(e) => setBrandFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-secondary" style={{ height: '42px' }}>
            Lọc Kết Quả
          </button>
        </form>
      </div>

      {/* Products Table View */}
      {products.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Không tìm thấy sản phẩm nào phù hợp.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1rem', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '1rem 0.75rem' }}>Ảnh bìa</th>
                <th style={{ padding: '1rem 0.75rem' }}>Tên Sản Phẩm</th>
                <th style={{ padding: '1rem 0.75rem' }}>Hãng & Nhóm</th>
                <th style={{ padding: '1rem 0.75rem' }}>Giá cơ bản</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>Biến thể</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>Nổi bật</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: '1rem 0.75rem', textAlign: 'right' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const imgCover = p.main_image_url 
                  ? `http://localhost:8080${p.main_image_url}` 
                  : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100';

                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--glass-border)', fontSize: '0.95rem' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <img 
                        src={imgCover} 
                        alt={p.name} 
                        style={{ width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--glass-border)' }}
                      />
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{p.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '0.15rem' }}>
                          Slug: {p.slug}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{p.brand_name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{p.category_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                      {p.price ? p.price.toLocaleString('vi-VN') + 'đ' : '0đ'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => navigate(`/admin/products/${p.id}/variants`)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px' }}
                      >
                        {p.variant_count || 0} biến thể ⚙
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleToggleFeatured(p.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: p.is_featured ? 'var(--warning)' : 'var(--text-muted)',
                          fontSize: '1.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        {p.is_featured ? '★' : '☆'}
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span className={`badge ${p.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {p.is_active ? 'Kinh doanh' : 'Đang ẩn'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEdit(p)} 
                          className="btn btn-secondary" 
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                        >
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(p.id)} 
                          className={`btn ${p.is_active ? 'btn-danger' : 'btn-primary'}`} 
                          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', background: p.is_active ? 'var(--danger)' : 'var(--success)', boxShadow: 'none' }}
                        >
                          {p.is_active ? 'Ẩn' : 'Hiện'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Products;
