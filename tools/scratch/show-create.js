const db = require('../../backend/src/config/db');

async function test() {
  try {
    const otpRes = await db.query('SHOW CREATE TABLE otp_pending');
    console.log('--- otp_pending ---');
    console.log(otpRes[0]['Create Table']);

    const prodRes = await db.query('SHOW CREATE TABLE products');
    console.log('--- products ---');
    console.log(prodRes[0]['Create Table']);
  } catch (error) {
    console.error('Error fetching create table statement:', error);
  } finally {
    await db.pool.end();
  }
}

test();
