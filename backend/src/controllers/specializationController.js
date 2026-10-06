const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

// GET /api/specializations — public listing (used by the doctor search filter)
const listSpecializationsPublic = asyncHandler(async (req, res) => {
  const specializations = await prisma.specialization.findMany({ orderBy: { name: "asc" } });
  return success(res, 200, "Specializations fetched.", { specializations });
});

module.exports = { listSpecializationsPublic };
