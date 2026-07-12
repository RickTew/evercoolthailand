import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { extractReference } from "@/app/admin/email/_lib/mail/inbound";
import { putAttachment } from "@/app/admin/email/_lib/storage/attachments";
import type { PendingAttachment } from "@/app/admin/email/_lib/types";

// Inbound email webhook. Resend receives mail sent to the verified domain
// (e.g. hi@evercoolthailand.com), stores it, and POSTs an `email.received`
// event here. The event carries metadata only, so we fetch the full body via
// the Receiving API, then turn the message into a ticket in the shared inbox.
// This is what replaces the old A2 Hosting mailboxes: replies land in the
// admin Email module instead.
//
// Resend stores every inbound email even if this endpoint is missing or errors,
// so nothing is lost while the domain/webhook is still being set up.
//
// Config (all server-only): RESEND_API_KEY (fetch the body) and
// RESEND_INBOUND_WEBHOOK_SECRET (the signing secret from the Resend webhook).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Somchai <somchai@example.com>" -> { name, email }; bare addresses pass through.
function parseFrom(from: string): { name: string; email: string } {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim() };
  return { name: "", email: from.trim() };
}

// Resend's `to` / `cc` can be a string or a string[]; normalize to bare addresses.
function addressList(v: unknown): string[] {
  const parts = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  return parts
    .filter((x): x is string => typeof x === "string")
    .map((s) => (s.match(/<([^>]+)>/)?.[1] ?? s).trim().toLowerCase())
    .filter(Boolean);
}

// Which of OUR addresses the mail was sent to (hi@, later per-staff addresses).
// The whole domain routes into the shared inbox, so this is the only signal of
// which inbox it landed in; we store it as the message's to_address so the team
// can tell them apart. Returns the first @evercoolthailand.com address across
// To then Cc, or null.
function pickInboxAddress(to: unknown, cc: unknown): string | null {
  return (
    [...addressList(to), ...addressList(cc)].find((a) =>
      a.endsWith("@evercoolthailand.com"),
    ) ?? null
  );
}

// The webhook and the Receiving GET are metadata/body only; the files come from
// the Receiving Attachments endpoint, each with a short-lived download_url.
// Best-effort BY DESIGN: an attachment failure must never cost the ticket, so
// every step degrades to "ticket without that file" instead of throwing.
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // the bucket's file_size_limit
const MAX_ATTACHMENTS = 8;

async function fetchInboundAttachments(
  apiKey: string,
  emailId: string,
): Promise<PendingAttachment[]> {
  const out: PendingAttachment[] = [];
  try {
    const res = await fetch(
      `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}/attachments`,
      { headers: { Authorization: `Bearer ${apiKey}` } },
    );
    if (!res.ok) {
      // 404 = an email with no attachments on some API versions; anything else
      // is worth a log line but still must not block the ticket.
      if (res.status !== 404) {
        console.error("[inbound] attachment list failed for", emailId, res.status);
      }
      return out;
    }
    const body = (await res.json()) as { data?: Array<Record<string, unknown>> };
    const items = Array.isArray(body?.data) ? body.data : [];
    for (const item of items.slice(0, MAX_ATTACHMENTS)) {
      const url = typeof item.download_url === "string" ? item.download_url : null;
      if (!url) continue;
      const fileName =
        (typeof item.filename === "string" && item.filename.trim()) || "attachment";
      const mime =
        (typeof item.content_type === "string" && item.content_type) ||
        "application/octet-stream";
      const fileRes = await fetch(url);
      if (!fileRes.ok) continue;
      const bytes = Buffer.from(await fileRes.arrayBuffer());
      if (bytes.length === 0 || bytes.length > MAX_ATTACHMENT_BYTES) {
        console.warn(`[inbound] skipping attachment ${fileName} (${bytes.length} bytes)`);
        continue;
      }
      out.push(await putAttachment("inbound", fileName, mime, bytes));
    }
  } catch (err) {
    console.error("[inbound] attachment ingest failed for", emailId, err);
  }
  return out;
}

// Last-resort plain text when an email has no text/plain part.
function htmlToText(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(p|div|br|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const webhookSecret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;

  // Not configured yet: 200 so Resend does not retry-storm. The email is still
  // safely stored on Resend and can be imported once we are wired.
  if (!apiKey || !webhookSecret) {
    console.warn("[inbound] RESEND_API_KEY / RESEND_INBOUND_WEBHOOK_SECRET not set; ignoring");
    return NextResponse.json({ ok: true, skipped: true });
  }

  const raw = await request.text();
  const resend = new Resend(apiKey);

  // 1. Verify the signature (Svix headers) before trusting anything.
  let event;
  try {
    event = resend.webhooks.verify({
      payload: raw,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret,
    });
  } catch (err) {
    console.error("[inbound] signature verification failed:", err);
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ ok: true, ignored: event.type });
  }

  // 2. Fetch the full email (the webhook is metadata only).
  const emailId = event.data.email_id;
  const { data: full, error } = await resend.emails.receiving.get(emailId);
  if (error || !full) {
    // 502 -> Resend retries later, by which point the body is fetchable.
    console.error("[inbound] could not fetch received email", emailId, error);
    return NextResponse.json({ error: "could not fetch email" }, { status: 502 });
  }

  // 3. Turn it into a ticket.
  const { name, email } = parseFrom(full.from);

  // Don't ingest our OWN outbound mail looping back in. All @evercoolthailand.com
  // inbound routes into the shared inbox, so a notification we send (e.g. a
  // system email sent hi@ -> hi@) would otherwise create a junk ticket. Skip
  // anything from our own send/notify addresses.
  const ownAddresses = [
    process.env.SUPPORT_FROM_ADDRESS,
    process.env.SUPPORT_NOTIFY_ADDRESS,
    "hi@evercoolthailand.com",
  ]
    .map((a) => (a ? (a.match(/<([^>]+)>/)?.[1] ?? a).trim().toLowerCase() : ""))
    .filter(Boolean);
  if (ownAddresses.includes(email.trim().toLowerCase())) {
    console.log(`[inbound] ignoring self-sent mail from ${email} (notification loop)`);
    return NextResponse.json({ ok: true, ignored: "self" });
  }

  // Reject mail that is not addressed to us. Resend fans `email.received` out
  // account-wide with no per-domain scoping, so if the account ever hosts more
  // than one domain this webhook also receives mail meant for other domains,
  // which would file junk tickets. Legit Evercool inbound always carries an
  // @evercoolthailand.com address in To or Cc, so when pickInboxAddress finds
  // none, the mail is for some other domain: drop it. This also tells us which
  // Evercool inbox it landed in, stored below as the message's to_address; all
  // addresses share the queue.
  const inboxAddress = pickInboxAddress(
    (full as { to?: unknown }).to,
    (full as { cc?: unknown }).cc,
  );
  if (!inboxAddress) {
    console.log(
      `[inbound] ignoring foreign-domain mail from ${email} (no @evercoolthailand.com recipient)`,
    );
    return NextResponse.json({ ok: true, ignored: "foreign-domain" });
  }

  // Capture EVERY recipient (the full To and Cc), not just the one inbox
  // address, so the inbox can see that a mail was also sent to / cc'd other
  // people (e.g. a customer's own address or a colleague) and "reply to all"
  // works. We store the whole To list as the message's to_address and the whole
  // Cc list as cc_address.
  const toList = addressList((full as { to?: unknown }).to);
  const ccList = addressList((full as { cc?: unknown }).cc);
  const toAddress = toList.join(", ") || inboxAddress;
  const ccAddress = ccList.join(", ");

  const subject = full.subject || "(no subject)";
  const body = (full.text?.trim() || htmlToText(full.html)) || "(no message body)";
  // Keep the original HTML verbatim so the inbox can render complex mail
  // faithfully later (sanitized at render time). body_text above stays the
  // plain fallback.
  const bodyHtml = full.html?.trim() ? full.html : null;
  const attachments = await fetchInboundAttachments(apiKey, emailId);

  try {
    const repo = await getRepo();

    // Threading: if the subject carries an EC-##### reference, append the
    // reply to that existing thread. Fall back to a new ticket when there is no
    // reference, or the referenced thread no longer exists.
    const reference = extractReference(subject);
    if (reference) {
      const appended = await repo.appendInboundToThreadByReference(reference, {
        name,
        email,
        body,
        bodyHtml,
        toAddress,
        ccAddress,
        attachments,
      });
      if (appended) {
        console.log(`[inbound] ${email} -> appended to ${reference} (thread ${appended})`);
        return NextResponse.json({ ok: true, threadId: appended, threaded: true });
      }
    }

    const threadId = await repo.createInboundMessage({
      name,
      email,
      subject,
      body,
      bodyHtml,
      toAddress,
      ccAddress,
      attachments,
      note: inboxAddress
        ? `Created from an inbound email to ${inboxAddress}.`
        : "Created from an inbound email to Evercool.",
    });
    console.log(`[inbound] ${email} -> support thread ${threadId}`);
    return NextResponse.json({ ok: true, threadId });
  } catch (err) {
    console.error("[inbound] failed to create support ticket:", err);
    return NextResponse.json({ error: "could not create ticket" }, { status: 500 });
  }
}
