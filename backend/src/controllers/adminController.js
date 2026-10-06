const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

// GET /api/admin/dashboard — high-level stats for the admin home screen.
const getDashboardStats = asyncHandler(async (req, res) => {
  const [totalPatients, totalDoctors, totalAppointments, pendingAppointments, pendingDoctorApprovals] =
    await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.doctor.count({ where: { approvalStatus: "PENDING" } }),
    ]);

  return success(res, 200, "Dashboard stats fetched.", {
    totalPatients,
    totalDoctors,
    totalAppointments,
    pendingAppointments,
    pendingDoctorApprovals,
  });
});

// GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return success(res, 200, "Users fetched.", { users });
});

// GET /api/admin/doctors  (includes pending, approved, rejected)
const listAllDoctors = asyncHandler(async (req, res) => {
  const doctors = await prisma.doctor.findMany({
    include: { user: { select: { email: true, isActive: true } }, specializations: { include: { specialization: true } } },
    orderBy: { createdAt: "desc" },
  });
  return success(res, 200, "Doctors fetched.", { doctors });
});

// GET /api/admin/patients
const listAllPatients = asyncHandler(async (req, res) => {
  const patients = await prisma.patient.findMany({
    include: { user: { select: { email: true, isActive: true } } },
    orderBy: { createdAt: "desc" },
  });
  return success(res, 200, "Patients fetched.", { patients });
});

// GET /api/admin/appointments
const listAllAppointments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const appointments = await prisma.appointment.findMany({
    where: status ? { status } : undefined,
    include: {
      doctor: { select: { fullName: true } },
      patient: { select: { fullName: true } },
    },
    orderBy: [{ appointmentDate: "desc" }],
  });
  return success(res, 200, "Appointments fetched.", { appointments });
});

// PATCH /api/admin/doctors/:id/status  — approve/reject a doctor account
const updateDoctorApprovalStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // APPROVED | REJECTED | PENDING
  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    throw new ApiError(400, "status must be APPROVED, REJECTED, or PENDING.");
  }

  const doctor = await prisma.doctor.update({
    where: { id: req.params.id },
    data: { approvalStatus: status },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: "DOCTOR_APPROVAL_STATUS_CHANGED",
      entityType: "Doctor",
      entityId: doctor.id,
      metadata: JSON.stringify({ newStatus: status }),
    },
  });

  await prisma.notification.create({
    data: {
      userId: doctor.userId,
      title: "Account status updated",
      message: `Your doctor account status is now ${status}.`,
    },
  });

  return success(res, 200, "Doctor status updated.", { doctor });
});

// PATCH /api/admin/users/:id/status — activate/deactivate any user account
const updateUserActiveStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: Boolean(isActive) },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      action: "USER_ACTIVE_STATUS_CHANGED",
      entityType: "User",
      entityId: user.id,
      metadata: JSON.stringify({ isActive: user.isActive }),
    },
  });

  return success(res, 200, "User status updated.", {
    user: { id: user.id, email: user.email, isActive: user.isActive },
  });
});

// GET /api/admin/specializations
const listSpecializations = asyncHandler(async (req, res) => {
  const specializations = await prisma.specialization.findMany({ orderBy: { name: "asc" } });
  return success(res, 200, "Specializations fetched.", { specializations });
});

// POST /api/admin/specializations
const createSpecialization = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const specialization = await prisma.specialization.create({ data: { name, description } });
  return success(res, 201, "Specialization created.", { specialization });
});

// GET /api/admin/activity  (recent audit log entries)
const getSystemActivity = asyncHandler(async (req, res) => {
  const logs = await prisma.auditLog.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, role: true } } },
  });
  return success(res, 200, "System activity fetched.", { logs });
});

module.exports = {
  getDashboardStats,
  listUsers,
  listAllDoctors,
  listAllPatients,
  listAllAppointments,
  updateDoctorApprovalStatus,
  updateUserActiveStatus,
  listSpecializations,
  createSpecialization,
  getSystemActivity,
};
