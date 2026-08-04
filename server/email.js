import "./envSetup.ts";
import { Resend } from "resend";

let resend = null;

function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY,
    notificationEmail: process.env.RESEND_NOTIFICATION_EMAIL ?? "Info@lizaz.ae",
    fromEmail: process.env.RESEND_FROM_EMAIL ?? "Lizaz <noreply@lizaz.ae>",
  };
}

function getResendClient() {
  const { apiKey } = getResendConfig();

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!resend) {
    resend = new Resend(apiKey);
  }

  return resend;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildContactEmailHtml(contact) {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const rows = [
    ["Name", fullName],
    ["Email", contact.email],
    ["Phone", contact.phone || "Not provided"],
    ["Service", contact.service || "Not specified"],
    ["Subject", contact.subject || "Not specified"],
    ["Message", contact.message],
  ];

  const tableRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 600; width: 160px; vertical-align: top; color: #333;">
            ${escapeHtml(label)}
          </td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555; white-space: pre-wrap;">
            ${escapeHtml(value)}
          </td>
        </tr>`,
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
      <h2 style="margin: 0 0 16px; color: #141d3d;">New Contact Inquiry</h2>
      <p style="margin: 0 0 20px; color: #666;">
        A new contact form submission was received on the Lizaz website.
      </p>
      <table style="width: 100%; border-collapse: collapse; background: #fafafa; border: 1px solid #eee; border-radius: 8px;">
        <tbody>${tableRows}</tbody>
      </table>
    </div>
  `;
}

export async function sendContactNotificationEmail(contact) {
  const client = getResendClient();
  const { notificationEmail, fromEmail } = getResendConfig();
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const subject = `New Contact Inquiry — ${fullName || contact.email}`;

  const { error } = await client.emails.send({
    from: fromEmail,
    to: [notificationEmail],
    replyTo: contact.email,
    subject,
    html: buildContactEmailHtml(contact),
  });

  if (error) {
    throw new Error(error.message);
  }
}
