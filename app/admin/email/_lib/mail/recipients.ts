import type { ThreadDetail } from "@/app/admin/email/_lib/types";

// Recipient helpers shared by the inbox display (ThreadView) and the reply
// action, so "who else was on this mail" and "reply to all" agree on one source
// of truth.

// Split a stored recipient string ("a@x.com, b@y.com" or "Name <a@x.com>") into
// bare, lowercased, de-duped addresses. Handles comma- and semicolon-separated
// lists (the inbound webhook joins multiple To/Cc addresses with ", ").
export function splitAddresses(value: string | null | undefined): string[] {
  if (!value) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of value.split(/[,;]+/)) {
    const a = (part.match(/<([^>]+)>/)?.[1] ?? part).trim().toLowerCase();
    if (!a || seen.has(a)) continue;
    seen.add(a);
    out.push(a);
  }
  return out;
}

// Is this one of OUR own inbox addresses (every @evercoolthailand.com lands back
// in the shared queue, so they are never a "reply to all" target)?
export function isOwnInbox(address: string): boolean {
  return address.trim().toLowerCase().endsWith("@evercoolthailand.com");
}

// The OTHER human recipients on a thread, for "reply to all": every To/Cc address
// seen on the inbound (customer) messages, minus our own @evercoolthailand.com
// inbox addresses and the contact themselves (who is already the reply's To).
// De-duped, in first-seen order. Empty when the mail was addressed only to us,
// so the composer can hide the toggle.
export function otherThreadRecipients(detail: ThreadDetail): string[] {
  const contact = detail.contact.email.trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of detail.messages) {
    if (m.direction !== "inbound") continue;
    for (const a of [...splitAddresses(m.toAddress), ...splitAddresses(m.ccAddress)]) {
      if (isOwnInbox(a) || a === contact || seen.has(a)) continue;
      seen.add(a);
      out.push(a);
    }
  }
  return out;
}
