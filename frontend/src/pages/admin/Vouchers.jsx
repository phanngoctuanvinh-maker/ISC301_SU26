import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function Vouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filters State
  const [keyword, setKeyword] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('all');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('0');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchVouchers();
  }, [isActiveFilter]); // Refetch on filter change

  const fetchVouchers = async (searchKeyword = keyword) => {
    try {
      setLoading(true);
      setError('');
      let url = '/admin/vouchers?';
      if (isActiveFilter !== 'all') {
        url += `is_active=${isActiveFilter === 'active'}&`;
      }
      if (searchKeyword.trim()) {
        url += `keyword=${encodeURIComponent(searchKeyword.trim())}&`;
      }
      const response = await api.get(url);
      setVouchers(response.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVouchers();
  };

  // Helper to convert API datetime to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatToDatetimeLocal = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setCode('');
    setDescription('');
    setDiscountType('percent');
    setDiscountValue('');
    setMinOrderValue('0');
    setMaxDiscount('');
    setUsageLimit('');
    setStartDate('');
    setExpiryDate('');
    setFormError('');
    setShowForm(true);
  };

  const handleOpenEdit = (v) => {
    setEditingId(v.id);
    setCode(v.code || '');
    setDescription(v.description || '');
    setDiscountType(v.discount_type || 'percent');
    setDiscountValue(v.discount_value ? String(v.discount_value) : '');
    setMinOrderValue(v.min_order_value ? String(v.min_order_value) : '0');
    setMaxDiscount(v.max_discount ? String(v.max_discount) : '');
    setUsageLimit(v.usage_limit ? String(v.usage_limit) : '');
    setStartDate(formatToDatetimeLocal(v.start_date));
    setExpiryDate(formatToDatetimeLocal(v.expiry_date));
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    // Validations
    if (!editingId && !code.trim()) {
      return setFormError('Mã voucher không được để trống');
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      return setFormError('Giá trị giảm phải lớn hơn 0');
    }
    if (discountType === 'percent' && parseFloat(discountValue) > 100) {
      return setFormError('Phần trăm giảm không được vượt quá 100%');
    }
    if (startDate && expiryDate && new Date(expiryDate) <= new Date(startDate)) {
      return setFormError('Ngày hết hạn phải sau ngày bắt đầu');
    }

    const payload = {
      description: description.trim() || null,
      discount_type: discountType,
      discount_value: parseInt(discountValue, 10),
      min_order_value: parseInt(minOrderValue, 10) || 0,
      max_discount: discountType === 'fixed' ? null : (maxDiscount ? parseInt(maxDiscount, 10) : null),
      usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null
    };

    if (!editingId) {
      payload.code = code.trim().toUpperCase();
    }

    try {
      if (editingId) {
        await api.put(`/admin/vouchers/${editingId}`, payload);
        setSuccess('Cập nhật voucher thành công!');
      } else {
        await api.post('/admin/vouchers', payload);
        setSuccess('Tạo voucher mới thành công!');
      }
      setShowForm(false);
      fetchVouchers();
    } catch (err) {
      setFormError(err.message || 'Không thể lưu voucher');
    }
  };

  const handleToggleStatus = async (id) => {
    setError('');
    setSuccess('');
    try {
      const response = await api.put(`/admin/vouchers/${id}/toggle-status`);
      setSuccess(`Thay đổi trạng thái voucher thành công!`);
      fetchVouchers();
    } catch (err) {
      setError(err.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return '0';
    return Number(val).toLocaleString('vi-VN') + '₫';
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'Vô thời hạn';
    const d = new Date(dateString);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Quản Lý Voucher</h1>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          + Tạo Voucher Mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form Section */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            {editingId ? `Chỉnh sửa voucher: ${code}` : 'Tạo mã giảm giá mới'}
          </h2>
          {formError && <div className="alert alert-danger">{formError}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Mã giảm giá (Code)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="Ví dụ: SALE20"
                  disabled={!!editingId} // Disable code edit to comply with backend rules
                  required
                  style={{ textTransform: 'uppercase' }}
                />
                {editingId && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Không được sửa mã code sau khi tạo
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Loại giảm giá</label>
                <select 
                  className="form-control" 
                  value={discountType} 
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    if (e.target.value === 'fixed') setMaxDiscount('');
                  }}
                >
                  <option value="percent">Giảm theo % (Percent)</option>
                  <option value="fixed">Giảm số tiền cố định (Fixed)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Giá trị giảm ({discountType === 'percent' ? '%' : 'VNĐ'})
                </label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={discountValue} 
                  onChange={(e) => setDiscountValue(e.target.value)} 
                  placeholder={discountType === 'percent' ? 'Ví dụ: 20' : 'Ví dụ: 50000'}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Đơn tối thiểu (VNĐ)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={minOrderValue} 
                  onChange={(e) => setMinOrderValue(e.target.value)} 
                  placeholder="Ví dụ: 100000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Giảm tối đa (VNĐ)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={maxDiscount} 
                  onChange={(e) => setMaxDiscount(e.target.value)} 
                  placeholder="Để trống nếu không giới hạn"
                  disabled={discountType === 'fixed'}
                  style={discountType === 'fixed' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                />
                {discountType === 'fixed' && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Không áp dụng cho loại cố định
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Giới hạn số lần dùng</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={usageLimit} 
                  onChange={(e) => setUsageLimit(e.target.value)} 
                  placeholder="Để trống nếu không giới hạn"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Thời gian bắt đầu</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Thời gian hết hạn</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  value={expiryDate} 
                  onChange={(e) => setExpiryDate(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Mô tả mã giảm giá</label>
              <textarea 
                className="form-control" 
                rows="2"
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Nhập mô tả cho khách hàng dễ hiểu (Ví dụ: Giảm 20% tối đa 50K cho mọi đơn hàng)"
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

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <form onSubmit={handleSearchSubmit} className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex items-center gap-4" style={{ flex: 1, minWidth: '280px' }}>
            <input 
              type="text" 
              className="form-control"
              placeholder="Tìm kiếm mã code hoặc mô tả..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>
              🔍 Tìm Kiếm
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TRẠNG THÁI:</span>
            <select 
              className="form-control" 
              value={isActiveFilter} 
              onChange={(e) => setIsActiveFilter(e.target.value)}
              style={{ width: '180px' }}
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Đang ẩn</option>
            </select>
          </div>
        </form>
      </div>

      {/* Table List View */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
          <h3>Đang tải danh sách voucher...</h3>
        </div>
      ) : vouchers.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Không tìm thấy mã giảm giá nào phù hợp.
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Mã (Code)</th>
                <th style={{ padding: '1rem' }}>Loại & Mức giảm</th>
                <th style={{ padding: '1rem' }}>Điều kiện đơn</th>
                <th style={{ padding: '1rem' }}>Giới hạn lượt dùng</th>
                <th style={{ padding: '1rem' }}>Thời gian hiệu lực</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => {
                const now = new Date();
                const isStarted = !v.start_date || new Date(v.start_date) <= now;
                const isExpired = v.expiry_date && new Date(v.expiry_date) < now;
                const isLimitReached = v.usage_limit !== null && v.used_count >= v.usage_limit;
                
                // Determine display sub-badge for active vouchers
                let validityBadge = null;
                if (v.is_active) {
                  if (isExpired) {
                    validityBadge = <span className="badge badge-secondary" style={{ backgroundColor: 'var(--danger)', color: 'white', marginLeft: '0.4rem', fontSize: '0.65rem' }}>Hết hạn</span>;
                  } else if (!isStarted) {
                    validityBadge = <span className="badge badge-secondary" style={{ backgroundColor: 'var(--warning)', color: 'white', marginLeft: '0.4rem', fontSize: '0.65rem' }}>Chưa hiệu lực</span>;
                  } else if (isLimitReached) {
                    validityBadge = <span className="badge badge-secondary" style={{ backgroundColor: 'var(--text-muted)', color: 'white', marginLeft: '0.4rem', fontSize: '0.65rem' }}>Hết lượt</span>;
                  } else {
                    validityBadge = <span className="badge badge-success" style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>Đang chạy</span>;
                  }
                }

                return (
                  <tr 
                    key={v.id} 
                    style={{ 
                      borderBottom: '1px solid var(--glass-border)',
                      transition: 'background var(--transition-fast)' 
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--primary)' }}>
                        {v.code}
                      </div>
                      {v.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {v.description}
                        </div>
                      )}
                    </td>
                    
                    <td style={{ padding: '1rem' }}>
                      <span className="badge" style={{ backgroundColor: v.discount_type === 'percent' ? 'var(--primary-light)' : 'var(--accent-light)', color: v.discount_type === 'percent' ? 'var(--primary)' : 'var(--accent)', marginRight: '0.5rem', fontWeight: 700 }}>
                        {v.discount_type === 'percent' ? 'Phần trăm %' : 'Cố định ₫'}
                      </span>
                      <strong style={{ fontSize: '1.05rem' }}>
                        {v.discount_type === 'percent' ? `${v.discount_value}%` : formatCurrency(v.discount_value)}
                      </strong>
                      {v.discount_type === 'percent' && v.max_discount && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          Giảm tối đa: {formatCurrency(v.max_discount)}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      Đơn từ: <strong>{formatCurrency(v.min_order_value)}</strong>
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                      Đã dùng: <strong>{v.used_count}</strong> / {v.usage_limit !== null ? v.usage_limit : '∞'}
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div>Từ: {formatDateDisplay(v.start_date)}</div>
                      <div style={{ marginTop: '0.2rem' }}>Đến: {formatDateDisplay(v.expiry_date)}</div>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div className="flex items-center justify-center">
                        <span className={`badge ${v.is_active ? 'badge-success' : 'badge-secondary'}`}>
                          {v.is_active ? 'Đang bật' : 'Đang ẩn'}
                        </span>
                        {validityBadge}
                      </div>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleOpenEdit(v)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                          Sửa
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(v.id)} 
                          className={`btn ${v.is_active ? 'btn-danger' : 'btn-primary'}`} 
                          style={{ 
                            padding: '0.35rem 0.75rem', 
                            fontSize: '0.8rem', 
                            background: v.is_active ? 'var(--danger)' : 'var(--success)', 
                            boxShadow: 'none' 
                          }}
                        >
                          {v.is_active ? 'Ẩn' : 'Hiện'}
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

export default Vouchers;
