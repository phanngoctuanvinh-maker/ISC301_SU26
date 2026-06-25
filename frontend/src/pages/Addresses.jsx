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
  const [addressType, setAddressType] = useState('Nhà');
  const [formError, setFormError] = useState('');

  // Dropdown states for Vietnam Administrative Divisions
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  useEffect(() => {
    fetchAddresses();
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    try {
      const res = await fetch('https://provinces.open-api.vn/api/p/');
      const data = await res.json();
      setProvinces(data);
    } catch (err) {
      console.error('Error loading provinces:', err);
    }
  };

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setDistricts([]);
      setWards([]);
      return;
    }
    const loadDistricts = async () => {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${selectedProvinceCode}?depth=2`);
        const data = await res.json();
        setDistricts(data.districts || []);
      } catch (err) {
        console.error('Error loading districts:', err);
      }
    };
    loadDistricts();
  }, [selectedProvinceCode]);

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrictCode) {
      setWards([]);
      return;
    }
    const loadWards = async () => {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${selectedDistrictCode}?depth=2`);
        const data = await res.json();
        setWards(data.wards || []);
      } catch (err) {
        console.error('Error loading wards:', err);
      }
    };
    loadWards();
  }, [selectedDistrictCode]);

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
    setAddressType('Nhà');
    setFormError('');
    setShowForm(false);

    setSelectedProvinceCode('');
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);
  };

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    setSelectedProvinceCode(code);
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setDistrict('');
    setWard('');

    const matched = provinces.find(p => String(p.code) === String(code));
    setCity(matched ? matched.name : '');
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    setSelectedDistrictCode(code);
    setSelectedWardCode('');
    setWard('');

    const matched = districts.find(d => String(d.code) === String(code));
    setDistrict(matched ? matched.name : '');
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    setSelectedWardCode(code);

    const matched = wards.find(w => String(w.code) === String(code));
    setWard(matched ? matched.name : '');
  };

  const handleOpenEdit = async (addr) => {
    setEditingId(addr.id);
    setReceiverName(addr.receiver_name || '');
    setPhone(addr.phone || '');
    setAddressLine(addr.address_line || '');
    setAddressType(addr.address_type || 'Nhà');
    setFormError('');
    setShowForm(true);

    // Mapped database values
    setCity(addr.city || '');
    setDistrict(addr.district || '');
    setWard(addr.ward || '');

    // Now map strings back to codes and fetch nested divisions sequentially
    try {
      let matchedProv = provinces.find(p => 
        p.name.toLowerCase().includes(addr.city.toLowerCase()) || 
        addr.city.toLowerCase().includes(p.name.toLowerCase())
      );
      if (matchedProv) {
        setSelectedProvinceCode(matchedProv.code);

        // Fetch districts immediately for editing
        const distRes = await fetch(`https://provinces.open-api.vn/api/p/${matchedProv.code}?depth=2`);
        const distData = await distRes.json();
        const distList = distData.districts || [];
        setDistricts(distList);

        // Find district
        let matchedDist = distList.find(d => 
          d.name.toLowerCase().includes(addr.district.toLowerCase()) || 
          addr.district.toLowerCase().includes(d.name.toLowerCase())
        );
        if (matchedDist) {
          setSelectedDistrictCode(matchedDist.code);

          // Fetch wards immediately for editing
          const wardRes = await fetch(`https://provinces.open-api.vn/api/d/${matchedDist.code}?depth=2`);
          const wardData = await wardRes.json();
          const wardList = wardData.wards || [];
          setWards(wardList);

          // Find ward
          if (addr.ward) {
            let matchedWard = wardList.find(w => 
              w.name.toLowerCase().includes(addr.ward.toLowerCase()) || 
              addr.ward.toLowerCase().includes(w.name.toLowerCase())
            );
            if (matchedWard) {
              setSelectedWardCode(matchedWard.code);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error mapping address to codes for editing:', err);
    }
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
      city,
      address_type: addressType
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
                <label className="form-label">Tỉnh/Thành phố</label>
                <select 
                  className="form-control" 
                  value={selectedProvinceCode} 
                  onChange={handleProvinceChange}
                  required
                >
                  <option value="">-- Chọn Tỉnh/Thành phố --</option>
                  {provinces.map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quận/Huyện</label>
                <select 
                  className="form-control" 
                  value={selectedDistrictCode} 
                  onChange={handleDistrictChange}
                  disabled={!selectedProvinceCode}
                  required
                >
                  <option value="">-- Chọn Quận/Huyện --</option>
                  {districts.map(d => (
                    <option key={d.code} value={d.code}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Phường/Xã (Tùy chọn)</label>
                <select 
                  className="form-control" 
                  value={selectedWardCode} 
                  onChange={handleWardChange}
                  disabled={!selectedDistrictCode}
                >
                  <option value="">-- Chọn Phường/Xã --</option>
                  {wards.map(w => (
                    <option key={w.code} value={w.code}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Loại địa chỉ</label>
              <div className="flex gap-4">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="addressType" value="Nhà" checked={addressType === 'Nhà'} onChange={(e) => setAddressType(e.target.value)} />
                  Nhà
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="addressType" value="Công ty" checked={addressType === 'Công ty'} onChange={(e) => setAddressType(e.target.value)} />
                  Công ty
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="addressType" value="Khác" checked={addressType === 'Khác'} onChange={(e) => setAddressType(e.target.value)} />
                  Khác
                </label>
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
                  <strong>Loại địa chỉ:</strong> {addr.address_type || 'Nhà'}
                </p>
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
