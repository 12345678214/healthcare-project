const express = require("express");
const { listMyNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", listMyNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

module.exports = router;
