const { errorResponse } = require('../utils/response.util');

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return errorResponse(res, 'Dữ liệu không hợp lệ', 400, errorMessages);
    }
    next();
  };
}

module.exports = {
  validate
};
