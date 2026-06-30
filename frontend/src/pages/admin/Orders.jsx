import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter State
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Status Update Modal State
  const [updateOrder, setUpdateOrder] = useState(null); // stores order to be updated
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/orders/admin/all');
      setOrders(response.data || []);
    } catch (err) {
      setError(err.message || 'Không thể lấy danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId) => {
    try {
      setDetailLoading(true);
      setDetailModalOpen(true);
      const response = await api.get(`/orders/admin/${orderId}`);
      setSelectedOrder(response.data);
    } catch (err) {
      alert(err.message || 'Không thể tải chi tiết đơn hàng');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenUpdateModal = (order) => {
    setUpdateOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.tracking_number || '');
    setUpdateError('');
    setUpdateModalOpen(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setUpdateError('');
    setSuccess('');

    try {
      await api.put(`/orders/${updateOrder.id}/status`, {
        status: newStatus,
        tracking_number: trackingNumber.trim() || null
      });

      setSuccess(`Cập nhật đơn hàng ORD${String(updateOrder.id).padStart(8, '0')} thành công!`);
      setUpdateModalOpen(false);
      fetchOrders();
    } catch (err) {
      setUpdateError(err.message || 'Không thể cập nhật trạng thái đơn hàng');
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

  const translateStatus = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'confirmed': return 'Đã xác nhận';
      case 'shipping': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#fff8e1', color: '#f57f17', border: '1px solid #ffe082', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      case 'confirmed': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#e8eaf6', color: '#3f51b5', border: '1px solid #c5cae9', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      case 'shipping': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#e0f7fa', color: '#006064', border: '1px solid #80deea', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
      case 'delivered': return { display: 'inline-block', whiteSpace: 'nowrap', background: '#e8f5e9', color: '#1b5e20', border: '1px solid #a5d6a7', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' };
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

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '4rem' }}>
        <h3>Đang tải danh sách đơn hàng...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', flex: 1 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Quản Lý Đơn Hàng</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`btn ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              borderRadius: '8px',
              textTransform: 'capitalize'
            }}
          >
            {status === 'all' ? 'Tất cả' : translateStatus(status)}
          </button>
        ))}
      </div>

      {/* Orders List Table */}
      {filteredOrders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Không tìm thấy đơn hàng nào ở trạng thái này.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflowX: 'auto', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '1rem' }}>Mã Đơn</th>
                <th style={{ padding: '1rem' }}>Khách Hàng</th>
                <th style={{ padding: '1rem' }}>Ngày Đặt</th>
                <th style={{ padding: '1rem' }}>Tổng Tiền</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap', minWidth: '160px' }}>Thanh Toán</th>
                <th style={{ padding: '1rem', whiteSpace: 'nowrap', minWidth: '150px' }}>Trạng Thái</th>
                <th style={{ padding: '1rem' }}>Vận Đơn</th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    ORD{String(order.id).padStart(8, '0')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{order.user_name}</div>
                    <small style={{ color: 'var(--text-secondary)' }}>{order.user_email}</small>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {new Date(order.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {Number(order.total_amount).toLocaleString('vi-VN')}₫
                  </td>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    <span style={getPaymentStatusStyle(order.payment_status)}>
                      {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                    <small style={{ display: 'block', color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '0.75rem' }}>
                      {order.payment_method?.toUpperCase()}
                    </small>
                  </td>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    <span style={getStatusStyle(order.status)}>
                      {translateStatus(order.status)}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                    {order.tracking_number ? (
                      <span className="badge badge-secondary" style={{ fontFamily: 'monospace' }}>{order.tracking_number}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button
                        onClick={() => fetchOrderDetail(order.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        Chi tiết
                      </button>
                      <button
                        onClick={() => handleOpenUpdateModal(order)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      >
                        Cập nhật
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {detailModalOpen && (
        <div
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
          onClick={() => { setDetailModalOpen(false); setSelectedOrder(null); }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '650px',
              width: '90%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '2rem',
              position: 'relative'
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
              onClick={() => { setDetailModalOpen(false); setSelectedOrder(null); }}
            >
              &times;
            </button>

            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <h4>Đang tải chi tiết đơn hàng...</h4>
              </div>
            ) : selectedOrder ? (
              <div>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                  Chi tiết đơn hàng ORD{String(selectedOrder.id).padStart(8, '0')}
                </h2>

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
                  <p style={{ margin: 0 }}><strong>Khách hàng:</strong> {selectedOrder.user_name} ({selectedOrder.user_email})</p>
                  <p style={{ margin: 0 }}><strong>Địa chỉ giao hàng:</strong> {selectedOrder.shipping_address}</p>
                  <p style={{ margin: 0 }}><strong>Phương thức thanh toán:</strong> {selectedOrder.payment_method?.toUpperCase()}</p>
                  <p style={{ margin: 0 }}><strong>Trạng thái thanh toán:</strong> {selectedOrder.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
                  <p style={{ margin: 0 }}><strong>Mã vận đơn:</strong> {selectedOrder.tracking_number || 'Chưa có'}</p>
                  <p style={{ margin: 0 }}><strong>Ghi chú:</strong> {selectedOrder.note || 'Không có ghi chú'}</p>
                </div>

                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Sản phẩm trong đơn</h3>
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
                      <div style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {((item.discount_at_purchase || item.price_at_purchase) * item.quantity).toLocaleString('vi-VN')}₫
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
            ) : null}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {updateModalOpen && updateOrder && (
        <div
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
          onClick={() => setUpdateModalOpen(false)}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '500px',
              width: '90%',
              padding: '2rem',
              position: 'relative'
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
              onClick={() => setUpdateModalOpen(false)}
            >
              &times;
            </button>

            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
              Cập nhật đơn hàng ORD{String(updateOrder.id).padStart(8, '0')}
            </h2>

            {updateError && <div className="alert alert-danger">{updateError}</div>}

            <form onSubmit={handleUpdateStatus}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Trạng thái đơn hàng</label>
                <select
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="pending">Chờ xử lý (Pending)</option>
                  <option value="confirmed">Đã xác nhận (Confirmed) - Trừ kho</option>
                  <option value="shipping">Đang giao hàng (Shipping)</option>
                  <option value="delivered">Đã giao (Delivered)</option>
                  <option value="cancelled">Đã hủy (Cancelled) - Hoàn kho</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                <label className="form-label">Mã vận đơn (Tracking Number)</label>
                <input
                  type="text"
                  className="form-control"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Nhập mã vận đơn (nếu có, VD: GHTK123456)..."
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Cập nhật đơn
                </button>
                <button type="button" onClick={() => setUpdateModalOpen(false)} className="btn btn-secondary">
                  Hủy bỏ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
