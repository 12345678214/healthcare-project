const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

// GET /api/patients/profile
const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findUnique({ where: { id: req.user.patient.id } });
  return success(res, 200, "Profile fetched.", { patient });
});

// PUT /api/patients/profile
const updateMyProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, dob, gender, address } = req.body;

  const patient = await prisma.patient.update({
    where: { id: req.user.patient.id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(dob !== undefined && { dob: dob ? new Date(dob) : null }),
      ...(gender !== undefined && { gender }),
      ...(address !== undefined && { address }),
    },
  });

  return success(res, 200, "Profile updated.", { patient });
});

// GET /api/patients/appointments  (convenience alias; also covered by
// the role-aware GET /api/appointments in appointmentController)
const getMyAppointments = asyncHandler(async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    where: { patientId: req.user.patient.id },
    include: { doctor: { select: { id: true, fullName: true, consultationFee: true } } },
    orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
  });
  return success(res, 200, "Appointments fetched.", { appointments });
});

module.exports = { getMyProfile, updateMyProfile, getMyAppointments };
