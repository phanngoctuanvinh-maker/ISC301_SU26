const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const categoryService = require('../src/modules/admin/category/category.service');
const brandService = require('../src/modules/admin/brand/brand.service');

async function testSuite() {
  console.log('--- KHỞI ĐỘNG INTEGRATION TEST CHO CATEGORIES & BRANDS ---');
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failCount++;
    }
  }

  try {
    // 0. Dọn dẹp dữ liệu cũ (nếu có tên test) để test chạy độc lập
    console.log('\n[0] Đang dọn dẹp dữ liệu cũ...');
    // Để tránh dính khoá ngoại, ta cần xoá danh mục con trước, sau đó danh mục cha
    await db.query("DELETE FROM categories WHERE name LIKE '%Test%'");
    await db.query("DELETE FROM brands WHERE name LIKE '%Test%'");

    // ==========================================
    // KIỂM THỬ DANH MỤC (CATEGORY)
    // ==========================================
    console.log('\n=== KIỂM THỬ DANH MỤC ===');

    // Test 1: Tạo danh mục cha hợp lệ
    const parentCat = await categoryService.createCategory({
      name: 'Giày Nike Test',
      parent_id: null,
      sort_order: 10
    });
    assert(parentCat.name === 'Giày Nike Test' && parentCat.slug === 'giay-nike-test' && parentCat.parent_id === null, 'Tạo danh mục cha thành công với slug hợp lệ.');

    // Test 2: Tạo danh mục con hợp lệ
    const childCat = await categoryService.createCategory({
      name: 'Giày Nike Nam Test',
      parent_id: parentCat.id,
      sort_order: 5
    });
    assert(childCat.name === 'Giày Nike Nam Test' && childCat.parent_id === parentCat.id && childCat.slug === 'giay-nike-nam-test', 'Tạo danh mục con (tầng 2) thành công.');

    // Test 3: Tạo danh mục con tầng 3 (phải bị chặn - Rule 1)
    try {
      await categoryService.createCategory({
        name: 'Giày Nike Nam Size Lớn Test',
        parent_id: childCat.id
      });
      assert(false, 'Tạo danh mục tầng 3 phải bị chặn.');
    } catch (err) {
      assert(err.status === 400 && err.message.includes('chỉ hỗ trợ 2 tầng'), 'Chặn tạo danh mục tầng 3 thành công.');
    }

    // Test 4: Sinh tự động slug chống trùng (Rule 2)
    const duplicateCat = await categoryService.createCategory({
      name: 'Giày Nike Test',
      parent_id: null
    });
    assert(duplicateCat.slug === 'giay-nike-test-2', 'Tự động tạo slug tăng hậu tố chống trùng thành công: giay-nike-test-2.');

    // Test 5: Sửa danh mục đổi tên -> sinh lại slug mới (Rule 2, 4)
    const updatedCat = await categoryService.updateCategory(duplicateCat.id, {
      name: 'Giày Nike Test Mới'
    });
    assert(updatedCat.slug === 'giay-nike-test-moi', 'Đổi tên danh mục tự động cập nhật lại slug mới thành công.');

    // Test 6: Ngăn chặn vòng lặp vô tận / gán cha sai (Rule 5)
    // Cố gắng đổi cha của parentCat thành chính nó
    try {
      await categoryService.updateCategory(parentCat.id, {
        parent_id: parentCat.id
      });
      assert(false, 'Đổi cha của danh mục thành chính nó phải bị chặn.');
    } catch (err) {
      assert(err.status === 400 && err.message.includes('cha của chính nó'), 'Chặn danh mục tự làm cha của chính nó thành công.');
    }

    // Cố gắng đổi cha của parentCat thành một danh mục khác khi nó đang có con
    try {
      await categoryService.updateCategory(parentCat.id, {
        parent_id: duplicateCat.id
      });
      assert(false, 'Gán parent_id cho danh mục cha đang có con phải bị chặn.');
    } catch (err) {
      assert(err.status === 400 && err.message.includes('đang có danh mục con'), 'Chặn biến danh mục cha đang có con thành danh mục con thành công.');
    }

    // Test 7: Lấy cây danh mục
    const tree = await categoryService.getCategoryTree();
    const foundParent = tree.find(c => c.id === parentCat.id);
    assert(foundParent && foundParent.children.length === 1 && foundParent.children[0].id === childCat.id, 'Lấy cây danh mục 2 tầng (Cha -> Con) thành công.');

    // Test 8: Sắp xếp lại danh mục (reorder)
    const reorderRes = await categoryService.reorderCategories([
      { id: parentCat.id, sort_order: 100 },
      { id: childCat.id, sort_order: 200 }
    ]);
    const parentAfter = await categoryService.getCategoryById(parentCat.id);
    const childAfter = await categoryService.getCategoryById(childCat.id);
    assert(reorderRes.message === 'Sắp xếp lại thành công' && parentAfter.sort_order === 100 && childAfter.sort_order === 200, 'Thay đổi thứ tự sắp xếp (reorder) danh mục thành công.');

    // Test 9: Ẩn danh mục cha -> ẩn luôn danh mục con (Rule 4)
    const toggleRes1 = await categoryService.toggleCategoryStatus(parentCat.id);
    assert(toggleRes1.is_active === false, 'Ẩn danh mục cha thành công.');
    
    const childChecked = await categoryService.getCategoryById(childCat.id);
    assert(childChecked.is_active === 0 || childChecked.is_active === false, 'Tự động ẩn danh mục con khi ẩn danh mục cha thành công.');

    // Test 10: Hiện danh mục cha -> KHÔNG tự động hiện con (Rule 4)
    const toggleRes2 = await categoryService.toggleCategoryStatus(parentCat.id);
    assert(toggleRes2.is_active === true, 'Hiện lại danh mục cha thành công.');
    
    const childChecked2 = await categoryService.getCategoryById(childCat.id);
    assert(childChecked2.is_active === 0 || childChecked2.is_active === false, 'Hiện danh mục cha không tự động hiện danh mục con thành công.');

    // ==========================================
    // KIỂM THỬ THƯƠNG HIỆU (BRAND)
    // ==========================================
    console.log('\n=== KIỂM THỬ THƯƠNG HIỆU ===');

    // Test 11: Tạo Brand mới
    const brand1 = await brandService.createBrand(
      { name: 'Adidas Test', description: 'Thương hiệu Adidas Test' },
      null
    );
    assert(brand1.name === 'Adidas Test' && brand1.logo_url === null && brand1.is_active === 1, 'Tạo brand thành công không có logo.');

    // Test 12: Kiểm tra trùng tên thương hiệu (Rule 8)
    try {
      await brandService.createBrand({ name: 'adidas test' }, null); // check case-insensitive or direct match
      assert(false, 'Tạo trùng tên brand phải bị chặn.');
    } catch (err) {
      assert(err.status === 409 && err.message.includes('đã tồn tại'), 'Chặn tạo trùng tên thương hiệu thành công.');
    }

    // Test 13: Cập nhật brand và upload logo mới -> dọn dẹp logo cũ
    // Đầu tiên tạo một file logo giả
    const mockUploadsDir = path.join(__dirname, '../uploads/brands');
    if (!fs.existsSync(mockUploadsDir)) {
      fs.mkdirSync(mockUploadsDir, { recursive: true });
    }
    
    const oldFilename = 'brand_old_mock_test.png';
    const oldFilePath = path.join(mockUploadsDir, oldFilename);
    fs.writeFileSync(oldFilePath, 'old_logo_content');

    // Gán logo cũ vào brand1
    await db.query('UPDATE brands SET logo_url = ? WHERE id = ?', [`/uploads/brands/${oldFilename}`, brand1.id]);
    
    // Kiểm tra file tồn tại
    assert(fs.existsSync(oldFilePath), 'Đã tạo file logo giả cũ.');

    // Bây giờ cập nhật brand với file logo mới
    const newFile = { filename: 'brand_new_mock_test.png' };
    const newFilePath = path.join(mockUploadsDir, newFile.filename);
    fs.writeFileSync(newFilePath, 'new_logo_content');

    const updatedBrand = await brandService.updateBrand(
      brand1.id,
      { name: 'Adidas Test Mới', description: 'Mô tả mới' },
      newFile
    );

    assert(
      updatedBrand.name === 'Adidas Test Mới' && 
      updatedBrand.logo_url === '/uploads/brands/brand_new_mock_test.png',
      'Cập nhật thông tin brand và logo mới thành công.'
    );

    // Kiểm tra file logo cũ đã bị xoá
    assert(!fs.existsSync(oldFilePath), 'Tự động dọn dẹp file logo cũ trên disk thành công.');
    
    // Dọn dẹp file logo mới vừa tạo
    if (fs.existsSync(newFilePath)) {
      fs.unlinkSync(newFilePath);
    }

    // Test 14: Lấy danh sách brand
    const brandsList = await brandService.getAllBrands();
    const foundBrand = brandsList.find(b => b.id === brand1.id);
    assert(foundBrand !== undefined && foundBrand.product_count !== undefined, 'Lấy danh sách thương hiệu kèm số lượng sản phẩm thành công.');

    // Test 15: Toggle status brand
    const toggleBrand = await brandService.toggleBrandStatus(brand1.id);
    assert(toggleBrand.is_active === false, 'Ẩn/hiện trạng thái brand thành công.');

    // Dọn dẹp sau khi test
    console.log('\n[Dọn dẹp] Đang dọn dẹp dữ liệu kiểm thử...');
    await db.query("DELETE FROM categories WHERE name LIKE '%Test%'");
    await db.query("DELETE FROM brands WHERE name LIKE '%Test%'");

    console.log('\n=== TỔNG KẾT KIỂM THỬ ===');
    console.log(`Tổng số test cases: ${passCount + failCount}`);
    console.log(`Số lượng PASS: ${passCount}`);
    console.log(`Số lượng FAIL: ${failCount}`);

    if (failCount === 0) {
      console.log('Tất cả các kiểm thử đều thành công tuyệt đối! 🎉');
    } else {
      console.error('Có một số lỗi kiểm thử cần khắc phục! ❌');
    }

  } catch (err) {
    console.error('Lỗi nghiêm trọng trong quá trình chạy test suite:', err);
  } finally {
    db.pool.end();
  }
}

testSuite();
