const Notification = require('../models/Notification.js');
const User = require('../models/user.js');
const sendEmail = require('./sendEmail');
const {
  getTemplate
} = require('./notificationTemplates');

/**
 * Advanced notification dispatcher
 *
 * - User preferences check karta hai
 * - Selected language me template leta hai
 * - In-app notification create karta hai
 * - Email ko Brevo API ke through send karta hai
 * - Delivery status save karta hai
 *
 * Email fail hone par booking/cancellation fail nahi hogi.
 */
async function sendNotification({
  userId,
  templateKey,
  type,
  data = {}
}) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      console.error(
        `Notification skipped: user ${userId} not found`
      );

      return null;
    }

    const preferences =
      user.notificationPreferences || {};

    const language =
      preferences.language || 'en';

    // Promotional notifications opt-out
    if (
      type === 'Promotion' &&
      preferences.promotional === false
    ) {
      console.log(
        `⏭ Promotion skipped for ${user.email} (opted out)`
      );

      return null;
    }

    // Booking-related notifications opt-out
    if (
      [
        'Booking',
        'Cancellation',
        'ScheduleChange',
        'Reminder'
      ].includes(type) &&
      preferences.bookingUpdates === false
    ) {
      console.log(
        `⏭ Booking notification skipped for ${user.email} (opted out)`
      );

      return null;
    }

    // Localized notification content
    const {
      title,
      message
    } = getTemplate(
      templateKey,
      language,
      data
    );

    if (!title || !message) {
      throw new Error(
        `Notification template "${templateKey}" returned invalid content`
      );
    }

    // In-app notification create
    const notification =
      await Notification.create({
        user: userId,
        title,
        message,
        type,
        language,

        channels: {
          inApp: {
            status: 'Sent'
          },

          email: {
            enabled:
              preferences.email !== false,

            status:
              preferences.email !== false
                ? 'Pending'
                : 'Skipped'
          },

          push: {
            enabled:
              preferences.push !== false,

            status:
              preferences.push !== false
                ? 'Pending'
                : 'Skipped'
          }
        }
      });

    // =================================
    // EMAIL CHANNEL — BREVO REST API
    // =================================
    if (preferences.email !== false) {
      try {
        await sendEmail({
          to: user.email,
          subject: title,
          text: message
        });

        notification.channels.email.status =
          'Sent';

        notification.channels.email.sentAt =
          new Date();

        notification.channels.email.error =
          '';

        console.log(
          `✅ ${templateKey} email sent to ${user.email}`
        );
      } catch (emailError) {
        notification.channels.email.status =
          'Failed';

        notification.channels.email.error =
          emailError.message;

        console.error(
          `❌ ${templateKey} email failed for ${user.email}: ${emailError.message}`
        );
      }
    }

    // Push channel simulated
    if (preferences.push !== false) {
      notification.channels.push.status =
        'Sent';

      notification.channels.push.sentAt =
        new Date();

      notification.channels.push.error =
        '';
    }

    await notification.save();

    return notification;
  } catch (error) {
    /*
     * Notification failure ki wajah se booking
     * ya cancellation request fail nahi hogi.
     */
    console.error(
      'Notification helper error:',
      error.message
    );

    return null;
  }
}

/**
 * Failed notification delivery retry
 */
async function retryNotification(
  notificationId,
  userId
) {
  const notification =
    await Notification.findOne({
      _id: notificationId,
      user: userId
    });

  if (!notification) {
    throw new Error(
      'Notification not found'
    );
  }

  if (
    notification.retryCount >=
    notification.maxRetries
  ) {
    throw new Error(
      'Maximum retry attempts reached'
    );
  }

  const user =
    await User.findById(userId);

  if (!user) {
    throw new Error(
      'User not found'
    );
  }

  notification.retryCount += 1;

  // Retry failed email through Brevo
  if (
    notification.channels.email.enabled &&
    notification.channels.email.status ===
      'Failed'
  ) {
    try {
      await sendEmail({
        to: user.email,
        subject: notification.title,
        text: notification.message
      });

      notification.channels.email.status =
        'Sent';

      notification.channels.email.sentAt =
        new Date();

      notification.channels.email.error =
        '';

      console.log(
        `✅ Retried email sent to ${user.email}`
      );
    } catch (emailError) {
      notification.channels.email.status =
        'Failed';

      notification.channels.email.error =
        emailError.message;

      console.error(
        `❌ Retried email failed for ${user.email}: ${emailError.message}`
      );
    }
  }

  // Retry simulated push
  if (
    notification.channels.push.enabled &&
    notification.channels.push.status ===
      'Failed'
  ) {
    notification.channels.push.status =
      'Sent';

    notification.channels.push.sentAt =
      new Date();

    notification.channels.push.error =
      '';
  }

  await notification.save();

  return notification;
}

module.exports = {
  sendNotification,
  retryNotification
};