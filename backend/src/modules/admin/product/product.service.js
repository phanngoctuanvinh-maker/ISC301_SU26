const db = require('../../../config/db');
const { toSlug } = require('../../../utils/slug.util');
const fs = require('fs');
const path = require('path');

const productService = {
  /**
   * Lấy danh sách sản phẩm (Admin)
   * @param {Object} query Lọc theo category_id, brand_id, keyword
   * @returns {Promise<Array>}
   */
  async getAllProducts(query) {
    const { category_id, brand_id, keyword } = query;

    let sql = `
      SELECT p.*, c.name as category_name, b.name as brand_name,
        (SELECT COUNT(*) FROM product_variants WHERE product_id = p.id) as variant_count
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN brands b ON b.id = p.brand_id
      WHERE 1=1
    `;
    const params = [];

    if (category_id) {
      sql += ' AND p.category_id = ?';
      params.push(parseInt(category_id, 10));
    }

    if (brand_id) {
      sql += ' AND p.brand_id = ?';
      params.push(parseInt(brand_id, 10));
    }

    if (keyword && keyword.trim()) {
      sql += ' AND p.name LIKE ?';
      params.push(`%${keyword.trim()}%`);
    }

    sql += ' ORDER BY p.created_at DESC';

    const products = await db.query(sql, params);
    
    // Đảm bảo kiểu dữ liệu chuẩn xác
    return products.map(p => ({
      ...p,
      is_active: !!p.is_active,
      is_featured: !!p.is_featured,
      price: Number(p.price || 0)
    }));
  },

  /**
   * Lấy chi tiết sản phẩm kèm mảng hình ảnh
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getProductDetail(id) {
    const product = await db.queryOne(
      `
      SELECT p.*, c.name as category_name, b.name as brand_name 
      FROM products p 
      JOIN categories c ON c.id = p.category_id 
      JOIN brands b ON b.id = p.brand_id 
      WHERE p.id = ?
      `,
      [id]
    );

    if (!product) {
      throw { status: 404, message: 'Sản phẩm không tồn tại' };
    }

    const images = await db.query(
      'SELECT id, image_url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
      [id]
    );

    product.is_active = !!product.is_active;
    product.is_featured = !!product.is_featured;
    product.price = Number(product.price || 0);
    product.images = images;

    return product;
  },

  /**
   * Tạo sản phẩm mới
   * @param {Object} body
   * @param {Array} files Mảng files từ multer
   * @returns {Promise<Object>}
   */
  async createProduct(body, files) {
    const { name, description, gender, sport_type, is_featured, price } = body;
    const category_id = parseInt(body.category_id, 10);
    const brand_id = parseInt(body.brand_id, 10);
    const finalPrice = price ? parseFloat(price) : 0;

    // 1. Validate Category (phải là danh mục con: parent_id != null)
    const category = await db.queryOne('SELECT id, parent_id, slug FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      throw { status: 404, message: 'Danh mục không tồn tại' };
    }
    if (category.parent_id === null) {
      throw { status: 400, message: 'Sản phẩm phải thuộc danh mục con, không được gán trực tiếp vào danh mục cha' };
    }

    // 2. Validate Brand
    const brand = await db.queryOne('SELECT id FROM brands WHERE id = ?', [brand_id]);
    if (!brand) {
      throw { status: 404, message: 'Thương hiệu không tồn tại' };
    }

    // 3. Kiểm tra xem có phải Phụ Kiện để gán null cho gender & sport_type hay không
    const parentCategory = await db.queryOne('SELECT slug FROM categories WHERE id = ?', [category.parent_id]);
    const isAccessory = category.slug.includes('phu-kien') || (parentCategory && parentCategory.slug.includes('phu-kien'));

    let finalGender = isAccessory ? null : (gender === '' ? null : gender);
    let finalSportType = isAccessory ? null : (sport_type === '' ? null : sport_type);

    // 4. Sinh slug chống trùng
    let baseSlug = toSlug(name);
    let slug = baseSlug;
    let counter = 2;
    while (true) {
      const existing = await db.queryOne('SELECT id FROM products WHERE slug = ?', [slug]);
      if (!existing) {
        break;
      }
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 5. Xác định main_image_url
    let mainImageUrl = null;
    if (files && files.length > 0) {
      mainImageUrl = `/uploads/products/${files[0].filename}`;
    }

    const finalFeatured = is_featured === true || is_featured === 'true' ? 1 : 0;

    // 6. Thực hiện Insert sản phẩm
    const result = await db.query(
      `
      INSERT INTO products (
        category_id, brand_id, name, slug, description, main_image_url, 
        gender, sport_type, is_active, is_featured, price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, true, ?, ?)
      `,
      [category_id, brand_id, name.trim(), slug, description || null, mainImageUrl, finalGender, finalSportType, finalFeatured, finalPrice]
    );

    const productId = result.insertId;

    // 7. Lưu hình ảnh sản phẩm vào bảng product_images
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const fileUrl = `/uploads/products/${files[i].filename}`;
        await db.query(
          'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
          [productId, fileUrl, i]
        );
      }
    }

    return this.getProductDetail(productId);
  },

  /**
   * Cập nhật thông tin sản phẩm
   * @param {number} id
   * @param {Object} body
   * @param {Array} files Mảng files mới thêm từ multer
   * @returns {Promise<Object>}
   */
  async updateProduct(id, body, files) {
    // 1. Kiểm tra sản phẩm tồn tại
    const current = await db.queryOne('SELECT p.* FROM products p WHERE p.id = ?', [id]);
    if (!current) {
      throw { status: 404, message: 'Sản phẩm không tồn tại' };
    }

    let isAccessory = false;
    let finalCategoryId = current.category_id;

    // 2. Validate và chuyển đổi category_id nếu truyền lên
    if (body.category_id !== undefined) {
      const categoryId = parseInt(body.category_id, 10);
      const category = await db.queryOne('SELECT id, parent_id, slug FROM categories WHERE id = ?', [categoryId]);
      if (!category) {
        throw { status: 404, message: 'Danh mục không tồn tại' };
      }
      if (category.parent_id === null) {
        throw { status: 400, message: 'Sản phẩm phải thuộc danh mục con, không được gán trực tiếp vào danh mục cha' };
      }
      finalCategoryId = categoryId;

      const parentCategory = await db.queryOne('SELECT slug FROM categories WHERE id = ?', [category.parent_id]);
      isAccessory = category.slug.includes('phu-kien') || (parentCategory && parentCategory.slug.includes('phu-kien'));
    } else {
      // Dùng danh mục hiện tại để kiểm tra Phụ Kiện
      const currentCategory = await db.queryOne('SELECT id, parent_id, slug FROM categories WHERE id = ?', [current.category_id]);
      if (currentCategory) {
        const parentCategory = await db.queryOne('SELECT slug FROM categories WHERE id = ?', [currentCategory.parent_id]);
        isAccessory = currentCategory.slug.includes('phu-kien') || (parentCategory && parentCategory.slug.includes('phu-kien'));
      }
    }

    // 3. Validate brand_id nếu truyền lên
    if (body.brand_id !== undefined) {
      const brandId = parseInt(body.brand_id, 10);
      const brand = await db.queryOne('SELECT id FROM brands WHERE id = ?', [brandId]);
      if (!brand) {
        throw { status: 404, message: 'Thương hiệu không tồn tại' };
      }
    }

    // 4. Xử lý đổi tên -> sinh lại slug mới
    let newSlug = undefined;
    if (body.name && body.name.trim() !== current.name) {
      let baseSlug = toSlug(body.name);
      let slug = baseSlug;
      let counter = 2;
      while (true) {
        const existing = await db.queryOne('SELECT id FROM products WHERE slug = ? AND id != ?', [slug, id]);
        if (!existing) {
          break;
        }
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      newSlug = slug;
    }

    // 5. Chuẩn hóa gender, sport_type
    let finalGender = undefined;
    let finalSportType = undefined;

    if (isAccessory) {
      finalGender = null;
      finalSportType = null;
    } else {
      if (body.gender !== undefined) {
        finalGender = body.gender === '' || body.gender === null ? null : body.gender;
      }
      if (body.sport_type !== undefined) {
        finalSportType = body.sport_type === '' || body.sport_type === null ? null : body.sport_type;
      }
    }

    // 6. Build câu SQL Update động cho sản phẩm
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
    if (body.description !== undefined) {
      fields.push('description = ?');
      values.push(body.description || null);
    }
    if (body.category_id !== undefined) {
      fields.push('category_id = ?');
      values.push(finalCategoryId);
    }
    if (body.brand_id !== undefined) {
      fields.push('brand_id = ?');
      values.push(parseInt(body.brand_id, 10));
    }
    if (finalGender !== undefined || isAccessory) {
      fields.push('gender = ?');
      values.push(finalGender !== undefined ? finalGender : null);
    }
    if (finalSportType !== undefined || isAccessory) {
      fields.push('sport_type = ?');
      values.push(finalSportType !== undefined ? finalSportType : null);
    }
    if (body.is_featured !== undefined) {
      fields.push('is_featured = ?');
      values.push(body.is_featured === true || body.is_featured === 'true' ? 1 : 0);
    }
    if (body.price !== undefined) {
      fields.push('price = ?');
      values.push(parseFloat(body.price));
    }

    // 7. Xử lý ảnh mới upload thêm
    if (files && files.length > 0) {
      // Đếm số lượng ảnh hiện có để gán sort_order kế tiếp
      const countRes = await db.queryOne('SELECT COUNT(*) as count FROM product_images WHERE product_id = ?', [id]);
      const currentCount = countRes ? countRes.count : 0;

      for (let i = 0; i < files.length; i++) {
        const fileUrl = `/uploads/products/${files[i].filename}`;
        await db.query(
          'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
          [id, fileUrl, currentCount + i]
        );
      }
    }

    // Nếu không có bất kỳ thay đổi nào từ text body và không có file mới
    if (fields.length === 0 && (!files || files.length === 0)) {
      throw { status: 400, message: 'Vui lòng cung cấp thông tin cần cập nhật' };
    }

    // Thực thi cập nhật sản phẩm nếu có
    if (fields.length > 0) {
      const sql = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
      values.push(id);
      await db.query(sql, values);
    }

    return this.getProductDetail(id);
  },

  /**
   * Xóa một hình ảnh khỏi danh sách ảnh của sản phẩm
   * @param {number} productId
   * @param {number} imageId
   * @returns {Promise<Object>}
   */
  async deleteProductImage(productId, imageId) {
    // 1. Kiểm tra ảnh thuộc về sản phẩm
    const image = await db.queryOne(
      'SELECT * FROM product_images WHERE id = ? AND product_id = ?',
      [imageId, productId]
    );
    if (!image) {
      throw { status: 404, message: 'Ảnh không tồn tại hoặc không thuộc sản phẩm này' };
    }

    // 2. Kiểm tra số lượng ảnh hiện có (không cho phép xóa ảnh cuối cùng)
    const countRes = await db.queryOne('SELECT COUNT(*) as count FROM product_images WHERE product_id = ?', [productId]);
    if (countRes && countRes.count <= 1) {
      throw { status: 400, message: 'Sản phẩm phải có ít nhất 1 ảnh, không thể xoá ảnh cuối cùng' };
    }

    // 3. Thực hiện xóa trong cơ sở dữ liệu
    await db.query('DELETE FROM product_images WHERE id = ?', [imageId]);

    // 4. Xóa tệp ảnh vật lý trên ổ đĩa
    const relativePath = image.image_url.startsWith('/') ? image.image_url.substring(1) : image.image_url;
    const oldFilePath = path.join(process.cwd(), relativePath);
    try {
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
        console.log(`[File System] Đã xóa ảnh sản phẩm: ${oldFilePath}`);
      }
    } catch (err) {
      console.error(`[File System] Lỗi khi xóa file ảnh sản phẩm: ${err.message}`);
    }

    // 5. Nếu ảnh bị xóa đang là ảnh chính (main_image_url), cập nhật ảnh chính mới là ảnh đầu tiên còn lại
    const product = await db.queryOne('SELECT p.main_image_url FROM products p WHERE p.id = ?', [productId]);
    if (product && product.main_image_url === image.image_url) {
      const nextImage = await db.queryOne(
        'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1',
        [productId]
      );
      const newMainUrl = nextImage ? nextImage.image_url : null;
      await db.query('UPDATE products SET main_image_url = ? WHERE id = ?', [newMainUrl, productId]);
    }

    return { message: 'Xoá ảnh thành công' };
  },

  /**
   * Đặt hình ảnh chỉ định làm ảnh đại diện chính (main_image_url)
   * @param {number} productId
   * @param {number} imageId
   * @returns {Promise<Object>}
   */
  async setMainImage(productId, imageId) {
    const image = await db.queryOne(
      'SELECT * FROM product_images WHERE id = ? AND product_id = ?',
      [imageId, productId]
    );
    if (!image) {
      throw { status: 404, message: 'Ảnh không tồn tại hoặc không thuộc sản phẩm này' };
    }

    await db.query('UPDATE products SET main_image_url = ? WHERE id = ?', [image.image_url, productId]);

    return { message: 'Đặt ảnh đại diện thành công', main_image_url: image.image_url };
  },

  /**
   * Bật / tắt hiển thị (is_active)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async toggleProductStatus(id) {
    const product = await db.queryOne('SELECT p.id, p.is_active FROM products p WHERE p.id = ?', [id]);
    if (!product) {
      throw { status: 404, message: 'Sản phẩm không tồn tại' };
    }

    const newStatus = !product.is_active;
    await db.query('UPDATE products SET is_active = ? WHERE id = ?', [newStatus, id]);

    return { id: Number(id), is_active: newStatus ? 1 : 0 };
  },

  /**
   * Bật / tắt nổi bật (is_featured)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async toggleFeatured(id) {
    const product = await db.queryOne('SELECT p.id, p.is_featured FROM products p WHERE p.id = ?', [id]);
    if (!product) {
      throw { status: 404, message: 'Sản phẩm không tồn tại' };
    }

    const newFeatured = !product.is_featured;
    await db.query('UPDATE products SET is_featured = ? WHERE id = ?', [newFeatured, id]);

    return { id: Number(id), is_featured: newFeatured ? 1 : 0 };
  }
};

module.exports = productService;
