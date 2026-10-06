const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

const publicDoctorSelect = {
  id: true,
  fullName: true,
  bio: true,
  experienceYears: true,
  qualifications: true,
  consultationFee: true,
  approvalStatus: true,
  specializations: { include: { specialization: true } },
};

// GET /api/doctors?specializationId=&search=
// Public endpoint — only approved doctors are visible.
const listDoctors = asyncHandler(async (req, res) => {
  const { specializationId, search } = req.query;

  const where = { approvalStatus: "APPROVED" };
  if (specializationId) {
    where.specializations = { some: { specializationId } };
  }
  if (search) {
    where.fullName = { contains: search, mode: "insensitive" };
  }

  const doctors = await prisma.doctor.findMany({
    where,
    select: publicDoctorSelect,
    orderBy: { fullName: "asc" },
  });

  return success(res, 200, "Doctors fetched.", { doctors });
});

// GET /api/doctors/:id
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: req.params.id },
    select: { ...publicDoctorSelect, availability: true },
  });
  if (!doctor || doctor.approvalStatus !== "APPROVED") {
    throw new ApiError(404, "Doctor not found.");
  }
  return success(res, 200, "Doctor fetched.", { doctor });
});

// GET /api/doctors/profile  (logged-in doctor's own full profile)
const getMyDoctorProfile = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctor.findUnique({
    where: { id: req.user.doctor.id },
    include: { specializations: { include: { specialization: true } }, availability: true },
  });
  return success(res, 200, "Profile fetched.", { doctor });
});

// PUT /api/doctors/profile
const updateMyDoctorProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, bio, experienceYears, qualifications, consultationFee, specializationIds } = req.body;

  const updated = await prisma.$transaction(async (tx) => {
    const doctor = await tx.doctor.update({
      where: { id: req.user.doctor.id },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(bio !== undefined && { bio }),
        ...(experienceYears !== undefined && { experienceYears }),
        ...(qualifications !== undefined && { qualifications }),
        ...(consultationFee !== undefined && { consultationFee }),
      },
    });

    if (Array.isArray(specializationIds)) {
      await tx.doctorSpecialization.deleteMany({ where: { doctorId: doctor.id } });
      await tx.doctorSpecialization.createMany({
        data: specializationIds.map((specializationId) => ({
          doctorId: doctor.id,
          specializationId,
        })),
        skipDuplicates: true,
      });
    }

    return tx.doctor.findUnique({
      where: { id: doctor.id },
      include: { specializations: { include: { specialization: true } } },
    });
  });

  return success(res, 200, "Profile updated.", { doctor: updated });
});

// GET /api/doctors/availability  (own weekly availability)
const getMyAvailability = asyncHandler(async (req, res) => {
  const availability = await prisma.doctorAvailability.findMany({
    where: { doctorId: req.user.doctor.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return success(res, 200, "Availability fetched.", { availability });
});

// POST /api/doctors/availability  (add a weekly availability window)
const addAvailability = asyncHandler(async (req, res) => {
  const { dayOfWeek, startTime, endTime, slotDurationMinutes } = req.body;

  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new ApiError(400, "dayOfWeek must be between 0 (Sunday) and 6 (Saturday).");
  }
  if (startTime >= endTime) {
    throw new ApiError(400, "startTime must be earlier than endTime.");
  }

  const window = await prisma.doctorAvailability.create({
    data: {
      doctorId: req.user.doctor.id,
      dayOfWeek,
      startTime,
      endTime,
      slotDurationMinutes: slotDurationMinutes || 30,
    },
  });

  return success(res, 201, "Availability added.", { availability: window });
});

// DELETE /api/doctors/availability/:id
const deleteAvailability = asyncHandler(async (req, res) => {
  const window = await prisma.doctorAvailability.findUnique({ where: { id: req.params.id } });
  if (!window || window.doctorId !== req.user.doctor.id) {
    throw new ApiError(404, "Availability window not found.");
  }
  await prisma.doctorAvailability.delete({ where: { id: req.params.id } });
  return success(res, 200, "Availability removed.", null);
});

module.exports = {
  listDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getMyAvailability,
  addAvailability,
  deleteAvailability,
};
