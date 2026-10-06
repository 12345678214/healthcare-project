const { body, param } = require("express-validator");

const upsertMedicalRecordValidator = [
  body("appointmentId").isUUID().withMessage("A valid appointmentId is required."),
  body("diagnosis").optional().isString().isLength({ max: 1000 }),
  body("symptoms").optional().isString().isLength({ max: 1000 }),
  body("doctorNotes").optional().isString().isLength({ max: 2000 }),
  body("followUpDate").optional().isISO8601().withMessage("followUpDate must be a valid date (YYYY-MM-DD)."),
  body("medicines").optional().isArray().withMessage("medicines must be an array."),
  body("medicines.*.medicineName").if(body("medicines").exists()).notEmpty().withMessage("Each medicine needs a medicineName."),
];

const idParamValidator = [param("id").isUUID().withMessage("Invalid id format.")];

module.exports = { upsertMedicalRecordValidator, idParamValidator };
