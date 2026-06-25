import { useParams, Link } from 'react-router-dom';
import './OrderSuccess.css';

export default function OrderSuccess() {
  const { id } = useParams();

  // Tạo định dạng Order Code như: ORD00000042
  const orderCode = `ORD${String(id).padStart(8, '0')}`;

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <div className="order-success-icon">✓</div>
        <h1 className="order-success-title">Đặt hàng thành công!</h1>
        <p className="order-success-message">
          Cảm ơn bạn đã mua sắm tại cửa hàng của chúng tôi. Đơn hàng của bạn đã được tiếp nhận và đang xử lý.
        </p>

        <div className="order-success-details">
          <div className="order-success-row">
            <span>Mã đơn hàng:</span>
            <strong>{orderCode}</strong>
          </div>
          <div className="order-success-row">
            <span>Trạng thái:</span>
            <span className="order-success-status-badge">Đang xử lý</span>
          </div>
        </div>

        <div className="order-success-actions">
          <Link to="/" className="btn-success-action btn-primary-success">
            Tiếp tục mua sắm
          </Link>
          <Link to="/profile" className="btn-success-action btn-secondary-success">
            Lịch sử đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
