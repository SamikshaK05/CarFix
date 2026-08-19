import nodemailer from 'nodemailer';

/**
 * @desc    Send email utility using nodemailer
 * @param   {Object} options - { to, subject, html, text }
 */
export const sendEmail = async (options) => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL || 'noreply@carfix.com';
  const fromName = process.env.FROM_NAME || 'CarFix Support';

  // If SMTP host/user is missing, log notice and skip actual send to prevent crash
  if (!host || !host.trim() || !user || !user.trim()) {
    console.warn('[Email Service] SMTP parameters missing in backend/.env. Real email delivery pending SMTP configuration.');
    return {
      sent: false,
      message: 'SMTP credentials missing in environment',
    };
  }

  const transporter = nodemailer.createTransport({
    host: host.trim(),
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: user.trim(),
      pass: pass ? pass.trim() : '',
    },
  });

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Email Service] Email sent to ${options.to}: ${info.messageId}`);
  return { sent: true, messageId: info.messageId };
};

export default sendEmail;
