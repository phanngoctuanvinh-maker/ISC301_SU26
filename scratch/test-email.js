const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

console.log('=== SMTP CONFIGURATION TEST ===');
console.log('MAIL_HOST:', process.env.MAIL_HOST);
console.log('MAIL_PORT:', process.env.MAIL_PORT);
console.log('MAIL_USER:', process.env.MAIL_USER);
console.log('MAIL_PASS (length):', process.env.MAIL_PASS ? process.env.MAIL_PASS.length : 0);
console.log('MAIL_FROM:', process.env.MAIL_FROM);
console.log('===============================\n');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

console.log('Connecting to SMTP server...');
transporter.verify(function (error, success) {
  if (error) {
    console.error('\n❌ SMTP Connection Failed!');
    console.error(error.message);
  } else {
    console.log('\n✅ SMTP Server is ready to send emails successfully!');
  }
  process.exit(0);
});
