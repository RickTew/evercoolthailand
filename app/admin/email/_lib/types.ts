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

// Per-staff inbox access + personalization (support_staff_prefs, one row per
// profile). Access model v1: admin manages everything; scope stays "all" until
// a per-staff privacy wall is decided.
export interface StaffPrefs {
  profileId: string;
  signature: string;
  inboxScope: "all" | "assigned"; // 'all' sees every inbox; 'assigned' restricts to the list below
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
