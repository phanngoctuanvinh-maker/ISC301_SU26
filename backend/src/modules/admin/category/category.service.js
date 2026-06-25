const db = require('../../../config/db');
const { toSlug } = require('../../../utils/slug.util');
const fs = require('fs');
const path = require('path');

const categoryService = {
  /**
   * Lấy cây danh mục 2 tầng (Cha -> Con)
   * @returns {Promise<Array>}
   */
  async getCategoryTree() {
    // 1. Query tất cả danh mục theo thứ tự sắp xếp và id tăng dần
    const allCategories = await db.query(
      'SELECT id, parent_id, name, slug, image_url, sort_order, is_active FROM categories ORDER BY sort_order ASC, id ASC'
    );

    // 2. Lọc danh mục cha (parent_id = null)
    const parents = allCategories.filter(cat => cat.parent_id === null);

    // 3. Với mỗi danh mục cha, tìm danh mục con (parent_id = cha.id)
    parents.forEach(parent => {
      parent.children = allCategories.filter(cat => cat.parent_id === parent.id);
    });

    return parents;
  },

  /**
   * Tìm danh mục theo ID
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getCategoryById(id) {
    const category = await db.queryOne('SELECT * FROM categories WHERE id = ?', [id]);
    if (!category) {
      throw { status: 404, message: 'Danh mục không tồn tại' };
    }
    return category;
  },

  /**
   * Tạo danh mục mới
   * @param {Object} body
   * @param {Object} file File upload từ multer
   * @returns {Promise<Object>}
   */
  async createCategory(body, file) {
    const { name } = body;
    let { parent_id, sort_order } = body;

    // Chuyển đổi và chuẩn hóa parent_id
    let parsedParentId = null;
    if (parent_id !== undefined && parent_id !== null && parent_id !== '' && parent_id !== 'null') {
      parsedParentId = parseInt(parent_id, 10);
    }

    // Chuyển đổi và chuẩn hóa sort_order
    let finalSortOrder = 0;
    if (sort_order !== undefined && sort_order !== null && sort_order !== '' && sort_order !== 'null') {
      finalSortOrder = parseInt(sort_order, 10);
    }

    // 1. Nếu có parent_id, kiểm tra tính hợp lệ (Rule 1)
    if (parsedParentId !== null) {
      const parent = await db.queryOne('SELECT * FROM categories WHERE id = ?', [parsedParentId]);
      if (!parent) {
        throw { status: 404, message: 'Danh mục cha không tồn tại' };
      }
      if (parent.parent_id !== null) {
        throw { status: 400, message: 'Không thể tạo danh mục con của danh mục con — chỉ hỗ trợ 2 tầng' };
      }
    }

    // 2. Sinh slug chống trùng (Rule 2)
    let baseSlug = toSlug(name);
    let slug = baseSlug;
    let counter = 2;
    
    while (true) {
      const existing = await db.queryOne('SELECT id FROM categories WHERE slug = ?', [slug]);
      if (!existing) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Xác định imageUrl từ file upload
    const imageUrl = file ? `/uploads/categories/${file.filename}` : null;

    // 3. Thực hiện Insert
    await db.query(
      'INSERT INTO categories (parent_id, name, slug, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, true)',
      [parsedParentId, name.trim(), slug, imageUrl, finalSortOrder]
    );

    // 4. Lấy danh mục vừa tạo
    const resultId = await db.query('SELECT LAST_INSERT_ID() as id');
    const newId = resultId[0].id;

    return this.getCategoryById(newId);
  },

  /**
   * Cập nhật danh mục
   * @param {number} id
   * @param {Object} body
   * @param {Object} file File upload từ multer (nếu có)
   * @returns {Promise<Object>}
   */
  async updateCategory(id, body, file) {
    // 1. Kiểm tra xem danh mục có tồn tại không
    const current = await this.getCategoryById(id);

    // 2. Chuẩn hóa và validate parent_id nếu được truyền lên (Rule 1, 5)
    let parsedParentId = undefined;
    if (body.parent_id !== undefined) {
      if (body.parent_id === '' || body.parent_id === 'null' || body.parent_id === null) {
        parsedParentId = null;
      } else {
        parsedParentId = parseInt(body.parent_id, 10);
      }

      if (parsedParentId !== null) {
        // Tự làm cha của chính mình
        if (Number(parsedParentId) === Number(id)) {
          throw { status: 400, message: 'Danh mục không thể là cha của chính nó' };
        }

        // Kiểm tra danh mục cha mới có tồn tại không
        const parentCategory = await db.queryOne('SELECT * FROM categories WHERE id = ?', [parsedParentId]);
        if (!parentCategory) {
          throw { status: 404, message: 'Danh mục cha không tồn tại' };
        }

        // Danh mục cha được chọn phải là danh mục tầng 1 (parent_id = null)
        if (parentCategory.parent_id !== null) {
          throw { status: 400, message: 'Không thể tạo danh mục con của danh mục con — chỉ hỗ trợ 2 tầng' };
        }

        // Kiểm tra xem danh mục đang sửa có đang là cha của danh mục khác không (Rule 5)
        const checkChildren = await db.queryOne('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?', [id]);
        if (checkChildren && checkChildren.count > 0) {
          throw { status: 400, message: 'Danh mục này đang có danh mục con, không thể trở thành danh mục con của danh mục khác' };
        }
      }
    }

    // Chuẩn hóa sort_order
    let parsedSortOrder = undefined;
    if (body.sort_order !== undefined) {
      if (body.sort_order === '' || body.sort_order === 'null' || body.sort_order === null) {
        parsedSortOrder = 0;
      } else {
        parsedSortOrder = parseInt(body.sort_order, 10);
      }
    }

    // 3. Xử lý đổi tên -> sinh lại slug mới (Rule 2, 4)
    let newSlug = undefined;
    if (body.name && body.name.trim() !== current.name) {
      let baseSlug = toSlug(body.name);
      let slug = baseSlug;
      let counter = 2;

      while (true) {
        // Kiểm tra trùng slug ngoại trừ chính bản ghi đang sửa
        const existing = await db.queryOne(
          'SELECT id FROM categories WHERE slug = ? AND id != ?',
          [slug, id]
        );
        if (!existing) {
          break;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      newSlug = slug;
    }

    // 4. Build câu update động
    const fields = [];
    const values = [];

    if (body.name !== undefined) {
      fields.push('name = ?');
      values.push(body.name.trim());
    }

    if (newSlug !== undefined) {
      fields.push('slug = ?');
      values.push(newSlug);
    }

    if (parsedParentId !== undefined) {
      fields.push('parent_id = ?');
      values.push(parsedParentId);
    }

    if (parsedSortOrder !== undefined) {
      fields.push('sort_order = ?');
      values.push(parsedSortOrder);
    }

    // 5. Nếu có file ảnh mới tải lên
    if (file) {
      const newImageUrl = `/uploads/categories/${file.filename}`;
      fields.push('image_url = ?');
      values.push(newImageUrl);

      // Xóa ảnh cũ vật lý trên server (nếu có)
      if (current.image_url && current.image_url.startsWith('/uploads/categories/')) {
        const oldFilePath = path.join(__dirname, '../../../..', current.image_url);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
            console.log(`[File System] Đã xóa ảnh danh mục cũ: ${oldFilePath}`);
          }
        } catch (err) {
          console.error(`[File System] Lỗi khi xóa ảnh danh mục cũ: ${err.message}`);
        }
      }
    }

    // Nếu không có thông tin gì thay đổi
    if (fields.length === 0) {
      throw { status: 400, message: 'Vui lòng cung cấp thông tin cần cập nhật' };
    }

    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    await db.query(sql, values);

    // 6. Trả về thông tin mới nhất
    return this.getCategoryById(id);
  },

  /**
   * Ẩn / hiện danh mục (Rule 3, 4)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async toggleCategoryStatus(id) {
    const category = await this.getCategoryById(id);
    const newStatus = !category.is_active;

    // Cập nhật trạng thái của chính danh mục đó
    await db.query('UPDATE categories SET is_active = ? WHERE id = ?', [newStatus, id]);

    // Rule 4: Nếu ẩn danh mục cha -> ẩn luôn tất cả con của nó
    if (newStatus === false && category.parent_id === null) {
      await db.query('UPDATE categories SET is_active = false WHERE parent_id = ?', [id]);
    }

    return { id, is_active: newStatus };
  },

  /**
   * Thay đổi thứ tự sắp xếp của mảng danh mục (Rule 7)
   * @param {Array} items Mảng [{ id, sort_order }, ...]
   * @returns {Promise<Object>}
   */
  async reorderCategories(items) {
    const updatePromises = items.map(item => {
      return db.query('UPDATE categories SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    });

    await Promise.all(updatePromises);

    return { message: 'Sắp xếp lại thành công' };
  }
};

module.exports = categoryService;
