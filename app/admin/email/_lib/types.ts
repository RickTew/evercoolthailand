// Core domain types for the Evercool email inbox (ported from newnei-app's
// Care system). These mirror the Supabase schema in
// supabase/migrations/0001_email_care_system.sql exactly, so the repo
// implementations are interchangeable behind the same interface.
// Newnei's AI-agent, fluid-knowledge, and voice-profile types were dropped in
// the port (Evercool does not use them).

// The runtime allow-list twin of ThreadStatus: server actions receive the
// status as untrusted client input, so they check against THIS list before
// writing (the type alone is erased at runtime).
export const THREAD_STATUSES = ["open", "pending", "closed"] as const;
export type ThreadStatus = (typeof THREAD_STATUSES)[number];

export function isThreadStatus(value: unknown): value is ThreadStatus {
  return (THREAD_STATUSES as readonly unknown[]).includes(value);
}

// Only "email" is used. The other values are a parked seam for unified
// social / messaging channels; no code paths use them.
export type Channel = "email" | "instagram" | "whatsapp" | "telegram" | "webchat";

export type MessageDirection = "inbound" | "outbound";

// "customer" wrote it, "agent" is a team member. The ai_* values exist in the
// schema (ported enum) but Evercool never creates them.
export type AuthorType = "customer" | "agent" | "ai_draft" | "ai_auto";

// Outbound lifecycle. null for inbound messages (received mail has no send state).
export type MessageState = "draft" | "approved" | "sent" | "failed" | null;

// Spam verdict on a thread. null = clean. "suspected" = auto-flagged by the
// inbound filter (failed sender authentication and similar hard evidence);
// "confirmed" = a human marked it spam, or the sender was already blocked.
// Suspected/confirmed threads live in the inbox Spam folder only.
export type SpamStatus = "suspected" | "confirmed" | null;

// Why an inbound mail was (or was not) flagged: the SES authentication verdicts
// captured at arrival plus the filter's score and human-readable reasons.
// Mirrors AuthResults in _lib/mail/spam.ts; stored as jsonb on the message.
export interface MessageAuthResults {
  spf?: string | null;
  dkim?: string | null;
  dmarc?: string | null;
  sesSpam?: string | null;
  sesVirus?: string | null;
  score?: number;
  reasons?: string[];
}

// One entry on the team's blocked-senders list. pattern is a full address
// ("support@imgsafe.org") or a whole domain ("@imgsafe.org").
export interface BlockedSender {
  id: string;
  pattern: string;
  reason: string | null;
  createdAt: string;
  hitCount: number;
  lastHitAt: string | null;
}

// "segment" tags belong to the person (VIP, Dealer) and live on the contact.
// "topic" tags belong to one ticket (Quote, Warranty, Install, ...) and live on
// the thread via support_thread_tags. The inbox shows topic tags on the ticket,
// segments on the contact panel.
export type TagKind = "segment" | "topic";

export interface Tag {
  id: string;
  name: string;
  color: string; // hex
  kind: TagKind;
}

// A staff member's private inbox folder. Each user organizes tickets into
// their own folders, beyond the shared Inbox/Archived.
export interface Folder {
  id: string;
  name: string;
}

export interface TeamMember {
  id: string;
  displayName: string;
  role: string;
}

export interface Contact {
  id: string;
  email: string;
  fullName: string;
  locale: string; // en, th, ...
  consentEmail: boolean;
  consentSource: string | null;
  consentUpdatedAt: string | null;
  unsubscribedAt: string | null;
  channelHandles: Record<string, string>; // parked seam, empty for now
  notes: string | null;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
}

// A stored file shown on a message. `url` is a short-lived signed URL resolved
// for display; the bucket itself is private.
export interface Attachment {
  id: string;
  messageId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number | null;
  direction: MessageDirection;
  url: string;
}

// A file already uploaded to storage, waiting to be linked to a message on send
// (outbound) or on arrival (inbound).
export interface PendingAttachment {
  path: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Message {
  id: string;
  threadId: string;
  direction: MessageDirection;
  authorType: AuthorType;
  fromAddress: string;
  toAddress: string;
  ccAddress?: string; // comma-joined CC recipients on an outbound message (Compose)
  bccAddress?: string; // comma-joined BCC recipients on an outbound message (Compose)
  bodyText: string;
  bodyHtml: string | null;
  state: MessageState;
  providerMessageId: string | null; // Resend id on send, mailbox id on receive
  createdAt: string;
  sentAt: string | null;
  attachments?: Attachment[]; // populated in the thread detail view
  // Delivery + engagement tracking on an outbound (sent) message, stamped by the
  // Resend events webhook. opened/clicked rely on Resend tracking being on for the
  // domain; "opened" is a soft signal (tracking pixel), clicks are reliable.
  deliveredAt?: string | null;
  openedAt?: string | null; // first open
  openCount?: number;
  clickedAt?: string | null; // first link click
  clickCount?: number;
  bouncedAt?: string | null;
  complainedAt?: string | null; // recipient marked it as spam
  // Inbound only: the SES authentication verdicts + the spam filter's reasons
  // captured when the mail arrived. Null on outbound and on pre-filter mail.
  authResults?: MessageAuthResults | null;
}

export interface Thread {
  id: string;
  contactId: string;
  reference: string; // human ticket handle, e.g. EC-10042
  subject: string;
  channel: Channel;
  status: ThreadStatus;
  assigneeId: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  followUpAt?: string | null;
  deletedAt?: string | null; // soft-deleted (in Trash) when set; restorable 30 days
  spamStatus?: SpamStatus; // set = lives in the Spam folder, hidden everywhere else
}

export interface KbArticle {
  id: string;
  title: string;
  body: string;
  language: string;
  isVerified: boolean;
  showInHelp: boolean; // appears on a PUBLIC help center; false hides internal notes
  updatedAt: string;
}

// How the free Draft button writes (stored in support_settings under
// 'draft_style'). The deterministic template's tone knobs; no AI involved.
export interface DraftStyle {
  signOff: string; // team sign-off used when the staffer has no personal signature
  greeting: "formal" | "casual";
  acknowledge: boolean; // open with a warm, situation-aware line
  warmth: "warm" | "concise";
  emoji: boolean;
  footer: string | null; // optional footer (hours, phone) under the sign-off
}

// One sent reply captured for the Knowledge review queue: promote it to a
// verified article (the Draft button then reuses it) or reject it.
export interface AnswerReview {
  id: string;
  threadId: string;
  question: string;
  answer: string;
  score: number | null;
  notes: string | null;
  status: string; // pending | promoted | rejected
  createdAt: string;
}

// Per-staff inbox access + personalization (support_staff_prefs, one row per
// profile). Access model v1: admin manages everything; scope stays "all" until
// a per-staff privacy wall is decided.
export interface StaffPrefs {
  profileId: string;
  signature: string;
  // 'all' sees every inbox; 'assigned' restricts to the list below; 'shared'
  // (the manager) sees everything EXCEPT mail that went only to another
  // staffer's personal address, so unlisted/typo company addresses never hide.
  inboxScope: "all" | "assigned" | "shared";
  assignedInboxes: string[]; // @evercoolthailand.com addresses this person may see (when scope = assigned)
  personalAddress: string | null; // their confirmed own address (e.g. rick@evercoolthailand.com), or null
  requestedAddress: string | null; // a pending request from their settings, awaiting an admin's confirm
  careSections: string[]; // allow-list of section keys; EMPTY = all sections
  canPhone: boolean; // parked seam from newnei; unused in Evercool
  canAiToggle: boolean; // parked seam from newnei; unused in Evercool
  restoreSession: boolean; // reopen the last inbox view + filters on return (default true)
  defaultView: string | null; // preferred starting layout when there is nothing to restore
  lastView: string | null; // the last inbox layout this person used
  lastFilters: Record<string, string>; // the last inbox filters (status, inbox, assignee, ...)
}

// A saved reply the team can drop into the composer.
export interface CannedResponse {
  id: string;
  title: string;
  body: string;
  language: string;
}

// A team-only note on a ticket, never sent to the customer.
export interface ThreadNote {
  id: string;
  threadId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

// ---- View models the inbox screen renders ----

export interface ThreadListItem {
  thread: Thread;
  contact: Contact;
  snippet: string; // first line of the latest message
  tags: Tag[]; // contact segment tags
  threadTags: Tag[]; // ticket topic tags
  assignee: TeamMember | null;
  hasPendingDraft: boolean; // a draft reply is waiting to be sent
}

// One row of the customer search results.
export interface ContactSearchResult {
  contact: Contact;
  segments: Tag[]; // person-level tags
  threadCount: number;
  lastContactAt: string | null;
  matchedSnippet: string | null; // a message excerpt when the match was on message text
}

// The full customer profile page: who they are + their whole support history.
export interface ContactProfile {
  contact: Contact;
  segments: Tag[];
  threads: Thread[]; // all of this person's tickets, newest first
  openCount: number;
  lastContactAt: string | null;
}

export interface ThreadDetail {
  thread: Thread;
  contact: Contact;
  messages: Message[]; // oldest first
  tags: Tag[]; // contact segment tags
  threadTags: Tag[]; // ticket topic tags
  notes: ThreadNote[]; // internal team-only notes, newest first
  assignee: TeamMember | null;
  contactHistory: Thread[]; // this person's other threads
}
