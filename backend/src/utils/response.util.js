function successResponse(res, data = null, message = null, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function errorResponse(res, message = 'Đã có lỗi xảy ra', statusCode = 400, errors = null) {
  const safeErrors = statusCode >= 500 ? null : errors;

  return res.status(statusCode).json({
    success: false,
    message,
    errors: safeErrors
  });
}

module.exports = {
  successResponse,
  errorResponse
};
