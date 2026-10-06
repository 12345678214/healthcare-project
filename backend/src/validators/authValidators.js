const { body } = require("express-validator");

const registerValidator = [
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  body("role")
    .isIn(["PATIENT", "DOCTOR"])
    .withMessage("Role must be PATIENT or DOCTOR (ADMIN accounts are seeded, not self-registered)."),
  body("fullName").trim().notEmpty().withMessage("Full name is required."),
  body("phone").optional().isString(),
];

const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required.").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

module.exports = { registerValidator, loginValidator };
