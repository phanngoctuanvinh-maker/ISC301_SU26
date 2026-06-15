const crypto = require('crypto');

function generateOtp() {
  const otpVal = crypto.randomInt(100000, 999999);
  return otpVal.toString();
}

module.exports = {
  generateOtp
};
