const express = require("express");
const { getMyProfile, updateMyProfile, getMyAppointments } = require("../controllers/patientController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate, authorize("PATIENT"));

router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.get("/appointments", getMyAppointments);

module.exports = router;
