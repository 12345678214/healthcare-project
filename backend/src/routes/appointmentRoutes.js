const express = require("express");
const {
  createAppointment,
  listAppointments,
  getAppointmentById,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
} = require("../controllers/appointmentController");
const { createAppointmentValidator, idParamValidator } = require("../validators/appointmentValidators");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/", authorize("PATIENT"), createAppointmentValidator, validate, createAppointment);
router.get("/", listAppointments);
router.get("/:id", idParamValidator, validate, getAppointmentById);
router.put("/:id", idParamValidator, validate, rescheduleAppointment);
router.patch("/:id/cancel", idParamValidator, validate, cancelAppointment);
router.patch("/:id/status", authorize("DOCTOR", "ADMIN"), idParamValidator, validate, updateAppointmentStatus);

module.exports = router;
