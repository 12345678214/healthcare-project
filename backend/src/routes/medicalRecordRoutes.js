const express = require("express");
const {
  createOrUpdateMedicalRecord,
  listMedicalRecords,
  getMedicalRecordById,
} = require("../controllers/medicalRecordController");
const { upsertMedicalRecordValidator, idParamValidator } = require("../validators/medicalRecordValidators");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.post("/", authorize("DOCTOR", "ADMIN"), upsertMedicalRecordValidator, validate, createOrUpdateMedicalRecord);
router.get("/", listMedicalRecords); // role-aware inside the controller
router.get("/:id", idParamValidator, validate, getMedicalRecordById);

module.exports = router;
