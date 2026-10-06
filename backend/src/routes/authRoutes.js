const express = require("express");
const { register, login, getMe } = require("../controllers/authController");
const { registerValidator, loginValidator } = require("../validators/authValidators");
const validate = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/me", authenticate, getMe);

module.exports = router;
