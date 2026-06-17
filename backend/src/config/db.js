const mysql = require('mysql2/promise');
require('./env');

function readEnv(env, names) {
  for (const name of names) {
    const value = env[name];
    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }
  }
  return undefined;
}

function parsePort(value) {
  const port = Number.parseInt(value || '3306', 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('Database configuration error: DB_PORT must be a valid TCP port.');
  }
  return port;
}

function getDbConfig(env = process.env) {
  const config = {
    host: readEnv(env, ['DB_HOST', 'MYSQL_HOST']) || 'localhost',
    port: parsePort(readEnv(env, ['DB_PORT', 'MYSQL_PORT'])),
    user: readEnv(env, ['DB_USER', 'MYSQL_USER']),
    password: readEnv(env, ['DB_PASS', 'DB_PASSWORD', 'MYSQL_PASSWORD']) || '',
    database: readEnv(env, ['DB_NAME', 'MYSQL_DATABASE']) || 'shoes_store'
  };

  if (!config.user) {
    throw new Error(
      'Database configuration error: DB_USER is required. Create a .env file from .env.example and set DB_USER/DB_PASS.'
    );
  }

  return config;
}

const pool = mysql.createPool({
  ...getDbConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  timezone: '+07:00'
});

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function queryOne(sql, params) {
  const rows = await query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

module.exports = {
  query,
  queryOne,
  pool,
  getDbConfig
};
