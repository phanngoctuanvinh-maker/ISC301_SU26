const db = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const tables = ['users', 'categories', 'brands', 'products', 'addresses', 'otp_pending'];
    let sqlOutput = `-- Shoes Store Database Dump & Initialization Schema\n`;
    sqlOutput += `-- Generated dynamically to match actual schema and seeded data.\n\n`;
    sqlOutput += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // 1. Generate CREATE TABLE statements
    for (const table of tables) {
      const showCreate = await db.query(`SHOW CREATE TABLE ${table}`);
      const createStatement = showCreate[0]['Create Table'];
      
      sqlOutput += `-- Table structure for table \`${table}\`\n`;
      sqlOutput += `DROP TABLE IF EXISTS \`${table}\`;\n`;
      sqlOutput += `${createStatement};\n\n`;
    }

    // 2. Generate INSERT statements for seeded data
    for (const table of tables) {
      const rows = await db.query(`SELECT * FROM ${table}`);
      if (rows.length === 0) continue;

      sqlOutput += `-- Dumping data for table \`${table}\`\n`;
      
      // Get column names
      const cols = Object.keys(rows[0]);
      const colString = cols.map(c => `\`${c}\``).join(', ');

      // Split inserts into batches of 10 to keep SQL file readable
      const batchSize = 10;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batchRows = rows.slice(i, i + batchSize);
        sqlOutput += `INSERT INTO \`${table}\` (${colString}) VALUES\n`;
        
        const valueStrings = batchRows.map(row => {
          const vals = cols.map(col => {
            const val = row[col];
            if (val === null || val === undefined) {
              return 'NULL';
            } else if (typeof val === 'boolean') {
              return val ? '1' : '0';
            } else if (val instanceof Date) {
              // Convert to mysql datetime format
              return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            } else if (typeof val === 'object' && Buffer.isBuffer(val)) {
              return `0x${val.toString('hex')}`;
            } else if (typeof val === 'number') {
              return val;
            } else {
              // String, escape single quotes
              const escaped = val.toString().replace(/'/g, "\\'");
              return `'${escaped}'`;
            }
          });
          return `(${vals.join(', ')})`;
        });

        sqlOutput += valueStrings.join(',\n') + ';\n';
      }
      sqlOutput += `\n`;
    }

    sqlOutput += `SET FOREIGN_KEY_CHECKS = 1;\n`;

    const initSqlPath = path.join(__dirname, '../docker/mysql/init.sql');
    fs.writeFileSync(initSqlPath, sqlOutput, 'utf8');
    console.log(`Successfully generated and wrote init.sql to: ${initSqlPath}`);
  } catch (error) {
    console.error('Error generating init.sql:', error);
  } finally {
    await db.pool.end();
  }
}

main();
