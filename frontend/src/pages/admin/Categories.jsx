import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [imageFile, setImageFile] = useState(null);
  const [formError, setFormError] = useState('');

  // Reorder State
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [flatCategories, setFlatCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/categories');
      setCategories(response.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setParentId('');
    setSortOrder('0');
    setImageFile(null);
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name || '');
    setParentId(cat.parent_id !== null ? String(cat.parent_id) : '');
    setSortOrder(String(cat.sort_order || 0));
    setImageFile(null);
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    if (!name.trim()) {
      return setFormError('Tên danh mục không được để trống');
    }

    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('parent_id', parentId || 'null');
    formData.append('sort_order', sortOrder);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Cập nhật danh mục thành công!');
      } else {
        await api.post('/admin/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccess('Tạo danh mục mới thành công!');
      }
      setShowForm(false);
      fetchCategories();
    } catch (err) {
      setFormError(err.message || 'Không thể lưu danh mục');
    }
  };

  const handleToggleStatus = async (id) => {
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/admin/categories/${id}/toggle-status`);
      setSuccess('Thay đổi trạng thái danh mục thành công!');
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  // Populate flat list of categories for reordering
  const handleOpenReorder = () => {
    const list = [];
    categories.forEach(parent => {
      list.push({ id: parent.id, name: parent.name, sort_order: parent.sort_order, isParent: true });
      if (parent.children && parent.children.length > 0) {
        parent.children.forEach(child => {
          list.push({ id: child.id, name: `└─ ${child.name}`, sort_order: child.sort_order, isParent: false });
        });
      }
    });
    setFlatCategories(list);
    setShowReorderModal(true);
  };

  const handleReorderChange = (index, value) => {
    const updated = [...flatCategories];
    updated[index].sort_order = parseInt(value) || 0;
    setFlatCategories(updated);
  };

  const handleSaveReorder = async () => {
    setError('');
    setSuccess('');
    try {
      const items = flatCategories.map(item => ({
        id: item.id,
        sort_order: item.sort_order
      }));
      await api.put('/admin/categories/reorder', { items });
      setSuccess('Cập nhật thứ tự sắp xếp thành công!');
      setShowReorderModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.message || 'Lỗi sắp xếp lại thứ tự');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
        <h3>Đang tải danh sách danh mục...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Quản Lý Danh Mục</h1>
        <div className="flex gap-2">
          <button onClick={handleOpenReorder} className="btn btn-secondary">
            ↕ Sắp Xếp Thứ Tự
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary">
            + Tạo Danh Mục Mới
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form Section */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            {editingId ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
          </h2>
          {formError && <div className="alert alert-danger">{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Tên danh mục</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ví dụ: Giày Nam"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Danh mục cha</label>
                <select 
                  className="form-control" 
                  value={parentId} 
                  onChange={(e) => setParentId(e.target.value)}
                >
                  <option value="">Không có (Là danh mục cha)</option>
                  {categories
                    .filter(c => c.id !== editingId) // Don't allow self as parent
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Thứ tự hiển thị (Sort Order)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ảnh danh mục</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="form-control" 
                  onChange={(e) => setImageFile(e.target.files[0])} 
                />
              </div>
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

      {/* Reorder Modal */}
      {showReorderModal && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--primary)' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Sắp xếp thứ tự danh mục</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Nhập số thứ tự (số nhỏ hiển thị trước) và nhấn Lưu.
          </p>
          <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem' }}>Tên Danh Mục</th>
                  <th style={{ padding: '0.5rem', width: '120px' }}>Số Thứ Tự</th>
                </tr>
              </thead>
              <tbody>
                {flatCategories.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: item.isParent ? '600' : '400' }}>{item.name}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={item.sort_order} 
                        onChange={(e) => handleReorderChange(idx, e.target.value)}
                        style={{ padding: '0.25rem 0.5rem' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveReorder} className="btn btn-primary">Lưu Thay Đổi</button>
            <button onClick={() => setShowReorderModal(false)} className="btn btn-secondary">Hủy</button>
          </div>
        </div>
      )}

      {/* Categories Tree View */}
      {categories.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Không có danh mục nào được tìm thấy.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {categories.map((parent) => {
            const parentImg = parent.image_url 
              ? `http://localhost:8080${parent.image_url}` 
              : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150';

            return (
              <div key={parent.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: parent.is_active ? '4px solid var(--primary)' : '4px solid var(--text-muted)' }}>
                {/* Parent Row */}
                <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                  <div className="flex items-center gap-4">
                    <img 
                      src={parentImg} 
                      alt={parent.name} 
                      style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                    />
                    <div>
                      <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {parent.name}
                        <span className={`badge ${parent.is_active ? 'badge-success' : 'badge-secondary'}`}>
                          {parent.is_active ? 'Đang hoạt động' : 'Đang ẩn'}
                        </span>
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Slug: {parent.slug} | Thứ tự: {parent.sort_order}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(parent)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                      Sửa
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(parent.id)} 
                      className={`btn ${parent.is_active ? 'btn-danger' : 'btn-primary'}`} 
                      style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', background: parent.is_active ? 'var(--danger)' : 'var(--success)', boxShadow: 'none' }}
                    >
                      {parent.is_active ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                </div>

                {/* Children Section */}
                <div style={{ marginLeft: '4.5rem', marginTop: '1.5rem', borderLeft: '2px dashed var(--glass-border)', paddingLeft: '1.5rem' }}>
                  {parent.children && parent.children.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {parent.children.map((child) => (
                        <div key={child.id} className="flex justify-between items-center" style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                          <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: '500' }}>
                              {child.name}
                              <span className={`badge ${child.is_active ? 'badge-success' : 'badge-secondary'}`} style={{ marginLeft: '0.5rem', fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                                {child.is_active ? 'Hoạt động' : 'Ẩn'}
                              </span>
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Slug: {child.slug} | Thứ tự: {child.sort_order}
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <button onClick={() => handleOpenEdit(child)} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>
                              Sửa
                            </button>
                            <button 
                              onClick={() => handleToggleStatus(child.id)} 
                              className="btn btn-secondary" 
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', color: child.is_active ? 'var(--danger)' : 'var(--success)' }}
                            >
                              {child.is_active ? 'Ẩn' : 'Hiện'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>Không có danh mục con</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Categories;
