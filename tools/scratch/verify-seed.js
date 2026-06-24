const authService = require('../../backend/src/modules/auth/auth.service');
const db = require('../../backend/src/config/db');

async function verify() {
  console.log('--- Verifying Seeded Authentication ---');
  try {
    console.log('Attempting admin login...');
    const adminLogin = await authService.login({
      email: 'admin@example.com',
      password: 'password123'
    });
    console.log('Admin login SUCCESS. Returned token:', adminLogin.token ? 'YES' : 'NO');
    console.log('Admin user details:', adminLogin.user);

    console.log('\nAttempting customer user1 login...');
    const userLogin = await authService.login({
      email: 'user1@example.com',
      password: 'password123'
    });
    console.log('Customer login SUCCESS. Returned token:', userLogin.token ? 'YES' : 'NO');
    console.log('Customer user details:', userLogin.user);
  } catch (error) {
    console.error('Authentication verification FAILED:', error);
  }

  console.log('\n--- Verifying Other Table Relations ---');
  try {
    // Verify products linked to brands
    const brandsList = await db.query(`
      SELECT b.id, b.name, COUNT(p.id) as product_count
      FROM brands b
      LEFT JOIN products p ON p.brand_id = b.id
      GROUP BY b.id
      LIMIT 5
    `);
    console.log('Sample Brands & Product Counts:', brandsList);

    // Verify categories hierarchy
    const categoriesList = await db.query(`
      SELECT parent.name as parent_name, COUNT(child.id) as child_count
      FROM categories parent
      LEFT JOIN categories child ON child.parent_id = parent.id
      WHERE parent.parent_id IS NULL
      GROUP BY parent.id
    `);
    console.log('Parent Categories & Child Counts:', categoriesList);

    // Verify addresses linked to users
    const addressesList = await db.query(`
      SELECT u.full_name, COUNT(a.id) as address_count
      FROM users u
      LEFT JOIN addresses a ON a.user_id = u.id
      WHERE u.role = 'customer'
      GROUP BY u.id
      LIMIT 5
    `);
    console.log('Sample Customers & Address Counts:', addressesList);

  } catch (error) {
    console.error('Relations query FAILED:', error);
  } finally {
    await db.pool.end();
  }
}

verify();
