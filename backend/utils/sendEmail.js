const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text }) => {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"TED BUS" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
      });

      console.log(`📧 Email sent to ${to}`);
      return { success: true };
    } else {
      console.log(`📧 [SIMULATED] Email to ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${text}`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error('Email sending failed:', error.message);
    throw error;
  }
};

module.exports = sendEmail;