const BREVO_API_URL =
  'https://api.brevo.com/v3/smtp/email';

/**
 * Brevo Transactional Email REST API
 *
 * Existing usage same rahega:
 *
 * await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Your OTP',
 *   text: 'Your OTP is 123456'
 * });
 */
const sendEmail = async ({
  to,
  subject,
  text,
  html
}) => {
  try {
    const apiKey =
      process.env.BREVO_API_KEY;

    const senderEmail =
      process.env.BREVO_SENDER_EMAIL;

    const senderName =
      process.env.BREVO_SENDER_NAME ||
      'TED BUS';

    // Required environment variables check
    if (!apiKey) {
      throw new Error(
        'BREVO_API_KEY is missing'
      );
    }

    if (!senderEmail) {
      throw new Error(
        'BREVO_SENDER_EMAIL is missing'
      );
    }

    if (!to) {
      throw new Error(
        'Recipient email is required'
      );
    }

    if (!subject) {
      throw new Error(
        'Email subject is required'
      );
    }

    if (!text && !html) {
      throw new Error(
        'Email text or HTML content is required'
      );
    }

    /**
     * Single email aur email array,
     * dono support honge.
     */
    const recipients = (
      Array.isArray(to) ? to : [to]
    )
      .map(recipient => {
        if (typeof recipient === 'string') {
          return {
            email: recipient.trim()
          };
        }

        return {
          email: String(
            recipient.email || ''
          ).trim(),

          ...(recipient.name
            ? {
                name: String(
                  recipient.name
                ).trim()
              }
            : {})
        };
      })
      .filter(
        recipient => recipient.email
      );

    if (recipients.length === 0) {
      throw new Error(
        'Valid recipient email is required'
      );
    }

    const payload = {
      sender: {
        name: senderName,
        email: senderEmail
      },

      to: recipients,

      subject,

      ...(text
        ? {
            textContent: text
          }
        : {}),

      ...(html
        ? {
            htmlContent: html
          }
        : {})
    };

    const response = await fetch(
      BREVO_API_URL,
      {
        method: 'POST',

        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': apiKey
        },

        body: JSON.stringify(payload)
      }
    );

    const responseText =
      await response.text();

    let responseData = {};

    if (responseText) {
      try {
        responseData =
          JSON.parse(responseText);
      } catch {
        responseData = {
          message: responseText
        };
      }
    }

    if (!response.ok) {
      const brevoMessage =
        responseData?.message ||
        responseData?.code ||
        'Unknown Brevo API error';

      throw new Error(
        `Brevo API error (${response.status}): ${brevoMessage}`
      );
    }

    console.log(
      `📧 Brevo email sent successfully to ${recipients
        .map(recipient => recipient.email)
        .join(', ')}`
    );

    return {
      success: true,
      messageId:
        responseData?.messageId || null
    };
  } catch (error) {
    console.error(
      'Brevo email sending failed:',
      error.message
    );

    throw error;
  }
};

module.exports = sendEmail;