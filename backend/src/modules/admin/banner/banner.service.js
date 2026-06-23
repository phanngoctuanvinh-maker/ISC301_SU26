const db = require('../../../config/db');
const fs = require('fs');
const path = require('path');

const bannerService = {
  /**
   * Lấy chi tiết banner theo ID (kèm JOIN lấy tên đối tượng liên kết)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getBannerById(id) {
    const sql = `
      SELECT b.*, c.name as category_name, br.name as brand_name, v.code as voucher_code
      FROM banners b
      LEFT JOIN categories c ON c.id = b.category_id
      LEFT JOIN brands br ON br.id = b.brand_id
      LEFT JOIN vouchers v ON v.id = b.voucher_id
      WHERE b.id = ?
    `;
    const banner = await db.queryOne(sql, [id]);
    if (!banner) {
      throw { status: 404, message: 'Banner không tồn tại' };
    }
    return banner;
  },

  /**
   * Lấy danh sách toàn bộ banner (Admin xem)
   * @returns {Promise<Array>}
   */
  async getAllBanners() {
    const sql = `
      SELECT b.*, c.name as category_name, br.name as brand_name, v.code as voucher_code
      FROM banners b
      LEFT JOIN categories c ON c.id = b.category_id
      LEFT JOIN brands br ON br.id = b.brand_id
      LEFT JOIN vouchers v ON v.id = b.voucher_id
      ORDER BY b.sort_order ASC, b.id DESC
    `;
    return db.query(sql);
  },

  /**
   * Lấy danh sách banner đang có hiệu lực (Public xem)
   * @returns {Promise<Array>}
   */
  async getActiveBanners() {
    const sql = `
      SELECT id, title, image_url, link_type, link_url, category_id, brand_id, voucher_id
      FROM banners
      WHERE is_active = true
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
      ORDER BY sort_order ASC
    `;
    return db.query(sql);
  },

  /**
   * Tạo banner mới
   * @param {Object} body
   * @param {Object} file
   * @returns {Promise<Object>}
   */
  async createBanner(body, file) {
    if (!file) {
      throw { status: 400, message: 'Vui lòng chọn ảnh cho banner' };
    }

    const { title, link_type, link_url, start_date, end_date, sort_order } = body;

    let finalCategoryId = null;
    let finalBrandId = null;
    let finalVoucherId = null;
    let finalLinkUrl = null;

    // Quy tắc 1 & 2: Dọn dẹp và kiểm tra sự tồn tại của thực thể liên kết
    if (link_type === 'category') {
      finalCategoryId = body.category_id ? parseInt(body.category_id, 10) : null;
      if (!finalCategoryId) {
        throw { status: 400, message: 'Vui lòng chọn danh mục khi chọn loại liên kết là category' };
      }
      const cat = await db.queryOne('SELECT id FROM categories WHERE id = ?', [finalCategoryId]);
      if (!cat) {
        throw { status: 404, message: 'Danh mục liên kết không tồn tại' };
      }
    } else if (link_type === 'brand') {
      finalBrandId = body.brand_id ? parseInt(body.brand_id, 10) : null;
      if (!finalBrandId) {
        throw { status: 400, message: 'Vui lòng chọn thương hiệu khi chọn loại liên kết là brand' };
      }
      const brand = await db.queryOne('SELECT id FROM brands WHERE id = ?', [finalBrandId]);
      if (!brand) {
        throw { status: 404, message: 'Thương hiệu liên kết không tồn tại' };
      }
    } else if (link_type === 'voucher') {
      finalVoucherId = body.voucher_id ? parseInt(body.voucher_id, 10) : null;
      if (!finalVoucherId) {
        throw { status: 400, message: 'Vui lòng chọn voucher khi chọn loại liên kết là voucher' };
      }
      const voucher = await db.queryOne('SELECT id FROM vouchers WHERE id = ?', [finalVoucherId]);
      if (!voucher) {
        throw { status: 404, message: 'Voucher liên kết không tồn tại' };
      }
    } else if (link_type === 'url') {
      finalLinkUrl = link_url ? link_url.trim() : null;
      if (!finalLinkUrl) {
        throw { status: 400, message: 'Vui lòng nhập đường dẫn URL khi chọn loại liên kết là url' };
      }
    }

    // Quy tắc 3: Kiểm tra end_date > start_date
    const parsedStartDate = start_date && start_date !== 'null' && start_date !== '' ? start_date : null;
    const parsedEndDate = end_date && end_date !== 'null' && end_date !== '' ? end_date : null;

    if (parsedStartDate && parsedEndDate) {
      const start = new Date(parsedStartDate);
      const end = new Date(parsedEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        throw { status: 400, message: 'Ngày kết thúc phải sau ngày bắt đầu' };
      }
    }

    const imageUrl = `/uploads/banners/${file.filename}`;
    const sortOrderVal = sort_order ? parseInt(sort_order, 10) : 0;

    const result = await db.query(
      `INSERT INTO banners 
       (title, image_url, link_type, link_url, category_id, brand_id, voucher_id, start_date, end_date, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [
        title || null,
        imageUrl,
        link_type,
        finalLinkUrl,
        finalCategoryId,
        finalBrandId,
        finalVoucherId,
        parsedStartDate,
        parsedEndDate,
        sortOrderVal
      ]
    );

    return this.getBannerById(result.insertId);
  },

  /**
   * Cập nhật banner
   * @param {number} id
   * @param {Object} body
   * @param {Object} file
   * @returns {Promise<Object>}
   */
  async updateBanner(id, body, file) {
    const current = await this.getBannerById(id);
    const link_type = body.link_type !== undefined ? body.link_type : current.link_type;

    let finalCategoryId = null;
    let finalBrandId = null;
    let finalVoucherId = null;
    let finalLinkUrl = null;

    // Quy tắc 1 & 2 & 3: logic cập nhật dọn dẹp và kiểm tra thực thể liên kết
    if (link_type === 'category') {
      const categoryIdVal = body.category_id !== undefined ? body.category_id : current.category_id;
      finalCategoryId = categoryIdVal ? parseInt(categoryIdVal, 10) : null;
      if (!finalCategoryId) {
        throw { status: 400, message: 'Vui lòng chọn danh mục khi chọn loại liên kết là category' };
      }
      const cat = await db.queryOne('SELECT id FROM categories WHERE id = ?', [finalCategoryId]);
      if (!cat) {
        throw { status: 404, message: 'Danh mục liên kết không tồn tại' };
      }
    } else if (link_type === 'brand') {
      const brandIdVal = body.brand_id !== undefined ? body.brand_id : current.brand_id;
      finalBrandId = brandIdVal ? parseInt(brandIdVal, 10) : null;
      if (!finalBrandId) {
        throw { status: 400, message: 'Vui lòng chọn thương hiệu khi chọn loại liên kết là brand' };
      }
      const brand = await db.queryOne('SELECT id FROM brands WHERE id = ?', [finalBrandId]);
      if (!brand) {
        throw { status: 404, message: 'Thương hiệu liên kết không tồn tại' };
      }
    } else if (link_type === 'voucher') {
      const voucherIdVal = body.voucher_id !== undefined ? body.voucher_id : current.voucher_id;
      finalVoucherId = voucherIdVal ? parseInt(voucherIdVal, 10) : null;
      if (!finalVoucherId) {
        throw { status: 400, message: 'Vui lòng chọn voucher khi chọn loại liên kết là voucher' };
      }
      const voucher = await db.queryOne('SELECT id FROM vouchers WHERE id = ?', [finalVoucherId]);
      if (!voucher) {
        throw { status: 404, message: 'Voucher liên kết không tồn tại' };
      }
    } else if (link_type === 'url') {
      finalLinkUrl = body.link_url !== undefined ? body.link_url : current.link_url;
      if (!finalLinkUrl || !finalLinkUrl.trim()) {
        throw { status: 400, message: 'Vui lòng nhập đường dẫn URL khi chọn loại liên kết là url' };
      }
      finalLinkUrl = finalLinkUrl.trim();
    }

    const start_date = body.start_date !== undefined ? body.start_date : current.start_date;
    const end_date = body.end_date !== undefined ? body.end_date : current.end_date;

    const parsedStartDate = start_date && start_date !== 'null' && start_date !== '' ? start_date : null;
    const parsedEndDate = end_date && end_date !== 'null' && end_date !== '' ? end_date : null;

    if (parsedStartDate && parsedEndDate) {
      const start = new Date(parsedStartDate);
      const end = new Date(parsedEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        throw { status: 400, message: 'Ngày kết thúc phải sau ngày bắt đầu' };
      }
    }

    // Xây dựng câu SQL update động
    const fields = [];
    const values = [];

    if (body.title !== undefined) {
      fields.push('title = ?');
      values.push(body.title || null);
    }

    // Luôn ghi đè các cột liên kết để dọn dẹp các giá trị cũ
    fields.push('link_type = ?');
    values.push(link_type);

    fields.push('link_url = ?');
    values.push(finalLinkUrl);

    fields.push('category_id = ?');
    values.push(finalCategoryId);

    fields.push('brand_id = ?');
    values.push(finalBrandId);

    fields.push('voucher_id = ?');
    values.push(finalVoucherId);

    if (body.start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(parsedStartDate);
    }

    if (body.end_date !== undefined) {
      fields.push('end_date = ?');
      values.push(parsedEndDate);
    }

    if (body.sort_order !== undefined) {
      fields.push('sort_order = ?');
      values.push(body.sort_order !== '' ? parseInt(body.sort_order, 10) : 0);
    }

    // Nếu tải lên ảnh mới, xóa ảnh cũ vật lý
    if (file) {
      const newImageUrl = `/uploads/banners/${file.filename}`;
      fields.push('image_url = ?');
      values.push(newImageUrl);

      if (current.image_url && current.image_url.startsWith('/uploads/banners/')) {
        const oldFilePath = path.join(__dirname, '../../../..', current.image_url);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`[File System] Đã xóa ảnh banner cũ: ${oldFilePath}`);
          }
        } catch (err) {
          console.error(`[File System] Lỗi khi xóa ảnh banner cũ: ${err.message}`);
        }
      }
    }

    if (Object.keys(body).length === 0 && !file) {
      throw { status: 400, message: 'Vui lòng cung cấp thông tin cần cập nhật' };
    }

    const sql = `UPDATE banners SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    await db.query(sql, values);

    return this.getBannerById(id);
  },

  /**
   * Thay đổi trạng thái hoạt động ẩn/hiện
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async toggleBannerStatus(id) {
    const current = await this.getBannerById(id);
    const newStatus = !current.is_active;

    await db.query('UPDATE banners SET is_active = ? WHERE id = ?', [newStatus, id]);

    return { id, is_active: newStatus };
  },

  /**
   * Sắp xếp lại danh sách banner hàng loạt
   * @param {Array<{id: number, sort_order: number}>} items
   * @returns {Promise<Object>}
   */
  async reorderBanners(items) {
    const queries = items.map(item => 
      db.query('UPDATE banners SET sort_order = ? WHERE id = ?', [parseInt(item.sort_order, 10), parseInt(item.id, 10)])
    );
    await Promise.all(queries);
    return { message: 'Sắp xếp lại thành công' };
  },

  /**
   * Xóa banner và ảnh vật lý
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async deleteBanner(id) {
    const banner = await this.getBannerById(id);

    // Xóa file ảnh vật lý nếu có
    if (banner.image_url && banner.image_url.startsWith('/uploads/banners/')) {
      const filePath = path.join(__dirname, '../../../..', banner.image_url);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[File System] Đã xóa ảnh banner: ${filePath}`);
        }
      } catch (err) {
        console.error(`[File System] Lỗi khi xóa ảnh banner: ${err.message}`);
      }
    }

    await db.query('DELETE FROM banners WHERE id = ?', [id]);
    return { id, message: 'Xóa banner thành công' };
  }
};

module.exports = bannerService;
