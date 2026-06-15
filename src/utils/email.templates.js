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

module.exports = {
  otpEmailTemplate
};
