const express = require("express");
const router = express.Router();

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  retryDelivery,
  getPreferences,
  updatePreferences,
  sendTestPromo,
} = require("../controllers/notificationController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getNotifications);
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);
router.put("/mark-all-read", markAllAsRead);
router.post("/test-promo", sendTestPromo);
router.put("/:id/read", markAsRead);
router.put("/:id/retry", retryDelivery);
router.delete("/:id", deleteNotification);

module.exports = router;