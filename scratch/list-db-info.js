const db = require('../backend/src/config/db');

async function main() {
  try {
    const tables = await db.query('SHOW TABLES');
    console.log('Tables in database:');
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const createRes = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
      console.log(`\n=== Table: ${tableName} ===`);
      console.log(createRes[0]['Create Table']);
    }
  } catch (err) {
    console.error('Error listing tables:', err);
  } finally {
    await db.pool.end();
  }
}

main();
