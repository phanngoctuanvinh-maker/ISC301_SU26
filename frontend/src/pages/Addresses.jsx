import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State for Create/Edit
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [ward, setWard] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/addresses');
      setAddresses(response.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setReceiverName('');
    setPhone('');
    setAddressLine('');
    setWard('');
    setDistrict('');
    setCity('');
    setFormError('');
    setShowForm(false);
  };

  const handleOpenEdit = (addr) => {
    setEditingId(addr.id);
    setReceiverName(addr.receiver_name || '');
    setPhone(addr.phone || '');
    setAddressLine(addr.address_line || '');
    setWard(addr.ward || '');
    setDistrict(addr.district || '');
    setCity(addr.city || '');
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    // Client-side validations
    if (receiverName.trim().length < 2) {
      return setFormError('Tên người nhận phải có ít nhất 2 ký tự');
    }
    if (!/^0\d{9}$/.test(phone)) {
      return setFormError('Số điện thoại không hợp lệ (phải bắt đầu bằng số 0 và có 10 chữ số)');
    }
    if (addressLine.trim().length < 5) {
      return setFormError('Địa chỉ chi tiết phải có ít nhất 5 ký tự');
    }
    if (!district.trim()) {
      return setFormError('Quận/Huyện không được bỏ trống');
    }
    if (!city.trim()) {
      return setFormError('Tỉnh/Thành phố không được bỏ trống');
    }

    const payload = {
      receiver_name: receiverName,
      phone,
      address_line: addressLine,
      ward: ward || null,
      district,
      city
    };

    try {
      if (editingId) {
        await api.put(`/addresses/${editingId}`, payload);
        setSuccess('Cập nhật địa chỉ thành công!');
      } else {
        await api.post('/addresses', payload);
        setSuccess('Thêm địa chỉ nhận hàng thành công!');
      }
      resetForm();
      fetchAddresses();
    } catch (err) {
      setFormError(err.message || 'Lỗi xử lý dữ liệu địa chỉ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;
    setError('');
    setSuccess('');

    try {
      const response = await api.delete(`/addresses/${id}`);
      setSuccess(response.message || 'Xóa địa chỉ thành công!');
      fetchAddresses();
    } catch (err) {
      setError(err.message || 'Xóa địa chỉ thất bại');
    }
  };

  const handleSetDefault = async (id) => {
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/addresses/${id}/default`);
      setSuccess(response.message || 'Đặt mặc định thành công!');
      fetchAddresses();
    } catch (err) {
      setError(err.message || 'Lỗi đặt địa chỉ mặc định');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
        <h3>Đang tải danh sách địa chỉ...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Địa Chỉ Nhận Hàng</h1>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="btn btn-primary"
        >
          + Thêm Địa Chỉ Mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form Modal/Section */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            {editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ nhận hàng mới'}
          </h2>
          
          {formError && <div className="alert alert-danger" style={{ padding: '0.75rem' }}>{formError}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Tên người nhận</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={receiverName} 
                  onChange={(e) => setReceiverName(e.target.value)} 
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="0987654321"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Địa chỉ chi tiết (Số nhà, tên đường)</label>
              <input 
                type="text" 
                className="form-control" 
                value={addressLine} 
                onChange={(e) => setAddressLine(e.target.value)} 
                placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Phường/Xã (Tùy chọn)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={ward} 
                  onChange={(e) => setWard(e.target.value)} 
                  placeholder="Phường Bến Nghé"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Quận/Huyện</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={district} 
                  onChange={(e) => setDistrict(e.target.value)} 
                  placeholder="Quận 1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tỉnh/Thành phố</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={city} 
                  onChange={(e) => setCity(e.target.value)} 
                  placeholder="TP. Hồ Chí Minh"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Cập nhật' : 'Thêm mới'}
              </button>
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Bạn chưa thêm địa chỉ nhận hàng nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <div key={addr.id} className="glass-card address-card flex flex-col justify-between gap-4">
              <div>
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem' }}>{addr.receiver_name}</h3>
                  {addr.is_default ? (
                    <span className="badge badge-success">Mặc định</span>
                  ) : (
                    <button 
                      onClick={() => handleSetDefault(addr.id)} 
                      className="badge badge-secondary"
                      style={{ cursor: 'pointer' }}
                    >
                      Đặt mặc định
                    </button>
                  )}
                </div>
                
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <strong>Số điện thoại:</strong> {addr.phone}
                </p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  <strong>Địa chỉ:</strong> {addr.address_line}
                  {addr.ward ? `, ${addr.ward}` : ''}
                  {`, ${addr.district}, ${addr.city}`}
                </p>
              </div>

              <div className="flex gap-2" style={{ marginTop: '1rem', alignSelf: 'flex-end' }}>
                <button 
                  onClick={() => handleOpenEdit(addr)} 
                  className="btn btn-secondary" 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                >
                  Sửa
                </button>
                <button 
                  onClick={() => handleDelete(addr.id)} 
                  className="btn btn-danger" 
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Addresses;
