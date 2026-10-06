const nodemailer = require("nodemailer");
const { smtp, emailFrom, nodeEnv } = require("../config/env");

// If SMTP credentials aren't configured (common in local dev / this
// sandbox, which has no outbound network access), fall back to a
// transport that just logs the email to the console instead of
// throwing. This keeps every code path that "sends an email"
// runnable without requiring a real mail provider to be set up.
const isSmtpConfigured = Boolean(smtp.host && smtp.user && smtp.pass);

let transporter;
if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
} else {
  transporter = {
    sendMail: async (options) => {
      if (nodeEnv !== "test") {
        // eslint-disable-next-line no-console
        console.log(
          `[email:console-fallback] SMTP not configured — would have sent:\n` +
            `  To: ${options.to}\n  Subject: ${options.subject}\n  Body:\n${options.text}\n`
        );
      }
      return { messageId: "console-fallback" };
    },
  };
}

// Sends an email and never throws — a failed/unconfigured email
// should never break the appointment action that triggered it
// (e.g. confirming an appointment must succeed even if the email
// provider is temporarily down). Errors are logged, not propagated.
async function sendEmail({ to, subject, text, html }) {
  if (!to) return null;
  try {
    return await transporter.sendMail({ from: emailFrom, to, subject, text, html });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[email] Failed to send "${subject}" to ${to}:`, err.message);
    return null;
  }
}

module.exports = { sendEmail, isSmtpConfigured };
