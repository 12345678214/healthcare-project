const { body, param } = require("express-validator");

const createAppointmentValidator = [
  body("doctorId").isUUID().withMessage("A valid doctorId is required."),
  body("appointmentDate")
    .isISO8601()
    .withMessage("appointmentDate must be a valid date (YYYY-MM-DD)."),
  body("startTime")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("startTime must be in HH:MM 24-hour format."),
  body("reasonForVisit").optional().isString().isLength({ max: 500 }),
];

const idParamValidator = [param("id").isUUID().withMessage("Invalid id format.")];

const addLeaveValidator = [
  body("startDate").isISO8601().withMessage("startDate must be a valid date (YYYY-MM-DD)."),
  body("endDate").optional().isISO8601().withMessage("endDate must be a valid date (YYYY-MM-DD)."),
  body("reason").optional().isString().isLength({ max: 300 }),
];

module.exports = { createAppointmentValidator, idParamValidator, addLeaveValidator };
