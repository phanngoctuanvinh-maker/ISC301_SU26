const cron = require('node-cron');
const db = require('../config/db');

function startOtpCleanupJob() {
  // Chạy mỗi 10 phút: giây 0, phút chia hết cho 10, tất cả giờ, ngày, tháng, thứ
  cron.schedule('0 */10 * * * *', async () => {
    try {
      const result = await db.query('DELETE FROM otp_pending WHERE expires_at < NOW()');
      const affectedRows = result.affectedRows || 0;
      console.log(`[OTP Cleanup] Đã xoá ${affectedRows} bản ghi hết hạn`);
    } catch (err) {
      console.error('[OTP Cleanup] Lỗi dọn dẹp OTP hết hạn:', err.message || err);
    }
  });
}

module.exports = {
  startOtpCleanupJob
};
