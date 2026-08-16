const Notification = require("../models/Notification");
const User = require("../models/User");
const sendEmail = require("./sendEmail");
const { getTemplate } = require("./notificationTemplates");

/**
 * Advanced notification dispatcher
 * - Checks user preferences
 * - Localizes message
 * - Sends via enabled channels
 * - Tracks delivery status
 */
async function sendNotification({ userId, templateKey, type, data = {} }) {
  try {
    const user = await User.findById(userId);
    if (!user) return null;

    const prefs = user.notificationPreferences || {};
    const language = prefs.language || "en";

    // Check opt-outs
    if (type === "Promotion" && prefs.promotional === false) {
      console.log(`⏭ Skipped promo notification for ${user.email} (opted out)`);
      return null;
    }

    if (["Booking", "Cancellation", "ScheduleChange", "Reminder"].includes(type)
        && prefs.bookingUpdates === false) {
      console.log(`⏭ Skipped booking notification for ${user.email} (opted out)`);
      return null;
    }

    // Localized content
    const { title, message } = getTemplate(templateKey, language, data);

    // Create notification (in-app always sent)
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      language,
      channels: {
        inApp: { status: "Sent" },
        email: {
          enabled: prefs.email !== false,
          status: prefs.email !== false ? "Pending" : "Skipped",
        },
        push: {
          enabled: prefs.push !== false,
          status: prefs.push !== false ? "Pending" : "Skipped",
        },
      },
    });

    // EMAIL channel
    if (prefs.email !== false) {
      try {
        await sendEmail({ to: user.email, subject: title, text: message });
        notification.channels.email.status = "Sent";
        notification.channels.email.sentAt = new Date();
      } catch (err) {
        notification.channels.email.status = "Failed";
        notification.channels.email.error = err.message;
        console.error(`❌ Email failed for ${user.email}: ${err.message}`);
      }
    }

    // PUSH channel (simulated — real push ke liye FCM/web-push chahiye)
    if (prefs.push !== false) {
      notification.channels.push.status = "Sent";
      notification.channels.push.sentAt = new Date();
    }

    await notification.save();
    return notification;

  } catch (error) {
    console.error("Notification helper error:", error.message);
    return null;
  }
}

/**
 * Retry failed notification delivery
 */
async function retryNotification(notificationId, userId) {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
  });

  if (!notification) throw new Error("Notification not found");

  if (notification.retryCount >= notification.maxRetries) {
    throw new Error("Maximum retry attempts reached");
  }

  const user = await User.findById(userId);
  notification.retryCount += 1;

  // Retry email if failed
  if (notification.channels.email.status === "Failed") {
    try {
      await sendEmail({
        to: user.email,
        subject: notification.title,
        text: notification.message,
      });
      notification.channels.email.status = "Sent";
      notification.channels.email.sentAt = new Date();
      notification.channels.email.error = "";
    } catch (err) {
      notification.channels.email.error = err.message;
    }
  }

  // Retry push if failed
  if (notification.channels.push.status === "Failed") {
    notification.channels.push.status = "Sent";
    notification.channels.push.sentAt = new Date();
  }

  await notification.save();
  return notification;
}

module.exports = { sendNotification, retryNotification };