const db = require('../../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { transporter } = require('../../config/mail');
const { generateOtp } = require('../../utils/otp.util');
const { otpEmailTemplate } = require('../../utils/email.templates');
const googleClient = require('../../config/google.config');

const authService = {
  async register(body) {
    const { full_name, email: rawEmail, password, phone } = body;
    const email = rawEmail.toLowerCase().trim();

    // 1. Kiểm tra email trùng lặp
    const existingUser = await db.queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      throw { status: 409, message: 'Email này đã được đăng ký' };
    }

    // 2. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Sinh mã OTP
    const otp = generateOtp();

    // 4. Tính toán thời gian hết hạn (5 phút)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 5. Xóa OTP cũ nếu có
    await db.query('DELETE FROM otp_pending WHERE email = ?', [email]);

    // 6. Lưu thông tin đăng ký tạm thời và OTP
    await db.query(
      'INSERT INTO otp_pending (email, full_name, phone, hashed_password, otp, resend_count, expires_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
      [email, full_name, phone || null, hashedPassword, otp, expiresAt]
    );

    // 7. Gửi email xác thực OTP
    const { subject, html } = otpEmailTemplate(full_name, otp);
    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject,
        html
      });
    } catch (mailErr) {
      // Nếu gửi email thất bại, xóa bản ghi trong bảng otp_pending
      await db.query('DELETE FROM otp_pending WHERE email = ?', [email]);
      throw { status: 500, message: 'Không thể gửi email, vui lòng thử lại' };
    }

    return { message: 'Mã OTP đã được gửi về email của bạn' };
  },

  async verifyOtp(body) {
    const { email: rawEmail, otp } = body;
    const email = rawEmail.toLowerCase().trim();

    // 1. Kiểm tra phiên đăng ký tạm thời
    const pending = await db.queryOne('SELECT * FROM otp_pending WHERE email = ?', [email]);
    if (!pending) {
      throw { status: 400, message: 'Phiên đăng ký không tồn tại hoặc đã hết hạn' };
    }

    // 2. Kiểm tra xem OTP đã hết hạn chưa
    if (new Date(pending.expires_at) < new Date()) {
      throw { status: 400, message: 'Mã OTP đã hết hạn, vui lòng gửi lại' };
    }

    // 3. Kiểm tra mã OTP khớp hay không
    if (otp !== pending.otp) {
      throw { status: 400, message: 'Mã OTP không đúng' };
    }

    // 4. Thêm người dùng mới vào bảng users chính thức
    await db.query(
      'INSERT INTO users (full_name, email, phone, password_hash, role, is_active) VALUES (?, ?, ?, ?, \'customer\', true)',
      [pending.full_name, email, pending.phone, pending.hashed_password]
    );

    // 5. Xóa phiên đăng ký tạm thời
    await db.query('DELETE FROM otp_pending WHERE email = ?', [email]);

    // 6. Lấy ID của người dùng vừa tạo theo yêu cầu
    const result = await db.query('SELECT LAST_INSERT_ID() as id');
    const userId = result[0].id;

    // 7. Tạo JWT Token
    const token = jwt.sign(
      { userId, email, role: 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      token,
      user: {
        id: userId,
        full_name: pending.full_name,
        email,
        role: 'customer'
      }
    };
  },

  async resendOtp(body) {
    const email = body.email.toLowerCase().trim();

    // 1. Kiểm tra phiên đăng ký tạm thời
    const pending = await db.queryOne('SELECT * FROM otp_pending WHERE email = ?', [email]);
    if (!pending) {
      throw { status: 400, message: 'Không tìm thấy phiên đăng ký' };
    }

    // 2. Kiểm tra số lần gửi lại đã vượt quá giới hạn chưa
    if (pending.resend_count >= 3) {
      throw { status: 429, message: 'Bạn đã gửi lại quá nhiều lần, vui lòng đăng ký lại' };
    }

    // 3. Sinh OTP mới và tính thời gian hết hạn mới
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 4. Cập nhật thông tin OTP mới
    await db.query(
      'UPDATE otp_pending SET otp = ?, resend_count = resend_count + 1, expires_at = ? WHERE email = ?',
      [otp, expiresAt, email]
    );

    // 5. Gửi email OTP mới
    const { subject, html } = otpEmailTemplate(pending.full_name, otp);
    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: email,
        subject,
        html
      });
    } catch (mailErr) {
      throw { status: 500, message: 'Không thể gửi email mới, vui lòng thử lại' };
    }

    return { message: 'Mã OTP mới đã được gửi về email của bạn' };
  },

  async login(body) {
    // 1. Lấy email, password từ body. Trim và lowercase email.
    const { email: rawEmail, password } = body;
    const email = rawEmail.toLowerCase().trim();

    // 2. Query tìm người dùng theo email trong bảng users
    const user = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      // Báo lỗi chung không phân biệt để bảo mật
      throw { status: 401, message: 'Email hoặc mật khẩu không đúng' };
    }

    // 3. Kiểm tra nếu tài khoản đang bị khóa
    if (user.is_active === false || user.is_active === 0) {
      throw { status: 403, message: 'Tài khoản của bạn đã bị khoá, vui lòng liên hệ hỗ trợ' };
    }

    // 4. Kiểm tra tài khoản bên thứ ba (Google/Facebook) chưa từng đặt mật khẩu
    if (!user.password_hash) {
      throw { status: 400, message: 'Tài khoản này đăng nhập bằng Google/Facebook, vui lòng dùng phương thức đó' };
    }

    // 5. So sánh mật khẩu người dùng gửi lên với mật khẩu đã băm trong DB
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      // Báo lỗi chung không phân biệt để bảo mật
      throw { status: 401, message: 'Email hoặc mật khẩu không đúng' };
    }

    // 6. Tạo JWT token chứa userId, email và role
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 7. Trả về thông tin đăng nhập thành công (không có password_hash)
    return {
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    };
  },

  async googleLogin(body) {
    // 1. Lấy credential từ body
    const { credential } = body;

    // 2. Xác minh token với Google
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch (err) {
      // Nếu verify lỗi (token giả, sai client_id, hết hạn)
      throw { status: 401, message: 'Xác thực Google không hợp lệ' };
    }

    // 3. Lấy payload thông tin từ Google
    const payload = ticket.getPayload();
    const googleEmail = payload.email;
    const googleName = payload.name;
    const googleSub = payload.sub;
    const emailVerified = payload.email_verified;

    // 4. Kiểm tra xem email Google đã được xác thực chưa
    if (emailVerified !== true) {
      throw { status: 401, message: 'Email Google chưa được xác thực' };
    }

    // 5. Chuyển email về chữ thường
    const email = googleEmail.toLowerCase();

    // 6. Tìm kiếm tài khoản trong database
    const existingUser = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);

    let userId;
    let fullName;
    let role;
    let phone = null;
    let isActive = true;

    if (!existingUser) {
      // Trường hợp A: Chưa có tài khoản -> Đăng ký mới
      await db.query(
        'INSERT INTO users (full_name, email, password_hash, role, social_provider, social_id, is_active) VALUES (?, ?, NULL, \'customer\', \'google\', ?, true)',
        [googleName, email, googleSub]
      );
      // Lấy id của user vừa tạo
      const result = await db.query('SELECT LAST_INSERT_ID() as id');
      userId = result[0].id;
      fullName = googleName;
      role = 'customer';
      phone = null;
      isActive = true;
    } else {
      userId = existingUser.id;
      fullName = existingUser.full_name;
      role = existingUser.role;
      phone = existingUser.phone;
      isActive = existingUser.is_active;

      if (!existingUser.social_provider) {
        // Trường hợp B: Đã có tài khoản bằng email/pass, tiến hành liên kết tài khoản
        await db.query(
          'UPDATE users SET social_provider = \'google\', social_id = ? WHERE id = ?',
          [googleSub, userId]
        );
      }
      // Trường hợp C: Đã liên kết trước đó, không cần cập nhật gì thêm
    }

    // 10. Kiểm tra tài khoản có đang bị khóa không
    if (isActive === false || isActive === 0) {
      throw { status: 403, message: 'Tài khoản của bạn đã bị khoá, vui lòng liên hệ hỗ trợ' };
    }

    // 11. Sinh JWT token hệ thống
    const token = jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 12. Trả về thông tin đăng nhập thành công (không có password_hash hay social_id)
    return {
      token,
      user: {
        id: userId,
        full_name: fullName,
        email,
        phone: phone || null,
        role
      }
    };
  }
};

module.exports = authService;
