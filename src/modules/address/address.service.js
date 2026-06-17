const db = require('../../config/db');

const addressService = {
  /**
   * Lấy danh sách địa chỉ của người dùng
   * @param {number} userId 
   */
  async getAddresses(userId) {
    const sql = 'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC';
    const rows = await db.query(sql, [userId]);
    return rows;
  },

  /**
   * Thêm một địa chỉ mới
   * @param {number} userId 
   * @param {object} body 
   */
  async createAddress(userId, body) {
    const { receiver_name, phone, address_line, ward, district, city } = body;

    // Kiểm tra số lượng địa chỉ hiện tại để xác định is_default
    const countSql = 'SELECT COUNT(*) as count FROM addresses WHERE user_id = ?';
    const countResult = await db.queryOne(countSql, [userId]);
    const isFirstAddress = (!countResult || countResult.count === 0);
    const isDefault = isFirstAddress ? 1 : 0;

    const insertSql = `
      INSERT INTO addresses (user_id, receiver_name, phone, address_line, ward, district, city, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      userId,
      receiver_name.trim(),
      phone.trim(),
      address_line.trim(),
      ward ? ward.trim() : null,
      district.trim(),
      city.trim(),
      isDefault
    ];

    const result = await db.query(insertSql, params);
    const newAddressId = result.insertId;

    // Lấy lại thông tin địa chỉ vừa tạo
    const newAddress = await db.queryOne('SELECT * FROM addresses WHERE id = ?', [newAddressId]);
    return newAddress;
  },

  /**
   * Cập nhật địa chỉ (dynamic update)
   * @param {number} userId 
   * @param {number} addressId 
   * @param {object} body 
   */
  async updateAddress(userId, addressId, body) {
    // 1. Kiểm tra sự tồn tại của địa chỉ
    const address = await db.queryOne('SELECT * FROM addresses WHERE id = ?', [addressId]);
    if (!address) {
      throw { status: 404, message: 'Địa chỉ không tồn tại' };
    }

    // 2. Kiểm tra ownership (quyền sở hữu)
    if (address.user_id !== userId) {
      throw { status: 403, message: 'Bạn không có quyền thao tác trên địa chỉ này' };
    }

    // 3. Build câu UPDATE động dựa trên các trường được gửi lên
    const allowedFields = ['receiver_name', 'phone', 'address_line', 'ward', 'district', 'city'];
    const fields = [];
    const values = [];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        fields.push(`${field} = ?`);
        const val = typeof body[field] === 'string' ? body[field].trim() : body[field];
        values.push(val);
      }
    });

    if (fields.length === 0) {
      throw { status: 400, message: 'Vui lòng cung cấp ít nhất 1 thông tin cần cập nhật' };
    }

    const sql = `UPDATE addresses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
    values.push(addressId, userId);

    await db.query(sql, values);

    // 4. Trả về thông tin địa chỉ mới cập nhật
    const updatedAddress = await db.queryOne('SELECT * FROM addresses WHERE id = ?', [addressId]);
    return updatedAddress;
  },

  /**
   * Xóa địa chỉ
   * @param {number} userId 
   * @param {number} addressId 
   */
  async deleteAddress(userId, addressId) {
    // 1. Kiểm tra sự tồn tại và ownership
    const address = await db.queryOne('SELECT * FROM addresses WHERE id = ?', [addressId]);
    if (!address) {
      throw { status: 404, message: 'Địa chỉ không tồn tại' };
    }

    if (address.user_id !== userId) {
      throw { status: 403, message: 'Bạn không có quyền thao tác trên địa chỉ này' };
    }

    // 2. Thực hiện xóa địa chỉ
    await db.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [addressId, userId]);

    // 3. Nếu địa chỉ vừa xóa đang là mặc định, chuyển mặc định sang địa chỉ còn lại gần nhất
    const isDefault = address.is_default === 1 || address.is_default === true || address.is_default === '1';
    if (isDefault) {
      const remainingSql = 'SELECT id FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1';
      const remainingAddress = await db.queryOne(remainingSql, [userId]);
      if (remainingAddress) {
        await db.query('UPDATE addresses SET is_default = true WHERE id = ?', [remainingAddress.id]);
      }
    }

    return { message: 'Xoá địa chỉ thành công' };
  },

  /**
   * Thiết lập địa chỉ mặc định
   * @param {number} userId 
   * @param {number} addressId 
   */
  async setDefaultAddress(userId, addressId) {
    // 1. Kiểm tra sự tồn tại và ownership
    const address = await db.queryOne('SELECT * FROM addresses WHERE id = ?', [addressId]);
    if (!address) {
      throw { status: 404, message: 'Địa chỉ không tồn tại' };
    }

    if (address.user_id !== userId) {
      throw { status: 403, message: 'Bạn không có quyền thao tác trên địa chỉ này' };
    }

    const isDefault = address.is_default === 1 || address.is_default === true || address.is_default === '1';
    if (isDefault) {
      return { message: 'Địa chỉ này đã là mặc định' };
    }

    // 2. Chạy transaction để đổi trạng thái mặc định
    const connection = await db.pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Hủy mặc định tất cả địa chỉ của user này
      await connection.execute('UPDATE addresses SET is_default = false WHERE user_id = ?', [userId]);
      
      // Thiết lập mặc định cho địa chỉ được chỉ định
      await connection.execute('UPDATE addresses SET is_default = true WHERE id = ? AND user_id = ?', [addressId, userId]);
      
      await connection.commit();
    } catch (err) {
      await connection.rollback();
      console.error('[Transaction Error] setDefaultAddress:', err);
      throw { status: 500, message: 'Không thể đặt địa chỉ mặc định, vui lòng thử lại' };
    } finally {
      connection.release();
    }

    return { message: 'Đặt địa chỉ mặc định thành công' };
  }
};

module.exports = addressService;
