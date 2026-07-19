/**
 * Tiện ích tính toán và ghép combo giảm giá
 * 1. Combo 3 món hoàn chỉnh: 1 Giày + 1 Tất (vớ) + 1 Dây giày -> Giảm 10% cho Tất và Dây.
 * 2. Phụ kiện mua kèm: Khi trong giỏ hàng có Giày, bất kỳ phụ kiện lẻ nào có đánh dấu mua kèm (is_bought_together = 1) sẽ được giảm 20%.
 */

function applyComboDiscount(items) {
  // Nhóm các đơn vị sản phẩm riêng lẻ để ghép cặp dễ dàng
  const shoesUnits = [];
  const socksUnits = [];
  const lacesUnits = [];
  const otherAccUnits = [];

  // Tạo bản sao danh sách để không làm thay đổi trực tiếp dữ liệu gốc
  items.forEach((item, index) => {
    item.original_price = item.price; 
    item.combo_discount = 0;
    item.is_combo_item = false;

    const isSocks = item.category_slug === 'vo-tat-the-thao' || item.category_slug === 'vo-tat';
    const isLaces = item.category_slug === 'day-giay-the-thao' || item.category_slug === 'day-giay';
    const isOtherAcc = item.category_slug === 'chai-xit-khu-mui' || item.category_slug === 'lot-giay-the-thao' || item.category_slug === 'bo-ve-sinh-giay' || item.category_slug === 'phu-kien';
    const isShoe = !isSocks && !isLaces && !isOtherAcc;

    const qty = Number(item.quantity || 0);

    for (let q = 0; q < qty; q++) {
      const unit = { 
        index, 
        brand_id: item.brand_id, 
        price: Number(item.price), 
        paired: false,
        comboType: null,
        is_bought_together: item.is_bought_together ? 1 : 0,
        is_flash_sale: item.is_flash_sale ? true : false,
        item_type: isSocks ? 'socks' : (isLaces ? 'laces' : (isOtherAcc ? 'accessory' : 'shoe'))
      };
      if (isSocks) {
        socksUnits.push(unit);
      } else if (isLaces) {
        lacesUnits.push(unit);
      } else if (isOtherAcc) {
        otherAccUnits.push(unit);
      } else if (isShoe) {
        shoesUnits.push(unit);
      }
    }
  });

  // 1. Ghép cặp mỗi đơn vị Giày với 1 Tất và 1 Dây giày (Full Combo 3 món - Giảm 15%)
  shoesUnits.forEach(shoe => {
    let sock = socksUnits.find(s => !s.paired && s.brand_id === shoe.brand_id);
    if (!sock) {
      sock = socksUnits.find(s => !s.paired);
    }
    if (!sock) return;

    let lace = lacesUnits.find(l => !l.paired && l.brand_id === shoe.brand_id);
    if (!lace) {
      lace = lacesUnits.find(l => !l.paired);
    }
    if (!lace) return;

    shoe.paired = true;
    sock.paired = true;
    lace.paired = true;
    
    shoe.comboType = 'full';
    sock.comboType = 'full';
    lace.comboType = 'full';
  });

  // 2. Nếu có giày trong giỏ hàng, tất cả phụ kiện lẻ có đánh dấu mua kèm (is_bought_together = 1) đều nhận chiết khấu 20%
  const hasAnyShoe = shoesUnits.length > 0;
  if (hasAnyShoe) {
    socksUnits.forEach(sock => {
      if (!sock.paired && sock.is_bought_together === 1) {
        sock.paired = true;
        sock.comboType = 'accessory';
      }
    });
    lacesUnits.forEach(lace => {
      if (!lace.paired && lace.is_bought_together === 1) {
        lace.paired = true;
        lace.comboType = 'accessory';
      }
    });
    otherAccUnits.forEach(acc => {
      if (!acc.paired && acc.is_bought_together === 1) {
        acc.paired = true;
        acc.comboType = 'accessory';
      }
    });
  }

  // Tính tổng số tiền chiết khấu
  let totalComboDiscount = 0;

  const applyUnitDiscount = (unit) => {
    if (unit.paired) {
      let discountPercent = 0;
      if (unit.comboType === 'full') {
        if (unit.item_type === 'shoe') {
          discountPercent = 0; // Giày không bao giờ giảm giá trong combo
        } else if (unit.is_flash_sale) {
          discountPercent = 0;
        } else {
          discountPercent = 0.10;
        }
      } else if (unit.comboType === 'accessory') {
        if (unit.is_flash_sale) {
          discountPercent = 0;
        } else {
          discountPercent = 0.20; // Giảm 20% cho phụ kiện mua kèm lẻ
        }
      }

      if (discountPercent > 0) {
        const discount = Math.round(unit.price * discountPercent);
        items[unit.index].combo_discount += discount;
        items[unit.index].is_combo_item = true;
        totalComboDiscount += discount;
      }
    }
  };

  shoesUnits.forEach(applyUnitDiscount);
  socksUnits.forEach(applyUnitDiscount);
  lacesUnits.forEach(applyUnitDiscount);
  otherAccUnits.forEach(applyUnitDiscount);

  // Cập nhật lại giá bán và tổng tiền từng dòng hàng sau khi giảm giá combo
  items.forEach(item => {
    if (item.combo_discount > 0) {
      item.line_total = (item.price * item.quantity) - item.combo_discount;
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
