import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { HONEYPOT_FIELD, isBot, tooLong, LIMITS } from "@/lib/spam";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Silently accept-and-drop bot submissions (honeypot filled).
    if (isBot(formData.get(HONEYPOT_FIELD))) {
      return NextResponse.json({ success: true });
    }

    const admin = createAdminClient();

    // Extract fields
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = (formData.get("email") as string) || null;
    const propertyType = formData.get("propertyType") as string;
    const serviceType = formData.get("serviceType") as string;
    const areaSqm = formData.get("areaSqm") as string;
    const numRooms = formData.get("numRooms") as string;
    const currentAcCount = formData.get("currentAcCount") as string;
    const humidityConcern = formData.get("humidityConcern") === "true";
    const moldVisible = formData.get("moldVisible") === "true";
    const coastalLocation = formData.get("coastalLocation") === "true";
    const notes = (formData.get("notes") as string) || null;
    const preferredLang = (formData.get("preferredLang") as string) || "en";
    const preferredTier = (formData.get("preferredTier") as string) || null;

    // Validate required fields
    if (!name || !phone || !propertyType || !serviceType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (tooLong(
      [name, LIMITS.name], [phone, LIMITS.phone], [email, LIMITS.email],
      [notes, LIMITS.message], [propertyType, LIMITS.shortText], [serviceType, LIMITS.shortText],
    )) {
      return NextResponse.json({ error: "One or more fields are too long" }, { status: 400 });
    }

    // Upload photos
    const photoPaths: string[] = [];
    const photos = formData.getAll("photos") as File[];
    for (const photo of photos) {
      if (photo.size > 0) {
        const buffer = Buffer.from(await photo.arrayBuffer());
        const ext = photo.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await admin.storage
          .from("quote-photos")
          .upload(fileName, buffer, {
            contentType: photo.type,
            upsert: false,
          });

        if (!uploadError) {
          photoPaths.push(fileName);
        }
      }
    }

    // Insert quote
    const { data, error } = await admin.from("quotes").insert({
      name,
      phone,
      email,
      property_type: propertyType,
      service_type: serviceType,
      area_sqm: areaSqm ? Number(areaSqm) : null,
      num_rooms: numRooms ? Number(numRooms) : null,
      current_ac_count: currentAcCount ? Number(currentAcCount) : null,
      humidity_concern: humidityConcern,
      mold_visible: moldVisible,
      coastal_location: coastalLocation,
      photo_paths: photoPaths,
      notes,
      preferred_language: preferredLang,
      preferred_tier: preferredTier,
      status: "new",
    }).select("id").single();

    if (error) {
      console.error("Quote insert error:", error);
      return NextResponse.json({ error: "Failed to save quote" }, { status: 500 });
    }

    // Send email notification (non-blocking — don't fail if email fails)
    try {
      const { sendEmail, escapeHtml } = await import("@/lib/email/send");
      const nameEsc = escapeHtml(name);
      const phoneEsc = escapeHtml(phone);
      const emailEsc = escapeHtml(email);
      const propertyTypeEsc = escapeHtml(propertyType);
      const areaSqmEsc = escapeHtml(areaSqm);
      const numRoomsEsc = escapeHtml(numRooms);
      const serviceTypeEsc = escapeHtml(serviceType);
      const preferredTierEsc = escapeHtml(preferredTier);
      const notesEsc = notes ? escapeHtml(notes).replace(/\n/g, "<br>") : "";
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const now = new Date().toLocaleString("en-GB", {
        timeZone: "Asia/Bangkok",
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
      const photoLinksHtml = photoPaths.length > 0
        ? photoPaths.map((p, i) => {
            const url = `${supabaseUrl}/storage/v1/object/public/quote-photos/${p}`;
            return `<a href="${url}" style="display:inline-block;margin:4px 6px 4px 0;padding:6px 14px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;color:#003554;text-decoration:none;font-weight:600;">📷 Photo ${i + 1}</a>`;
          }).join("")
        : `<p style="margin:0;font-size:13px;color:#94a3b8;">No photos attached</p>`;

      await sendEmail({
        to: "hello@evercoolthailand.com",
        subject: `New quote request from ${nameEsc}`,
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
          <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;line-height:1.2;">New Quote Request</h1>
          <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.45);">${now} · Bangkok time</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;">

          <!-- Contact details -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="padding:10px 14px;background:#f8fafc;border-radius:8px 8px 0 0;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">From</p>
              <p style="margin:3px 0 0;font-size:16px;font-weight:700;color:#0f172a;">${nameEsc}</p>
            </td></tr>
            <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Phone</p>
              <p style="margin:3px 0 0;font-size:14px;color:#0f172a;">${phoneEsc}</p>
            </td></tr>
            ${email ? `<tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Email</p>
              <p style="margin:3px 0 0;font-size:14px;color:#0f172a;">${emailEsc}</p>
            </td></tr>` : ""}
            <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Property</p>
              <p style="margin:3px 0 0;font-size:14px;color:#0f172a;">${propertyTypeEsc} ${areaSqm ? `· ${areaSqmEsc} m²` : ""} ${numRooms ? `· ${numRoomsEsc} rooms` : ""}</p>
            </td></tr>
            <tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Service</p>
              <p style="margin:3px 0 0;font-size:14px;color:#0f172a;text-transform:capitalize;">${serviceTypeEsc.replace(/-/g, " ")}</p>
            </td></tr>
            ${preferredTier ? `<tr><td style="padding:10px 14px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Preferred Tier</p>
              <p style="margin:3px 0 0;font-size:14px;color:#0f172a;text-transform:capitalize;">${preferredTierEsc}</p>
            </td></tr>` : ""}
            <tr><td style="padding:10px 14px;background:#f8fafc;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Concerns</p>
              <p style="margin:3px 0 0;font-size:13px;color:#0f172a;">
                ${[humidityConcern && "High Humidity", moldVisible && "Mold / Musty Smell", coastalLocation && "Coastal / Island"].filter(Boolean).join(" · ") || "None flagged"}
              </p>
            </td></tr>
          </table>

          ${notes ? `<!-- Notes -->
          <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Notes</p>
          <div style="background:#f8fafc;border-left:3px solid #00b2d4;border-radius:0 8px 8px 0;padding:16px 18px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#334155;line-height:1.7;">${notesEsc}</p>
          </div>` : ""}

          <!-- Photos -->
          <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Photos (${photoPaths.length})</p>
          <div style="margin-bottom:8px;">${photoLinksHtml}</div>

        </td></tr>

        <!-- CTA -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0;">
          <a href="tel:+${phone.replace(/\D/g, "")}" style="display:inline-block;background:#00b2d4;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;padding:10px 22px;border-radius:8px;margin-right:10px;">Call Back</a>
          ${email ? `<a href="mailto:${encodeURIComponent(email)}" style="display:inline-block;background:#ffffff;color:#003554;font-size:13px;font-weight:700;text-decoration:none;padding:10px 22px;border-radius:8px;border:1px solid #e2e8f0;">Reply by Email</a>` : ""}
          <p style="margin:14px 0 0;font-size:11px;color:#94a3b8;">Quote #${data.id} · submitted via evercoolthailand.com</p>
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

    return NextResponse.json({ success: true, quoteId: data.id });
  } catch (err) {
    console.error("Quote API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
