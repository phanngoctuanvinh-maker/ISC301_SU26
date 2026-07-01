import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import './Banners.css';

const LINK_TYPES = [
  { value: 'none', label: 'Không liên kết' },
  { value: 'url', label: 'Đường dẫn URL' },
  { value: 'category', label: 'Danh mục' },
  { value: 'brand', label: 'Thương hiệu' },
];

const defaultForm = {
  title: '',
  link_type: 'none',
  link_url: '',
  category_id: '',
  brand_id: '',
  start_date: '',
  end_date: '',
  sort_order: 0,
};

function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Ref data for dropdowns
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Drag reorder
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(null); // banner object or null
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/banners');
      const data = (res.data || []).sort((a, b) => a.sort_order - b.sort_order);
      setBanners(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [catRes, brandRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/brands'),
      ]);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchBanners();
    fetchDropdowns();
  }, [fetchBanners, fetchDropdowns]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 3500);
      return () => clearTimeout(t);
    }
  }, [success]);

  // ─── Form Handlers ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setImageFile(null);
    setImagePreview(null);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title || '',
      link_type: banner.link_type || 'none',
      link_url: banner.link_url || '',
      category_id: banner.category_id || '',
      brand_id: banner.brand_id || '',
      start_date: banner.start_date ? banner.start_date.slice(0, 16) : '',
      end_date: banner.end_date ? banner.end_date.slice(0, 16) : '',
      sort_order: banner.sort_order ?? 0,
    });
    setImageFile(null);
    setImagePreview(banner.image_url ? banner.image_url : null);
    setFormError('');
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!editingId && !imageFile) {
      return setFormError('Vui lòng chọn ảnh banner');
    }

    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('link_type', form.link_type);
    fd.append('sort_order', form.sort_order);

    if (form.link_type === 'url') fd.append('link_url', form.link_url.trim());
    if (form.link_type === 'category') fd.append('category_id', form.category_id);
    if (form.link_type === 'brand') fd.append('brand_id', form.brand_id);
    if (form.start_date) fd.append('start_date', form.start_date);
    if (form.end_date) fd.append('end_date', form.end_date);
    if (imageFile) fd.append('image', imageFile);

    setFormLoading(true);
    try {
      if (editingId) {
        await api.put(`/admin/banners/${editingId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Cập nhật banner thành công!');
      } else {
        await api.post('/admin/banners', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSuccess('Tạo banner mới thành công!');
      }
      setShowForm(false);
      fetchBanners();
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/banners/${confirmDelete.id}`);
      setBanners(prev => prev.filter(b => b.id !== confirmDelete.id));
      setSuccess(`Đã xóa banner "${confirmDelete.title || 'Không có tiêu đề'}" thành công!`);
      setConfirmDelete(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể xóa banner');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Toggle Status ────────────────────────────────────────────────────────
  const handleToggle = async (banner) => {
    try {
      await api.put(`/admin/banners/${banner.id}/toggle-status`);
      setBanners(prev =>
        prev.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b)
      );
      setSuccess(`Banner đã được ${banner.is_active ? 'ẩn' : 'hiện'} thành công!`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không thể thay đổi trạng thái');
    }
  };

  // ─── Drag Reorder ─────────────────────────────────────────────────────────
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...banners];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, moved);
    const reordered = updated.map((b, i) => ({ ...b, sort_order: i }));
    setBanners(reordered);
    setDragIndex(null);
    setDragOverIndex(null);

    try {
      await api.put('/admin/banners/reorder', {
        items: reordered.map(b => ({ id: b.id, sort_order: b.sort_order })),
      });
      setSuccess('Sắp xếp banner thành công!');
    } catch (err) {
      setError('Lưu thứ tự thất bại, thử lại sau');
      fetchBanners();
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getBannerStatus = (banner) => {
    if (!banner.is_active) return { label: 'Đã ẩn', cls: 'status-badge--inactive' };
    const now = new Date();
    if (banner.start_date && new Date(banner.start_date) > now) return { label: 'Chưa bắt đầu', cls: 'status-badge--pending' };
    if (banner.end_date && new Date(banner.end_date) < now) return { label: 'Hết hạn', cls: 'status-badge--expired' };
    return { label: 'Đang hiển thị', cls: 'status-badge--active' };
  };

  const getLinkLabel = (banner) => {
    if (banner.link_type === 'category') return `📁 ${banner.category_name || 'Danh mục'}`;
    if (banner.link_type === 'brand') return `🏷️ ${banner.brand_name || 'Thương hiệu'}`;
    if (banner.link_type === 'voucher') return `🎟️ ${banner.voucher_code || 'Voucher'}`;
    if (banner.link_type === 'url') return `🔗 URL`;
    return '—';
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN');
  };

  const totalActive = banners.filter(b => getBannerStatus(b).cls === 'status-badge--active').length;
  const totalHidden = banners.filter(b => !b.is_active).length;
  const totalExpired = banners.filter(b => getBannerStatus(b).cls === 'status-badge--expired').length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="banners-page">

      {/* Page Header */}
      <div className="banners-header">
        <div>
          <h1 className="banners-title">
            <span className="banners-icon">🎨</span>
            Quản Lý Banner
          </h1>
          <p className="banners-sub">Quản lý banner trang chủ · Kéo thả để sắp xếp thứ tự hiển thị</p>
        </div>
        <button className="btn-primary-banner" onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Thêm Banner Mới
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="banner-alert banner-alert--error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>{error}</span>
          <button className="banner-alert-close" onClick={() => setError('')}>✕</button>
        </div>
      )}
      {success && (
        <div className="banner-alert banner-alert--success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span>{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="banner-stats-row">
        <div className="banner-stat">
          <span className="banner-stat__num">{banners.length}</span>
          <span className="banner-stat__lbl">Tổng Banner</span>
        </div>
        <div className="banner-stat banner-stat--success">
          <span className="banner-stat__num">{totalActive}</span>
          <span className="banner-stat__lbl">Đang Hiển Thị</span>
        </div>
        <div className="banner-stat banner-stat--warn">
          <span className="banner-stat__num">{totalHidden}</span>
          <span className="banner-stat__lbl">Đã Ẩn</span>
        </div>
        <div className="banner-stat banner-stat--danger">
          <span className="banner-stat__num">{totalExpired}</span>
          <span className="banner-stat__lbl">Hết Hạn</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="banner-loading-state">
          <div className="banner-spinner"></div>
          <span>Đang tải banner...</span>
        </div>
      ) : banners.length === 0 ? (
        <div className="banner-empty-state">
          <div className="banner-empty-icon">🖼️</div>
          <h3>Chưa có banner nào</h3>
          <p>Tạo banner đầu tiên để hiển thị trên trang chủ của bạn</p>
          <button className="btn-primary-banner" onClick={openCreate}>Tạo Banner Ngay</button>
        </div>
      ) : (
        <>
          <p className="banner-drag-hint">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l-3 3 3 3"/><path d="M9 5l3-3 3 3"/><path d="M15 19l3-3-3-3"/><path d="M19 9l3 3-3 3"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>
            Kéo thả thẻ banner để thay đổi thứ tự hiển thị
          </p>
          <div className="banner-cards-grid">
            {banners.map((banner, index) => {
              const status = getBannerStatus(banner);
              return (
                <div
                  key={banner.id}
                  className={`banner-card ${dragIndex === index ? 'banner-card--dragging' : ''} ${dragOverIndex === index && dragIndex !== index ? 'banner-card--dragover' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                >
                  {/* Drag handle */}
                  <div className="banner-card__drag-handle" title="Kéo để sắp xếp">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="6" r="1" fill="currentColor"/>
                      <circle cx="9" cy="12" r="1" fill="currentColor"/>
                      <circle cx="9" cy="18" r="1" fill="currentColor"/>
                      <circle cx="15" cy="6" r="1" fill="currentColor"/>
                      <circle cx="15" cy="12" r="1" fill="currentColor"/>
                      <circle cx="15" cy="18" r="1" fill="currentColor"/>
                    </svg>
                  </div>

                  {/* Order badge */}
                  <span className="banner-card__order">#{index + 1}</span>

                  {/* Image */}
                  <div className="banner-card__img-wrap">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title || 'Banner'}
                        className="banner-card__img"
                        onError={e => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="banner-card__img-placeholder" style={{ display: banner.image_url ? 'none' : 'flex' }}>
                      🖼️
                    </div>
                  </div>

                  {/* Info */}
                  <div className="banner-card__body">
                    <div className="banner-card__top-row">
                      <h3 className="banner-card__title">{banner.title || <em style={{ opacity: 0.5 }}>Không có tiêu đề</em>}</h3>
                      <span className={`status-badge ${status.cls}`}>{status.label}</span>
                    </div>

                    <div className="banner-card__meta">
                      <span className="banner-card__meta-item">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        {getLinkLabel(banner)}
                      </span>
                    </div>

                    <div className="banner-card__dates">
                      <span>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {formatDate(banner.start_date)} → {formatDate(banner.end_date)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="banner-card__actions">
                      <button
                        className={`banner-toggle-btn ${banner.is_active ? 'banner-toggle-btn--hide' : 'banner-toggle-btn--show'}`}
                        onClick={() => handleToggle(banner)}
                        title={banner.is_active ? 'Ẩn banner' : 'Hiện banner'}
                      >
                        {banner.is_active ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            Ẩn
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            Hiện
                          </>
                        )}
                      </button>

                      <button className="banner-edit-btn" onClick={() => openEdit(banner)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Sửa
                      </button>

                      <button className="banner-delete-btn" onClick={() => setConfirmDelete(banner)} title="Xóa banner">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ─── Modal Form ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="banner-modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="banner-modal">
            <div className="banner-modal__header">
              <h2 className="banner-modal__title">
                {editingId ? '✏️ Chỉnh Sửa Banner' : '➕ Tạo Banner Mới'}
              </h2>
              <button className="banner-modal__close" onClick={() => setShowForm(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="banner-modal__body">
              {formError && (
                <div className="banner-form-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {formError}
                </div>
              )}

              {/* Image Upload */}
              <div className="banner-form-group">
                <label className="banner-form-label">
                  Ảnh Banner <span className="required">*</span>
                  {!editingId && <em className="banner-form-hint"> (Bắt buộc khi tạo mới)</em>}
                </label>
                <div
                  className="banner-upload-zone"
                  onClick={() => document.getElementById('banner-image-input').click()}
                  style={{ backgroundImage: imagePreview ? `url(${imagePreview})` : 'none' }}
                >
                  {!imagePreview && (
                    <div className="banner-upload-placeholder">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span>Nhấp để chọn ảnh banner</span>
                      <small>JPG, PNG, WebP · Tỉ lệ 16:5 được khuyến nghị</small>
                    </div>
                  )}
                  {imagePreview && <div className="banner-upload-overlay">🔄 Nhấp để thay đổi ảnh</div>}
                </div>
                <input
                  id="banner-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Title */}
              <div className="banner-form-group">
                <label className="banner-form-label">Tiêu Đề Banner</label>
                <input
                  type="text"
                  className="banner-form-input"
                  placeholder="VD: Sale mùa hè lên đến 50%"
                  value={form.title}
                  onChange={e => handleFormChange('title', e.target.value)}
                />
              </div>

              {/* Link Type */}
              <div className="banner-form-group">
                <label className="banner-form-label">Loại Liên Kết</label>
                <select
                  className="banner-form-select"
                  value={form.link_type}
                  onChange={e => handleFormChange('link_type', e.target.value)}
                >
                  {LINK_TYPES.map(lt => (
                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                  ))}
                </select>
              </div>

              {/* Conditional fields */}
              {form.link_type === 'url' && (
                <div className="banner-form-group">
                  <label className="banner-form-label">Đường Dẫn URL <span className="required">*</span></label>
                  <input
                    type="url"
                    className="banner-form-input"
                    placeholder="https://example.com/sale"
                    value={form.link_url}
                    onChange={e => handleFormChange('link_url', e.target.value)}
                  />
                </div>
              )}

              {form.link_type === 'category' && (
                <div className="banner-form-group">
                  <label className="banner-form-label">Danh Mục <span className="required">*</span></label>
                  <select
                    className="banner-form-select"
                    value={form.category_id}
                    onChange={e => handleFormChange('category_id', e.target.value)}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.link_type === 'brand' && (
                <div className="banner-form-group">
                  <label className="banner-form-label">Thương Hiệu <span className="required">*</span></label>
                  <select
                    className="banner-form-select"
                    value={form.brand_id}
                    onChange={e => handleFormChange('brand_id', e.target.value)}
                  >
                    <option value="">-- Chọn thương hiệu --</option>
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date range */}
              <div className="banner-form-row">
                <div className="banner-form-group">
                  <label className="banner-form-label">Ngày Bắt Đầu</label>
                  <input
                    type="datetime-local"
                    className="banner-form-input"
                    value={form.start_date}
                    onChange={e => handleFormChange('start_date', e.target.value)}
                  />
                </div>
                <div className="banner-form-group">
                  <label className="banner-form-label">Ngày Kết Thúc</label>
                  <input
                    type="datetime-local"
                    className="banner-form-input"
                    value={form.end_date}
                    onChange={e => handleFormChange('end_date', e.target.value)}
                  />
                </div>
              </div>

              {/* Sort order */}
              <div className="banner-form-group">
                <label className="banner-form-label">Thứ Tự Hiển Thị</label>
                <input
                  type="number"
                  className="banner-form-input"
                  min="0"
                  value={form.sort_order}
                  onChange={e => handleFormChange('sort_order', parseInt(e.target.value) || 0)}
                  style={{ width: '120px' }}
                />
                <small className="banner-form-hint"> (Số nhỏ hơn hiển thị trước)</small>
              </div>

              {/* Actions */}
              <div className="banner-modal__footer">
                <button
                  type="button"
                  className="btn-banner-cancel"
                  onClick={() => setShowForm(false)}
                  disabled={formLoading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-banner-save"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <span className="btn-spinner"></span>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      {editingId ? 'Cập Nhật Banner' : 'Tạo Banner'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Confirm Delete Dialog ─────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="banner-modal-overlay" onClick={(e) => e.target === e.currentTarget && !deleteLoading && setConfirmDelete(null)}>
          <div className="banner-confirm-dialog">
            <div className="banner-confirm-icon">🗑️</div>
            <h3 className="banner-confirm-title">Xác Nhận Xóa Banner</h3>
            <p className="banner-confirm-desc">
              Bạn có chắc chắn muốn xóa banner{' '}
              <strong>"{confirmDelete.title || 'Không có tiêu đề'}"</strong>?{' '}
              Hành động này không thể hoàn tác và ảnh sẽ bị xóa vĩnh viễn.
            </p>
            {confirmDelete.image_url && (
              <img
                src={confirmDelete.image_url}
                alt="Preview"
                className="banner-confirm-preview"
              />
            )}
            <div className="banner-confirm-actions">
              <button
                className="btn-banner-cancel"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteLoading}
              >
                Hủy Bỏ
              </button>
              <button
                className="btn-banner-delete-confirm"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <><span className="btn-spinner"></span> Đang xóa...</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Xóa Vĩnh Viễn</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Banners;
