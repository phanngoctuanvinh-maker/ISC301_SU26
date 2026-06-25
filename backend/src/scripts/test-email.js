const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const emailsToTest = [
  'phanngoctuanvinh@gmail.com',
  'phanngoctuanvinh7102003@gmail.com'
];

const pass = 'miufsipdudgpifwk'; // The password from .env

async function testEmail(userEmail) {
  console.log(`Testing SMTP connection for username: ${userEmail}...`);
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: userEmail,
      pass: pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await transporter.verify();
    console.log(`✅ SUCCESS: ${userEmail} connected successfully!`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${userEmail} connection failed. Error: ${error.message}`);
    return false;
  }
}

async function run() {
  console.log('=== MULTI-ACCOUNT SMTP TEST ===');
  console.log('Using password:', pass);
  console.log('===============================\n');

  let successfulEmail = null;
  for (const email of emailsToTest) {
    const success = await testEmail(email);
    if (success) {
      successfulEmail = email;
      break;
    }
  }

  if (successfulEmail) {
    console.log(`\n🎉 Found matching configuration! The correct username is: ${successfulEmail}`);
  } else {
    console.log('\n❌ None of the tested emails could authenticate with this app password.');
    console.log('Please ensure the App Password is correct and corresponds to one of these accounts.');
  }
  process.exit(0);
}

run();
