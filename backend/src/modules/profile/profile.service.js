const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const profileService = {
  async getProfile(userId) {
    // 1. Query lấy thông tin cá nhân (loại trừ password_hash và social_id để an toàn)
    const user = await db.queryOne(
      'SELECT id, full_name, email, phone, avatar_url, gender, date_of_birth, role, social_provider, foot_length_cm, foot_width, shoe_size_measured, style_preference, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    return user;
  },

  async updateProfile(userId, body) {
    // 1. Kiểm tra xem người dùng có tồn tại không
    const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    // 2. Nếu thay đổi email, thực hiện kiểm tra bảo mật
    if (body.email && body.email.toLowerCase().trim() !== user.email) {
      // Tài khoản liên kết Google không được đổi email
      if (user.social_provider === 'google') {
        throw { status: 400, message: 'Tài khoản đăng nhập bằng Google không thể đổi email' };
      }

      const email = body.email.toLowerCase().trim();
      // Kiểm tra trùng lặp email với tài khoản khác
      const duplicateEmail = await db.queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
      if (duplicateEmail) {
        throw { status: 409, message: 'Email này đã được sử dụng bởi tài khoản khác' };
      }
      body.email = email; // Cập nhật lại email đã chuẩn hóa vào body
    }

    // 3. Xây dựng câu UPDATE động dựa trên các trường được gửi lên
    const allowedFields = ['full_name', 'phone', 'email', 'gender', 'date_of_birth'];
    const fields = [];
    const values = [];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(body[field]);
      }
    });

    // Nếu không có trường nào cần update thì ném lỗi
    if (fields.length === 0) {
      throw { status: 400, message: 'Vui lòng cung cấp ít nhất 1 thông tin cần cập nhật' };
    }

    const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
    values.push(userId);

    await db.query(sql, values);

    // 4. Trả về thông tin cá nhân mới nhất
    return this.getProfile(userId);
  },

  async changePassword(userId, body) {
    const { current_password, new_password } = body;

    // 1. Lấy thông tin mật khẩu cũ và provider của user
    const user = await db.queryOne('SELECT password_hash, social_provider FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    // 2. Chặn đổi mật khẩu nếu tài khoản này đăng nhập bằng Google và chưa đặt mật khẩu
    if (!user.password_hash) {
      throw { status: 400, message: 'Tài khoản này đăng nhập bằng Google, không thể đổi mật khẩu theo cách này' };
    }

    // 3. Xác thực mật khẩu cũ
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      throw { status: 400, message: 'Mật khẩu hiện tại không đúng' };
    }

    // 4. Kiểm tra mật khẩu mới không được giống mật khẩu cũ
    const isSame = await bcrypt.compare(new_password, user.password_hash);
    if (isSame) {
      throw { status: 400, message: 'Mật khẩu mới không được giống mật khẩu cũ' };
    }

    // 5. Băm mật khẩu mới và lưu vào cơ sở dữ liệu
    const hashedNewPassword = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [hashedNewPassword, userId]);

    return { message: 'Đổi mật khẩu thành công' };
  },

  async updateAvatar(userId, file) {
    // 1. Kiểm tra xem có file tải lên không
    if (!file) {
      throw { status: 400, message: 'Vui lòng chọn ảnh để upload' };
    }

    // 2. Lấy thông tin avatar cũ để xóa
    const user = await db.queryOne('SELECT avatar_url FROM users WHERE id = ?', [userId]);
    if (!user) {
      throw { status: 404, message: 'Không tìm thấy người dùng' };
    }

    // 3. Lưu thông tin đường dẫn avatar mới
    const newAvatarUrl = '/uploads/avatars/' + file.filename;
    await db.query('UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?', [newAvatarUrl, userId]);

    // 4. Xóa ảnh đại diện cũ (nếu có và là ảnh cục bộ) để tránh rác thư mục
    if (user.avatar_url && user.avatar_url.startsWith('/uploads/avatars/')) {
      const oldFilePath = path.join(__dirname, '../../..', user.avatar_url);
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`[File System] Đã xóa avatar cũ: ${oldFilePath}`);
        }
      } catch (err) {
        console.error(`[File System] Lỗi khi xóa avatar cũ: ${err.message}`);
      }
    }

    return { avatar_url: newAvatarUrl };
  }
};

module.exports = profileService;
