const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';

const state = {
  insertId: 10,
  categories: [
    { id: 1, parent_id: null, name: 'Shoes', slug: 'shoes', image_url: null, sort_order: 1, is_active: 1 },
    { id: 2, parent_id: 1, name: 'Running', slug: 'running', image_url: null, sort_order: 1, is_active: 1 }
  ],
  brands: [
    { id: 1, name: 'Nike', logo_url: null, description: 'Nike brand', is_active: 1 }
  ],
  products: [
    {
      id: 1,
      category_id: 2,
      brand_id: 1,
      name: 'Nike Runner',
      slug: 'nike-runner',
      description: 'Daily running shoe',
      main_image_url: '/uploads/products/nike-runner.png',
      gender: 'unisex',
      sport_type: 'running',
      is_active: 1,
      is_featured: 1,
      sold_count: 5,
      created_at: '2026-06-17T00:00:00.000Z',
      updated_at: '2026-06-17T00:00:00.000Z'
    },
    {
      id: 2,
      category_id: 2,
      brand_id: 1,
      name: 'Hidden Shoe',
      slug: 'hidden-shoe',
      description: 'Inactive',
      main_image_url: null,
      gender: 'male',
      sport_type: 'running',
      is_active: 0,
      is_featured: 0,
      sold_count: 1,
      created_at: '2026-06-17T00:00:00.000Z',
      updated_at: '2026-06-17T00:00:00.000Z'
    }
  ]
};

function productRow(product) {
  const category = state.categories.find(item => item.id === product.category_id);
  const brand = state.brands.find(item => item.id === product.brand_id);
  return {
    ...product,
    category_name: category && category.name,
    category_slug: category && category.slug,
    brand_name: brand && brand.name,
    brand_logo_url: brand && brand.logo_url
  };
}

const mockDb = {
  pool: {},
  async query(sql, params = []) {
    const compactSql = sql.replace(/\s+/g, ' ').trim();

    if (compactSql.includes('FROM products p') && compactSql.includes('COUNT(*) AS total')) {
      return [{ total: state.products.filter(product => product.is_active).length }];
    }

    if (compactSql.includes('FROM products p') && compactSql.includes('ORDER BY') && compactSql.includes('LIMIT')) {
      return state.products.filter(product => product.is_active).map(productRow);
    }

    if (compactSql.includes('INSERT INTO products')) {
      const product = {
        id: state.insertId++,
        category_id: Number(params[0]),
        brand_id: Number(params[1]),
        name: params[2],
        slug: params[3],
        description: params[4],
        main_image_url: params[5],
        gender: params[6],
        sport_type: params[7],
        is_active: 1,
        is_featured: params[8],
        sold_count: 0,
        created_at: '2026-06-18T00:00:00.000Z',
        updated_at: '2026-06-18T00:00:00.000Z'
      };
      state.products.push(product);
      return { insertId: product.id };
    }

    if (compactSql.startsWith('UPDATE products SET is_active')) {
      const product = state.products.find(item => item.id === Number(params[1]));
      product.is_active = params[0];
      return { affectedRows: 1 };
    }

    if (compactSql.startsWith('UPDATE products SET')) {
      return { affectedRows: 1 };
    }

    return [];
  },
  async queryOne(sql, params = []) {
    const compactSql = sql.replace(/\s+/g, ' ').trim();

    if (compactSql.includes('FROM categories WHERE id = ?')) {
      return state.categories.find(category => category.id === Number(params[0])) || null;
    }

    if (compactSql.includes('FROM brands WHERE id = ?')) {
      return state.brands.find(brand => brand.id === Number(params[0])) || null;
    }

    if (compactSql.includes('FROM products WHERE slug = ?')) {
      return state.products.find(product => product.slug === params[0]) || null;
    }

    if (compactSql.includes('FROM products WHERE slug = ? AND id != ?')) {
      return state.products.find(product => product.slug === params[0] && product.id !== Number(params[1])) || null;
    }

    if (compactSql.includes('FROM products p') && compactSql.includes('WHERE p.slug = ?')) {
      const product = state.products.find(item => item.slug === params[0] && item.is_active);
      return product ? productRow(product) : null;
    }

    if (compactSql.includes('FROM products p') && compactSql.includes('WHERE p.id = ?')) {
      const product = state.products.find(item => item.id === Number(params[0]));
      return product ? productRow(product) : null;
    }

    return null;
  }
};

const dbPath = path.resolve(__dirname, '../src/config/db.js');
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: mockDb
};

const { createApp } = require('../src/app');

function request(app, method, route, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const payload = body ? JSON.stringify(body) : null;
      const options = {
        method,
        port: server.address().port,
        path: route,
        headers: {
          ...headers,
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      };

      const req = http.request(options, res => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          server.close();
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null
          });
        });
      });

      req.on('error', err => {
        server.close();
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

test('GET /api/products returns active products with pagination', async () => {
  const app = createApp();
  const response = await request(app, 'GET', '/api/products?limit=10');

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.items.length, 1);
  assert.equal(response.body.data.items[0].slug, 'nike-runner');
  assert.equal(response.body.data.pagination.total, 1);
});

test('GET /api/products/:slug returns product detail and hides inactive products', async () => {
  const app = createApp();
  const found = await request(app, 'GET', '/api/products/nike-runner');
  const hidden = await request(app, 'GET', '/api/products/hidden-shoe');

  assert.equal(found.status, 200);
  assert.equal(found.body.data.brand_name, 'Nike');
  assert.equal(hidden.status, 404);
});

test('admin product routes require admin role and create products with insertId', async () => {
  const app = createApp();
  const customerToken = jwt.sign({ userId: 2, email: 'user@example.com', role: 'customer' }, process.env.JWT_SECRET);
  const adminToken = jwt.sign({ userId: 1, email: 'admin@example.com', role: 'admin' }, process.env.JWT_SECRET);

  const forbidden = await request(app, 'POST', '/api/admin/products', {
    category_id: 2,
    brand_id: 1,
    name: 'Customer Product'
  }, { Authorization: `Bearer ${customerToken}` });

  const created = await request(app, 'POST', '/api/admin/products', {
    category_id: 2,
    brand_id: 1,
    name: 'Admin Product',
    gender: 'unisex',
    sport_type: 'running',
    is_featured: true
  }, { Authorization: `Bearer ${adminToken}` });

  assert.equal(forbidden.status, 403);
  assert.equal(created.status, 201);
  assert.equal(created.body.data.id, 10);
  assert.equal(created.body.data.slug, 'admin-product');
});

test('admin can toggle product active status', async () => {
  const app = createApp();
  const adminToken = jwt.sign({ userId: 1, email: 'admin@example.com', role: 'admin' }, process.env.JWT_SECRET);

  const response = await request(app, 'PUT', '/api/admin/products/1/toggle-status', null, {
    Authorization: `Bearer ${adminToken}`
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.data.id, 1);
  assert.equal(response.body.data.is_active, 0);
});
