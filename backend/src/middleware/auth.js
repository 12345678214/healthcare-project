const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");
const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

// Verifies the "Authorization: Bearer <token>" header, loads the
// user from the database, and attaches it to req.user.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Authentication required. No token provided.");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token.");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { patient: true, doctor: true },
  });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Account no longer exists or is deactivated.");
  }

  req.user = user; // full user row + role-specific profile
  next();
});

// Role-based authorization guard. Usage: authorize("ADMIN", "DOCTOR")
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action.");
    }
    next();
  };
}

module.exports = { authenticate, authorize };
