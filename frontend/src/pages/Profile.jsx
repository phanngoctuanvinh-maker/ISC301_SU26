import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Profile() {
  const [profile, setProfile] = useState(null);
  
  // Profile Update Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('other');
  const [dob, setDob] = useState('');
  
  // Change Password Form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'orders'

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [repayLoadingId, setRepayLoadingId] = useState(null);

  // Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Reviews Submission State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrderItemId, setReviewOrderItemId] = useState(null);
  const [reviewProductName, setReviewProductName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      const user = response.data;
      setProfile(user);
      
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setGender(user.gender || 'other');
      if (user.date_of_birth) {
        // format ISO date string to YYYY-MM-DD for date input
        setDob(user.date_of_birth.substring(0, 10));
      }
    } catch (err) {
      setError(err.message || 'Không thể lấy thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError('');
      const response = await api.get('/orders');
      setOrders(response.data || []);
    } catch (err) {
      setOrdersError(err.message || 'Không thể lấy danh sách đơn hàng');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setDetailsLoading(true);
      setModalOpen(true);
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data);
    } catch (err) {
      alert(err.message || 'Không thể lấy thông tin chi tiết đơn hàng');
      setModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      return;
    }

    try {
      await api.put(`/orders/${orderId}/cancel`);
      alert('Hủy đơn hàng thành công!');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setModalOpen(false);
        setSelectedOrder(null);
      }
    } catch (err) {
      alert(err.message || 'Không thể hủy đơn hàng');
    }
  };

  const handleRepayOrder = async (orderId) => {
    try {
      setRepayLoadingId(orderId);
      const response = await api.post('/payment/vnpay-url', { order_id: orderId });
      if (response.data && response.data.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        alert('Không thể tạo URL thanh toán. Vui lòng thử lại sau.');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi kết nối đến cổng thanh toán');
    } finally {
      setRepayLoadingId(null);
    }
  };

  const handleOpenReviewModal = (item) => {
    setReviewOrderItemId(item.id);
    setReviewProductName(item.product_name);
    setReviewRating(5);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewOrderItemId) return;

    try {
      setSubmittingReview(true);
      await api.post('/reviews', {
        order_item_id: reviewOrderItemId,
        rating: reviewRating,
        comment: reviewComment
      });

      alert('Cảm ơn bạn đã đánh giá sản phẩm!');
      setReviewModalOpen(false);
      
      // Refresh order details to update review_id status
      if (selectedOrder) {
        fetchOrderDetails(selectedOrder.id);
      }
    } catch (err) {
      alert(err.message || 'Không thể gửi đánh giá, vui lòng thử lại');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/profile', {
        full_name: fullName,
        phone: phone || null,
        gender,
        date_of_birth: dob || null
      });
      
      // Update local storage user information
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.full_name = fullName;
      localStorage.setItem('user', JSON.stringify(localUser));

      setProfile(response.data);
      setSuccess('Cập nhật thông tin cá nhân thành công!');
    } catch (err) {
      setError(err.message || 'Cập nhật thất bại');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    try {
      await api.put('/profile/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setPwdSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPwdError(err.message || 'Mật khẩu cũ không chính xác');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update local user details avatar if displayed in Navbar
      const updatedUser = response.data;
      setProfile(updatedUser);
      setSuccess('Cập nhật ảnh đại diện thành công!');
    } catch (err) {
      setError(err.message || 'Không thể tải ảnh lên');
    } finally {
      setAvatarUploading(false);
    }
  };

  const getCategoryLabel = (item) => {
    const parentSlug = item.parent_category_slug || '';
    const catSlug = item.category_slug || '';
    const parentName = item.parent_category_name || '';
    const catName = item.category_name || '';
    
    if (
      parentSlug === 'phu-kien' || 
      catSlug === 'phu-kien' ||
      parentName.toLowerCase().includes('phụ kiện') ||
      catName.toLowerCase().includes('phụ kiện')
    ) {
      return 'Phụ kiện';
    }
    return 'Giày dép';
  };

  const getTimelineSteps = (status) => {
    if (status === 'cancelled') {
      return [
        { key: 'pending', label: 'Đặt hàng', completed: true },
        { key: 'cancelled', label: 'Đã hủy đơn', completed: true, isError: true }
      ];
    }
    
    const steps = [
      { key: 'pending', label: 'Chờ xử lý' },
      { key: 'confirmed', label: 'Đã xác nhận' },
      { key: 'shipping', label: 'Đang giao' },
      { key: 'delivered', label: 'Đã giao' }
    ];

    let activeIndex = 0;
    if (status === 'confirmed' || status === 'processing') {
      activeIndex = 1;
    } else if (status === 'shipping') {
      activeIndex = 2;
    } else if (status === 'delivered' || status === 'completed') {
      activeIndex = 3;
    }

    return steps.map((step, idx) => ({
      ...step,
      active: idx === activeIndex,
      completed: idx <= activeIndex
    }));
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'processing': return 'Đang xử lý';
      case 'shipping': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      case 'confirmed': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#e8eaf6', color: '#3f51b5', border: '1px solid #c5cae9', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      case 'processing': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#e3f2fd', color: '#0d47a1', border: '1px solid #90caf9', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      case 'shipping': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#e0f7fa', color: '#006064', border: '1px solid #80deea', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      case 'delivered': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#e8f5e9', color: '#1b5e20', border: '1px solid #a5d6a7', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      case 'completed': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#e8f5e9', color: '#1b5e20', border: '1px solid #a5d6a7', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      case 'cancelled': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#ffebee', color: '#b71c1c', border: '1px solid #ffcdd2', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      default: return { display: 'inline-block', whiteSpace: 'nowrap', background: '#eee', color: '#666', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem' };
    }
  };

  const getPaymentStatusStyle = (status) => {
    if (status === 'paid') {
      return { display: 'inline-block', whiteSpace: 'nowrap', background: '#e8f5e9', color: '#1b5e20', border: '1px solid #a5d6a7', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
    }
    return { display: 'inline-block', whiteSpace: 'nowrap', background: '#ffebee', color: '#b71c1c', border: '1px solid #ffcdd2', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
        <h3>Đang tải dữ liệu hồ sơ...</h3>
      </div>
    );
  }

  const avatarUrl = profile?.avatar 
    ? (profile.avatar.startsWith('http') ? profile.avatar : `http://localhost:8080${profile.avatar}`)
    : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <h1 style={{ marginBottom: '2rem', fontSize: '2rem' }}>Hồ Sơ Cá Nhân</h1>

      <div className="grid grid-cols-3 gap-6" style={{ alignItems: 'start' }}>
        {/* Left Side: Avatar Panel */}
        <div className="glass-card flex flex-col items-center gap-4">
          <img 
            src={avatarUrl} 
            alt="Avatar" 
            className="avatar" 
            style={{ width: '120px', height: '120px', border: '4px solid var(--accent)', boxShadow: 'var(--shadow-md)' }} 
          />
          <div style={{ textAlign: 'center' }}>
            <h3>{profile?.full_name}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{profile?.email}</p>
            <span className="badge badge-secondary" style={{ marginTop: '0.5rem', textTransform: 'capitalize' }}>
              Vai trò: {profile?.role}
            </span>
          </div>

          <div style={{ width: '100%', marginTop: '1rem' }}>
            <label className="btn btn-secondary" style={{ display: 'block', textAlign: 'center', width: '100%', position: 'relative' }}>
              {avatarUploading ? 'Đang tải ảnh...' : 'Thay ảnh đại diện'}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                disabled={avatarUploading}
              />
            </label>
          </div>
        </div>

        {/* Right Side: Tab Panel (Info or Order History) */}
        <div className="glass-card flex flex-col" style={{ gridColumn: 'span 2', minHeight: '400px' }}>
          {/* Tab Headers */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            <button 
              onClick={() => setActiveTab('info')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'info' ? '3px solid var(--accent)' : '3px solid transparent',
                color: activeTab === 'info' ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Thông tin tài khoản
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === 'orders' ? '3px solid var(--accent)' : '3px solid transparent',
                color: activeTab === 'orders' ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Lịch sử đơn hàng
            </button>
          </div>

          {/* Tab Contents: Info Form */}
          {activeTab === 'info' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Cập nhật thông tin tài khoản</h2>
              
              {error && <div className="alert alert-danger">{error}</div>}
              {success && <div className="alert alert-success">{success}</div>}

              <form onSubmit={handleUpdateProfile}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Họ và Tên</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
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
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Giới tính</label>
                    <select 
                      className="form-control" 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Ngày sinh</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Lưu thay đổi
                </button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '2rem 0' }} />

              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Đổi mật khẩu</h2>
              
              {pwdError && <div className="alert alert-danger">{pwdError}</div>}
              {pwdSuccess && <div className="alert alert-success">{pwdSuccess}</div>}

              <form onSubmit={handleChangePassword}>
                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Mật khẩu cũ</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Mật khẩu mới</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mật khẩu mới ít nhất 8 ký tự..."
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-secondary">
                  Đổi mật khẩu
                </button>
              </form>
            </div>
          )}

          {/* Tab Contents: Order History */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem' }}>Lịch sử đặt hàng</h2>
              
              {ordersError && <div className="alert alert-danger">{ordersError}</div>}
              
              {ordersLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <h4>Đang tải danh sách đơn hàng...</h4>
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Bạn chưa thực hiện đơn đặt hàng nào.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {orders.map((order) => (
                    <div 
                      key={order.id} 
                      className="order-card"
                      style={{
                        background: 'rgba(255, 255, 255, 0.4)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'transform 0.2s ease-in-out'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>
                          Mã đơn hàng: ORD{String(order.id).padStart(8, '0')}
                        </h4>
                        <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Ngày đặt: {new Date(order.created_at).toLocaleString('vi-VN')}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                          <span style={getStatusStyle(order.status)}>
                            {translateStatus(order.status)}
                          </span>
                          <span style={getPaymentStatusStyle(order.payment_status)}>
                            {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                          {Number(order.total_amount).toLocaleString('vi-VN')}₫
                        </p>
                        <p style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          PTTT: {order.payment_method.toUpperCase()}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                          {order.payment_method === 'vnpay' && order.payment_status === 'unpaid' && order.status === 'pending' && (
                            <button 
                              className="btn btn-primary btn-sm" 
                              onClick={() => handleRepayOrder(order.id)}
                              disabled={repayLoadingId !== null}
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: 'var(--accent)', boxShadow: 'none' }}
                            >
                              {repayLoadingId === order.id ? 'Đang tạo...' : 'Thanh toán lại'}
                            </button>
                          )}
                          {order.status === 'pending' && (
                            <button 
                              className="btn btn-danger btn-sm" 
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={repayLoadingId !== null}
                              style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', background: 'var(--danger)', boxShadow: 'none' }}
                            >
                              Hủy đơn
                            </button>
                          )}
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => fetchOrderDetails(order.id)}
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {modalOpen && (
        <div 
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => { setModalOpen(false); setSelectedOrder(null); }}
        >
          <div 
            className="modal-content glass-card"
            style={{
              maxWidth: '650px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.75rem',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                lineHeight: 1
              }}
              onClick={() => { setModalOpen(false); setSelectedOrder(null); }}
            >
              &times;
            </button>

            {detailsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h4>Đang tải chi tiết đơn hàng...</h4>
              </div>
            ) : selectedOrder ? (
              <div>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                  Chi tiết đơn hàng ORD{String(selectedOrder.id).padStart(8, '0')}
                </h2>

                {/* Visual Status Timeline */}
                {(() => {
                  const steps = getTimelineSteps(selectedOrder.status);
                  const isCancelled = selectedOrder.status === 'cancelled';
                  const totalSteps = steps.length;
                  let progressPercent = 0;
                  if (isCancelled) {
                    progressPercent = 100;
                  } else {
                    const currentCompletedIndex = steps.reduce((max, s, idx) => s.completed ? idx : max, 0);
                    progressPercent = (currentCompletedIndex / (totalSteps - 1)) * 100;
                  }

                  return (
                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.25)', borderRadius: '12px', border: '1px solid var(--glass-border)', position: 'relative' }}>
                      <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1.25rem', letterSpacing: '0.05em', fontWeight: 'bold' }}>
                        Trạng thái đơn hàng
                      </h4>
                      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', margin: '0 1rem' }}>
                        {/* Background line */}
                        <div style={{ position: 'absolute', top: '18px', left: '18px', right: '18px', height: '4px', background: 'rgba(15, 23, 42, 0.08)', zIndex: 1, borderRadius: '2px' }} />
                        
                        {/* Progress line */}
                        <div style={{ 
                          position: 'absolute', 
                          top: '18px', 
                          left: '18px', 
                          width: `calc(${progressPercent}% - (${progressPercent}% * 36px / 100))`,
                          height: '4px', 
                          background: isCancelled ? 'var(--danger)' : 'linear-gradient(90deg, var(--primary), var(--accent))', 
                          zIndex: 2, 
                          transition: 'width 0.4s ease', 
                          borderRadius: '2px' 
                        }} />
                        
                        {/* Steps */}
                        {steps.map((step, idx) => {
                          const isCompleted = step.completed;
                          const isActive = step.active;
                          const isErr = step.isError;
                          
                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, width: '40px', position: 'relative' }}>
                              <div 
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: isErr 
                                    ? 'var(--danger)' 
                                    : isCompleted 
                                      ? 'linear-gradient(135deg, var(--primary), var(--accent))' 
                                      : 'var(--bg-tertiary)',
                                  border: isErr
                                    ? '3px solid #ffccd2'
                                    : isCompleted 
                                      ? '3px solid hsla(187, 92%, 46%, 0.2)' 
                                      : '3px solid var(--glass-border)',
                                  color: isCompleted || isErr ? '#ffffff' : 'var(--text-secondary)',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  fontSize: '0.85rem',
                                  boxShadow: isCompleted && !isErr ? '0 4px 10px rgba(187, 92, 46, 0.2)' : 'none',
                                  transition: 'all 0.3s ease',
                                  transform: isActive ? 'scale(1.15)' : 'none'
                                }}
                              >
                                {isErr ? '✗' : isCompleted ? '✓' : idx + 1}
                              </div>
                              <span 
                                style={{
                                  marginTop: '0.5rem',
                                  fontSize: '0.75rem',
                                  fontWeight: isActive || isCompleted ? '600' : '500',
                                  color: isErr 
                                    ? 'var(--danger)' 
                                    : isActive 
                                      ? 'var(--primary)' 
                                      : isCompleted 
                                        ? 'var(--text-primary)' 
                                        : 'var(--text-muted)',
                                  textAlign: 'center',
                                  whiteSpace: 'nowrap',
                                  position: 'absolute',
                                  top: '38px'
                                }}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ height: '24px' }}></div>

                      {/* Display Tracking Number if shipping */}
                      {selectedOrder.tracking_number && (
                        <div style={{
                          marginTop: '1.25rem',
                          background: 'var(--accent-light)',
                          border: '1px solid hsla(187, 92%, 46%, 0.15)',
                          padding: '0.6rem 1rem',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            🚚 Mã vận đơn: <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--accent)' }}>{selectedOrder.tracking_number}</span>
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Đơn vị vận chuyển liên kết: <strong>Giao Hàng Nhanh (GHN)</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                <div 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.25)', 
                    padding: '1.25rem', 
                    borderRadius: '10px', 
                    marginBottom: '1.5rem', 
                    fontSize: '0.9rem',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <p style={{ margin: 0 }}><strong>Địa chỉ giao hàng:</strong> {selectedOrder.shipping_address}</p>
                  <p style={{ margin: 0 }}><strong>Phương thức thanh toán:</strong> {selectedOrder.payment_method.toUpperCase()}</p>
                  <p style={{ margin: 0 }}><strong>Trạng thái thanh toán:</strong> {selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
                  <p style={{ margin: 0 }}><strong>Ghi chú:</strong> {selectedOrder.note || 'Không có ghi chú'}</p>
                  {selectedOrder.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                      {selectedOrder.payment_method === 'vnpay' && selectedOrder.payment_status === 'unpaid' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleRepayOrder(selectedOrder.id)}
                          disabled={repayLoadingId !== null}
                          style={{ background: 'var(--accent)', boxShadow: 'none', padding: '0.4rem 1rem' }}
                        >
                          {repayLoadingId === selectedOrder.id ? 'Đang tạo...' : 'Thanh toán lại'}
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        disabled={repayLoadingId !== null}
                        style={{ background: 'var(--danger)', boxShadow: 'none', padding: '0.4rem 1rem' }}
                      >
                        Hủy đơn hàng này
                      </button>
                    </div>
                  )}
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Sản phẩm đã mua</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        gap: '1rem', 
                        alignItems: 'center', 
                        borderBottom: '1px solid var(--glass-border)', 
                        paddingBottom: '0.75rem' 
                      }}
                    >
                      <img 
                        src={item.main_image_url ? `http://localhost:8080${item.main_image_url}` : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80'} 
                        alt={item.product_name} 
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.product_name}</h4>
                          <span 
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              fontWeight: '600',
                              background: getCategoryLabel(item) === 'Phụ kiện' ? 'rgba(187, 92, 46, 0.1)' : 'rgba(262, 83, 58, 0.1)',
                              color: getCategoryLabel(item) === 'Phụ kiện' ? 'var(--accent)' : 'var(--primary)',
                              border: getCategoryLabel(item) === 'Phụ kiện' ? '1px solid hsla(187, 92%, 46%, 0.2)' : '1px solid hsla(262, 83%, 58%, 0.2)'
                            }}
                          >
                            {getCategoryLabel(item)}
                          </span>
                        </div>
                        <small style={{ color: 'var(--text-secondary)' }}>Màu: {item.color} | Size: {item.size} | SL: {item.quantity}</small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {((item.discount_at_purchase || item.price_at_purchase) * item.quantity).toLocaleString('vi-VN')}₫
                        </div>
                        {selectedOrder.status === 'delivered' && (
                          <div style={{ marginTop: '0.5rem' }}>
                            {item.review_id ? (
                              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: '600' }}>
                                ★ {item.review_rating} - Đã đánh giá
                              </span>
                            ) : (
                              <button
                                onClick={() => handleOpenReviewModal(item)}
                                className="btn btn-primary"
                                style={{
                                  padding: '4px 10px',
                                  fontSize: '0.75rem',
                                  borderRadius: '6px',
                                  boxShadow: 'none',
                                  background: 'linear-gradient(135deg, var(--primary), var(--accent))'
                                }}
                              >
                                Viết đánh giá
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Tạm tính: {Number(selectedOrder.subtotal).toLocaleString('vi-VN')}₫</p>
                  {Number(selectedOrder.discount_amount) > 0 && (
                    <p style={{ margin: 0, color: '#d32f2f' }}>Giảm giá: -{Number(selectedOrder.discount_amount).toLocaleString('vi-VN')}₫</p>
                  )}
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                    Phí vận chuyển: {Number(selectedOrder.shipping_fee) === 0 ? 'Miễn phí' : `${Number(selectedOrder.shipping_fee).toLocaleString('vi-VN')}₫`}
                  </p>
                  <h3 style={{ color: 'var(--accent)', marginTop: '0.5rem', fontSize: '1.4rem' }}>
                    Tổng cộng: {Number(selectedOrder.total_amount).toLocaleString('vi-VN')}₫
                  </h3>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h4>Không tìm thấy thông tin chi tiết đơn hàng</h4>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Submission Modal */}
      {reviewModalOpen && (
        <div 
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100,
            backdropFilter: 'blur(5px)'
          }}
          onClick={() => setReviewModalOpen(false)}
        >
          <div 
            className="modal-content glass-card"
            style={{
              maxWidth: '500px',
              width: '90%',
              padding: '2rem',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.75rem',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                lineHeight: 1
              }}
              onClick={() => setReviewModalOpen(false)}
            >
              &times;
            </button>

            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
              Đánh giá sản phẩm
            </h2>

            <p style={{ fontSize: '0.95rem', marginBottom: '1.25rem', color: 'var(--text-primary)', fontWeight: '600' }}>
              {reviewProductName}
            </p>

            <form onSubmit={handleSubmitReview}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Điểm số (Sao)</label>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '2rem', cursor: 'pointer', color: 'var(--warning)', marginTop: '0.25rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      onClick={() => setReviewRating(star)}
                      style={{ transition: 'transform 0.1s' }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      {star <= reviewRating ? '★' : '☆'}
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Nhận xét của bạn</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này (chất liệu, kích cỡ, độ êm ái...)..."
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setReviewModalOpen(false)}
                  disabled={submittingReview}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
