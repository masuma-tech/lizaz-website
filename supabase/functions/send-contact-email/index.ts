import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ContactPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  service?: string;
  subject?: string;
  message?: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildContactEmailHtml(contact: Required<
  Pick<ContactPayload, "firstName" | "lastName" | "email" | "message">
> & ContactPayload) {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const rows: [string, string][] = [
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

function validateContact(body: ContactPayload) {
  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const email = String(body.email || "").trim();
  const phone = String(body.phone || "").trim();
  const service = String(body.service || "").trim();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();

  if (!firstName || !lastName || !email || !message) {
    return { error: "Missing required fields" as const };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Valid email is required" as const };
  }

  return {
    contact: { firstName, lastName, email, phone, service, subject, message },
  };
}

async function sendResendEmail(contact: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  service?: string;
  subject?: string;
  message: string;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const notificationEmail = Deno.env.get("RESEND_NOTIFICATION_EMAIL") ?? "Info@lizaz.ae";
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "Lizaz <noreply@lizaz.ae>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const subject = `New Contact Inquiry — ${fullName || contact.email}`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [notificationEmail],
      reply_to: contact.email,
      subject,
      html: buildContactEmailHtml(contact),
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || "Failed to send email via Resend");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as ContactPayload;
    const validated = validateContact(body);
    if ("error" in validated) {
      return jsonResponse({ error: validated.error }, 400);
    }

    const { contact } = validated;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Supabase service credentials are not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: insertError } = await supabase.from("contacts").insert({
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone || "",
      service: contact.service || "",
      subject: contact.subject || "",
      message: contact.message,
    });

    if (insertError) {
      console.error("Failed to insert contact:", insertError);
      return jsonResponse({ error: "Failed to submit inquiry" }, 500);
    }

    let emailSent = true;
    try {
      await sendResendEmail(contact);
    } catch (emailError) {
      emailSent = false;
      console.error("Failed to send contact notification email:", emailError);
    }

    return jsonResponse({ ok: true, emailSent }, 201);
  } catch (error) {
    console.error("send-contact-email failed:", error);
    return jsonResponse({ error: "Failed to submit inquiry" }, 500);
  }
});
