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

  errorResponse(res, 'Loi he thong', 500, "Access denied for user ''@'localhost'");

  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Loi he thong');
  assert.equal(res.body.errors, null);
});

test('errorResponse keeps validation details for client errors', () => {
  const res = createMockResponse();
  const errors = [{ field: 'email', message: 'Email khong hop le' }];

  errorResponse(res, 'Du lieu khong hop le', 400, errors);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body.errors, errors);
});
