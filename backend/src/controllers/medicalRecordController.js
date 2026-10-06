const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

// ---------------------------------------------------------------------
// POST /api/medical-records  (doctor only)
// Body: {
//   appointmentId, diagnosis?, symptoms?, doctorNotes?, followUpDate?,
//   medicines?: [{ medicineName, dosage?, instructions? }]
// }
//
// One record per appointment: if a record already exists for this
// appointment, this call updates it (and replaces the prescription
// item list) rather than creating a duplicate — enforced both by the
// @unique constraint on Appointment.id in the schema and by this
// upsert-style logic.
// ---------------------------------------------------------------------
const createOrUpdateMedicalRecord = asyncHandler(async (req, res) => {
  const { appointmentId, diagnosis, symptoms, doctorNotes, followUpDate, medicines } = req.body;

  if (!appointmentId) throw new ApiError(400, "appointmentId is required.");

  const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment) throw new ApiError(404, "Appointment not found.");

  if (req.user.role !== "ADMIN" && appointment.doctorId !== req.user.doctor?.id) {
    throw new ApiError(403, "Only the doctor who took this appointment (or an admin) can add a medical record.");
  }

  if (appointment.status !== "COMPLETED") {
    throw new ApiError(400, "A medical record can only be added once the appointment is marked COMPLETED.");
  }

  const medicineList = Array.isArray(medicines) ? medicines : [];
  for (const m of medicineList) {
    if (!m.medicineName || typeof m.medicineName !== "string") {
      throw new ApiError(400, "Each medicine entry requires a medicineName.");
    }
  }

  const record = await prisma.$transaction(async (tx) => {
    const existing = await tx.medicalRecord.findUnique({ where: { appointmentId } });

    const data = {
      diagnosis,
      symptoms,
      doctorNotes,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
    };

    let saved;
    if (existing) {
      // Replace the prescription list wholesale — simplest correct way
      // to reconcile an edited medicine list without diffing item-by-item.
      await tx.prescriptionItem.deleteMany({ where: { medicalRecordId: existing.id } });
      saved = await tx.medicalRecord.update({ where: { id: existing.id }, data });
    } else {
      saved = await tx.medicalRecord.create({
        data: {
          ...data,
          appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
        },
      });
    }

    if (medicineList.length > 0) {
      await tx.prescriptionItem.createMany({
        data: medicineList.map((m) => ({
          medicalRecordId: saved.id,
          medicineName: m.medicineName,
          dosage: m.dosage || null,
          instructions: m.instructions || null,
        })),
      });
    }

    return tx.medicalRecord.findUnique({
      where: { id: saved.id },
      include: { prescriptionItems: true },
    });
  });

  return success(res, 200, "Medical record saved.", { medicalRecord: record });
});

// GET /api/medical-records  (role-aware)
// Patient: their own records. Doctor: records they authored. Admin: all.
const listMedicalRecords = asyncHandler(async (req, res) => {
  const where = {};
  if (req.user.role === "PATIENT") {
    where.patientId = req.user.patient.id;
  } else if (req.user.role === "DOCTOR") {
    where.doctorId = req.user.doctor.id;
  }

  const records = await prisma.medicalRecord.findMany({
    where,
    include: {
      prescriptionItems: true,
      doctor: { select: { fullName: true } },
      patient: { select: { fullName: true } },
      appointment: { select: { appointmentDate: true, startTime: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return success(res, 200, "Medical records fetched.", { medicalRecords: records });
});

// GET /api/medical-records/:id
const getMedicalRecordById = asyncHandler(async (req, res) => {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: req.params.id },
    include: {
      prescriptionItems: true,
      doctor: { select: { fullName: true } },
      patient: { select: { fullName: true } },
      appointment: true,
    },
  });
  if (!record) throw new ApiError(404, "Medical record not found.");

  if (
    req.user.role !== "ADMIN" &&
    !(req.user.role === "PATIENT" && record.patientId === req.user.patient?.id) &&
    !(req.user.role === "DOCTOR" && record.doctorId === req.user.doctor?.id)
  ) {
    throw new ApiError(403, "You do not have access to this medical record.");
  }

  return success(res, 200, "Medical record fetched.", { medicalRecord: record });
});

module.exports = { createOrUpdateMedicalRecord, listMedicalRecords, getMedicalRecordById };
