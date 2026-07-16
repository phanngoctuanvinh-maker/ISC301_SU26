const fs = require('fs');
const path = require('path');
const db = require('../config/db');
require('dotenv').config();

const rootDir = path.join(__dirname, '../../../frontend/.agents/Phụ kiện');
const destDir = path.join(__dirname, '../../uploads/products');

// Helper to convert string to slug
function toSlug(str) {
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/[^a-z0-9\s-]/g, '');
  str = str.replace(/\s+/g, '-');
  str = str.replace(/-+/g, '-');
  return str.trim();
}

// Brand list to detect
const knownBrands = [
  'Nike', 'Adidas', 'Puma', 'Reebok', 'Jordan', 
  'Under Armour', 'Asics', 'New Balance', 'Mizuno', 'Salomon', 
  'Skechers', 'Fila', 'Converse', 'Vans', 'Li-Ning',
  'Sofsole', 'Ligpro', 'Taro', 'Zocker', 'DevSport', 
  '2XU', 'Bahe Studio', 'Balega', 'HOKA'
];

function detectBrandName(name) {
  const lower = name.toLowerCase();
  for (const b of knownBrands) {
    if (lower.includes(b.toLowerCase())) {
      return b;
    }
  }
  return 'Khác';
}

function detectColorFromFilename(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('-den') || lower.includes('_den') || lower.includes(' den') || lower.includes('black')) return 'Đen';
  if (lower.includes('-trang') || lower.includes('_trang') || lower.includes(' trang') || lower.includes('white')) return 'Trắng';
  if (lower.includes('-xam') || lower.includes('_xam') || lower.includes(' xam') || lower.includes('grey') || lower.includes('gray')) return 'Xám';
  if (lower.includes('-do') || lower.includes('_do') || lower.includes(' do') || lower.includes('red')) return 'Đỏ';
  if (lower.includes('-vang') || lower.includes('_vang') || lower.includes(' vang') || lower.includes('yellow')) return 'Vàng';
  if (lower.includes('-cam') || lower.includes('_cam') || lower.includes(' cam') || lower.includes('orange')) return 'Cam';
  if (lower.includes('xanh-la') || lower.includes('xanhla') || lower.includes('green')) return 'Xanh Lá';
  if (lower.includes('xanh-duong') || lower.includes('xanhduong') || lower.includes('blue')) return 'Xanh Dương';
  return null;
}

function parseProductColors(productPath, productName) {
  const items = fs.readdirSync(productPath);
  const subdirs = items.filter(f => {
    const stat = fs.statSync(path.join(productPath, f));
    if (!stat.isDirectory()) return false;
    const lower = f.toLowerCase();
    return lower !== 'size' && !lower.includes('size giày') && !lower.includes('kích thước');
  });

  if (subdirs.length > 0) {
    // We have color subdirectories!
    const colorList = [];
    for (const s of subdirs) {
      const colorPath = path.join(productPath, s);
      const files = fs.readdirSync(colorPath);
      const images = files.filter(f => {
        const isDir = fs.statSync(path.join(colorPath, f)).isDirectory();
        return !isDir && ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(path.extname(f).toLowerCase());
      });
      colorList.push({
        colorName: s,
        folderPath: colorPath,
        images: images
      });
    }
    return colorList;
  }

  // No color subdirectories. We look at the files in the directory
  const files = items.filter(f => {
    const isDir = fs.statSync(path.join(productPath, f)).isDirectory();
    return !isDir && ['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(path.extname(f).toLowerCase());
  });

  // Check folder name color suffix
  let folderColor = null;
  if (productName.includes(' - ')) {
    const parts = productName.split(' - ');
    folderColor = parts[parts.length - 1].trim();
  }

  // Check file-level colors
  const colorMap = {};
  for (const file of files) {
    const detected = detectColorFromFilename(file);
    if (detected) {
      if (!colorMap[detected]) colorMap[detected] = [];
      colorMap[detected].push(file);
    }
  }

  const detectedColors = Object.keys(colorMap);
  if (detectedColors.length > 1) {
    return detectedColors.map(c => ({
      colorName: c,
      folderPath: productPath,
      images: colorMap[c]
    }));
  }

  const resolvedColor = folderColor || (detectedColors.length === 1 ? detectedColors[0] : 'Tiêu Chuẩn');
  return [{
    colorName: resolvedColor,
    folderPath: productPath,
    images: files
  }];
}

function generateAccessoryPrice(name, brand, categorySlug) {
  const lowerName = name.toLowerCase();
  const lowerBrand = brand.toLowerCase();
  
  if (categorySlug === 'chai-xit-khu-mui' || categorySlug === 'chai-xit-ve-sinh-giay') {
    if (lowerBrand.includes('sofsole')) return 160000;
    if (lowerBrand.includes('zocker')) return 120000;
    if (lowerBrand.includes('ligpro')) return 85000;
    if (lowerBrand.includes('taro')) return 95000;
    return 80000;
  }
  
  // Socks
  if (lowerBrand.includes('2xu')) return 240000;
  if (lowerBrand.includes('nike') || lowerBrand.includes('adidas') || lowerBrand.includes('under armour') || lowerBrand.includes('hoka')) {
    if (lowerName.includes('3-pack') || lowerName.includes('3 pairs') || lowerName.includes('3 pack')) {
      return 290000;
    }
    if (lowerName.includes('6-pack') || lowerName.includes('6 pack')) {
      return 450000;
    }
    return 150000;
  }
  if (lowerBrand.includes('balega')) return 180000;
  if (lowerBrand.includes('bahe')) return 120000;
  if (lowerBrand.includes('zocker')) return 50000;
  if (lowerBrand.includes('sofsole')) return 90000;
  
  return 60000;
}

// Ask Gemini for descriptions in batch to be highly efficient
async function generateDescriptions(models) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key') {
    console.log('Gemini API key is not set. Using local description generator.');
    return {};
  }

  console.log(`Generating descriptions for ${models.length} unique accessory models using Gemini...`);
  const descriptions = {};
  
  const chunkSize = 20;
  for (let i = 0; i < models.length; i += chunkSize) {
    const chunk = models.slice(i, i + chunkSize);
    const prompt = `You are a professional copywriter for a high-end sports shoe and accessories store "Shoes Store".
Write a compelling, professional, and SEO-friendly product description in Vietnamese (2-3 sentences, 40-60 words) for each of the following sports accessories. The descriptions must highlight their quality, benefits, and usage.

List of products:
${chunk.map(m => `- ${m}`).join('\n')}

Format your response strictly as a JSON object where the keys are the exact product names provided above and the values are the generated Vietnamese descriptions. Do not include markdown code block characters like \`\`\`json, just return the raw JSON object.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const resData = await response.json();
      let rawText = resData.candidates[0].content.parts[0].text.trim();
      
      if (rawText.startsWith('```json')) {
        rawText = rawText.substring(7);
      }
      if (rawText.endsWith('```')) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
      
      const parsed = JSON.parse(rawText.trim());
      Object.assign(descriptions, parsed);
      console.log(`Successfully generated descriptions for chunk ${Math.floor(i / chunkSize) + 1}`);
    } catch (err) {
      console.error(`Error generating descriptions for chunk ${Math.floor(i / chunkSize) + 1}:`, err.message);
    }
  }

  return descriptions;
}

async function main() {
  console.log('--- STARTING ACCESSORIES DATABASE INGESTION ---');

  if (!fs.existsSync(rootDir)) {
    console.error(`Directory not found: ${rootDir}`);
    process.exit(1);
  }

  // Ensure dest directory exists
  fs.mkdirSync(destDir, { recursive: true });

  // Resolve Categories from database or create if missing
  const parentCat = await db.queryOne("SELECT id FROM categories WHERE slug = 'phu-kien'");
  const parentId = parentCat ? parentCat.id : 2;

  let cleanCat = await db.queryOne("SELECT id FROM categories WHERE slug = 'chai-xit-ve-sinh-giay'");
  let cleanCatId;
  if (!cleanCat) {
    console.log('Creating category: Chai Xịt Vệ Sinh Giày...');
    const result = await db.query(
      `INSERT INTO categories (parent_id, name, slug, image_url, sort_order, is_active) 
       VALUES (?, 'Chai Xịt Vệ Sinh Giày', 'chai-xit-ve-sinh-giay', '/uploads/categories/chai-xit-ve-sinh-giay.png', 5, 1)`,
      [parentId]
    );
    cleanCatId = result.insertId;
  } else {
    cleanCatId = cleanCat.id;
  }

  const categoryMap = {
    'Bình xịt khử mùi': { slug: 'chai-xit-khu-mui', id: 13 },
    'Bình xịt vệ sinh giày': { slug: 'chai-xit-ve-sinh-giay', id: cleanCatId },
    'Tất vớ': { slug: 'vo-tat-the-thao', id: 10 }
  };

  const productsToImport = [];

  // Scan items
  const mainFolders = fs.readdirSync(rootDir).filter(f => fs.statSync(path.join(rootDir, f)).isDirectory());

  for (const folder of mainFolders) {
    const folderPath = path.join(rootDir, folder);
    
    if (folder === 'Tất vớ') {
      const genders = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isDirectory());
      for (const gender of genders) {
        if (gender === 'Size giày hướng dẫn kích thước') continue;
        
        const genderPath = path.join(folderPath, gender);
        const items = fs.readdirSync(genderPath).filter(f => fs.statSync(path.join(genderPath, f)).isDirectory());
        
        for (const item of items) {
          if (item === 'Size giày hướng dẫn kích thước') continue;
          
          const itemPath = path.join(genderPath, item);
          const brand = detectBrandName(item);
          const catInfo = categoryMap['Tất vớ'];
          const genderValue = gender === 'Nam' ? 'male' : 'female';
          
          productsToImport.push({
            name: item,
            brand,
            categorySlug: catInfo.slug,
            categoryId: catInfo.id,
            gender: genderValue,
            itemPath
          });
        }
      }
    } else if (folder === 'Bình xịt khử mùi' || folder === 'Bình xịt vệ sinh giày') {
      const items = fs.readdirSync(folderPath).filter(f => fs.statSync(path.join(folderPath, f)).isDirectory());
      
      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const brand = detectBrandName(item);
        const catInfo = categoryMap[folder];
        
        productsToImport.push({
          name: item,
          brand,
          categorySlug: catInfo.slug,
          categoryId: catInfo.id,
          gender: 'unisex',
          itemPath
        });
      }
    }
  }

  console.log(`Scanned ${productsToImport.length} accessories from directories.`);

  // Generate descriptions in batch
  const uniqueNames = [...new Set(productsToImport.map(p => p.name))];
  const geminiDescriptions = await generateDescriptions(uniqueNames);

  let brandsCreated = 0;
  let productsImported = 0;
  let variantsCreated = 0;
  let imagesCopied = 0;

  const brandIdsMap = {};

  for (const prod of productsToImport) {
    // 1. Resolve Brand ID
    const brandKey = prod.brand.toLowerCase();
    let brandId = brandIdsMap[brandKey];
    if (!brandId) {
      let brandDb = await db.queryOne('SELECT id FROM brands WHERE LOWER(name) = ?', [brandKey]);
      if (brandDb) {
        brandId = brandDb.id;
      } else {
        const brandSlug = toSlug(prod.brand);
        const logoUrl = `/uploads/brands/${brandSlug}-logo.png`;
        const desc = `Thương hiệu thể thao ${prod.brand} nổi tiếng toàn cầu.`;
        const result = await db.query(
          'INSERT INTO brands (name, logo_url, description, is_active) VALUES (?, ?, ?, ?)',
          [prod.brand, logoUrl, desc, true]
        );
        brandId = result.insertId;
        brandsCreated++;
        console.log(`Created missing brand: ${prod.brand} (ID: ${brandId})`);
      }
      brandIdsMap[brandKey] = brandId;
    }

    // 2. Parse color variants
    const colors = parseProductColors(prod.itemPath, prod.name);

    // 3. Resolve Description
    let description = geminiDescriptions[prod.name];
    if (!description) {
      if (prod.categorySlug.includes('xit')) {
        description = `Sản phẩm ${prod.name} chính hãng từ thương hiệu ${prod.brand}. Giúp làm sạch, khử mùi hôi hiệu quả, kháng khuẩn vượt trội và lưu hương thơm mát lâu dài cho đôi giày của bạn.`;
      } else {
        description = `Vớ/Tất thể thao ${prod.name} chính hãng từ thương hiệu ${prod.brand}. Thiết kế ôm sát, chất liệu vải cao cấp co giãn, thấm hút mồ hôi cực tốt mang lại cảm giác thông thoáng, êm ái suốt ngày dài năng động.`;
      }
    }

    // 4. Generate retail price
    const price = generateAccessoryPrice(prod.name, prod.brand, prod.categorySlug);

    // 5. Generate SEO Slug
    let baseSlug = toSlug(prod.name);
    let slug = baseSlug;
    let counter = 2;
    while (true) {
      const existing = await db.queryOne('SELECT id FROM products WHERE slug = ?', [slug]);
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 6. Copy main product image (first image of first color)
    let mainImageUrl = null;
    const firstColor = colors[0];
    if (firstColor && firstColor.images.length > 0) {
      const firstImg = firstColor.images[0];
      const srcPath = path.join(firstColor.folderPath, firstImg);
      const destPath = path.join(destDir, firstImg);
      
      try {
        fs.copyFileSync(srcPath, destPath);
        mainImageUrl = `/uploads/products/${firstImg}`;
        imagesCopied++;
      } catch (copyErr) {
        console.error(`Failed to copy main image ${firstImg}:`, copyErr.message);
      }
    }

    // 7. Insert Product
    const prodResult = await db.query(
      `INSERT INTO products (
        category_id, brand_id, name, slug, description, main_image_url, 
        gender, sport_type, price, is_active, is_featured, sold_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 1, 0, ?)`,
      [
        prod.categoryId,
        brandId,
        prod.name,
        slug,
        description,
        mainImageUrl,
        prod.gender,
        price,
        Math.floor(Math.random() * 80) + 10 // random sold count
      ]
    );
    const productId = prodResult.insertId;
    productsImported++;

    // 8. Process variants (Color & Size)
    let imageSortOrder = 0;
    for (const col of colors) {
      // A. Copy and insert all images for this color
      for (const img of col.images) {
        const srcPath = path.join(col.folderPath, img);
        const destPath = path.join(destDir, img);
        
        if (srcPath !== destPath && fs.existsSync(srcPath)) {
          try {
            fs.copyFileSync(srcPath, destPath);
            const imageUrl = `/uploads/products/${img}`;
            await db.query(
              'INSERT INTO product_images (product_id, image_url, sort_order) VALUES (?, ?, ?)',
              [productId, imageUrl, imageSortOrder++]
            );
            imagesCopied++;
          } catch (copyErr) {
            console.error(`Failed to copy image ${img}:`, copyErr.message);
          }
        }
      }

      // B. Insert single variant of size 'Standard'
      const colorSlug = toSlug(col.colorName);
      const shortName = toSlug(prod.name.substring(0, 15));
      const sku = `${prod.brand.substring(0,3).toUpperCase()}-${shortName}-${colorSlug}-STD`.toUpperCase();
      
      let uniqueSku = sku;
      let skuCounter = 1;
      while (true) {
        const existingSku = await db.queryOne('SELECT id FROM product_variants WHERE sku = ?', [uniqueSku]);
        if (!existingSku) break;
        uniqueSku = `${sku}-${skuCounter++}`;
      }

      const stock = 15 + Math.floor(Math.random() * 40); // 15 to 54
      const hasDiscount = Math.random() < 0.25;
      const discountPrice = hasDiscount ? Math.round((price * 0.85) / 5000) * 5000 : null;

      await db.query(
        `INSERT INTO product_variants (
          product_id, sku, color, size, price, discount_price, stock_quantity, low_stock_threshold, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 5, 1)`,
        [
          productId,
          uniqueSku,
          col.colorName === 'Tiêu Chuẩn' ? null : col.colorName,
          'Standard',
          price,
          discountPrice,
          stock
        ]
      );
      variantsCreated++;
    }

    if (productsImported % 5 === 0) {
      console.log(`Imported ${productsImported} accessories...`);
    }
  }

  console.log('\n--- INGESTION COMPLETE ---');
  console.log(`Brands created: ${brandsCreated}`);
  console.log(`Products imported: ${productsImported}`);
  console.log(`Images copied & registered: ${imagesCopied}`);
  console.log(`Variants created: ${variantsCreated}`);
  
  db.pool.end();
}

main().catch(err => {
  console.error('Fatal error during ingestion:', err);
  db.pool.end();
});
