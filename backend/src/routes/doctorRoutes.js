const express = require("express");
const {
  listDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
  getMyAvailability,
  addAvailability,
  deleteAvailability,
} = require("../controllers/doctorController");
const { getMyLeaves, addLeave, deleteLeave } = require("../controllers/doctorLeaveController");
const { getDoctorAvailableSlots } = require("../controllers/appointmentController");
const { addLeaveValidator, idParamValidator } = require("../validators/appointmentValidators");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

// --- Public ---
router.get("/", listDoctors);

// --- Doctor-only (own profile/availability/leave) — must be BEFORE "/:id" ---
router.get("/profile", authenticate, authorize("DOCTOR"), getMyDoctorProfile);
router.put("/profile", authenticate, authorize("DOCTOR"), updateMyDoctorProfile);
router.get("/availability", authenticate, authorize("DOCTOR"), getMyAvailability);
router.post("/availability", authenticate, authorize("DOCTOR"), addAvailability);
router.delete("/availability/:id", authenticate, authorize("DOCTOR"), deleteAvailability);
router.get("/leaves", authenticate, authorize("DOCTOR"), getMyLeaves);
router.post("/leaves", authenticate, authorize("DOCTOR"), addLeaveValidator, validate, addLeave);
router.delete("/leaves/:id", authenticate, authorize("DOCTOR"), idParamValidator, validate, deleteLeave);

// --- Public (by id) ---
router.get("/:id", getDoctorById);
router.get("/:id/availability", getDoctorAvailableSlots);

module.exports = router;
