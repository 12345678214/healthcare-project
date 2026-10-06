const express = require("express");
const { listSpecializationsPublic } = require("../controllers/specializationController");

const router = express.Router();

// Public — anyone (including logged-out visitors) can see the list of
// specializations to filter doctor search results.
router.get("/", listSpecializationsPublic);

module.exports = router;
