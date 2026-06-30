function otpEmailTemplate(fullName, otpCode) {
  const subject = '[Shoes Store] Mã xác thực OTP của bạn';
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;
     padding: 32px; border: 1px solid #e5e5e5; border-radius: 8px;">
  <h2 style="color: #1a1a1a;">Xác thực tài khoản</h2>
  <p>Xin chào <strong>${fullName}</strong>,</p>
  <p>Mã xác thực OTP của bạn là:</p>
  <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
       color: #2E75B6; text-align: center; padding: 16px;
       background: #f0f5ff; border-radius: 8px; margin: 16px 0;">
    ${otpCode}
  </div>
  <p style="color: #666;">Mã có hiệu lực trong <strong>5 phút</strong>.
     Không chia sẻ mã này với bất kỳ ai.</p>
  <p style="color: #999; font-size: 12px;">Nếu bạn không yêu cầu đăng ký,
     hãy bỏ qua email này.</p>
</div>
`;
  return { subject, html };
}

function resetPasswordEmailTemplate(fullName, resetUrl) {
  const subject = '[Shoes Store] Yêu cầu khôi phục mật khẩu';
  const html = `
<div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;
     padding: 32px; border: 1px solid #e5e5e5; border-radius: 8px;">
  <h2 style="color: #1a1a1a;">Khôi phục mật khẩu</h2>
  <p>Xin chào <strong>${fullName}</strong>,</p>
  <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng click vào liên kết dưới đây để thiết lập mật khẩu mới:</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${resetUrl}" style="background-color: #2E75B6; color: #ffffff; padding: 12px 24px;
         text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
      Đặt lại mật khẩu
    </a>
  </div>
  <p style="color: #666; font-size: 14px;">Liên kết này có hiệu lực trong <strong>10 phút</strong>.
     Không chia sẻ liên kết này với bất kỳ ai.</p>
  <p style="color: #999; font-size: 12px;">Nếu bạn không yêu cầu khôi phục mật khẩu,
     hãy bỏ qua email này.</p>
</div>
`;
  return { subject, html };
}

function orderConfirmationEmailTemplate(fullName, order, items) {
  const subject = `[Shoes Store] Xác nhận đơn hàng #${order.id} thành công`;
  const itemsHtml = items.map(item => {
    const price = item.discount_price || item.price || item.discount_at_purchase || item.price_at_purchase || 0;
    return `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">
        ${item.product_name} <br/>
        <small style="color: #666;">Màu: ${item.color || ''} | Size: ${item.size}</small>
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${Number(price).toLocaleString('vi-VN')}₫</td>
    </tr>
  `;}).join('');

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;
     padding: 24px; border: 1px solid #e5e5e5; border-radius: 8px; color: #333;">
  <h2 style="color: #2E75B6; text-align: center;">CẢM ƠN BẠN ĐÃ MUA HÀNG!</h2>
  <p>Xin chào <strong>${fullName}</strong>,</p>
  <p>Đơn hàng <strong>#${order.id}</strong> của bạn đã được đặt thành công và đang được chuẩn bị để giao hàng.</p>
  
  <h3 style="border-bottom: 2px solid #2E75B6; padding-bottom: 8px; color: #2E75B6;">Thông tin đơn hàng</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr>
      <td style="padding: 6px 0; font-weight: bold; width: 150px;">Mã đơn hàng:</td>
      <td style="padding: 6px 0;">#${order.id}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; font-weight: bold;">Địa chỉ nhận hàng:</td>
      <td style="padding: 6px 0;">${order.shipping_address}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; font-weight: bold;">Phương thức thanh toán:</td>
      <td style="padding: 6px 0; text-transform: uppercase;">${order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : order.payment_method}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; font-weight: bold;">Trạng thái thanh toán:</td>
      <td style="padding: 6px 0;">${order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</td>
    </tr>
  </table>

  <h3 style="border-bottom: 2px solid #2E75B6; padding-bottom: 8px; color: #2E75B6;">Chi tiết sản phẩm</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <thead>
      <tr style="background-color: #f2f2f2;">
        <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Sản phẩm</th>
        <th style="padding: 8px; text-align: center; border: 1px solid #ddd; width: 80px;">Số lượng</th>
        <th style="padding: 8px; text-align: right; border: 1px solid #ddd; width: 120px;">Đơn giá</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div style="text-align: right; font-size: 16px; margin-top: 16px;">
    <p><strong>Tạm tính:</strong> ${Number(order.subtotal).toLocaleString('vi-VN')}₫</p>
    ${order.discount_amount > 0 ? `<p style="color: red;"><strong>Giảm giá:</strong> -${Number(order.discount_amount).toLocaleString('vi-VN')}₫</p>` : ''}
    <p><strong>Phí vận chuyển:</strong> ${Number(order.shipping_fee) === 0 ? 'Miễn phí' : `${Number(order.shipping_fee).toLocaleString('vi-VN')}₫`}</p>
    <h3 style="color: #2E75B6;">Tổng cộng: ${Number(order.total_amount).toLocaleString('vi-VN')}₫</h3>
  </div>

  <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="font-size: 12px; color: #999; text-align: center;">
    Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi qua email phanngoctuanvinh@gmail.com hoặc hotline. <br/>
    Cảm ơn bạn đã lựa chọn Shoes Store!
  </p>
</div>
`;
  return { subject, html };
}

module.exports = {
  otpEmailTemplate,
  resetPasswordEmailTemplate,
  orderConfirmationEmailTemplate
};

