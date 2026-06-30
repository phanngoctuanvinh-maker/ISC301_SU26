import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import './VNPayReturn.css';

export default function VNPayReturn() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const paramsObj = Object.fromEntries(searchParams.entries());
        // Gọi API backend xác thực chữ ký của VNPAY
        const response = await api.get('/payment/vnpay-verify', { params: paramsObj });
        
        // Response trả về trực tiếp data do interceptor response.data
        const data = response.data || response;
        
        if (data.success) {
          setPaymentData(data);
        } else {
          setError(data.message || 'Xác thực thanh toán thất bại');
        }
      } catch (err) {
        setError(err.message || 'Lỗi hệ thống khi xác thực thanh toán');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  // Tạo định dạng Order Code như: ORD00000042
  const formatOrderCode = (id) => {
    if (!id) return '';
    return `ORD${String(id).padStart(8, '0')}`;
  };

  if (loading) {
    return (
      <div className="vnpay-return-page">
        <div className="vnpay-return-card vnpay-return-card--loading">
          <div className="vnpay-spinner"></div>
          <h1 className="vnpay-return-title">Đang xác thực giao dịch...</h1>
          <p className="vnpay-return-message">Vui lòng không đóng trình duyệt hoặc tải lại trang.</p>
        </div>
      </div>
    );
  }

  if (error || !paymentData) {
    const orderId = searchParams.get('vnp_TxnRef');
    return (
      <div className="vnpay-return-page">
        <div className="vnpay-return-card">
          <div className="vnpay-return-icon vnpay-return-icon--error">✗</div>
          <h1 className="vnpay-return-title">Thanh toán thất bại!</h1>
          <p className="vnpay-return-message">
            {error || 'Giao dịch của bạn đã bị hủy hoặc gặp sự cố trong quá trình thanh toán.'}
          </p>

          <div className="vnpay-return-details">
            {orderId && (
              <div className="vnpay-return-row">
                <span>Mã đơn hàng:</span>
                <strong>{formatOrderCode(orderId)}</strong>
              </div>
            )}
            <div className="vnpay-return-row">
              <span>Phương thức:</span>
              <strong>VNPAY Gateway</strong>
            </div>
            <div className="vnpay-return-row">
              <span>Trạng thái:</span>
              <span className="vnpay-return-status-badge vnpay-return-status-badge--error">Thất bại</span>
            </div>
          </div>

          <div className="vnpay-return-actions">
            <Link to="/checkout" className="btn-vnpay-action btn-primary-vnpay">
              Thử lại thanh toán
            </Link>
            <Link to="/" className="btn-vnpay-action btn-secondary-vnpay">
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vnpay-return-page">
      <div className="vnpay-return-card">
        <div className="vnpay-return-icon vnpay-return-icon--success">✓</div>
        <h1 className="vnpay-return-title">Thanh toán thành công!</h1>
        <p className="vnpay-return-message">
          Cảm ơn bạn đã mua sắm! Đơn hàng của bạn đã được thanh toán trực tuyến qua VNPAY thành công và đang được chuẩn bị để giao hàng.
        </p>

        <div className="vnpay-return-details">
          <div className="vnpay-return-row">
            <span>Mã đơn hàng:</span>
            <strong>{formatOrderCode(paymentData.orderId)}</strong>
          </div>
          <div className="vnpay-return-row">
            <span>Số tiền:</span>
            <strong>{Number(paymentData.amount).toLocaleString('vi-VN')}₫</strong>
          </div>
          <div className="vnpay-return-row">
            <span>Mã giao dịch VNPAY:</span>
            <strong>{paymentData.transactionNo}</strong>
          </div>
          <div className="vnpay-return-row">
            <span>Phương thức:</span>
            <strong>VNPAY (ATM/QR)</strong>
          </div>
          <div className="vnpay-return-row">
            <span>Trạng thái:</span>
            <span className="vnpay-return-status-badge vnpay-return-status-badge--success">Đã thanh toán</span>
          </div>
        </div>

        <div className="vnpay-return-actions">
          <Link to="/" className="btn-vnpay-action btn-primary-vnpay">
            Tiếp tục mua sắm
          </Link>
          <Link to="/profile" className="btn-vnpay-action btn-secondary-vnpay">
            Lịch sử đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
