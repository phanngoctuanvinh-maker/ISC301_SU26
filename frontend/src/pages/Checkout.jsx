import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAddresses from '../hooks/useAddresses';
import api from '../services/api';
import './Checkout.css';

export default function Checkout() {
  const { addresses, defaultAddress, isLoading: addressLoading } = useAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherInput, setVoucherInput] = useState(''); // Giá trị đang gõ
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState(null);        // Kết quả từ API preview
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  // Auto-select địa chỉ mặc định khi load xong
  useEffect(() => {
    if (defaultAddress && !selectedAddressId) {
      setSelectedAddressId(defaultAddress.id);
    }
  }, [defaultAddress]);

  // Gọi API preview khi thay đổi địa chỉ hoặc voucher
  useEffect(() => {
    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      setSubmitError('');
      try {
        const res = await api.post('/orders/preview', {
          address_id: selectedAddressId || undefined,
          voucher_code: voucherCode || undefined
        });
        setPreview(res.data);
      } catch (err) {
        setSubmitError(err.message || 'Không thể tải thông tin đơn hàng');
        setPreview(null);
      } finally {
        setIsLoadingPreview(false);
      }
    };

    fetchPreview();
  }, [selectedAddressId, voucherCode]);

  // Áp dụng voucher
  const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setVoucherError('');
    try {
      // Validate qua API apply
      await api.post('/vouchers/apply', {
        code: voucherInput.trim(),
        subtotal: preview?.subtotal || 0
      });
      // Nếu hợp lệ, cập nhật state voucherCode để trigger preview
      setVoucherCode(voucherInput.trim());
    } catch (err) {
      setVoucherError(err.message || 'Mã không hợp lệ');
      setVoucherCode(''); // Xóa mã cũ nếu mã mới lỗi
    }
  };

  // Xóa voucher
  const handleRemoveVoucher = () => {
    setVoucherCode('');
    setVoucherInput('');
    setVoucherError('');
  };

  // Đặt hàng
  const handleSubmit = async () => {
    if (!selectedAddressId) {
      setSubmitError('Vui lòng chọn địa chỉ nhận hàng');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.post('/orders', {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        voucher_code: voucherCode || undefined,
        note: note || undefined
      });
      const orderId = res.data?.order_id || res.data?.data?.order_id;
      
      // Đồng bộ giỏ hàng ngay lập tức để làm trống badge ở Navbar
      window.dispatchEvent(new Event('cart-updated'));
      
      if (paymentMethod === 'vnpay') {
        const vnpayRes = await api.post('/payment/vnpay-url', { order_id: orderId });
        const paymentUrl = vnpayRes.data?.paymentUrl || vnpayRes.data?.data?.paymentUrl;
        if (paymentUrl) {
          window.location.href = paymentUrl;
          return;
        } else {
          throw new Error('Không thể khởi tạo liên kết thanh toán VNPAY');
        }
      }
      
      navigate(`/order-success/${orderId}`);
    } catch (err) {
      setSubmitError(err.message || 'Đặt hàng thất bại, vui lòng thử lại');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1 className="checkout-page__title">Thanh toán</h1>

      <div className="checkout-page__layout">
        {/* CỘT TRÁI — Thông tin giao hàng & Tùy chọn */}
        <div className="checkout-page__left">

          {/* KHỐI 1: Chọn địa chỉ */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Địa chỉ nhận hàng</h2>
            {addressLoading ? (
              <div className="checkout-skeleton" />
            ) : addresses.length === 0 ? (
              <div className="checkout-no-address">
                <p>Bạn chưa có địa chỉ nhận hàng nào.</p>
                <Link to="/addresses" className="checkout-address-link">+ Thêm địa chỉ mới</Link>
              </div>
            ) : (
              <div className="checkout-address-list">
                {addresses.map(addr => (
                  <label
                    key={addr.id}
                    className={`checkout-address-item ${selectedAddressId === addr.id ? 'checkout-address-item--selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <div className="checkout-address-item__info">
                      <div className="checkout-address-item__header">
                        <strong>{addr.receiver_name}</strong>
                        <span className="checkout-address-item__phone">{addr.phone}</span>
                        {addr.is_default === 1 && (
                          <span className="checkout-address-item__badge">Mặc định</span>
                        )}
                      </div>
                      <p className="checkout-address-item__text">
                        {[addr.address_line, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </label>
                ))}
                <Link to="/addresses" className="checkout-address-link">Quản lý địa chỉ</Link>
              </div>
            )}
          </section>

          {/* KHỐI 2: Phương thức thanh toán */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Phương thức thanh toán</h2>
            <div className="checkout-payment-list">
              {[
                { value: 'cod', label: 'Thanh toán khi nhận hàng (COD)' },
                { value: 'vietqr', label: 'Chuyển khoản VietQR' },
                { value: 'vnpay', label: 'VNPay' },
                { value: 'momo', label: 'Ví MoMo' },
              ].map(method => (
                <label
                  key={method.value}
                  className={`checkout-payment-item ${paymentMethod === method.value ? 'checkout-payment-item--selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value)}
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* KHỐI 3: Mã giảm giá */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Mã giảm giá</h2>
            {voucherCode ? (
              <div className="checkout-voucher-applied">
                <span>🏷️ Đã áp dụng: <strong>{voucherCode}</strong></span>
                <button onClick={handleRemoveVoucher} className="checkout-voucher-remove">Xoá</button>
              </div>
            ) : (
              <div className="checkout-voucher-input">
                <input
                  type="text"
                  value={voucherInput}
                  onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="Nhập mã giảm giá..."
                  onKeyDown={e => e.key === 'Enter' && handleApplyVoucher()}
                />
                <button onClick={handleApplyVoucher} disabled={!voucherInput.trim()}>
                  Áp dụng
                </button>
              </div>
            )}
            {voucherError && <p className="checkout-voucher-error">{voucherError}</p>}
          </section>

          {/* KHỐI 4: Ghi chú */}
          <section className="checkout-section">
            <h2 className="checkout-section__title">Ghi chú đơn hàng</h2>
            <textarea
              className="checkout-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ghi chú cho người giao hàng (tuỳ chọn)..."
              rows={3}
              maxLength={500}
            />
          </section>
        </div>

        {/* CỘT PHẢI — Tổng kết đơn hàng */}
        <div className="checkout-page__right">
          <section className="checkout-summary">
            <h2 className="checkout-section__title">Tổng kết đơn hàng</h2>

            {isLoadingPreview ? (
              <div className="checkout-skeleton checkout-skeleton--summary" />
            ) : preview ? (
              <>
                {/* Danh sách sản phẩm */}
                <div className="checkout-summary__items">
                  {preview.items.map(item => (
                    <div key={item.cart_id} className="checkout-summary__item">
                      <img
                        src={item.main_image_url ? item.main_image_url : '/placeholder.png'}
                        alt={item.product_name}
                        className="checkout-summary__item-img"
                      />
                      <div className="checkout-summary__item-info">
                        <p className="checkout-summary__item-name">{item.product_name}</p>
                        <small className="checkout-summary__item-meta">
                          {item.color} - Size {item.size} × {item.quantity}
                        </small>
                      </div>
                      <span className="checkout-summary__item-price">
                        {((item.discount_price || item.price) * item.quantity).toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tổng tiền */}
                <div className="checkout-summary__totals">
                  <div className="checkout-summary__row">
                    <span>Tạm tính:</span>
                    <span>{preview.subtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  {preview.discount_amount > 0 && (
                    <div className="checkout-summary__row checkout-summary__row--discount">
                      <span>Giảm giá ({preview.voucher?.code}):</span>
                      <span>-{preview.discount_amount.toLocaleString('vi-VN')}₫</span>
                    </div>
                  )}
                  <div className="checkout-summary__row">
                    <span>Phí vận chuyển:</span>
                    <span>
                      {preview.is_free_shipping ? (
                        <span className="checkout-summary__free-ship">Miễn phí</span>
                      ) : (
                        `${preview.shipping_fee.toLocaleString('vi-VN')}₫`
                      )}
                    </span>
                  </div>
                  <div className="checkout-summary__row checkout-summary__row--total">
                    <strong>Tổng cộng:</strong>
                    <strong className="checkout-summary__total-amount">
                      {preview.total_amount.toLocaleString('vi-VN')}₫
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <p className="checkout-summary__empty">Đang tải thông tin đơn hàng...</p>
            )}

            {submitError && (
              <div className="checkout-submit-error">{submitError}</div>
            )}

            <button
              className="checkout-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting || !preview || !selectedAddressId || isLoadingPreview}
            >
              {isSubmitting ? 'Đang đặt hàng...' : `Đặt hàng • ${preview?.total_amount?.toLocaleString('vi-VN') || 0}₫`}
            </button>

            <p className="checkout-terms">
              Bằng cách đặt hàng, bạn đồng ý với <a href="/policy/dieu-khoan">Điều khoản sử dụng</a> của chúng tôi.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
