const db = require('../../config/db');
require('dotenv').config();

/**
 * Lấy hồ sơ chân của người dùng
 */
async function getAIProfile(userId) {
  const profile = await db.queryOne(
    `SELECT foot_length_cm, foot_width, shoe_size_measured, style_preference 
     FROM users WHERE id = ?`,
    [userId]
  );
  return profile;
}

/**
 * Cập nhật hồ sơ chân của người dùng
 */
async function updateFootProfile(userId, length, width, shoeSize, stylePreference) {
  await db.query(
    `UPDATE users 
     SET foot_length_cm = ?, foot_width = ?, shoe_size_measured = ?, style_preference = ? 
     WHERE id = ?`,
    [length, width, shoeSize, stylePreference, userId]
  );
  return getAIProfile(userId);
}

/**
 * Thực hiện đo size chân từ các điểm hiệu chuẩn gửi lên
 */
async function measureFoot(userId, { paperPoints, footPoints, widthPoints, stylePreference }) {
  // Khoảng cách tờ A4 thực tế là 29.7cm dọc và 21.0cm ngang
  // Tính khoảng cách pixel của tờ giấy A4 (theo chiều dọc)
  const distPaperY = Math.sqrt(
    Math.pow(paperPoints[1].x - paperPoints[0].x, 2) +
    Math.pow(paperPoints[1].y - paperPoints[0].y, 2)
  );

  // Tính khoảng cách pixel của bàn chân (chiều dài)
  const distFootY = Math.sqrt(
    Math.pow(footPoints[1].x - footPoints[0].x, 2) +
    Math.pow(footPoints[1].y - footPoints[0].y, 2)
  );

  // Tính khoảng cách pixel độ rộng bàn chân
  const distFootX = Math.sqrt(
    Math.pow(widthPoints[1].x - widthPoints[0].x, 2) +
    Math.pow(widthPoints[1].y - widthPoints[0].y, 2)
  );

  // Chiều dài chân thực tế (cm) = 29.7 * (pixel chân / pixel giấy)
  let footLengthCm = 29.7 * (distFootY / distPaperY);
  // Chiều rộng chân thực tế (cm)
  let footWidthCm = 29.7 * (distFootX / distPaperY);

  // Giới hạn hợp lệ thực tế
  if (isNaN(footLengthCm) || footLengthCm < 15 || footLengthCm > 35) {
    footLengthCm = 25.0; // Mặc định nếu tính toán bất thường
  }
  if (isNaN(footWidthCm) || footWidthCm < 5 || footWidthCm > 18) {
    footWidthCm = 9.8;
  }

  footLengthCm = Math.round(footLengthCm * 10) / 10;
  footWidthCm = Math.round(footWidthCm * 10) / 10;

  // Tính tỷ lệ rộng / dài để phân loại độ rộng chân
  const ratio = footWidthCm / footLengthCm;
  let footWidth = 'medium'; // Thường
  if (ratio < 0.37) {
    footWidth = 'narrow'; // Thon
  } else if (ratio > 0.41) {
    footWidth = 'wide'; // Bè
  }

  // Công thức tính size giày EU: Size = 1.5 * (Length + 1.5)
  // Ví dụ: 25.5cm -> 1.5 * 27 = 40.5 -> làm tròn thành 41
  let shoeSizeMeasured = Math.round(1.5 * (footLengthCm + 1.5));
  if (shoeSizeMeasured < 35) shoeSizeMeasured = 35;
  if (shoeSizeMeasured > 46) shoeSizeMeasured = 46;

  // Cập nhật vào DB nếu người dùng đã đăng nhập
  let profile = {
    foot_length_cm: footLengthCm,
    foot_width: footWidth,
    shoe_size_measured: shoeSizeMeasured,
    style_preference: stylePreference || 'lifestyle'
  };

  if (userId) {
    profile = await updateFootProfile(
      userId,
      footLengthCm,
      footWidth,
      shoeSizeMeasured,
      stylePreference || 'lifestyle'
    );
  }

  return {
    success: true,
    footLengthCm,
    footWidthCm,
    footWidth,
    shoeSizeMeasured,
    profile
  };
}

/**
 * Trò chuyện tư vấn bằng AI (Gemini hoặc Offline Fallback)
 */
async function chatWithAI(messages, userProfile) {
  // Lấy danh sách sản phẩm thực tế trong DB để AI có thông tin đề xuất đúng
  const products = await db.query(`
    SELECT p.id, p.name, p.slug, p.gender, p.sport_type, p.price,
           (SELECT MIN(pv.discount_price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = true) AS discount_price,
           b.name as brand_name, c.name as category_name, c.slug as category_slug
    FROM products p
    INNER JOIN brands b ON b.id = p.brand_id
    INNER JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = true AND c.is_active = true
  `);

  const productContext = products.map(p => 
    `- [ID: ${p.id}] ${p.name} (${p.brand_name} - ${p.category_name}), Giá: ${p.discount_price || p.price}₫, Dành cho: ${p.gender || 'unisex'}, Kiểu: ${p.sport_type || 'Casual'}`
  ).join('\n');

  const apiKey = process.env.GEMINI_API_KEY;
  let result = null;

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key') {
    try {
      const sizeInfo = userProfile 
        ? `Thông tin chân của khách hàng: Chiều dài: ${userProfile.foot_length_cm} cm, Độ rộng chân: ${userProfile.foot_width} (thon/thường/bè), Size giày đo được: EU ${userProfile.shoe_size_measured}, Phong cách ưa thích: ${userProfile.style_preference || 'Chưa chọn'}`
        : 'Khách hàng chưa cung cấp thông tin đo chân.';

      const systemInstruction = `Bạn là Trợ lý Tư vấn Chọn Giày AI thông minh và thân thiện của cửa hàng "SHOES STORE".
Nhiệm vụ của bạn là lắng nghe nhu cầu của khách hàng, tư vấn chọn giày phù hợp nhất về kiểu dáng, phân loại và giá cả dựa trên danh sách sản phẩm thực tế của cửa hàng dưới đây.

${sizeInfo}

Danh sách sản phẩm có sẵn trong cửa hàng:
${productContext}

QUY TẮC PHẢN HỒI:
1. Trả lời bằng tiếng Việt lịch sự, nhiệt tình, tư vấn chân thành.
2. Giới thiệu chi tiết các đôi giày phù hợp từ danh sách sản phẩm trên (không được bịa ra tên sản phẩm khác ngoài danh sách).
3. Đề xuất size giày khuyên dùng dựa trên kích thước chân của họ (nếu có thông tin). Lưu ý nếu chân bè (wide) thì nên khuyên tăng 0.5 - 1 size so với size đo chuẩn cho các dòng ôm chân.
4. Cuối câu trả lời, bạn BẮT BUỘC phải đính kèm một khối dữ liệu JSON định dạng chính xác sau (bao quanh bởi thẻ code \`\`\`json và \`\`\`), để hệ thống của chúng tôi tự động hiển thị thẻ sản phẩm tương tác và gợi ý Outfit phối hợp:

\`\`\`json
{
  "recommended_product_ids": [mảng số ID sản phẩm được bạn đề cử, ví dụ: [1, 2]],
  "outfit_recommendations": [
    {
      "type": "socks",
      "name": "Tên tất/vớ phối hợp",
      "color": "Màu sắc tất",
      "reason": "Lý do chọn để phối cùng giày"
    },
    {
      "type": "laces",
      "name": "Dây giày đi kèm",
      "color": "Màu dây",
      "reason": "Lý do phối dây"
    },
    {
      "type": "top",
      "name": "Áo phối hợp gợi ý (ví dụ: Áo thun Nike Dri-FIT)",
      "color": "Màu áo",
      "reason": "Lý do phối áo"
    },
    {
      "type": "bottom",
      "name": "Quần gợi ý phối hợp",
      "color": "Màu quần",
      "reason": "Lý do phối quần"
    }
  ]
}
\`\`\`
Đảm bảo thẻ json hoàn toàn hợp lệ và là phần cuối cùng của câu trả lời.`;

      // Chuẩn bị payload hội thoại cho Gemini API
      const contents = [];
      
      contents.push({
        role: 'user',
        parts: [{ text: systemInstruction }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: "Tôi đã hiểu rõ nhiệm vụ của mình. Tôi sẽ tư vấn nhiệt tình dựa trên danh sách sản phẩm và cung cấp khối JSON cuối bài." }]
      });

      // Lấy 6 tin nhắn gần nhất để làm ngữ cảnh chat
      const recentMessages = messages.slice(-6);
      recentMessages.forEach(msg => {
        contents.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: Status ${response.status}`);
      }

      const resData = await response.json();
      const rawText = resData.candidates[0].content.parts[0].text;
      
      result = parseAIChatResponse(rawText);
    } catch (err) {
      console.error('[Gemini API Call failed, switching to offline rules engine]:', err.message);
      result = runOfflineRulesEngine(messages, products, userProfile);
    }
  } else {
    // Không có API Key -> Chạy Offline Rules Engine
    result = runOfflineRulesEngine(messages, products, userProfile);
  }

  // Tải chi tiết sản phẩm đầy đủ để phản hồi trả về frontend tự dựng card
  let recommendedProducts = [];
  if (result && result.recommended_product_ids && result.recommended_product_ids.length > 0) {
    try {
      recommendedProducts = await db.query(
        `SELECT p.id, p.name, p.slug, p.price,
                (SELECT MIN(pv.discount_price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = true) AS discount_price,
                p.main_image_url,
                b.name as brand_name, c.name as category_name, c.slug as category_slug
         FROM products p
         INNER JOIN brands b ON b.id = p.brand_id
         INNER JOIN categories c ON c.id = p.category_id
         WHERE p.id IN (${result.recommended_product_ids.join(',')}) AND p.is_active = true`
      );
      recommendedProducts = recommendedProducts.map(p => ({
        ...p,
        price: Number(p.price),
        discount_price: p.discount_price !== null ? Number(p.discount_price) : null
      }));
    } catch (e) {
      console.error('Lỗi tải sản phẩm đề cử:', e.message);
    }
  }

  result.recommended_products = recommendedProducts;
  return result;
}

/**
 * Tách văn bản phản hồi của AI thành nội dung text và khối JSON đề xuất
 */
function parseAIChatResponse(rawText) {
  let textContent = rawText;
  let recommended_product_ids = [];
  let outfit_recommendations = [];

  try {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = rawText.match(jsonRegex);
    if (match && match[1]) {
      const data = JSON.parse(match[1].trim());
      recommended_product_ids = data.recommended_product_ids || [];
      outfit_recommendations = data.outfit_recommendations || [];
      // Cắt bỏ khối JSON khỏi văn bản để hiển thị sạch sẽ
      textContent = rawText.replace(jsonRegex, '').trim();
    }
  } catch (err) {
    console.error('Lỗi phân tích JSON từ AI:', err.message);
  }

  return {
    text: textContent,
    recommended_product_ids,
    outfit_recommendations
  };
}

/**
 * Công cụ phân tích quy tắc từ khóa offline thay thế cho Gemini API
 */
function runOfflineRulesEngine(messages, products, userProfile) {
  const lastUserMsg = messages[messages.length - 1]?.text?.toLowerCase() || '';
  
  let matchProducts = [];
  let responseText = '';
  let sportType = 'lifestyle';

  if (lastUserMsg.includes('chạy bộ') || lastUserMsg.includes('chay bo') || lastUserMsg.includes('running')) {
    matchProducts = products.filter(p => p.sport_type === 'running');
    sportType = 'running';
    responseText = "Dựa trên nhu cầu tìm giày chạy bộ của bạn, tôi xin đề cử những dòng sản phẩm chuyên dụng, có đệm êm ái hỗ trợ tối đa cho các buổi chạy:";
  } else if (lastUserMsg.includes('bóng rổ') || lastUserMsg.includes('basketball') || lastUserMsg.includes('bong ro')) {
    matchProducts = products.filter(p => p.sport_type === 'basketball');
    sportType = 'basketball';
    responseText = "Đối với bộ môn bóng rổ đòi hỏi sức bật và bảo vệ cổ chân, dưới đây là những đôi giày có độ bám và đệm giảm chấn tốt nhất tại Shoes Store:";
  } else if (lastUserMsg.includes('đá bóng') || lastUserMsg.includes('football') || lastUserMsg.includes('da bong')) {
    matchProducts = products.filter(p => p.sport_type === 'football' || p.category_slug === 'giay-da-bong');
    sportType = 'football';
    responseText = "Để làm chủ sân cỏ, bạn nên chọn những đôi giày đinh bám sân và ôm chân tốt dưới đây:";
  } else if (lastUserMsg.includes('công sở') || lastUserMsg.includes('tay') || lastUserMsg.includes('oxford') || lastUserMsg.includes('loafer')) {
    matchProducts = products.filter(p => p.category_slug === 'giay-oxford' || p.category_slug === 'giay-loafer' || p.category_slug === 'giay-tay-cong-so');
    sportType = 'formal';
    responseText = "Lịch lãm và trang trọng cho môi trường công sở, đây là các mẫu giày da cao cấp có kiểu dáng sang trọng và êm ái cho cả ngày làm việc:";
  } else {
    // Mặc định hoặc lifestyle
    matchProducts = products.filter(p => p.sport_type === 'lifestyle' || p.category_slug === 'giay-sneaker-co-thap').slice(0, 3);
    responseText = "Chào bạn! Để mang lại sự thoải mái năng động hằng ngày và dễ dàng phối đồ, tôi xin gợi ý cho bạn những mẫu giày Sneaker Lifestyle được yêu thích nhất:";
  }

  // Lọc theo size của user nếu có
  if (userProfile && userProfile.shoe_size_measured) {
    responseText += `\n\nVới kích thước chân đo được của bạn là **Size EU ${userProfile.shoe_size_measured} (${userProfile.foot_length_cm}cm, chân ${userProfile.foot_width === 'wide' ? 'bè rộng' : userProfile.foot_width === 'narrow' ? 'thon gọn' : 'thường'})**, những mẫu này đều rất lý tưởng.`;
    if (userProfile.foot_width === 'wide') {
      responseText += `\n*Lưu ý: Do chân bạn hơi bè ngang, bạn nên cân nhắc chọn tăng 0.5 đến 1 size đối với các mẫu phom ôm sát để có sự thoải mái nhất.*`;
    }
  }

  // Lấy tối đa 3 sản phẩm phù hợp
  const recommendedItems = matchProducts.slice(0, 3);
  recommendedItems.forEach((p, idx) => {
    responseText += `\n${idx + 1}. **${p.name}** (${p.brand_name}) - Giá ưu đãi: ${(p.discount_price || p.price).toLocaleString('vi-VN')}₫`;
  });

  responseText += `\n\nTôi cũng đã thiết kế sẵn một set đồ Outfit năng động đi kèm dưới đây để bạn tham khảo phối đồ cực chất nhé!`;

  const recommended_product_ids = recommendedItems.map(p => p.id);

  // Tạo Outfit phù hợp theo kiểu sport
  let outfit_recommendations = [];
  if (sportType === 'running') {
    outfit_recommendations = [
      { type: "socks", name: "Vớ Chạy Bộ Cổ Thấp Cotton", color: "Trắng xám", reason: "Chất liệu cotton co giãn, dày dặn bảo vệ gót chân" },
      { type: "laces", name: "Dây Giày Dẹt Chuyên Dụng", color: "Cam dạ quang", reason: "Tạo nét thể thao cá tính và phản quang ban đêm" },
      { type: "top", name: "Áo Thun Thể Thao Dri-FIT Running", color: "Xám đen", reason: "Công nghệ thoát ẩm cực nhanh khi vận động" },
      { type: "bottom", name: "Quần Short Thể Thao 2 Lớp Chạy Bộ", color: "Đen", reason: "Lớp lót chống ma sát đùi trong khi sải bước dài" }
    ];
  } else if (sportType === 'formal') {
    outfit_recommendations = [
      { type: "socks", name: "Vớ Lông Cừu Kháng Khuẩn Cổ Cao", color: "Đen tuyền", reason: "Khử mùi hiệu quả, giữ ấm lịch sự khi đi giày Tây" },
      { type: "laces", name: "Dây Giày Tây Tròn Waxed Cotton", color: "Nâu sẫm", reason: "Dây sáp bóng cao cấp bền bỉ, không xù lông" },
      { type: "top", name: "Áo Sơ Mi Oxford Cotton Slimfit", color: "Xanh nhạt", reason: "Phom dáng đứng tôn nét thanh lịch công sở" },
      { type: "bottom", name: "Quần Tây Khaki Dáng Suông", color: "Xám tro", reason: "Vải mềm thoải mái di chuyển và dễ phối đồ" }
    ];
  } else {
    outfit_recommendations = [
      { type: "socks", name: "Vớ Trơn Thể Thao Cổ Trung", color: "Trắng basic", reason: "Thiết kế cơ bản cực kỳ dễ phối đồ với mọi loại Sneaker" },
      { type: "laces", name: "Dây Giày Bản Dẹt Cotton", color: "Trắng sữa", reason: "Màu vintage cổ điển thanh lịch cho giày đi chơi" },
      { type: "top", name: "Áo Thun Oversize Unisex Heavyweight", color: "Đen bóng", reason: "Chất vải dày dặn, năng động chuẩn Streetwear" },
      { type: "bottom", name: "Quần Cargo Pants Nhiều Túi Hộp", color: "Xanh rêu", reason: "Tạo nét bụi bặm phong trần khi xuống phố" }
    ];
  }

  return {
    text: responseText,
    recommended_product_ids,
    outfit_recommendations
  };
}

module.exports = {
  getAIProfile,
  updateFootProfile,
  measureFoot,
  chatWithAI
};
