import type {
  BlockedSender,
  CannedResponse,
  Folder,
  MessageAuthResults,
  PendingAttachment,
  StaffPrefs,
  Tag,
  TeamMember,
  ThreadDetail,
  ThreadListItem,
  ThreadNote,
  ThreadStatus,
} from "@/app/admin/email/_lib/types";

// The data-layer seam for the email inbox (ported from newnei-app's Care
// system, trimmed: no AI drafts, no WhatsApp/webchat, no KB-fluid sync).
// The inbox screens and server actions depend only on this interface; the
// Supabase implementation lives in supabase-repo.ts.

// Filters the inbox thread list can apply.
export interface ThreadFilter {
  status?: ThreadStatus | "all";
  assigneeId?: string | "all" | "unassigned"; // a team member id, "all", or "unassigned"
  // "My desk" (the focused landing): tickets assigned to this person PLUS the
  // unclaimed ones (no assignee), so new mail never sits invisible waiting for
  // an owner. Wins over assigneeId when set.
  deskId?: string;
  // Folder view: active (not archived, the default), follow-ups only, archived,
  // trash (soft-deleted, restorable until purge), sent (threads with at
  // least one outbound message we actually sent), or spam (threads the filter
  // or a human flagged). Trashed threads are hidden from every other view, and
  // so are spam threads (they show ONLY in the spam view).
  view?: "active" | "followups" | "archived" | "trash" | "sent" | "spam";
  // Only tickets with a saved reply draft still waiting to be sent.
  pendingDraft?: boolean;
  // Only tickets in this custom folder. Replaces the active/archived axis.
  folderId?: string;
  // Only tickets carrying this topic tag.
  topicId?: string;
  // Only tickets whose contact is in this segment tag.
  segmentId?: string;
  // Only tickets that came to this Evercool address (hi@, ...), matched against
  // the inbound messages' recipient. All addresses share one queue.
  inbox?: string;
  // Restrict to tickets that came to ANY of these Evercool addresses. This is
  // how a per-staff inbox scope is enforced when it is turned on later: the page
  // resolves the allowed set and passes it here, so the restriction holds
  // server-side regardless of the `inbox` dropdown. An empty array = see nothing.
  // (Access model v1: admin sees all, so pages pass null.)
  inboxes?: string[];
  // Free-text search: matches across contact name/email, the subject, the
  // EC-##### reference, and message body. Layered as an AND on the other filters.
  q?: string;
  // Search scope: "all" (default) searches name/email + subject + message body;
  // "contact" narrows to the sender's name and email only; "text" narrows to
  // the subject and message body. The ticket reference (EC-#####) always
  // matches regardless of scope, so a handle lookup never fails.
  qmode?: "all" | "contact" | "text";
}

// Aggregate counts for the overview tiles. Computed by a cheap count-only
// query instead of hydrating a second full thread list.
export interface InboxCounts {
  total: number;
  open: number;
  pending: number;
  closed: number;
  unassigned: number;
  awaiting: number; // tickets with a saved reply draft still waiting to be sent
}

export interface SupportRepo {
  listTeam(): Promise<TeamMember[]>;
  listTags(): Promise<Tag[]>;
  listThreads(filter?: ThreadFilter): Promise<ThreadListItem[]>;
  // Cheap aggregate counts for the overview tiles, scoped to the same active /
  // topic / segment / inbox axis as listThreads so the tiles match the list.
  countThreads(filter?: {
    topicId?: string;
    segmentId?: string;
    inbox?: string;
    inboxes?: string[] | null;
  }): Promise<InboxCounts>;
  getThread(threadId: string): Promise<ThreadDetail | null>;
  setStatus(threadId: string, status: ThreadStatus): Promise<void>;
  setAssignee(threadId: string, assigneeId: string | null): Promise<void>;
  addContactTag(contactId: string, tagId: string): Promise<void>;
  removeContactTag(contactId: string, tagId: string): Promise<void>;
  // Staff-editable contact display name: inbound mail with no From name shows
  // the email address, so let a human set the real name.
  updateContactName(contactId: string, fullName: string): Promise<void>;
  // Topic tags carried on the ticket (support_thread_tags), distinct from
  // contact segments.
  addThreadTag(threadId: string, tagId: string): Promise<void>;
  removeThreadTag(threadId: string, tagId: string): Promise<void>;
  // Manage the tag vocabulary (the Labels admin): create / rename / recolor /
  // delete topics (thread tags) and segments (contact tags).
  createTag(name: string, color: string, kind: "topic" | "segment"): Promise<{ ok: boolean; error?: string }>;
  updateTag(id: string, fields: { name?: string; color?: string }): Promise<{ ok: boolean; error?: string }>;
  deleteTag(id: string): Promise<void>;
  // Team-wide custom folders: one shared filing system every staffer sees.
  // createFolder records who created it (audit), but folders are not scoped to
  // a person.
  listFolders(): Promise<Folder[]>;
  createFolder(createdBy: string, name: string): Promise<{ ok: boolean; error?: string; id?: string }>;
  deleteFolder(id: string): Promise<void>;
  addThreadToFolder(threadId: string, folderId: string): Promise<void>;
  removeThreadFromFolder(threadId: string, folderId: string): Promise<void>;
  listThreadFolderIds(threadId: string): Promise<string[]>;
  // Compose a brand-new outbound conversation ("New Mail"): find or create the
  // contact by email and open an email thread, with NO message yet. Returns the
  // thread id + its reference (EC-#####, set by trigger) + the normalized
  // email, so the action can send the first message and thread it. The first
  // outbound message is then recorded via recordSentReply, like a normal reply.
  createOutboundThread(input: {
    name: string;
    email: string;
    subject: string;
  }): Promise<{ threadId: string; reference: string | null; email: string }>;
  // Saves the composer text as an outbound agent draft (state = "draft"): the
  // human's own manually-saved draft (prefills the box on return).
  saveDraft(threadId: string, bodyText: string): Promise<void>;
  // Inbox structure: archive/unarchive and set/clear a follow-up date.
  setArchived(threadId: string, archived: boolean): Promise<void>;
  setFollowUp(threadId: string, followUpAtIso: string | null): Promise<void>;
  // Soft-delete: "Delete" moves a thread to Trash (sets deleted_at), reversible
  // until the purge. Trashed threads are hidden from every other view.
  setTrashed(threadId: string, trashed: boolean): Promise<void>;
  // Hard-delete from Trash ("Delete for good"): removes the thread and (via FK
  // cascade) its messages, attachments, topic tags, notes, and folder links.
  // Only trashed threads can be hard-deleted. This cannot be undone.
  deleteThread(threadId: string): Promise<void>;
  // Purge: hard-delete trashed threads older than the given number of days (the
  // Trash retention). Run by a daily purge cron. Returns how many went.
  purgeTrash(olderThanDays: number): Promise<number>;
  // Trash retention is CONFIGURABLE (support_settings 'trash_retention').
  getTrashRetentionDays(): Promise<number>;
  setTrashRetentionDays(days: number): Promise<void>;
  // Empty Trash now: hard-delete every trashed thread immediately. Returns how
  // many were removed.
  emptyTrashNow(): Promise<number>;
  countTrash(): Promise<number>;
  // Records a reply that has been sent: an outbound agent message with state
  // "sent". Clears any pending drafts on the thread and bumps the thread's
  // last_message_at.
  recordSentReply(
    threadId: string,
    bodyText: string,
    providerMessageId: string | null,
    attachments?: PendingAttachment[],
    // Compose can address several To recipients plus CC/BCC. When given, they
    // are stored on the outbound message (to_address holds the joined To list).
    // `from` is the From that actually went on the wire (a reply is sent from
    // the inbox the customer wrote to); omitted = the default sender is stored.
    recipients?: { to?: string[]; cc?: string[]; bcc?: string[]; from?: string },
  ): Promise<void>;
  // Outbound delivery/engagement tracking: stamp a Resend event (delivered,
  // opened, clicked, bounced, complained) onto the sent message that carries
  // this provider_message_id. Calls the support_message_mark_email_event RPC.
  recordEmailEvent(providerMessageId: string, type: string, atIso: string): Promise<void>;
  // Consent gate: has the contact at this email opted out (unsubscribed)? Used
  // by the brand-new outbound path, which has only an email (no thread yet) so
  // it cannot read consent off a loaded thread. False when no contact exists.
  isContactUnsubscribed(email: string): Promise<boolean>;
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
    // The spam filter's verdict (see _lib/mail/spam.ts). A set spamStatus files
    // the new ticket into the Spam folder and skips topic auto-tagging (a phish
    // must not arrive dressed as "Billing"); authResults is stored on the
    // message either way so staff can see the evidence.
    spamStatus?: "suspected" | "confirmed" | null;
    authResults?: MessageAuthResults | null;
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
      authResults?: MessageAuthResults | null; // arrival evidence, stored on the message
    },
  ): Promise<string | null>;
  // Spam triage: "Mark as spam" (confirmed), "Not spam" (null; also clears a
  // suspected flag). Suspected is only ever set by the inbound filter itself.
  setSpamStatus(threadId: string, status: "confirmed" | null): Promise<void>;
  // The team's blocked-senders list. Patterns are a full address or "@domain"
  // (see _lib/mail/spam.ts). matchBlockedSender returns the matching entry for
  // an inbound sender (and the webhook then bumps its hit counter), or null.
  listBlockedSenders(): Promise<BlockedSender[]>;
  addBlockedSender(pattern: string, reason: string, createdBy: string | null): Promise<{ ok: boolean; error?: string }>;
  removeBlockedSender(pattern: string): Promise<void>;
  matchBlockedSender(email: string): Promise<BlockedSender | null>;
  recordBlockedHit(id: string): Promise<void>;
  // Test Lab cleanup: delete every contact with a test address (@example.* /
  // *.test) and, via FK cascade, all their threads/messages/attachments/notes.
  clearTestData(): Promise<void>;
  // Saved replies (canned responses) for the composer.
  listCannedResponses(): Promise<CannedResponse[]>;
  addCannedResponse(title: string, body: string, language: string): Promise<void>;
  deleteCannedResponse(id: string): Promise<void>;
  // Internal team-only notes on a ticket, never sent to the customer.
  addThreadNote(threadId: string, authorName: string, body: string): Promise<ThreadNote>;
  updateThreadNote(id: string, body: string): Promise<void>;
  deleteThreadNote(id: string): Promise<void>;
  // Per-staff prefs (support_staff_prefs). getStaffPrefs returns defaults
  // (never null) when the person has no row yet.
  setStaffSignature(profileId: string, signature: string): Promise<void>;
  getStaffPrefs(profileId: string): Promise<StaffPrefs>;
  setStaffPrefs(profileId: string, patch: Partial<Omit<StaffPrefs, "profileId">>): Promise<void>;
}

// The only backend is Supabase (the Evercool project). All reads and writes run
// server-side through the service-role client (RLS is locked to service_role).
let cached: SupportRepo | null = null;

export async function getRepo(): Promise<SupportRepo> {
  if (cached) return cached;
  const { SupabaseRepo } = await import("@/app/admin/email/_lib/data/supabase-repo");
  cached = new SupabaseRepo();
  return cached;
}
