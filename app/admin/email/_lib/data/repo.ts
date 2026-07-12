import type { PendingAttachment } from "@/app/admin/email/_lib/types";

// The data-layer seam for the email inbox (ported from newnei-app's Care
// system). Phase 1.2 defines only the methods the webhook routes call; the
// rest of the interface (thread list, thread detail, replies, tags, notes,
// staff prefs, ...) arrives with the Supabase implementation in Phase 1.3.

export interface SupportRepo {
  // Outbound delivery/engagement tracking: stamp a Resend event (delivered,
  // opened, clicked, bounced, complained) onto the sent message that carries
  // this provider_message_id. Calls the support_message_mark_email_event RPC.
  recordEmailEvent(providerMessageId: string, type: string, atIso: string): Promise<void>;
  // Inject an inbound customer message as a new open thread (finds or creates
  // the contact by email). Returns the thread id. Used by the real
  // inbound-email webhook and the Test Lab simulator; pass `note` to set the
  // note on a newly created contact.
  createInboundMessage(input: {
    name: string;
    email: string;
    subject: string;
    body: string;
    // The original HTML body, stored verbatim for faithful rich rendering later
    // (sanitized at render time). Plain-text sources leave this null and the
    // inbox falls back to body_text.
    bodyHtml?: string | null;
    locale?: string;
    note?: string;
    toAddress?: string; // the full original To list (joined); the inbox pill + filter read it
    ccAddress?: string; // the full original Cc list (joined), so staff can see + reply to all
    attachments?: PendingAttachment[];
  }): Promise<string>;
  // Inbound threading: when a reply's subject carries the ticket's EC-#####
  // reference, append the message to that existing thread instead of opening a
  // new one, so back-and-forth stays on a single conversation. A customer reply
  // also bumps the activity time and reopens a resolved ticket. Returns the
  // thread id, or null when no thread matches that reference (the caller then
  // opens a new ticket via createInboundMessage).
  appendInboundToThreadByReference(
    reference: string,
    msg: {
      name: string;
      email: string;
      body: string;
      bodyHtml?: string | null; // original HTML, stored verbatim (see createInboundMessage)
      toAddress?: string;
      ccAddress?: string;
      attachments?: PendingAttachment[];
    },
  ): Promise<string | null>;
}

// The only backend is Supabase (the Evercool project). All reads and writes run
// server-side through the service-role client (RLS is locked to service_role).
let cached: SupportRepo | null = null;

export async function getRepo(): Promise<SupportRepo> {
  if (cached) return cached;
  // Phase 1.3 replaces this with:
  //   const { SupabaseRepo } = await import("@/app/admin/email/_lib/data/supabase-repo");
  //   cached = new SupabaseRepo();
  throw new Error("SupportRepo not ported yet (Phase 1.3); webhooks cannot store mail until then.");
}
