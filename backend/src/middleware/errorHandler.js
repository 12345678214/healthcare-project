const { failure } = require("../utils/apiResponse");

// Centralized error handler. Every thrown ApiError (or unexpected
// error) ends up here exactly once, producing a consistent JSON
// response and never leaking stack traces in production.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let details = err.details || null;

  // Prisma known error codes -> friendly messages
  if (err.code === "P2002") {
    statusCode = 409;
    message = "This slot or record already exists (duplicate entry).";
    details = err.meta;
  }
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Requested record was not found.";
  }

  if (process.env.NODE_ENV === "development" && statusCode === 500) {
    console.error(err); // eslint-disable-line no-console
  }

  return failure(res, statusCode, message, details);
}

function notFoundHandler(req, res) {
  return failure(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

module.exports = { errorHandler, notFoundHandler };
