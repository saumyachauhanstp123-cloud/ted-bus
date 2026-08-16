const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Booking", "Cancellation", "ScheduleChange", "Reminder", "Promotion", "Alert", "System"],
    default: "System",
  },
  isRead: {
    type: Boolean,
    default: false,
  },

  // 🔥 ADVANCED FIELDS
  language: {
    type: String,
    enum: ["en", "hi"],
    default: "en",
  },
  channels: {
    inApp: {
      status: { type: String, enum: ["Sent", "Failed"], default: "Sent" },
    },
    email: {
      enabled: { type: Boolean, default: false },
      status: { type: String, enum: ["Pending", "Sent", "Failed", "Skipped"], default: "Pending" },
      sentAt: { type: Date },
      error: { type: String, default: "" },
    },
    push: {
      enabled: { type: Boolean, default: false },
      status: { type: String, enum: ["Pending", "Sent", "Failed", "Skipped"], default: "Pending" },
      sentAt: { type: Date },
      error: { type: String, default: "" },
    },
  },
  retryCount: {
    type: Number,
    default: 0,
  },
  maxRetries: {
    type: Number,
    default: 3,
  },
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);