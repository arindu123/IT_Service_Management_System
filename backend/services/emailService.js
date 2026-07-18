const nodemailer = require("nodemailer");

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true").toLowerCase() === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
};

const sendPasswordResetEmail = async ({ to, resetUrl, ttlMinutes }) => {
  const subject = "Reset your IT Management System password";
  const text = `A password reset was requested for your account. Open this one-time link within ${ttlMinutes} minutes: ${resetUrl}\n\nIf you did not request this, ignore this email.`;
  const html = `<p>A password reset was requested for your account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This one-time link expires in ${ttlMinutes} minutes.</p><p>If you did not request this, ignore this email.</p>`;

  return getTransporter().sendMail({ from: process.env.EMAIL_FROM || process.env.SMTP_USER, to, subject, text, html });
};

module.exports = { sendPasswordResetEmail };
