const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

// GET /api/doctors/leaves  (own leave records, upcoming first then past)
const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await prisma.doctorLeave.findMany({
    where: { doctorId: req.user.doctor.id },
    orderBy: { startDate: "desc" },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = leaves.filter((l) => new Date(l.endDate) >= today);
  const past = leaves.filter((l) => new Date(l.endDate) < today);

  return success(res, 200, "Leaves fetched.", { upcoming, past });
});

// POST /api/doctors/leaves
// Body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", reason?: string }
const addLeave = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason } = req.body;

  const start = new Date(startDate);
  const end = new Date(endDate || startDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new ApiError(400, "startDate/endDate must be valid dates (YYYY-MM-DD).");
  }
  if (end < start) {
    throw new ApiError(400, "endDate cannot be before startDate.");
  }
  if (start < today) {
    throw new ApiError(400, "Cannot add leave for a date in the past.");
  }

  // Warn-and-block on overlap with an existing leave for the same doctor,
  // to avoid confusing duplicate/overlapping leave ranges.
  const overlapping = await prisma.doctorLeave.findFirst({
    where: {
      doctorId: req.user.doctor.id,
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });
  if (overlapping) {
    throw new ApiError(409, "This date range overlaps with an existing leave entry.");
  }

  const leave = await prisma.doctorLeave.create({
    data: { doctorId: req.user.doctor.id, startDate: start, endDate: end, reason },
  });

  // Any already-PENDING/CONFIRMED appointments that now fall inside this
  // leave range need the doctor's attention — they aren't auto-cancelled
  // (a doctor might still see patients already booked), but we flag it
  // via a notification back to the doctor themselves as a reminder to
  // follow up, rather than silently leaving conflicting bookings.
  const conflicting = await prisma.appointment.findMany({
    where: {
      doctorId: req.user.doctor.id,
      appointmentDate: { gte: start, lte: end },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (conflicting.length > 0) {
    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: "Leave overlaps existing appointments",
        message: `You have ${conflicting.length} appointment(s) scheduled during your new leave (${startDate} to ${endDate}). Please reschedule or cancel them.`,
      },
    });
  }

  return success(res, 201, "Leave added.", { leave, conflictingAppointmentCount: conflicting.length });
});

// DELETE /api/doctors/leaves/:id
const deleteLeave = asyncHandler(async (req, res) => {
  const leave = await prisma.doctorLeave.findUnique({ where: { id: req.params.id } });
  if (!leave || leave.doctorId !== req.user.doctor.id) {
    throw new ApiError(404, "Leave entry not found.");
  }
  await prisma.doctorLeave.delete({ where: { id: req.params.id } });
  return success(res, 200, "Leave removed.", null);
});

module.exports = { getMyLeaves, addLeave, deleteLeave };
