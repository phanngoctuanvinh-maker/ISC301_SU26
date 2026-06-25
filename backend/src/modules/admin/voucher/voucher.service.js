const db = require('../../../config/db');

const parseDate = (val) => {
  if (val === undefined || val === null || val === '' || val === 'null' || val === 'undefined') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const voucherService = {
  /**
   * Lấy danh sách tất cả voucher
   * @param {Object} query
   * @returns {Promise<Array>}
   */
  async getAllVouchers(query = {}) {
    const { is_active, keyword } = query;
    let sql = 'SELECT * FROM vouchers WHERE 1=1';
    const params = [];

    if (keyword) {
      sql += ' AND (code LIKE ? OR description LIKE ?)';
      const keywordPattern = `%${keyword.trim()}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (is_active === 'true') {
      sql += ' AND is_active = true';
    } else if (is_active === 'false') {
      sql += ' AND is_active = false';
    }

    sql += ' ORDER BY created_at DESC, id DESC';

    const rows = await db.query(sql, params);
    return rows;
  },

  /**
   * Lấy voucher theo ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getVoucherById(id) {
    const voucher = await db.queryOne('SELECT * FROM vouchers WHERE id = ?', [id]);
    if (!voucher) {
      throw { status: 404, message: 'Voucher không tồn tại' };
    }
    return voucher;
  },

  /**
   * Tạo voucher mới
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  async createVoucher(body) {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_discount,
      usage_limit,
      start_date,
      expiry_date
    } = body;

    const normalizedCode = code.trim().toUpperCase();

    // 1. Kiểm tra mã voucher trùng
    const existing = await db.queryOne('SELECT id FROM vouchers WHERE code = ?', [normalizedCode]);
    if (existing) {
      throw { status: 409, message: 'Mã voucher này đã tồn tại' };
    }

    // 2. Xử lý max_discount của loại fixed
    let finalMaxDiscount = max_discount;
    if (discount_type === 'fixed') {
      finalMaxDiscount = null;
    }

    // 3. Chuẩn hóa ngày
    const startDateVal = parseDate(start_date);
    const expiryDateVal = parseDate(expiry_date);

    if (startDateVal && expiryDateVal && expiryDateVal <= startDateVal) {
      throw { status: 400, message: 'Ngày hết hạn phải sau ngày bắt đầu' };
    }

    const minOrderVal = min_order_value !== undefined ? parseInt(min_order_value, 10) : 0;
    const usageLimitVal = (usage_limit !== undefined && usage_limit !== null && usage_limit !== '') ? parseInt(usage_limit, 10) : null;

    // 4. Insert database
    await db.query(
      `INSERT INTO vouchers (
        code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, used_count, start_date, expiry_date, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, true)`,
      [
        normalizedCode,
        description || null,
        discount_type,
        discount_value,
        minOrderVal,
        finalMaxDiscount,
        usageLimitVal,
        startDateVal,
        expiryDateVal
      ]
    );

    // Lấy id vừa tạo
    const resultId = await db.query('SELECT LAST_INSERT_ID() as id');
    const newId = resultId[0].id;

    return this.getVoucherById(newId);
  },

  /**
   * Cập nhật voucher
   * @param {number} id
   * @param {Object} body
   * @returns {Promise<Object>}
   */
  async updateVoucher(id, body) {
    // 1. Kiểm tra xem voucher có tồn tại không
    const current = await this.getVoucherById(id);

    // 2. Không cho phép đổi code
    if (body.code !== undefined) {
      const normalizedCode = body.code.trim().toUpperCase();
      if (normalizedCode !== current.code) {
        throw {
          status: 400,
          message: 'Không thể thay đổi mã voucher sau khi tạo. Nếu muốn đổi mã, hãy tạo voucher mới.'
        };
      }
    }

    const finalDiscountType = body.discount_type !== undefined ? body.discount_type : current.discount_type;
    let finalMaxDiscount = body.max_discount !== undefined ? body.max_discount : current.max_discount;
    if (finalDiscountType === 'fixed') {
      finalMaxDiscount = null;
    }

    // 3. Validate logic giá trị
    const finalDiscountValue = body.discount_value !== undefined ? body.discount_value : current.discount_value;
    if (finalDiscountType === 'percent' && finalDiscountValue > 100) {
      throw { status: 400, message: 'Phần trăm giảm không được vượt quá 100%' };
    }

    // 4. Validate logic ngày
    const finalStartDate = body.start_date !== undefined ? parseDate(body.start_date) : parseDate(current.start_date);
    const finalExpiryDate = body.expiry_date !== undefined ? parseDate(body.expiry_date) : parseDate(current.expiry_date);
    if (finalStartDate && finalExpiryDate && finalExpiryDate <= finalStartDate) {
      throw { status: 400, message: 'Ngày hết hạn phải sau ngày bắt đầu' };
    }

    // 5. Build query update động
    const fields = [];
    const values = [];

    if (body.description !== undefined) {
      fields.push('description = ?');
      values.push(body.description || null);
    }
    if (body.discount_type !== undefined) {
      fields.push('discount_type = ?');
      values.push(body.discount_type);
    }
    if (body.discount_value !== undefined) {
      fields.push('discount_value = ?');
      values.push(body.discount_value);
    }
    if (body.min_order_value !== undefined) {
      fields.push('min_order_value = ?');
      values.push(body.min_order_value);
    }
    
    // Luôn cập nhật max_discount nếu discount_type đổi thành fixed, hoặc nếu nó được truyền lên
    if (body.max_discount !== undefined || finalDiscountType === 'fixed') {
      fields.push('max_discount = ?');
      values.push(finalMaxDiscount);
    }

    if (body.usage_limit !== undefined) {
      fields.push('usage_limit = ?');
      values.push(body.usage_limit === '' ? null : body.usage_limit);
    }

    if (body.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(parseDate(body.start_date));
    }

    if (body.expiry_date !== undefined) {
      fields.push('expiry_date = ?');
      values.push(parseDate(body.expiry_date));
    }

    if (fields.length === 0) {
      throw { status: 400, message: 'Vui lòng cung cấp thông tin cần cập nhật' };
    }

    const sql = `UPDATE vouchers SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    await db.query(sql, values);

    return this.getVoucherById(id);
  },

  /**
   * Thay đổi trạng thái ẩn/hiện voucher
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async toggleVoucherStatus(id) {
    const voucher = await this.getVoucherById(id);
    const newStatus = !voucher.is_active;

    await db.query('UPDATE vouchers SET is_active = ? WHERE id = ?', [newStatus, id]);

    return { id, is_active: newStatus };
  },

  /**
   * Áp dụng voucher (validate và tính toán tiền giảm)
   * @param {string} code
   * @param {number} subtotal
   * @returns {Promise<Object>}
   */
  async applyVoucher(code, subtotal) {
    const normalizedCode = code.trim().toUpperCase();

    // 1. Kiểm tra tồn tại
    const voucher = await db.queryOne('SELECT * FROM vouchers WHERE code = ?', [normalizedCode]);
    if (!voucher) {
      throw { status: 404, message: 'Mã giảm giá không tồn tại' };
    }

    // 2. Kiểm tra trạng thái hoạt động
    if (!voucher.is_active) {
      throw { status: 400, message: 'Mã giảm giá không còn hiệu lực' };
    }

    // 3. Kiểm tra ngày bắt đầu
    if (voucher.start_date && new Date(voucher.start_date) > new Date()) {
      throw { status: 400, message: 'Mã giảm giá chưa có hiệu lực' };
    }

    // 4. Kiểm tra ngày hết hạn
    if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
      throw { status: 400, message: 'Mã giảm giá đã hết hạn' };
    }

    // 5. Kiểm tra giới hạn lượt dùng
    if (voucher.usage_limit !== null && voucher.used_count >= voucher.usage_limit) {
      throw { status: 400, message: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    // 6. Kiểm tra giá trị đơn hàng tối thiểu
    const minOrderVal = parseFloat(voucher.min_order_value || 0);
    if (subtotal < minOrderVal) {
      throw {
        status: 400,
        message: `Đơn hàng chưa đạt giá trị tối thiểu ${minOrderVal.toLocaleString('vi-VN')}₫ để sử dụng mã này`,
        min_order_value: minOrderVal
      };
    }

    // 7. Tính toán số tiền được giảm
    let discountAmount = 0;
    const discountVal = parseFloat(voucher.discount_value);
    
    if (voucher.discount_type === 'percent') {
      discountAmount = Math.floor(subtotal * (discountVal / 100));
      if (voucher.max_discount !== null) {
        const maxDiscountVal = parseFloat(voucher.max_discount);
        discountAmount = Math.min(discountAmount, maxDiscountVal);
      }
    } else { // fixed
      discountAmount = Math.min(discountVal, subtotal);
    }

    // 8. Trả về kết quả (chỉ những gì Client cần)
    return {
      voucher_id: voucher.id,
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: discountVal,
      discount_amount: discountAmount,
      max_discount: voucher.max_discount !== null ? parseFloat(voucher.max_discount) : null,
      description: voucher.description
    };
  }
};

module.exports = {
  voucherService
};
