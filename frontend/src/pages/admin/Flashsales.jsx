import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function Flashsales() {
  const [sessions, setSessions] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [formError, setFormError] = useState('');

  // Add Item to session state
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentFlashPrice, setCurrentFlashPrice] = useState('');
  const [currentFlashQuantity, setCurrentFlashQuantity] = useState('');

  useEffect(() => {
    fetchFlashSales();
    fetchProducts();
  }, []);

  const fetchFlashSales = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/flashsales/admin');
      setSessions(response.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách Flash Sale');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products', { params: { limit: 100 } });
      setProductsList(response.data?.items || []);
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
    }
  };

  const handleOpenCreate = () => {
    setName('');
    
    // Set default times: tomorrow 12:00 to 14:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    
    setStartTime(`${year}-${month}-${day}T12:00`);
    setEndTime(`${year}-${month}-${day}T14:00`);
    
    setSelectedItems([]);
    setFormError('');
    setCurrentProductId('');
    setCurrentFlashPrice('');
    setCurrentFlashQuantity('');
    setShowForm(true);
  };

  const handleAddItem = () => {
    setFormError('');
    if (!currentProductId) {
      return setFormError('Vui lòng chọn sản phẩm');
    }
    if (!currentFlashPrice || parseFloat(currentFlashPrice) <= 0) {
      return setFormError('Giá flash sale phải lớn hơn 0');
    }
    if (!currentFlashQuantity || parseInt(currentFlashQuantity, 10) <= 0) {
      return setFormError('Số lượng giới hạn phải lớn hơn 0');
    }

    // Check duplicate
    if (selectedItems.some(item => item.product_id === parseInt(currentProductId, 10))) {
      return setFormError('Sản phẩm này đã được thêm vào danh sách');
    }

    const prod = productsList.find(p => p.id === parseInt(currentProductId, 10));
    
    setSelectedItems([
      ...selectedItems,
      {
        product_id: prod.id,
        name: prod.name,
        original_price: prod.price,
        flash_price: parseFloat(currentFlashPrice),
        flash_quantity: parseInt(currentFlashQuantity, 10)
      }
    ]);

    // Clear item inputs
    setCurrentProductId('');
    setCurrentFlashPrice('');
    setCurrentFlashQuantity('');
  };

  const handleRemoveItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccess('');

    if (!name.trim()) {
      return setFormError('Tên chương trình không được để trống');
    }
    if (!startTime || !endTime) {
      return setFormError('Thời gian bắt đầu và kết thúc không được để trống');
    }
    if (new Date(endTime) <= new Date(startTime)) {
      return setFormError('Thời gian kết thúc phải diễn ra sau thời gian bắt đầu');
    }
    if (selectedItems.length === 0) {
      return setFormError('Vui lòng thêm ít nhất một sản phẩm vào chương trình Flash Sale');
    }

    const payload = {
      name: name.trim(),
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      items: selectedItems.map(item => ({
        product_id: item.product_id,
        flash_price: item.flash_price,
        flash_quantity: item.flash_quantity
      }))
    };

    try {
      await api.post('/flashsales/admin', payload);
      setSuccess('Tạo chương trình Flash Sale thành công!');
      setShowForm(false);
      fetchFlashSales();
    } catch (err) {
      setFormError(err.message || 'Không thể tạo chương trình Flash Sale');
    }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá chương trình Flash Sale này không?')) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/flashsales/admin/${id}`);
      setSuccess('Xoá chương trình Flash Sale thành công!');
      fetchFlashSales();
    } catch (err) {
      setError(err.message || 'Không thể xoá chương trình Flash Sale');
    }
  };

  const formatCurrency = (val) => {
    return Number(val).toLocaleString('vi-VN') + '₫';
  };

  const formatDateDisplay = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (session) => {
    const now = new Date();
    const start = new Date(session.start_time);
    const end = new Date(session.end_time);

    if (!session.is_active) {
      return <span className="badge badge-secondary">Đã ẩn</span>;
    }
    if (now > end) {
      return <span className="badge badge-secondary" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>Đã kết thúc</span>;
    }
    if (now >= start && now <= end) {
      return <span className="badge badge-success">Đang chạy</span>;
    }
    return <span className="badge badge-warning" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>Sắp diễn ra</span>;
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Quản Lý Flash Sale</h1>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          + Tạo Flash Sale Mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Form Section */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', border: '1px solid var(--accent)' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
            Tạo chương trình Flash Sale mới theo giờ
          </h2>
          {formError && <div className="alert alert-danger">{formError}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Tên chương trình</label>
              <input 
                type="text" 
                className="form-control" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Ví dụ: Giờ vàng Nike Air Max"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Thời gian bắt đầu</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  value={startTime} 
                  onChange={(e) => setStartTime(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Thời gian kết thúc</label>
                <input 
                  type="datetime-local" 
                  className="form-control" 
                  value={endTime} 
                  onChange={(e) => setEndTime(e.target.value)} 
                  required
                />
              </div>
            </div>

            {/* Add Products Section */}
            <div style={{ border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', fontWeight: 'bold' }}>Thêm sản phẩm tham gia</h3>
              
              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Chọn sản phẩm</label>
                  <select 
                    className="form-control" 
                    value={currentProductId} 
                    onChange={(e) => {
                      setCurrentProductId(e.target.value);
                      const prod = productsList.find(p => p.id === parseInt(e.target.value, 10));
                      if (prod) {
                        // Autofill 1.5M for Nike Air Max 90 for quicker user demo
                        if (prod.slug === 'nike-air-max-90') {
                          setCurrentFlashPrice('1500000');
                          setCurrentFlashQuantity('20');
                        } else {
                          setCurrentFlashPrice(String(Math.round(prod.price * 0.6))); // Suggest 40% discount
                          setCurrentFlashQuantity('10');
                        }
                      }
                    }}
                  >
                    <option value="">-- Chọn sản phẩm --</option>
                    {productsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({formatCurrency(p.price)})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Giá Flash Sale (VNĐ)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={currentFlashPrice} 
                    onChange={(e) => setCurrentFlashPrice(e.target.value)} 
                    placeholder="Ví dụ: 1500000"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Số lượng Flash Sale giới hạn</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={currentFlashQuantity} 
                    onChange={(e) => setCurrentFlashQuantity(e.target.value)} 
                    placeholder="Ví dụ: 20"
                  />
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleAddItem} 
                className="btn btn-secondary" 
                style={{ marginTop: '1rem', width: '100%' }}
              >
                + Thêm vào danh sách bên dưới
              </button>
            </div>

            {/* Added products table list */}
            {selectedItems.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Danh sách sản phẩm tham gia:</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--glass-border)' }}>
                      <th style={{ padding: '0.5rem' }}>Tên sản phẩm</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Giá gốc</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Giá Flash Sale</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Số lượng</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => (
                      <tr key={item.product_id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                        <td style={{ padding: '0.5rem' }}>{item.name}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>{formatCurrency(item.original_price)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent)' }}>{formatCurrency(item.flash_price)}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>{item.flash_quantity} đôi</td>
                        <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveItem(index)} 
                            className="btn btn-danger" 
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', boxShadow: 'none' }}
                          >
                            Xoá
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-4">
              <button type="submit" className="btn btn-primary">
                Tạo chương trình
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table List View */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem' }}>
          <h3>Đang tải danh sách Flash Sale...</h3>
        </div>
      ) : sessions.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Không tìm thấy chương trình Flash Sale nào.
          </p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflowX: 'auto', border: '1px solid var(--glass-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '950px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '2px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Tên chương trình</th>
                <th style={{ padding: '1rem' }}>Thời gian hiệu lực</th>
                <th style={{ padding: '1rem' }}>Sản phẩm tham gia</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Trạng thái</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr 
                  key={s.id} 
                  style={{ 
                    borderBottom: '1px solid var(--glass-border)',
                    transition: 'background var(--transition-fast)' 
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--primary)' }}>
                      {s.name}
                    </div>
                  </td>
                  
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>Từ: {formatDateDisplay(s.start_time)}</div>
                    <div style={{ marginTop: '0.2rem' }}>Đến: {formatDateDisplay(s.end_time)}</div>
                  </td>

                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {s.items?.map(item => (
                        <div key={item.id}>
                          • {item.product_name}: <strong style={{ color: 'var(--accent)' }}>{formatCurrency(item.flash_price)}</strong> (Bán {item.sold_quantity || 0}/{item.flash_quantity} đôi)
                        </div>
                      ))}
                    </div>
                  </td>

                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {getStatusBadge(s)}
                  </td>

                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDeleteSession(s.id)} 
                      className="btn btn-danger" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: 'var(--danger)', boxShadow: 'none' }}
                    >
                      Xoá
                    </button>
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

export default Flashsales;
