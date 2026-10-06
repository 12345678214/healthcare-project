const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

// GET /api/notifications  (own notifications, newest first)
const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  return success(res, 200, "Notifications fetched.", { notifications });
});

// PATCH /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification || notification.userId !== req.user.id) {
    throw new ApiError(404, "Notification not found.");
  }
  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { isRead: true },
  });
  return success(res, 200, "Notification marked as read.", { notification: updated });
});

// PATCH /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  return success(res, 200, "All notifications marked as read.", null);
});

module.exports = { listMyNotifications, markAsRead, markAllAsRead };
