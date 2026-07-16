const fs = require('fs');
const path = require('path');
const db = require('../config/db');
require('dotenv').config();

const rootDir = path.join(__dirname, '../../../frontend/Giày thể thao/Giày thể thao');
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

// Extract base product name without color suffix
function getProductName(candName) {
  let name = candName;
  if (name.includes(' - ')) {
    name = name.split(' - ')[0];
  } else if (name.includes(' -')) {
    name = name.split(' -')[0];
  }
  return name.trim();
}

// Brand name resolution (handles Pickleball directory specific brands)
function detectBrandName(brandFolder, candDirName) {
  if (brandFolder === 'Giày PickleBall') {
    if (candDirName.toLowerCase().includes('asics')) return 'Asics';
    if (candDirName.toLowerCase().includes('nike')) return 'Nike';
  }
  return brandFolder.replace('Giày ', '').trim();
}

// Map product name to subcategory and sport_type
function getCategoryAndSport(name) {
  const lower = name.toLowerCase();
  if (lower.includes('adizero') || lower.includes('speed') || lower.includes('duramo') || lower.includes('run') || lower.includes('pureboost') || lower.includes('ultrarun') || lower.includes('aviator') || lower.includes('scend') || lower.includes('supercross') || lower.includes('gel-kayano') || lower.includes('wave rider') || lower.includes('pegasus') || lower.includes('journey') || lower.includes('revolution') || lower.includes('winflo') || lower.includes('structure') || lower.includes('vomero')) {
    return { categoryId: 4, sportType: 'running' }; // Giày Chạy Bộ
  }
  if (lower.includes('bóng rổ') || lower.includes('basketball') || lower.includes('jordan') || lower.includes('curry')) {
    return { categoryId: 5, sportType: 'basketball' }; // Giày Bóng Rổ
  }
  if (lower.includes('đá bóng') || lower.includes('football') || lower.includes('soccer') || lower.includes('mercurial') || lower.includes('predator')) {
    return { categoryId: 6, sportType: 'football' }; // Giày Đá Bóng
  }
  if (lower.includes('tập luyện') || lower.includes('training') || lower.includes('flex') || lower.includes('hybrid') || lower.includes('x-cell') || lower.includes('pwr')) {
    return { categoryId: 7, sportType: 'training' }; // Giày Tập Luyện
  }
  if (lower.includes('tennis') || lower.includes('pickleball') || lower.includes('court') || lower.includes('dedicate') || lower.includes('challenger') || lower.includes('resolution') || lower.includes('solution') || lower.includes('vapor') || lower.includes('gp challenge')) {
    return { categoryId: 8, sportType: 'tennis' }; // Giày Tennis
  }
  return { categoryId: 9, sportType: 'lifestyle' }; // Giày Sneaker Thể Thao
}

// Generate realistic prices
function generatePrice(brandClean) {
  const brand = brandClean.toLowerCase();
  let base = 1800000;
  let max = 3200000;
  if (brand.includes('nike')) {
    base = 2200000;
    max = 3800000;
  } else if (brand.includes('adidas')) {
    base = 1900000;
    max = 3400000;
  } else if (brand.includes('lacoste')) {
    base = 2600000;
    max = 4200000;
  } else if (brand.includes('asics')) {
    base = 2000000;
    max = 3500000;
  } else if (brand.includes('puma')) {
    base = 1300000;
    max = 2400000;
  }
  
  const randomVal = base + Math.floor(Math.random() * ((max - base) / 50000)) * 50000;
  return randomVal;
}

// Determine gender
function getGender(genderFolder, candDirName) {
  const lower = (genderFolder + ' ' + candDirName).toLowerCase();
  if (lower.includes('unisex')) return 'unisex';
  if (lower.includes('nữ') || lower.includes('female')) return 'female';
  if (lower.includes('nam') || lower.includes('male')) return 'male';
  return 'unisex';
}

// Ask Gemini for descriptions in batch to be highly efficient
async function generateDescriptions(models) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_gemini_api_key') {
    console.log('Gemini API key is not set. Using local description generator.');
    return {};
  }

  console.log(`Generating descriptions for ${models.length} unique shoe models using Gemini...`);
  const descriptions = {};
  
  // We chunk them in sets of 20 to avoid large prompts/timeouts
  const chunkSize = 20;
  for (let i = 0; i < models.length; i += chunkSize) {
    const chunk = models.slice(i, i + chunkSize);
    const prompt = `You are a professional copywriter for a high-end sports shoe store "Shoes Store".
Write a compelling, professional, and SEO-friendly product description in Vietnamese (2-3 sentences, 40-60 words) for each of the following shoe models. The descriptions must highlight their design, comfort, and athletic benefits.

List of shoe models:
${chunk.map(m => `- ${m}`).join('\n')}

Format your response strictly as a JSON object where the keys are the exact model names provided above and the values are the generated Vietnamese descriptions. Do not include markdown code block characters like \`\`\`json, just return the raw JSON object.`;

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
      
      // Clean potential JSON markdown wraps
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
      // Fallback description will be generated dynamically during insertion
    }
  }

  return descriptions;
}

// Walk folder tree to scan shoe items
function scanShoes() {
  if (!fs.existsSync(rootDir)) {
    console.error(`Folder not found: ${rootDir}`);
    process.exit(1);
  }

  const brands = fs.readdirSync(rootDir).filter(f => fs.statSync(path.join(rootDir, f)).isDirectory());
  const products = [];

  for (const brandFolder of brands) {
    const brandPath = path.join(rootDir, brandFolder);
    const genders = fs.readdirSync(brandPath).filter(f => fs.statSync(path.join(brandPath, f)).isDirectory());

    for (const genderFolder of genders) {
      const genderPath = path.join(brandPath, genderFolder);
      const candidates = fs.readdirSync(genderPath).filter(f => fs.statSync(path.join(genderPath, f)).isDirectory());

      for (const candDirName of candidates) {
        const candPath = path.join(genderPath, candDirName);
        const children = fs.readdirSync(candPath).filter(f => fs.statSync(path.join(candPath, f)).isDirectory());
        
        // Check if color subdirectories exist inside
        const hasColors = children.some(c => c.toLowerCase() !== 'size giày' && c.toLowerCase() !== 'size  giày');
        const resolvedBrand = detectBrandName(brandFolder, candDirName);
        const cleanProductName = getProductName(candDirName);
        const gender = getGender(genderFolder, candDirName);

        if (hasColors) {
          const colors = children.filter(c => c.toLowerCase() !== 'size giày' && c.toLowerCase() !== 'size  giày');
          const colorList = colors.map(col => {
            const colPath = path.join(candPath, col);
            const files = fs.readdirSync(colPath);
            return {
              colorName: col,
              folderPath: colPath,
              images: files.filter(f => !fs.statSync(path.join(colPath, f)).isDirectory() && ['.jpg', '.jpeg', '.png'].includes(path.extname(f).toLowerCase()))
            };
          });

          products.push({
            name: cleanProductName,
            brand: resolvedBrand,
            gender,
            hasColors: true,
            colorList
          });
        } else {
          // Single color. Detect color from product folder name
          let colorName = null;
          if (candDirName.includes(' - ')) {
            colorName = candDirName.split(' - ')[1].trim();
          } else if (candDirName.includes(' -')) {
            colorName = candDirName.split(' -')[1].trim();
          }

          const files = fs.readdirSync(candPath);
          products.push({
            name: cleanProductName,
            brand: resolvedBrand,
            gender,
            hasColors: false,
            colorList: [{
              colorName: colorName || 'Tiêu Chuẩn',
              folderPath: candPath,
              images: files.filter(f => !fs.statSync(path.join(candPath, f)).isDirectory() && ['.jpg', '.jpeg', '.png'].includes(path.extname(f).toLowerCase()))
            }]
          });
        }
      }
    }
  }

  return products;
}

// Ingestion entry point
async function main() {
  console.log('--- STARTING SHOE DATABASE INGESTION ---');
  
  // Ensure uploads/products folder exists
  fs.mkdirSync(destDir, { recursive: true });

  const productsList = scanShoes();
  console.log(`Scanned ${productsList.length} products from the file system.`);

  // Get unique model names to fetch descriptions in batch
  const uniqueModels = [...new Set(productsList.map(p => p.name))];
  const geminiDescriptions = await generateDescriptions(uniqueModels);

  let brandsCreated = 0;
  let productsImported = 0;
  let variantsCreated = 0;
  let imagesCopied = 0;

  // Cache of brand IDs to save DB calls
  const brandIdsMap = {};

  try {
    for (const prod of productsList) {
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

      // 2. Resolve Category & Sport Type
      const { categoryId, sportType } = getCategoryAndSport(prod.name);

      // 3. Resolve Description
      let description = geminiDescriptions[prod.name];
      if (!description) {
        description = `Dòng giày ${prod.name} chính hãng từ thương hiệu ${prod.brand}. Sản phẩm sở hữu thiết kế năng động, chất liệu cao cấp bền bỉ cùng đệm đế cực kỳ êm ái hỗ trợ tối đa cho các hoạt động thể thao hằng ngày.`;
      }

      // 4. Generate retail price
      const price = generatePrice(prod.brand);

      // 5. Generate SEO Slug and avoid collisions
      let baseSlug = toSlug(prod.name);
      let slug = baseSlug;
      let counter = 2;
      while (true) {
        const existing = await db.queryOne('SELECT id FROM products WHERE slug = ?', [slug]);
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // 6. Copy main product image (use first image of first color)
      let mainImageUrl = null;
      const firstColor = prod.colorList[0];
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

      // 7. Insert Product into `products`
      const prodResult = await db.query(
        `INSERT INTO products (
          category_id, brand_id, name, slug, description, main_image_url, 
          gender, sport_type, price, is_active, is_featured, sold_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
        [
          categoryId,
          brandId,
          prod.name,
          slug,
          description,
          mainImageUrl,
          prod.gender,
          sportType,
          price,
          Math.floor(Math.random() * 50) // random sold count for realism
        ]
      );
      const productId = prodResult.insertId;
      productsImported++;

      // 8. Process Colors & Images & Variants
      let imageSortOrder = 0;
      for (const col of prod.colorList) {
        // A. Copy and insert all images
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

        // B. Generate sizes based on gender
        let sizes = ['39', '40', '41', '42', '43', '44']; // default male
        if (prod.gender === 'female') {
          sizes = ['36', '37', '38', '39', '40'];
        } else if (prod.gender === 'unisex') {
          sizes = ['36', '37', '38', '39', '40', '41', '42', '43', '44'];
        }

        // C. Insert variant for each size
        for (const size of sizes) {
          const colorSlug = toSlug(col.colorName);
          const shortModel = toSlug(prod.name.replace('Giày', '').trim()).substring(0, 15);
          const sku = `${prod.brand.substring(0,3).toUpperCase()}-${shortModel}-${colorSlug}-${size}`.toUpperCase();
          
          // Double check SKU uniqueness
          let uniqueSku = sku;
          let skuCounter = 1;
          while (true) {
            const existingSku = await db.queryOne('SELECT id FROM product_variants WHERE sku = ?', [uniqueSku]);
            if (!existingSku) break;
            uniqueSku = `${sku}-${skuCounter++}`;
          }

          const stock = 5 + Math.floor(Math.random() * 20); // random stock 5 to 24

          // Optional discount on price for 20% of the variants for realism
          const hasDiscount = Math.random() < 0.2;
          const discountPrice = hasDiscount ? Math.round((price * 0.85) / 10000) * 10000 : null;

          await db.query(
            `INSERT INTO product_variants (
              product_id, sku, color, size, price, discount_price, stock_quantity, low_stock_threshold, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 3, 1)`,
            [
              productId,
              uniqueSku,
              col.colorName === 'Tiêu Chuẩn' ? null : col.colorName,
              size,
              price,
              discountPrice,
              stock
            ]
          );
          variantsCreated++;
        }
      }
      
      if (productsImported % 10 === 0) {
        console.log(`Imported ${productsImported} products...`);
      }
    }

    console.log('\n--- INGESTION COMPLETE ---');
    console.log(`Brands created: ${brandsCreated}`);
    console.log(`Products imported: ${productsImported}`);
    console.log(`Images copied & registered: ${imagesCopied}`);
    console.log(`Variants created: ${variantsCreated}`);

  } catch (err) {
    console.error('Fatal error during ingestion:', err);
  } finally {
    db.pool.end();
  }
}

if (require.main === module) {
  main();
}
