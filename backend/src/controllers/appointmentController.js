const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const { generateSlots, toMinutes } = require("../utils/timeSlots");
const { sendEmail } = require("../utils/email");
const {
  appointmentConfirmedEmail,
  appointmentRejectedEmail,
  appointmentCancelledEmail,
} = require("../utils/emailTemplates");

// ---------------------------------------------------------------------
// Helper: is this doctor on leave for the given date?
// A leave record covers a date range (startDate..endDate inclusive);
// this is checked BEFORE the weekly-availability slot generation, so
// a leave always wins over the recurring pattern for that date.
// ---------------------------------------------------------------------
async function findLeaveForDate(doctorId, dateStr) {
  const date = new Date(dateStr);
  return prisma.doctorLeave.findFirst({
    where: {
      doctorId,
      startDate: { lte: date },
      endDate: { gte: date },
    },
  });
}

// ---------------------------------------------------------------------
// Helper: compute a doctor's free slots for one calendar date.
// 1. Check the doctor isn't on leave for this date.
// 2. Find the weekly availability window(s) for that day-of-week.
// 3. Expand each window into candidate slots.
// 4. Remove slots that already have a non-cancelled/rejected appointment.
// Returns { slots, onLeave, leaveReason } so callers (and the API
// response) can distinguish "no availability configured" from
// "doctor is on leave" — the two need different messaging to patients.
// ---------------------------------------------------------------------
async function getAvailableSlotsForDate(doctorId, dateStr) {
  const leave = await findLeaveForDate(doctorId, dateStr);
  if (leave) {
    return { slots: [], onLeave: true, leaveReason: leave.reason || null };
  }

  const date = new Date(dateStr);
  const dayOfWeek = date.getUTCDay();

  const windows = await prisma.doctorAvailability.findMany({
    where: { doctorId, dayOfWeek, isActive: true },
  });

  if (windows.length === 0) return { slots: [], onLeave: false };

  const allSlots = windows.flatMap((w) =>
    generateSlots(w.startTime, w.endTime, w.slotDurationMinutes)
  );

  const bookedAppointments = await prisma.appointment.findMany({
    where: {
      doctorId,
      appointmentDate: date,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { startTime: true },
  });
  const bookedSet = new Set(bookedAppointments.map((a) => a.startTime));

  // Also block slots that are already in the past for "today".
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const slots = allSlots.filter((slot) => {
    if (bookedSet.has(slot.startTime)) return false;
    if (isToday && toMinutes(slot.startTime) <= nowMinutes) return false;
    return true;
  });

  return { slots, onLeave: false };
}

// GET /api/doctors/:id/availability?date=YYYY-MM-DD
const getDoctorAvailableSlots = asyncHandler(async (req, res) => {
  const { id: doctorId } = req.params;
  const { date } = req.query;

  if (!date) throw new ApiError(400, "Query parameter 'date' (YYYY-MM-DD) is required.");

  const requestedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (requestedDate < today) {
    throw new ApiError(400, "Cannot fetch availability for a past date.");
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new ApiError(404, "Doctor not found.");

  const { slots, onLeave, leaveReason } = await getAvailableSlotsForDate(doctorId, date);
  const message = onLeave
    ? `Dr. ${doctor.fullName} is on leave on this date${leaveReason ? ` (${leaveReason})` : ""}.`
    : "Available slots fetched.";

  return success(res, 200, message, { date, slots, onLeave: Boolean(onLeave) });
});

// ---------------------------------------------------------------------
// POST /api/appointments  — the core booking flow.
//
// Race-condition safety: two patients could both request the same
// slot at nearly the same instant. Rather than trusting the
// "is this slot free?" check alone (check-then-act is not atomic),
// we rely on the database-level UNIQUE constraint
// (doctorId, appointmentDate, startTime) defined in schema.prisma.
// If two inserts race, Postgres allows the first and rejects the
// second with a P2002 error, which errorHandler.js turns into a
// clean 409 Conflict response. The pre-check below just gives a
// fast, friendly error in the common (non-race) case.
// ---------------------------------------------------------------------
const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, startTime, reasonForVisit } = req.body;
  const patient = req.user.patient;

  if (!patient) throw new ApiError(403, "Only patients can book appointments.");

  const date = new Date(appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) throw new ApiError(400, "Cannot book an appointment in the past.");

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) throw new ApiError(404, "Doctor not found.");
  if (doctor.approvalStatus !== "APPROVED") {
    throw new ApiError(400, "This doctor is not currently accepting appointments.");
  }

  // Confirm requested slot is one of the doctor's valid generated slots.
  // getAvailableSlotsForDate already checks doctor leave internally, so
  // a slot can never be "matched" on a day the doctor is on leave.
  const { slots: freeSlots, onLeave, leaveReason } = await getAvailableSlotsForDate(doctorId, appointmentDate);
  if (onLeave) {
    throw new ApiError(
      409,
      `Dr. ${doctor.fullName} is on leave on this date${leaveReason ? ` (${leaveReason})` : ""}. Please choose another date.`
    );
  }
  const matchedSlot = freeSlots.find((s) => s.startTime === startTime);
  if (!matchedSlot) {
    throw new ApiError(409, "That slot is not available. Please choose a different time.");
  }

  try {
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        appointmentDate: date,
        startTime: matchedSlot.startTime,
        endTime: matchedSlot.endTime,
        reasonForVisit,
        status: "PENDING",
      },
      include: { doctor: true, patient: true },
    });

    await prisma.notification.create({
      data: {
        userId: doctor.userId,
        title: "New appointment request",
        message: `${patient.fullName} requested an appointment on ${appointmentDate} at ${matchedSlot.startTime}.`,
      },
    });

    return success(res, 201, "Appointment booked successfully.", { appointment });
  } catch (err) {
    // P2002 = Prisma's unique constraint violation code — this is the
    // race-condition safety net described above.
    if (err.code === "P2002") {
      throw new ApiError(409, "This slot was just booked by someone else. Please pick another.");
    }
    throw err;
  }
});

// GET /api/appointments  (role-aware: patient sees own, doctor sees own, admin sees all)
const listAppointments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;

  if (req.user.role === "PATIENT") {
    where.patientId = req.user.patient.id;
  } else if (req.user.role === "DOCTOR") {
    where.doctorId = req.user.doctor.id;
  }
  // ADMIN: no extra filter — sees everything.

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      doctor: { select: { id: true, fullName: true, consultationFee: true } },
      patient: { select: { id: true, fullName: true, phone: true } },
      medicalRecord: { select: { id: true } },
    },
    orderBy: [{ appointmentDate: "desc" }, { startTime: "desc" }],
  });

  return success(res, 200, "Appointments fetched.", { appointments });
});

// GET /api/appointments/:id
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: {
      doctor: { include: { specializations: { include: { specialization: true } } } },
      patient: true,
      medicalRecord: { include: { prescriptionItems: true } },
    },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found.");

  assertAppointmentAccess(req.user, appointment);

  return success(res, 200, "Appointment fetched.", { appointment });
});

// Shared authorization check: patients/doctors may only access their
// own appointments; admins may access all.
function assertAppointmentAccess(user, appointment) {
  if (user.role === "ADMIN") return;
  if (user.role === "PATIENT" && appointment.patientId === user.patient?.id) return;
  if (user.role === "DOCTOR" && appointment.doctorId === user.doctor?.id) return;
  throw new ApiError(403, "You do not have access to this appointment.");
}

// PUT /api/appointments/:id  — reschedule (change date/time)
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { appointmentDate, startTime } = req.body;
  const appointment = await prisma.appointment.findUnique({ where: { id: req.params.id } });
  if (!appointment) throw new ApiError(404, "Appointment not found.");

  assertAppointmentAccess(req.user, appointment);

  if (["COMPLETED", "CANCELLED", "REJECTED"].includes(appointment.status)) {
    throw new ApiError(400, `Cannot reschedule an appointment that is ${appointment.status}.`);
  }

  const { slots: freeSlots, onLeave, leaveReason } = await getAvailableSlotsForDate(appointment.doctorId, appointmentDate);
  if (onLeave) {
    throw new ApiError(409, `The doctor is on leave on this date${leaveReason ? ` (${leaveReason})` : ""}. Please choose another date.`);
  }
  const matchedSlot = freeSlots.find((s) => s.startTime === startTime);
  if (!matchedSlot) {
    throw new ApiError(409, "That slot is not available. Please choose a different time.");
  }

  try {
    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        appointmentDate: new Date(appointmentDate),
        startTime: matchedSlot.startTime,
        endTime: matchedSlot.endTime,
        status: "PENDING", // rescheduled appointments go back to pending confirmation
        // Rescheduling changes the appointment time, so any reminder
        // already sent for the old time is no longer valid — reset both.
        reminder24hSentAt: null,
        reminder1hSentAt: null,
      },
    });
    return success(res, 200, "Appointment rescheduled.", { appointment: updated });
  } catch (err) {
    if (err.code === "P2002") {
      throw new ApiError(409, "That slot was just booked by someone else.");
    }
    throw err;
  }
});

// PATCH /api/appointments/:id/cancel
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: { doctor: true, patient: { include: { user: true } } },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found.");

  assertAppointmentAccess(req.user, appointment);

  if (["COMPLETED", "CANCELLED", "REJECTED"].includes(appointment.status)) {
    throw new ApiError(400, `Appointment is already ${appointment.status}.`);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });

  await prisma.notification.create({
    data: {
      userId: appointment.patient.userId,
      title: "Appointment cancelled",
      message: `Your appointment on ${appointment.appointmentDate.toISOString().slice(0, 10)} at ${appointment.startTime} has been cancelled.`,
    },
  });

  const { subject, text, html } = appointmentCancelledEmail({
    patientName: appointment.patient.fullName,
    doctorName: appointment.doctor.fullName,
    appointmentDate: appointment.appointmentDate,
    startTime: appointment.startTime,
    cancelledBy: req.user.role,
  });
  await sendEmail({ to: appointment.patient.user.email, subject, text, html });

  return success(res, 200, "Appointment cancelled.", { appointment: updated });
});

// PATCH /api/appointments/:id/status  — doctor confirms/rejects/completes
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["CONFIRMED", "REJECTED", "COMPLETED"];
  if (!allowed.includes(status)) {
    throw new ApiError(400, `status must be one of: ${allowed.join(", ")}`);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include: {
      doctor: { include: { specializations: { include: { specialization: true } } } },
      patient: { include: { user: true } },
    },
  });
  if (!appointment) throw new ApiError(404, "Appointment not found.");

  if (req.user.role !== "ADMIN" && appointment.doctorId !== req.user.doctor?.id) {
    throw new ApiError(403, "Only the assigned doctor (or an admin) can update this status.");
  }

  if (["COMPLETED", "CANCELLED", "REJECTED"].includes(appointment.status)) {
    throw new ApiError(400, `Cannot change status of an appointment that is already ${appointment.status}.`);
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status },
  });

  await prisma.notification.create({
    data: {
      userId: appointment.patient.userId,
      title: `Appointment ${status.toLowerCase()}`,
      message: `Your appointment on ${appointment.appointmentDate.toISOString().slice(0, 10)} at ${appointment.startTime} is now ${status}.`,
    },
  });

  // Email the patient for the two statuses that genuinely need an
  // out-of-app notification — a confirmed slot or a declined request.
  // COMPLETED doesn't get an email; the in-app notification covers it,
  // and it's not something a patient needs to hear about away from the app.
  if (status === "CONFIRMED") {
    const specializationNames = appointment.doctor.specializations
      .map((s) => s.specialization.name)
      .join(", ");
    const { subject, text, html } = appointmentConfirmedEmail({
      patientName: appointment.patient.fullName,
      doctorName: appointment.doctor.fullName,
      specializationNames,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
      fee: appointment.doctor.consultationFee,
    });
    await sendEmail({ to: appointment.patient.user.email, subject, text, html });
  } else if (status === "REJECTED") {
    const { subject, text, html } = appointmentRejectedEmail({
      patientName: appointment.patient.fullName,
      doctorName: appointment.doctor.fullName,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.startTime,
    });
    await sendEmail({ to: appointment.patient.user.email, subject, text, html });
  }

  return success(res, 200, "Appointment status updated.", { appointment: updated });
});

module.exports = {
  getDoctorAvailableSlots,
  createAppointment,
  listAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  // exported for reuse by doctorLeaveController (checking overlapping
  // future appointments before allowing a leave to be created) and by
  // the reminder job (not directly, but keeps one source of truth).
  findLeaveForDate,
  getAvailableSlotsForDate,
};
