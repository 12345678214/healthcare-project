const express = require("express");
const {
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
} = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/dashboard", getDashboardStats);
router.get("/users", listUsers);
router.get("/doctors", listAllDoctors);
router.get("/patients", listAllPatients);
router.get("/appointments", listAllAppointments);
router.patch("/doctors/:id/status", updateDoctorApprovalStatus);
router.patch("/users/:id/status", updateUserActiveStatus);
router.get("/specializations", listSpecializations);
router.post("/specializations", createSpecialization);
router.get("/activity", getSystemActivity);

module.exports = router;
