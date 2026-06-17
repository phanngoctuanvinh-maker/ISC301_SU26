const crypto = require('crypto');
const querystring = require('querystring');

function sortObject(source) {
  return Object.keys(source)
    .sort()
    .reduce((result, key) => {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
        result[key] = source[key];
      }
      return result;
    }, {});
}

function createSecureHash(params, secret) {
  const sortedParams = sortObject(params);
  const signData = querystring.stringify(sortedParams, null, null, {
    encodeURIComponent: querystring.escape
  });
  return crypto.createHmac('sha512', secret).update(Buffer.from(signData, 'utf-8')).digest('hex');
}

function verifySecureHash(params, secret) {
  const secureHash = params.vnp_SecureHash;
  const clone = { ...params };
  delete clone.vnp_SecureHash;
  delete clone.vnp_SecureHashType;
  return createSecureHash(clone, secret) === secureHash;
}

function formatVnpayDate(date) {
  const pad = (value) => value.toString().padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds())
  ].join('');
}

module.exports = {
  sortObject,
  createSecureHash,
  verifySecureHash,
  formatVnpayDate
};
