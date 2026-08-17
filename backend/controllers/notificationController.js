const Notification = require('../models/Notification.js');
const user = require('../models/user.js');
const { retryNotification, sendNotification } = require("../utils/notificationHelper");

// GET ALL (history with delivery status)
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    res.status(200).json({ success: true, unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// MARK AS READ
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!notification) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔥 RETRY FAILED DELIVERY
exports.retryDelivery = async (req, res) => {
  try {
    const notification = await retryNotification(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: "Retry attempted",
      notification,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 🔥 GET PREFERENCES
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      preferences: user.notificationPreferences || {
        email: true, push: true, bookingUpdates: true, promotional: true, language: "en",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔥 UPDATE PREFERENCES
exports.updatePreferences = async (req, res) => {
  try {
    const { email, push, bookingUpdates, promotional, language } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        notificationPreferences: {
          email: email !== false,
          push: push !== false,
          bookingUpdates: bookingUpdates !== false,
          promotional: promotional !== false,
          language: language || "en",
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Preferences updated",
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔥 TEST PROMO (admin can broadcast later; abhi self-test)
exports.sendTestPromo = async (req, res) => {
  try {
    const notification = await sendNotification({
      userId: req.user.id,
      templateKey: "PROMOTION",
      type: "Promotion",
      data: {
        text: "Flat 20% off on your next booking! Use code TEDBUS20",
        textHi: "अगली बुकिंग पर 20% छूट! कोड TEDBUS20 इस्तेमाल करें",
      },
    });

    res.status(200).json({
      success: true,
      message: notification ? "Promo sent" : "User opted out of promos",
      notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};