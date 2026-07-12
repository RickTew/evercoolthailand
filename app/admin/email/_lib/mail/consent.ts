import type { Contact } from "@/app/admin/email/_lib/types";

// Email consent gate. Honored before outbound mail.
//
// The signal we gate on is `unsubscribed_at`: an explicit opt-out action (the
// customer clicked unsubscribe / withdrew consent). `consent_email` is a
// marketing OPT-IN flag and defaults false for support contacts (who simply
// emailed in), so it is deliberately NOT a block here, otherwise every
// legitimate support reply would be stopped.
//
// How the outbound paths apply it (see inbox actions):
//  - Single reply to a ticket the customer opened: TRANSACTIONAL, always allowed
//    (a person who contacts support must be able to receive an answer). We only
//    log when the contact has opted out, for the audit trail; the composer also
//    shows an "unsubscribed contact" notice.
//  - Brand-new outbound ("New Mail"): BLOCKED for an opted-out contact (a cold,
//    non-reply message is the marketing-risk case).
//  - Bulk "reply to several" (a broadcast): the opted-out contacts are SKIPPED
//    and reported, the rest still send.
export function isEmailOptedOut(contact: Pick<Contact, "unsubscribedAt">): boolean {
  return Boolean(contact.unsubscribedAt);
}
