const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const { signToken } = require("../utils/jwt");

const SALT_ROUNDS = 10;

// Shape a User row (with optional patient/doctor profile) into the
// safe object we send back to the client — never the passwordHash.
function toSafeUser(user) {
  const { passwordHash, ...safe } = user; // eslint-disable-line no-unused-vars
  return safe;
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { email, password, role, fullName, phone } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // A user + their role-specific profile are created together in a
  // transaction so we never end up with an orphaned User row.
  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: { email, passwordHash, role },
    });

    if (role === "PATIENT") {
      await tx.patient.create({
        data: { userId: createdUser.id, fullName, phone },
      });
    } else if (role === "DOCTOR") {
      await tx.doctor.create({
        data: { userId: createdUser.id, fullName, phone },
        // approvalStatus defaults to PENDING — an admin must approve
        // the doctor before they appear in public search results.
      });
    }

    return tx.user.findUnique({
      where: { id: createdUser.id },
      include: { patient: true, doctor: true },
    });
  });

  const token = signToken({ userId: user.id, role: user.role });

  return success(res, 201, "Registration successful.", {
    user: toSafeUser(user),
    token,
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { patient: true, doctor: true },
  });

  // Deliberately generic message: never reveal whether the email
  // exists or the password was wrong (prevents user enumeration).
  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.isActive) {
    throw new ApiError(403, "This account has been deactivated. Contact support.");
  }

  const token = signToken({ userId: user.id, role: user.role });

  return success(res, 200, "Login successful.", {
    user: toSafeUser(user),
    token,
  });
});

// GET /api/auth/me  (requires authentication)
const getMe = asyncHandler(async (req, res) => {
  return success(res, 200, "Current user fetched.", { user: toSafeUser(req.user) });
});

module.exports = { register, login, getMe, toSafeUser };
