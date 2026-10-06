const { validationResult } = require("express-validator");
const { failure } = require("../utils/apiResponse");

// Runs after an array of express-validator checks; if any failed,
// short-circuits with a 422 response instead of hitting the controller.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return failure(res, 422, "Validation failed.", errors.array());
  }
  next();
}

module.exports = validate;
