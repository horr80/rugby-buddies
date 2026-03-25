import nodemailer from "nodemailer";

export { blastEmailTemplate } from "./email-templates";

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const transporter = getTransporter();
  const recipients = Array.isArray(to) ? to.join(", ") : to;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "Rugby Buddy <noreply@rugbybuddies.co.uk>",
    to: recipients,
    subject,
    html,
  });
}

export function reminderEmailTemplate(
  childName: string,
  sessionDate: string,
  blockTitle: string,
  location: string,
  time: string,
  customMessage: string
) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px;">
      <div style="background: #2D5F2D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🏉 Rugby Buddy</h1>
        <p style="margin: 5px 0 0;">Session Reminder</p>
      </div>
      <div style="background: white; padding: 20px; border-radius: 0 0 8px 8px;">
        <p>Hi there!</p>
        <p>${customMessage}</p>
        <div style="background: #f0f7f0; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <p style="margin: 5px 0;"><strong>Player:</strong> ${childName}</p>
          <p style="margin: 5px 0;"><strong>Session:</strong> ${blockTitle}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${sessionDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${time}</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
        </div>
        <p>See you on the pitch!</p>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">Rugby Buddy - www.rugbybuddies.co.uk</p>
      </div>
    </div>
  `;
}

