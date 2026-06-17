const test = require('node:test');
const assert = require('node:assert/strict');

process.env.DB_USER = process.env.DB_USER || 'test_user';

const { getDbConfig } = require('../src/config/db');

test('getDbConfig reads DB credentials from primary environment variables', () => {
  const config = getDbConfig({
    DB_HOST: '127.0.0.1',
    DB_PORT: '3307',
    DB_USER: 'shoes_user',
    DB_PASS: 'shoes_pass',
    DB_NAME: 'shoes_store_test'
  });

  assert.deepEqual(config, {
    host: '127.0.0.1',
    port: 3307,
    user: 'shoes_user',
    password: 'shoes_pass',
    database: 'shoes_store_test'
  });
});

test('getDbConfig supports MySQL and DB_PASSWORD aliases', () => {
  const config = getDbConfig({
    MYSQL_HOST: 'mysql',
    MYSQL_PORT: '3306',
    MYSQL_USER: 'docker_user',
    DB_PASSWORD: 'docker_pass',
    MYSQL_DATABASE: 'docker_db'
  });

  assert.equal(config.host, 'mysql');
  assert.equal(config.port, 3306);
  assert.equal(config.user, 'docker_user');
  assert.equal(config.password, 'docker_pass');
  assert.equal(config.database, 'docker_db');
});

test('getDbConfig rejects an empty database user before MySQL connects anonymously', () => {
  assert.throws(
    () => getDbConfig({ DB_USER: '', DB_PASS: '', DB_NAME: 'shoes_store' }),
    /DB_USER is required/
  );
});
