const db = require('../../config/db');
const { getPagination, buildPagination } = require('../../utils/pagination.util');

const sortableFields = {
  newest: 'p.created_at DESC, p.id DESC',
  popular: 'p.sold_count DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id DESC',
  name_asc: 'p.name ASC, p.id ASC',
  name_desc: 'p.name DESC, p.id DESC'
};

function buildProductSelect() {
  return `
    SELECT
      p.id,
      p.category_id,
      p.brand_id,
      p.name,
      p.slug,
      p.description,
      p.main_image_url,
      COALESCE(MIN(CASE WHEN pv.is_active = true THEN pv.price ELSE NULL END), p.price) AS price,
      MIN(CASE WHEN pv.is_active = true THEN pv.discount_price ELSE NULL END) AS discount_price,
      p.gender,
      p.sport_type,
      p.is_active,
      p.is_featured,
      p.sold_count,
      p.created_at,
      p.updated_at,
      c.name AS category_name,
      c.slug AS category_slug,
      b.name AS brand_name,
      b.logo_url AS brand_logo_url,
      COALESCE(SUM(CASE WHEN pv.is_active = true THEN pv.stock_quantity ELSE 0 END), 0) AS total_stock,
      COALESCE(pr.rating_average, 5.0) AS rating_average,
      COALESCE(pr.rating_count, 0) AS rating_count
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    INNER JOIN brands b ON b.id = p.brand_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    LEFT JOIN (
      SELECT product_id, COUNT(*) AS rating_count, COALESCE(ROUND(AVG(rating), 1), 5.0) AS rating_average
      FROM product_reviews
      GROUP BY product_id
    ) pr ON pr.product_id = p.id
  `;
}

function addFilter(filters, values, condition, value) {
  filters.push(condition);
  values.push(value);
}

function parsePositiveInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildPublicFilters(query) {
  const filters = ['p.is_active = true', 'c.is_active = true', 'b.is_active = true'];
  const values = [];

  if (query.search) {
    addFilter(filters, values, '(p.name LIKE ? OR p.description LIKE ?)', `%${query.search.trim()}%`);
    values.push(`%${query.search.trim()}%`);
  }

  if (query.category_id) {
    const categoryId = parsePositiveInt(query.category_id);
    if (categoryId) {
      addFilter(filters, values, '(p.category_id = ? OR c.parent_id = ?)', categoryId);
      values.push(categoryId);
    }
  }

  if (query.category_slug) {
    addFilter(filters, values, '(c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ? LIMIT 1))', query.category_slug.trim());
    values.push(query.category_slug.trim());
  }

  if (query.brand_id) {
    const brandId = parsePositiveInt(query.brand_id);
    if (brandId) {
      addFilter(filters, values, 'p.brand_id = ?', brandId);
    }
  }

  if (query.brand_name) {
    addFilter(filters, values, 'b.name = ?', query.brand_name.trim());
  }

  if (query.gender) {
    addFilter(filters, values, 'p.gender = ?', query.gender);
  }

  if (query.sport_type) {
    addFilter(filters, values, 'p.sport_type = ?', query.sport_type);
  }

  if (query.featured !== undefined || query.is_featured !== undefined) {
    const rawFeatured = query.featured !== undefined ? query.featured : query.is_featured;
    const isFeatured = rawFeatured === true || rawFeatured === 'true' || rawFeatured === '1' ? 1 : 0;
    addFilter(filters, values, 'p.is_featured = ?', isFeatured);
  }

  return { where: filters.join(' AND '), values };
}

async function getProductVariants(productId) {
  return db.query(
    `
      SELECT id, product_id, sku, size, stock_quantity, low_stock_threshold, is_active
      FROM product_variants
      WHERE product_id = ? AND is_active = true
      ORDER BY CAST(size AS DECIMAL(4,1)) ASC, size ASC, id ASC
    `,
    [productId]
  );
}

async function attachVariants(product) {
  const variants = await getProductVariants(product.id);
  
  if (product.flash_sale && product.flash_sale.status === 'active') {
    const remaining = product.flash_sale.flash_quantity - product.flash_sale.sold_quantity;
    variants.forEach(v => {
      v.stock_quantity = Math.min(v.stock_quantity, remaining);
    });
  }

  return {
    ...product,
    price: Number(product.price || 0),
    discount_price: product.discount_price !== null ? Number(product.discount_price) : null,
    total_stock: Number(product.total_stock || 0),
    available_sizes: variants.filter(item => Number(item.stock_quantity) > 0).map(item => item.size),
    variants
  };
}

async function listPublicProducts(query) {
  const { page, limit, offset } = getPagination(query);
  const { where, values } = buildPublicFilters(query);
  const orderBy = sortableFields[query.sort] || sortableFields.newest;

  const countRows = await db.query(
    `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM products p
      INNER JOIN categories c ON c.id = p.category_id
      INNER JOIN brands b ON b.id = p.brand_id
      WHERE ${where}
    `,
    values
  );

  const products = await db.query(
    `
      ${buildProductSelect()}
      WHERE ${where}
      GROUP BY p.id, c.id, b.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `,
    [...values, limit, offset]
  );

  const total = countRows[0] ? countRows[0].total : 0;

  // Apply active and upcoming flash sale prices to product list
  const activeFlashItems = await db.query(`
    SELECT fsi.product_id, fsi.flash_price, fsi.flash_quantity, fsi.sold_quantity, fs.start_time, fs.end_time,
           CASE 
             WHEN fs.start_time <= NOW() AND fs.end_time >= NOW() THEN 'active'
             ELSE 'upcoming'
           END AS status
    FROM flash_sale_items fsi
    INNER JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
    WHERE fs.is_active = 1 
      AND (
        (fs.start_time <= NOW() AND fs.end_time >= NOW())
        OR (fs.start_time > NOW() AND fs.start_time <= DATE_ADD(NOW(), INTERVAL 24 HOUR))
      )
  `);
  const activeFlashMap = new Map(activeFlashItems.map(item => [item.product_id, item]));

  const mappedItems = products.map(product => {
    let finalDiscountPrice = product.discount_price !== null ? Number(product.discount_price) : null;
    let flashSaleInfo = null;

    if (activeFlashMap.has(product.id)) {
      const flashItem = activeFlashMap.get(product.id);
      flashSaleInfo = {
        status: flashItem.status,
        flash_price: Number(flashItem.flash_price),
        flash_quantity: Number(flashItem.flash_quantity),
        sold_quantity: Number(flashItem.sold_quantity),
        start_time: flashItem.start_time,
        end_time: flashItem.end_time
      };
      if (flashItem.status === 'active') {
        finalDiscountPrice = Number(flashItem.flash_price);
      }
    }

    return {
      ...product,
      price: Number(product.price || 0),
      discount_price: finalDiscountPrice,
      total_stock: Number(product.total_stock || 0),
      rating_average: Number(product.rating_average || 5.0),
      rating_count: Number(product.rating_count || 0),
      sold_count: Number(product.sold_count || 0),
      flash_sale: flashSaleInfo
    };
  });

  return {
    items: mappedItems,
    pagination: buildPagination(page, limit, total)
  };
}

async function getPublicProductBySlug(slug) {
  const product = await db.queryOne(
    `
      ${buildProductSelect()}
      WHERE p.slug = ? AND p.is_active = true AND c.is_active = true AND b.is_active = true
      GROUP BY p.id, c.id, b.id
      LIMIT 1
    `,
    [slug]
  );

  if (!product) {
    throw { status: 404, message: 'Sản phẩm không tồn tại' };
  }

  // Fetch images for the product
  const images = await db.query(
    'SELECT id, image_url, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    [product.id]
  );
  product.images = images;

  // Fetch review statistics
  const stats = await db.queryOne(
    `SELECT COUNT(*) as count, COALESCE(ROUND(AVG(rating), 1), 5.0) as average
     FROM product_reviews
     WHERE product_id = ?`,
    [product.id]
  );
  product.rating_average = stats ? Number(stats.average) : 5.0;
  product.rating_count = stats ? stats.count : 0;

  // Get combo (socks + laces) if not an accessory
  const isAccessory = product.category_slug === 'vo-tat-the-thao' || 
                      product.category_slug === 'day-giay-the-thao' || 
                      product.category_slug === 'lot-giay-the-thao' || 
                      product.category_slug === 'chai-xit-khu-mui';
  if (!isAccessory) {
    product.combo = await getProductCombo(product);
  } else {
    product.combo = null;
  }

  // Check for active or upcoming flash sale for this product
  const flashSale = await db.queryOne(`
    SELECT fsi.flash_price, fsi.flash_quantity, fsi.sold_quantity,
           fs.id AS flash_sale_id, fs.name AS flash_sale_name, fs.start_time, fs.end_time
    FROM flash_sale_items fsi
    INNER JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
    WHERE fsi.product_id = ? AND fs.is_active = 1 AND fs.end_time > NOW()
    ORDER BY fs.start_time ASC
    LIMIT 1
  `, [product.id]);

  if (flashSale) {
    const now = new Date();
    const startTime = new Date(flashSale.start_time);
    const is_active = startTime <= now;
    const is_sold_out = flashSale.sold_quantity >= flashSale.flash_quantity;

    product.flash_sale = {
      id: flashSale.flash_sale_id,
      name: flashSale.flash_sale_name,
      start_time: flashSale.start_time,
      end_time: flashSale.end_time,
      flash_price: Number(flashSale.flash_price),
      flash_quantity: Number(flashSale.flash_quantity),
      sold_quantity: Number(flashSale.sold_quantity),
      status: is_active ? (is_sold_out ? 'sold_out' : 'active') : 'upcoming'
    };

    if (is_active && !is_sold_out) {
      product.discount_price = Number(flashSale.flash_price);
    }
  } else {
    product.flash_sale = null;
  }

  return attachVariants(product);
}


async function getProductCombo(product) {
  let sock = null;

  const getSockSQL = (useBrand) => `
    SELECT p.id, p.category_id, p.brand_id, p.name, p.slug, p.description, p.main_image_url,
           COALESCE(MIN(CASE WHEN pv.is_active = true THEN pv.price ELSE NULL END), p.price) AS price,
           MIN(CASE WHEN pv.is_active = true THEN pv.discount_price ELSE NULL END) AS discount_price
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE c.slug = 'vo-tat-the-thao' AND p.is_active = true AND c.is_active = true
      ${useBrand ? 'AND p.brand_id = ?' : ''}
    GROUP BY p.id, p.category_id, p.brand_id, p.name, p.slug, p.description, p.main_image_url
    LIMIT 1
  `;
  
  const getLaceSQL = (useBrand) => `
    SELECT p.id, p.category_id, p.brand_id, p.name, p.slug, p.description, p.main_image_url,
           COALESCE(MIN(CASE WHEN pv.is_active = true THEN pv.price ELSE NULL END), p.price) AS price,
           MIN(CASE WHEN pv.is_active = true THEN pv.discount_price ELSE NULL END) AS discount_price
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.id
    WHERE c.slug = 'day-giay-the-thao' AND p.is_active = true AND c.is_active = true
      ${useBrand ? 'AND p.brand_id = ?' : ''}
    GROUP BY p.id, p.category_id, p.brand_id, p.name, p.slug, p.description, p.main_image_url
    LIMIT 1
  `;

  // Find sock of same brand first
  const sameBrandSocks = await db.query(getSockSQL(true), [product.brand_id]);
  if (sameBrandSocks && sameBrandSocks.length > 0) {
    sock = sameBrandSocks[0];
  } else {
    const anySocks = await db.query(getSockSQL(false));
    if (anySocks && anySocks.length > 0) sock = anySocks[0];
  }
  
  // Find lace of same brand first
  const sameBrandLaces = await db.query(getLaceSQL(true), [product.brand_id]);
  if (sameBrandLaces && sameBrandLaces.length > 0) {
    lace = sameBrandLaces[0];
  } else {
    const anyLaces = await db.query(getLaceSQL(false));
    if (anyLaces && anyLaces.length > 0) lace = anyLaces[0];
  }

  if (!sock || !lace) {
    return null;
  }

  // Make prices Numbers
  sock.price = Number(sock.price);
  sock.discount_price = sock.discount_price !== null ? Number(sock.discount_price) : null;
  lace.price = Number(lace.price);
  lace.discount_price = lace.discount_price !== null ? Number(lace.discount_price) : null;

  const shoePrice = product.discount_price !== null ? product.discount_price : product.price;
  const sockPrice = sock.discount_price !== null ? sock.discount_price : sock.price;
  const lacePrice = lace.discount_price !== null ? lace.discount_price : lace.price;

  const originalTotal = shoePrice + sockPrice + lacePrice;
  const comboTotal = Math.round(originalTotal * 0.85); // 15% discount
  const discountAmount = originalTotal - comboTotal;

  // Fetch variants for sock and lace
  const sockVariants = await getProductVariants(sock.id);
  const laceVariants = await getProductVariants(lace.id);

  sock.variants = sockVariants;
  sock.available_sizes = sockVariants.filter(v => Number(v.stock_quantity) > 0).map(v => v.size);
  
  lace.variants = laceVariants;
  lace.available_sizes = laceVariants.filter(v => Number(v.stock_quantity) > 0).map(v => v.size);

  return {
    socks: sock,
    laces: lace,
    original_total: originalTotal,
    combo_total: comboTotal,
    discount_amount: discountAmount,
    discount_percent: 15
  };
}

module.exports = {
  listPublicProducts,
  getPublicProductBySlug,
  getProductVariants
};
