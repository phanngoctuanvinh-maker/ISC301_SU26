/**
 * Chuyển đổi chuỗi tiếng Việt có dấu thành slug không dấu
 * @param {string} str Chuỗi đầu vào cần chuyển đổi
 * @returns {string} Chuỗi slug kết quả
 */
function toSlug(str) {
  if (!str) return '';

  // 1. Chuyển về lowercase
  let slug = str.toLowerCase();

  // 2. Thay thế ký tự đ/Đ thành d
  slug = slug.replace(/[đĐ]/g, 'd');

  // 3. Chuyển ký tự tiếng Việt có dấu thành không dấu
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 4. Thay tất cả ký tự không phải chữ/số bằng dấu gạch ngang
  slug = slug.replace(/[^a-z0-9]+/g, '-');

  // 5. Xóa dấu gạch ngang ở đầu/cuối
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
}

module.exports = {
  toSlug
};
