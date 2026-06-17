const db = require('../../../config/db');
const fs = require('fs');
const path = require('path');

const brandService = {
  /**
   * Lấy danh sách toàn bộ thương hiệu kèm số lượng sản phẩm
   * @returns {Promise<Array>}
   */
  async getAllBrands() {
    const sql = `
      SELECT b.*, COUNT(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id
      GROUP BY b.id
      ORDER BY b.name ASC
    `;
    return db.query(sql);
  },

  /**
   * Tìm thương hiệu theo ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getBrandById(id) {
    const brand = await db.queryOne('SELECT * FROM brands WHERE id = ?', [id]);
    if (!brand) {
      throw { status: 404, message: 'Thương hiệu không tồn tại' };
    }
    return brand;
  },

  /**
   * Tạo thương hiệu mới
   * @param {Object} body
   * @param {Object} file File upload từ multer
   * @returns {Promise<Object>}
   */
  async createBrand(body, file) {
    const { name, description } = body;
    const trimmedName = name.trim();

    // 1. Kiểm tra trùng tên thương hiệu
    const duplicate = await db.queryOne('SELECT id FROM brands WHERE name = ?', [trimmedName]);
    if (duplicate) {
      throw { status: 409, message: 'Tên thương hiệu này đã tồn tại' };
    }

    // 2. Xác định đường dẫn logo
    const logoUrl = file ? `/uploads/brands/${file.filename}` : null;

    // 3. Insert vào DB
    const result = await db.query(
      'INSERT INTO brands (name, logo_url, description, is_active) VALUES (?, ?, ?, true)',
      [trimmedName, logoUrl, description || null]
    );

    return this.getBrandById(result.insertId);
  },

  /**
   * Cập nhật thương hiệu
   * @param {number} id
   * @param {Object} body
   * @param {Object} file File upload mới từ multer (nếu có)
   * @returns {Promise<Object>}
   */
  async updateBrand(id, body, file) {
    // 1. Kiểm tra xem thương hiệu có tồn tại không
    const current = await this.getBrandById(id);

    // 2. Kiểm tra trùng tên nếu thay đổi
    if (body.name && body.name.trim() !== current.name) {
      const trimmedName = body.name.trim();
      const duplicate = await db.queryOne(
        'SELECT id FROM brands WHERE name = ? AND id != ?',
        [trimmedName, id]
      );
      if (duplicate) {
        throw { status: 409, message: 'Tên thương hiệu này đã tồn tại' };
      }
    }

    // 3. Xây dựng câu update động
    const fields = [];
    const values = [];

    if (body.name !== undefined) {
      fields.push('name = ?');
      values.push(body.name.trim());
    }

    if (body.description !== undefined) {
      fields.push('description = ?');
      values.push(body.description);
    }

    // 4. Nếu có file logo mới tải lên
    if (file) {
      const newLogoUrl = `/uploads/brands/${file.filename}`;
      fields.push('logo_url = ?');
      values.push(newLogoUrl);

      // Xóa logo cũ vật lý trên server (nếu có)
      if (current.logo_url && current.logo_url.startsWith('/uploads/brands/')) {
        const oldFilePath = path.join(__dirname, '../../../..', current.logo_url);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`[File System] Đã xóa logo cũ của brand: ${oldFilePath}`);
          }
        } catch (err) {
          console.error(`[File System] Lỗi khi xóa logo cũ: ${err.message}`);
        }
      }
    }

    // Nếu không có thông tin gì thay đổi
    if (fields.length === 0) {
      throw { status: 400, message: 'Vui lòng cung cấp thông tin cần cập nhật' };
    }

    const sql = `UPDATE brands SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    await db.query(sql, values);

    // 5. Trả về thông tin mới nhất
    return this.getBrandById(id);
  },

  /**
   * Thay đổi trạng thái ẩn/hiện thương hiệu
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async toggleBrandStatus(id) {
    const brand = await this.getBrandById(id);
    const newStatus = !brand.is_active;

    await db.query('UPDATE brands SET is_active = ? WHERE id = ?', [newStatus, id]);

    return { id, is_active: newStatus };
  }
};

module.exports = brandService;
