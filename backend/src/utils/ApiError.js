// Custom error class carrying an HTTP status code.
// Thrown anywhere in the app; caught centrally by errorHandler.js
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
