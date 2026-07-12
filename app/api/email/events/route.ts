import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getRepo } from "@/app/admin/email/_lib/data/repo";

// Resend delivery + engagement webhook (separate from the inbound-mail webhook).
// When open + click tracking is enabled for the domain, Resend POSTs these events
// for OUTBOUND mail we sent. We match each one to the sent message by its Resend
// id (provider_message_id) and stamp the tracking columns, so the inbox can show
// a read-receipt. Metadata only; no body fetch needed.
//
// Setup (server-only): add a SECOND webhook in the Resend dashboard pointing at
// /api/email/events, subscribe it to the delivered/opened/clicked/bounced/
// complained events, and put its signing secret in RESEND_EVENTS_WEBHOOK_SECRET.
// Until that secret is set this endpoint no-ops (200) so Resend does not retry.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRACKED = new Set([
  "email.delivered",
  "email.opened",
  "email.clicked",
  "email.bounced",
  "email.complained",
]);

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.RESEND_EVENTS_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;

  // Not configured yet: 200 so Resend does not retry-storm.
  if (!webhookSecret || !apiKey) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const raw = await request.text();
  const resend = new Resend(apiKey);

  // Verify the Svix signature before trusting anything.
  let event: { type?: string; created_at?: string; data?: { email_id?: string; created_at?: string } };
  try {
    event = resend.webhooks.verify({
      payload: raw,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    }) as typeof event;
  } catch (err) {
    console.error("[email-events] signature verification failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const type = event.type ?? "";
  if (!TRACKED.has(type)) {
    return NextResponse.json({ ok: true, ignored: type });
  }

  const providerMessageId = event.data?.email_id ?? "";
  if (!providerMessageId) {
    return NextResponse.json({ ok: true, ignored: "no-email-id" });
  }

  // Prefer the event's own timestamp; fall back to the envelope created_at.
  const at = event.data?.created_at || event.created_at || new Date().toISOString();

  try {
    const repo = await getRepo();
    await repo.recordEmailEvent(providerMessageId, type, at);
    return NextResponse.json({ ok: true, type, providerMessageId });
  } catch (err) {
    console.error("[email-events] failed to record", type, providerMessageId, err);
    return NextResponse.json({ error: "could not record event" }, { status: 500 });
  }
}
