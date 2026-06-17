const test = require('node:test');
const assert = require('node:assert/strict');

const { errorResponse } = require('../src/utils/response.util');

function createMockResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      return {
        json: body => {
          this.statusCode = code;
          this.body = body;
          return this;
        }
      };
    }
  };
}

test('errorResponse does not expose internal errors for 500 responses', () => {
  const res = createMockResponse();

  errorResponse(res, 'Lỗi hệ thống', 500, "Access denied for user ''@'localhost'");

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Lỗi hệ thống');
  assert.equal(res.body.errors, null);
});

test('errorResponse keeps validation details for client errors', () => {
  const res = createMockResponse();
  const errors = [{ field: 'email', message: 'Email không hợp lệ' }];

  errorResponse(res, 'Dữ liệu không hợp lệ', 400, errors);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.errors, errors);
});
