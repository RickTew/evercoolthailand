import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const admin = createAdminClient();

    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const email = (formData.get("email") as string) || null;
    const serviceSlug = formData.get("serviceSlug") as string;
    const serviceName = formData.get("serviceName") as string;
    const bookingDate = formData.get("bookingDate") as string;
    const bookingTime = formData.get("bookingTime") as string;
    const area = formData.get("area") as string;
    const address = formData.get("address") as string;
    const notes = (formData.get("notes") as string) || null;
    const preferredLanguage = (formData.get("preferredLanguage") as string) || "en";

    if (!name || !phone || !serviceSlug || !bookingDate || !bookingTime || !area || !address) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
          .upload(`bookings/${fileName}`, buffer, { contentType: photo.type, upsert: false });
        if (!uploadError) photoPaths.push(fileName);
      }
    }

    const { data, error } = await admin.from("bookings").insert({
      name, phone, email,
      service_slug: serviceSlug,
      service_name: serviceName,
      booking_date: bookingDate,
      booking_time: bookingTime,
      area, address,
      photo_paths: photoPaths,
      notes,
      preferred_language: preferredLanguage,
      status: "pending",
    }).select("id").single();

    if (error) {
      console.error("Booking insert error:", error);
      return NextResponse.json({ error: "Failed to save booking" }, { status: 500 });
    }

    // Non-blocking email
    try {
      const { sendEmail, escapeHtml } = await import("@/lib/email/send");
      await sendEmail({
        to: "info@evercoolthailand.com",
        subject: `New Booking: ${serviceName} on ${bookingDate} at ${bookingTime}`,
        html: `
          <h2>New Service Booking</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
          ${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ""}
          <p><strong>Service:</strong> ${escapeHtml(serviceName)}</p>
          <p><strong>Date:</strong> ${escapeHtml(bookingDate)} at ${escapeHtml(bookingTime)}</p>
          <p><strong>Area:</strong> ${escapeHtml(area)}</p>
          <p><strong>Address:</strong> ${escapeHtml(address)}</p>
          ${notes ? `<p><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ""}
          <p><strong>Photos:</strong> ${photoPaths.length}</p>
        `,
      });
    } catch {
      // Email failure is non-critical
    }

    return NextResponse.json({ success: true, bookingId: data.id });
  } catch (err) {
    console.error("Booking API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
