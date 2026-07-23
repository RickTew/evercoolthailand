import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { HONEYPOT_FIELD, isBot, tooLong, LIMITS } from "@/lib/spam";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, subject, message } = body;

    // Silently accept-and-drop bot submissions (honeypot filled).
    if (isBot(body[HONEYPOT_FIELD])) {
      return NextResponse.json({ success: true });
    }

    if (!name || !phone || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (tooLong(
      [name, LIMITS.name], [phone, LIMITS.phone], [email, LIMITS.email],
      [subject, LIMITS.subject], [message, LIMITS.message],
    )) {
      return NextResponse.json({ error: "One or more fields are too long" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error } = await admin.from("contact_messages").insert({
      name,
      phone,
      email: email || null,
      subject: subject || "General Inquiry",
      message,
    });

    if (error) {
      console.error("Contact insert error:", error);
      return NextResponse.json({ error: "Failed to save message" }, { status: 500 });
    }

    // The form is a CRM channel (Rick, 13 Jul): every submission opens a ticket
    // in the shared queue, like an inbound email, so staff work ONE list and
    // replies land on the contact's history. Blocked senders file straight to
    // the Spam folder. Failure here must not lose the submission (it is already
    // in contact_messages above), so this block only logs.
    try {
      const { getRepo } = await import("@/app/admin/email/_lib/data/repo");
      const repo = await getRepo();
      const senderEmail = (email || "").trim().toLowerCase();
      // A contact record needs an email; a phone-only submission gets a
      // clearly-fake placeholder (".invalid" never routes) so staff can see
      // there is no address to reply to.
      const contactEmail =
        senderEmail || `phone-${String(phone).replace(/\D/g, "") || "unknown"}@no-email.invalid`;
      const blocked = senderEmail ? await repo.matchBlockedSender(senderEmail) : null;
      if (blocked) await repo.recordBlockedHit(blocked.id);
      await repo.createInboundMessage({
        name,
        email: contactEmail,
        subject: subject || "General Inquiry",
        body: `${message}\n\nPhone: ${phone}`,
        toAddress: "info@evercoolthailand.com",
        note: "Created from the website contact form.",
        spamStatus: blocked ? "confirmed" : null,
        authResults: blocked
          ? { reasons: [`The sender matches the blocked list (${blocked.pattern}).`] }
          : null,
      });
    } catch (e) {
      console.error("[contact] could not open a CRM ticket:", e);
    }

    // Non-blocking email notification
    try {
      const { sendEmail, escapeHtml } = await import("@/lib/email/send");
      const nameEsc = escapeHtml(name);
      const phoneEsc = escapeHtml(phone);
      const emailEsc = escapeHtml(email);
      const subjectEsc = escapeHtml(subject);
      const messageEsc = escapeHtml(message).replace(/\n/g, "<br>");
      const now = new Date().toLocaleString("en-GB", {
        timeZone: "Asia/Bangkok",
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      await sendEmail({
        to: "hello@evercoolthailand.com",
        subject: `New enquiry from ${nameEsc}`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:#003554;border-radius:12px 12px 0 0;padding:28px 32px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#00b2d4;letter-spacing:2px;text-transform:uppercase;">Evercool Thailand</p>
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;">New Website Enquiry</h1>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.45);">${now} · Bangkok time</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;">

          <!-- Caller details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:10px 14px;background:#f8fafc;border-radius:8px 8px 0 0;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">From</p>
                <p style="margin:3px 0 0;font-size:16px;font-weight:700;color:#0f172a;">${nameEsc}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Phone</p>
                <p style="margin:3px 0 0;font-size:14px;color:#0f172a;">${phoneEsc}</p>
              </td>
            </tr>
            ${email ? `<tr>
              <td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Email</p>
                <p style="margin:3px 0 0;font-size:14px;color:#0f172a;">${emailEsc}</p>
              </td>
            </tr>` : ""}
            ${subject ? `<tr>
              <td style="padding:10px 14px;background:#f8fafc;border-radius:0 0 8px 8px;">
                <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Subject</p>
                <p style="margin:3px 0 0;font-size:14px;color:#0f172a;">${subjectEsc}</p>
              </td>
            </tr>` : ""}
          </table>

          <!-- Message -->
          <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Message</p>
          <div style="background:#f8fafc;border-left:3px solid #00b2d4;border-radius:0 8px 8px 0;padding:16px 18px;">
            <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">${messageEsc}</p>
          </div>

        </td></tr>

        <!-- CTA -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0;">
          <a href="tel:+${phone.replace(/\D/g, "")}" style="display:inline-block;background:#00b2d4;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 22px;border-radius:8px;margin-right:10px;">Call Back</a>
          ${email ? `<a href="mailto:${encodeURIComponent(email)}" style="display:inline-block;background:#ffffff;color:#003554;font-size:13px;font-weight:700;text-decoration:none;padding:10px 22px;border-radius:8px;border:1px solid #e2e8f0;">Reply by Email</a>` : ""}
          <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;">This message was submitted via the contact form at evercoolthailand.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
    } catch {
      // Email failure is non-critical
    }

    // Confirmation to the customer (non-blocking). The contact form has no
    // language field, so the intro carries both languages.
    if (email) {
      try {
        const { sendEmail } = await import("@/lib/email/send");
        const { customerConfirmationHtml } = await import("@/lib/email/customerConfirmation");
        await sendEmail({
          to: email,
          subject: "We received your message | เราได้รับข้อความของคุณแล้ว",
          html: customerConfirmationHtml({
            lang: "en",
            heading: "Message received",
            intro: `Hi ${name}, thank you for contacting EverCool Thailand. We will reply within 24 hours (Mon to Sat). สวัสดีคุณ${name} ขอบคุณที่ติดต่อ EverCool Thailand เราจะตอบกลับภายใน 24 ชั่วโมง (จันทร์ถึงเสาร์)`,
            rows: [["Subject", subject || "General Inquiry"]],
          }),
        });
      } catch {
        // Confirmation failure is non-critical
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
