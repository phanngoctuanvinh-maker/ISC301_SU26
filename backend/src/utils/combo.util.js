/**
 * Tiện ích tính toán và ghép combo giảm giá 15%
 * Một combo hoàn chỉnh gồm: 1 Giày + 1 Tất (vớ) + 1 Dây giày
 */

function applyComboDiscount(items) {
  // Nhóm các đơn vị sản phẩm riêng lẻ để ghép cặp dễ dàng
  const shoesUnits = [];
  const socksUnits = [];
  const lacesUnits = [];

  // Tạo bản sao danh sách để không làm thay đổi trực tiếp dữ liệu gốc bên ngoài ngoài ý muốn
  items.forEach((item, index) => {
    // Khởi tạo các thuộc tính phục vụ tính toán
    item.original_price = item.price; 
    item.combo_discount = 0;
    item.is_combo_item = false;

    const isSocks = item.category_slug === 'vo-tat-the-thao';
    const isLaces = item.category_slug === 'day-giay-the-thao';
    const isShoe = !isSocks && !isLaces;

    const qty = Number(item.quantity || 0);

    for (let q = 0; q < qty; q++) {
      const unit = { 
        index, 
        brand_id: item.brand_id, 
        price: Number(item.price), 
        paired: false 
      };
      if (isSocks) {
        socksUnits.push(unit);
      } else if (isLaces) {
        lacesUnits.push(unit);
      } else if (isShoe) {
        shoesUnits.push(unit);
      }
    }
  });

  // Ghép cặp mỗi đơn vị Giày với 1 Tất và 1 Dây giày
  shoesUnits.forEach(shoe => {
    // 1. Tìm 1 Tất chưa ghép (ưu tiên cùng thương hiệu)
    let sock = socksUnits.find(s => !s.paired && s.brand_id === shoe.brand_id);
    if (!sock) {
      sock = socksUnits.find(s => !s.paired); // Fallback tất khác thương hiệu
    }
    if (!sock) return; // Không đủ tất để tạo combo

    // 2. Tìm 1 Dây giày chưa ghép (ưu tiên cùng thương hiệu)
    let lace = lacesUnits.find(l => !l.paired && l.brand_id === shoe.brand_id);
    if (!lace) {
      lace = lacesUnits.find(l => !l.paired); // Fallback dây giày khác thương hiệu
    }
    if (!lace) return; // Không đủ dây giày để tạo combo

    // Đánh dấu đã ghép cặp thành công
    shoe.paired = true;
    sock.paired = true;
    lace.paired = true;
  });

  // Tính tổng số tiền chiết khấu (15% trên giá của các đơn vị sản phẩm được ghép cặp)
  let totalComboDiscount = 0;

  const applyUnitDiscount = (unit) => {
    if (unit.paired) {
      // Chiết khấu 15% cho từng đơn vị sản phẩm tham gia combo
      const discount = Math.round(unit.price * 0.15);
      items[unit.index].combo_discount += discount;
      items[unit.index].is_combo_item = true;
      totalComboDiscount += discount;
    }
  };

  shoesUnits.forEach(applyUnitDiscount);
  socksUnits.forEach(applyUnitDiscount);
  lacesUnits.forEach(applyUnitDiscount);

  // Cập nhật lại giá bán và tổng tiền từng dòng hàng sau khi giảm giá combo
  items.forEach(item => {
    if (item.combo_discount > 0) {
      // Điều chỉnh line_total bằng cách trừ đi số tiền combo_discount
      item.line_total = (item.price * item.quantity) - item.combo_discount;
      // Giá trung bình của 1 sản phẩm sau khi đã giảm combo
      item.price = Math.round(item.line_total / item.quantity);
    } else {
      item.line_total = item.price * item.quantity;
    }
  });

  return totalComboDiscount;
}

module.exports = {
  applyComboDiscount
};
