import type {
  Attachment,
  BlockedSender,
  CannedResponse,
  Contact,
  Message,
  MessageAuthResults,
  PendingAttachment,
  Folder,
  SpamStatus,
  StaffPrefs,
  Tag,
  TeamMember,
  Thread,
  ThreadDetail,
  ThreadListItem,
  ThreadNote,
  ThreadStatus,
} from "@/app/admin/email/_lib/types";
import { cache } from "react";
import type { SupportRepo, ThreadFilter, InboxCounts } from "@/app/admin/email/_lib/data/repo";
import { createAdminClient } from "@/lib/supabase/server";
import { isArchived } from "@/app/admin/email/_lib/ui";
import { classifyTopics } from "@/app/admin/email/_lib/support/classify";
import { normalizeBlockPattern, senderMatchesPattern } from "@/app/admin/email/_lib/mail/spam";
import { signedUrl } from "@/app/admin/email/_lib/storage/attachments";

// Trash retention default (days) when no support_settings row exists, plus the
// allowed range. Shared shape for getTrashRetentionDays / setTrashRetentionDays.
export const DEFAULT_TRASH_RETENTION_DAYS = 30;
const TRASH_RETENTION_MIN = 1;
const TRASH_RETENTION_MAX = 365;
export function normalizeTrashRetentionDays(raw: unknown): number {
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n)) return DEFAULT_TRASH_RETENTION_DAYS;
  return Math.min(TRASH_RETENTION_MAX, Math.max(TRASH_RETENTION_MIN, n));
}

// Supabase-backed implementation of the SupportRepo interface (ported from
// newnei-app, trimmed: no AI drafts, no WhatsApp/webchat, no KB-fluid sync).
// RLS on the support tables is locked to service_role, so every read/write
// goes through the service-role admin client (server-only). This module must
// never be imported into a "use client" component.

const DEFAULT_FROM = "Evercool <hi@evercoolthailand.com>";

// An @evercoolthailand.com address (root or subdomain), matching the inbound
// webhook's own-domain test, so scope checks agree with what gets ingested.
const OWN_INBOX_RE = /@(?:[a-z0-9-]+\.)*evercoolthailand\.com$/i;

// Row shapes (snake_case) as stored in Postgres.
type ContactRow = {
  id: string;
  email: string;
  full_name: string;
  locale: string;
  consent_email: boolean;
  consent_source: string | null;
  consent_updated_at: string | null;
  unsubscribed_at: string | null;
  channel_handles: Record<string, string>;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapContact(row: ContactRow, tagIds: string[]): Contact {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    locale: row.locale,
    consentEmail: row.consent_email,
    consentSource: row.consent_source,
    consentUpdatedAt: row.consent_updated_at,
    unsubscribedAt: row.unsubscribed_at,
    channelHandles: row.channel_handles ?? {},
    notes: row.notes,
    tagIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ThreadRow = {
  id: string;
  contact_id: string;
  reference: string | null;
  subject: string;
  channel: Thread["channel"];
  status: ThreadStatus;
  assignee_id: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  follow_up_at?: string | null;
  deleted_at?: string | null;
  spam_status?: SpamStatus;
};

function mapThread(row: ThreadRow): Thread {
  return {
    id: row.id,
    contactId: row.contact_id,
    reference: row.reference ?? "",
    subject: row.subject,
    channel: row.channel,
    status: row.status,
    assigneeId: row.assignee_id,
    lastMessageAt: row.last_message_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at ?? null,
    followUpAt: row.follow_up_at ?? null,
    deletedAt: row.deleted_at ?? null,
    spamStatus: row.spam_status ?? null,
  };
}

type MessageRow = {
  id: string;
  thread_id: string;
  direction: Message["direction"];
  author_type: Message["authorType"];
  from_address: string;
  to_address: string;
  cc_address?: string | null;
  bcc_address?: string | null;
  body_text: string;
  body_html: string | null;
  state: Message["state"];
  provider_message_id: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at?: string | null;
  opened_at?: string | null;
  open_count?: number | null;
  clicked_at?: string | null;
  click_count?: number | null;
  bounced_at?: string | null;
  complained_at?: string | null;
  auth_results?: MessageAuthResults | null;
};

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    threadId: row.thread_id,
    direction: row.direction,
    authorType: row.author_type,
    fromAddress: row.from_address,
    toAddress: row.to_address,
    ccAddress: row.cc_address ?? "",
    bccAddress: row.bcc_address ?? "",
    bodyText: row.body_text,
    bodyHtml: row.body_html,
    state: row.state,
    providerMessageId: row.provider_message_id,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    deliveredAt: row.delivered_at ?? null,
    openedAt: row.opened_at ?? null,
    openCount: row.open_count ?? 0,
    clickedAt: row.clicked_at ?? null,
    clickCount: row.click_count ?? 0,
    bouncedAt: row.bounced_at ?? null,
    complainedAt: row.complained_at ?? null,
    authResults: row.auth_results ?? null,
  };
}

// Request-scoped caches for the two small, stable lookup tables. React's cache()
// returns the same promise for every call within a single server request, so the
// repeated listTeam/listTags calls during one inbox render collapse to one query
// each (they reset between requests, so edits to staff/tags still show up).
const loadTeamCached = cache(async (): Promise<TeamMember[]> => {
  const db = createAdminClient();
  // Who is assignable = every ACTIVE Evercool staff profile. Access model v1:
  // admin manages everything and all active staff share the queue, so there is
  // no per-role area gate here (newnei's role-area map was dropped in the port).
  const { data } = await db
    .from("profiles")
    .select("id, name, email, role")
    .eq("is_active", true)
    .order("name", { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id,
    displayName: r.name ?? r.email ?? "Staff",
    role: r.role ?? "staff",
  }));
});

const loadTagsCached = cache(async (): Promise<Tag[]> => {
  const db = createAdminClient();
  const { data } = await db.from("tags").select("id, name, color, kind");
  return (data ?? []) as Tag[];
});

export class SupabaseRepo implements SupportRepo {
  // Service-role client: RLS is locked, so all inbox data work runs through the
  // admin client behind the admin gate. Server-only.
  private async db() {
    return createAdminClient();
  }

  // listTeam / listTags read tiny, request-stable tables but are called several
  // times per inbox render (the page, each listThreads, getThread). cache() from
  // React dedupes them to a single query per request, so a thread click no longer
  // re-fetches the staff list and tag list four times over.
  async listTeam(): Promise<TeamMember[]> {
    return loadTeamCached();
  }

  async listTags(): Promise<Tag[]> {
    return loadTagsCached();
  }

  // Loads attachments for a set of messages (one query) and resolves a signed URL
  // for each, mutating message.attachments in place.
  private async attachAttachments(messages: Message[]): Promise<void> {
    if (messages.length === 0) return;
    const db = await this.db();
    const ids = messages.map((m) => m.id);
    const { data: rows } = await db
      .from("support_message_attachments")
      .select("id, message_id, storage_path, file_name, mime_type, size_bytes, direction")
      .in("message_id", ids);
    if (!rows || rows.length === 0) return;
    const withUrls: Attachment[] = await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        messageId: r.message_id,
        fileName: r.file_name,
        mimeType: r.mime_type,
        sizeBytes: r.size_bytes,
        direction: r.direction,
        url: await signedUrl(r.storage_path),
      })),
    );
    for (const m of messages) {
      m.attachments = withUrls.filter((a) => a.messageId === m.id);
    }
  }

  private async insertAttachmentRows(
    messageId: string,
    direction: "inbound" | "outbound",
    attachments: PendingAttachment[],
  ): Promise<void> {
    if (!attachments || attachments.length === 0) return;
    const db = await this.db();
    await db.from("support_message_attachments").insert(
      attachments.map((a) => ({
        message_id: messageId,
        storage_path: a.path,
        file_name: a.fileName,
        mime_type: a.mimeType,
        size_bytes: a.sizeBytes,
        direction,
      })),
    );
  }

  // Topic tag ids for a set of classifier topic names (used to auto-tag arrivals).
  private async topicTagIdsForNames(names: string[]): Promise<string[]> {
    if (names.length === 0) return [];
    const db = await this.db();
    const { data } = await db
      .from("tags")
      .select("id, name, kind")
      .eq("kind", "topic")
      .in("name", names);
    return (data ?? []).map((r) => r.id);
  }

  // The set of thread ids that received inbound mail at one of these Evercool
  // addresses (all addresses share one queue, so visibility is matched on the
  // inbound messages' recipient). This is the single enforcement point for the
  // per-staff inbox scope: the inbox list, the overview tiles and any directory
  // views all resolve their allowed slice through here, so they agree. An
  // empty/blank address set yields an empty set (the caller treats it as "sees
  // nothing"); the inbound `thread_id` column is the only thing read.
  private async threadIdsForInboxes(addresses: string[]): Promise<Set<string>> {
    const clean = cleanInboxAddresses(addresses);
    if (clean.length === 0) return new Set();
    const db = await this.db();
    // Match the inbox address whether it was a To OR a Cc recipient, so a mail
    // sent to one address and cc'd another surfaces under BOTH filters (all
    // Evercool addresses share the queue).
    const orFilter = clean.flatMap((a) => [`to_address.ilike.%${a}%`, `cc_address.ilike.%${a}%`]).join(",");
    const { data } = await db
      .from("support_messages")
      .select("thread_id")
      .eq("direction", "inbound")
      .or(orFilter);
    return new Set((data ?? []).map((r) => r.thread_id));
  }

  // The inverse of threadIdsForInboxes, for the manager's "shared" scope:
  // threads whose inbound mail went ONLY to the given (other staffers'
  // personal) addresses. A thread that also touched any company address, or
  // carries no @evercoolthailand.com recipient at all (test/mock data), is NOT
  // excluded; the exclusion is strictly "someone else's personal mailbox".
  private async threadIdsOnlyForInboxes(addresses: string[]): Promise<Set<string>> {
    const excluded = new Set(cleanInboxAddresses(addresses));
    if (excluded.size === 0) return new Set();
    const db = await this.db();
    const { data } = await db
      .from("support_messages")
      .select("thread_id, to_address, cc_address")
      .eq("direction", "inbound");
    // All Evercool recipients per thread, across every inbound message.
    const ownByThread = new Map<string, string[]>();
    for (const r of data ?? []) {
      const own = `${r.to_address ?? ""},${r.cc_address ?? ""}`
        .split(",")
        .map((s) => (s.match(/<([^>]+)>/)?.[1] ?? s).trim().toLowerCase())
        .filter((a) => OWN_INBOX_RE.test(a));
      if (own.length === 0) continue;
      ownByThread.set(r.thread_id, [...(ownByThread.get(r.thread_id) ?? []), ...own]);
    }
    const out = new Set<string>();
    for (const [threadId, own] of ownByThread) {
      if (own.every((a) => excluded.has(a))) out.add(threadId);
    }
    return out;
  }

  async listThreads(filter?: ThreadFilter): Promise<ThreadListItem[]> {
    const db = await this.db();
    let query = db.from("support_threads").select("*").order("last_message_at", { ascending: false });
    const view = filter?.view ?? "active";
    if (filter?.status && filter.status !== "all") query = query.eq("status", filter.status);
    // My desk (mine + unclaimed) wins over the plain assignee filter. deskId is
    // the signed-in staffer's profile id (a uuid from auth, never user text).
    if (filter?.deskId) query = query.or(`assignee_id.eq.${filter.deskId},assignee_id.is.null`);
    else if (filter?.assigneeId === "unassigned") query = query.is("assignee_id", null);
    else if (filter?.assigneeId && filter.assigneeId !== "all")
      query = query.eq("assignee_id", filter.assigneeId);
    // Custom folder filter: restrict to the threads in this folder. The folder
    // is the user's organization, so it replaces the active/archived axis.
    let folderThreadIds: Set<string> | null = null;
    if (filter?.folderId) {
      const { data: links } = await db
        .from("support_thread_folders")
        .select("thread_id")
        .eq("folder_id", filter.folderId);
      folderThreadIds = new Set((links ?? []).map((l) => l.thread_id));
      if (folderThreadIds.size === 0) return [];
    }

    // Topic filter: restrict to threads carrying this topic tag.
    let topicThreadIds: Set<string> | null = null;
    if (filter?.topicId) {
      const { data: tt } = await db
        .from("support_thread_tags")
        .select("thread_id")
        .eq("tag_id", filter.topicId);
      topicThreadIds = new Set((tt ?? []).map((r) => r.thread_id));
      if (topicThreadIds.size === 0) return [];
    }

    // Segment filter: restrict to threads whose contact is in this segment.
    let segmentContactIds: Set<string> | null = null;
    if (filter?.segmentId) {
      const { data: ct } = await db
        .from("contact_tags")
        .select("contact_id")
        .eq("tag_id", filter.segmentId);
      segmentContactIds = new Set((ct ?? []).map((r) => r.contact_id));
      if (segmentContactIds.size === 0) return [];
    }

    // Inbox filter: restrict to threads that received mail at one of a set of
    // Evercool addresses (matched on the inbound messages' recipient; all
    // addresses share the queue). `inboxes` (the per-staff scope, which may be
    // an empty set = "sees nothing") takes precedence; otherwise the single
    // `inbox` dropdown value applies. This is where a person's inbox visibility
    // is actually enforced.
    let inboxThreadIds: Set<string> | null = null;
    const inboxMatch = filter?.inboxes ?? (filter?.inbox ? [filter.inbox] : null);
    if (inboxMatch) {
      if (inboxMatch.length === 0) return []; // scoped to no inbox => sees nothing
      inboxThreadIds = await this.threadIdsForInboxes(inboxMatch);
      if (inboxThreadIds.size === 0) return [];
    }

    // The manager's "shared" scope: hide threads whose inbound mail went ONLY
    // to other staffers' personal addresses; everything else stays visible.
    let excludedThreadIds: Set<string> | null = null;
    if (filter?.excludeInboxes?.length) {
      excludedThreadIds = await this.threadIdsOnlyForInboxes(filter.excludeInboxes);
    }

    // Sent view: restrict to threads that have at least one outbound message we
    // actually sent (a composed mail or a reply). state 'sent' excludes unsent
    // drafts, so the Sent folder is real outgoing mail only.
    let sentThreadIds: Set<string> | null = null;
    if (view === "sent") {
      const { data: sm } = await db
        .from("support_messages")
        .select("thread_id")
        .eq("direction", "outbound")
        .eq("state", "sent");
      sentThreadIds = new Set((sm ?? []).map((r) => r.thread_id));
      if (sentThreadIds.size === 0) return [];
    }

    // Free-text search: resolve the contact-name/email and message-body matches
    // up front (subject + EC-##### reference are matched in memory below, since
    // they live on the thread rows we are about to fetch). Strip characters
    // that would break the PostgREST or()/ilike filters. The search scope
    // (qmode) decides which axes run: "contact" skips the message-body scan,
    // "text" skips the contact name/email scan, "all" runs both.
    const qmode = filter?.qmode ?? "all";
    const searchContacts = qmode === "all" || qmode === "contact";
    const searchText = qmode === "all" || qmode === "text";
    let searchContactIds: Set<string> | null = null;
    let searchMsgThreadIds: Set<string> | null = null;
    const q = (filter?.q ?? "").trim().replace(/[%(),*]/g, " ").trim();
    if (q) {
      const like = `%${q}%`;
      const [cRows, mRows] = await Promise.all([
        searchContacts
          ? db
              .from("contacts")
              .select("id")
              .or(`full_name.ilike.${like},email.ilike.${like}`)
              .then((r) => r.data)
          : Promise.resolve([]),
        searchText
          ? db
              .from("support_messages")
              .select("thread_id")
              .ilike("body_text", like)
              .limit(5000)
              .then((r) => r.data)
          : Promise.resolve([]),
      ]);
      searchContactIds = searchContacts ? new Set((cRows ?? []).map((r) => r.id)) : null;
      searchMsgThreadIds = searchText ? new Set((mRows ?? []).map((r) => r.thread_id)) : null;
    }

    const { data: threadRows } = await query;
    // Active vs Archived is purely explicit: a thread is archived only when it
    // has an archived_at. No auto-archive-by-age, so Archive/Unarchive is always
    // one click and a ticket never lands in Archive without a clearable flag.
    const ql = q.toLowerCase();
    const threads = ((threadRows ?? []) as ThreadRow[]).filter((t) => {
      // Topic / segment / inbox are AND filters layered on whatever axis follows.
      if (topicThreadIds && !topicThreadIds.has(t.id)) return false;
      if (segmentContactIds && !segmentContactIds.has(t.contact_id)) return false;
      if (inboxThreadIds && !inboxThreadIds.has(t.id)) return false;
      if (excludedThreadIds?.has(t.id)) return false;
      // Free-text search: keep the thread if the query hits an in-scope axis.
      // The EC-##### reference always matches (a handle lookup must never
      // fail); the subject counts as message text (only in "all"/"text" scope);
      // contact name/email and message body honour the chosen scope.
      if (q) {
        const hit =
          (t.reference ?? "").toLowerCase().includes(ql) ||
          (searchText && (t.subject?.toLowerCase().includes(ql) ?? false)) ||
          (searchContactIds?.has(t.contact_id) ?? false) ||
          (searchMsgThreadIds?.has(t.id) ?? false);
        if (!hit) return false;
      }
      // Trash is its own axis: the Trash view shows ONLY soft-deleted threads, and
      // every other view (active, archived, a custom folder) hides them.
      const trashed = !!(t.deleted_at ?? null);
      if (view === "trash") return trashed;
      if (trashed) return false;
      // Spam is its own axis too (Trash still wins: a trashed spam thread is in
      // Trash). The Spam view shows only flagged threads; every other view
      // hides them, so a phish never sits in the shared queue looking real.
      const spam = !!(t.spam_status ?? null);
      if (view === "spam") return spam;
      if (spam) return false;
      // Sent is its own axis (like Trash): show every non-trashed thread that has
      // a sent outbound message, whether it is active or archived.
      if (view === "sent") return sentThreadIds?.has(t.id) ?? false;
      if (folderThreadIds) return folderThreadIds.has(t.id);
      const archived = isArchived(t.archived_at ?? null);
      return view === "archived" ? archived : !archived;
    });
    if (threads.length === 0) return [];

    const contactIds = [...new Set(threads.map((t) => t.contact_id))];
    const threadIds = threads.map((t) => t.id);

    // Everything below depends only on contactIds / threadIds, both known now, so
    // fire the lookups in one parallel batch instead of six sequential round-trips.
    const [team, tags, contactRows, ctRows, draftRows, custMsgRows, ttRows] =
      await Promise.all([
        this.listTeam(),
        this.listTags(),
        db.from("contacts").select("*").in("id", contactIds).then((r) => r.data),
        db
          .from("contact_tags")
          .select("contact_id, tag_id")
          .in("contact_id", contactIds)
          .then((r) => r.data),
        // Saved reply drafts still waiting to be sent (newnei tracked AI drafts
        // here; Evercool has no AI, so the badge marks the human's saved draft).
        db
          .from("support_messages")
          .select("thread_id")
          .in("thread_id", threadIds)
          .eq("author_type", "agent")
          .eq("state", "draft")
          .then((r) => r.data),
        // Latest customer message per thread, for the card preview. ONE query for
        // all threads (avoids an N+1 query per thread).
        db
          .from("support_messages")
          .select("thread_id, body_text, created_at")
          .in("thread_id", threadIds)
          .eq("author_type", "customer")
          .order("created_at", { ascending: false })
          .then((r) => r.data),
        // Topic tags carried on each ticket (one batched query for all threads).
        db.from("support_thread_tags").select("thread_id, tag_id").in("thread_id", threadIds).then((r) => r.data),
      ]);

    const pendingDraftThreadIds = new Set((draftRows ?? []).map((r) => r.thread_id));

    const snippetByThread = new Map<string, string>();
    for (const m of custMsgRows ?? []) {
      if (!snippetByThread.has(m.thread_id)) {
        snippetByThread.set(m.thread_id, m.body_text?.split("\n")[0]?.slice(0, 140) ?? "");
      }
    }

    const items: ThreadListItem[] = [];
    for (const tr of threads) {
      const cRow = (contactRows ?? []).find((c) => c.id === tr.contact_id) as ContactRow | undefined;
      if (!cRow) continue;
      const tagIds = (ctRows ?? []).filter((x) => x.contact_id === cRow.id).map((x) => x.tag_id);
      const contact = mapContact(cRow, tagIds);
      const threadTagIds = (ttRows ?? []).filter((x) => x.thread_id === tr.id).map((x) => x.tag_id);
      items.push({
        thread: mapThread(tr),
        contact,
        snippet: snippetByThread.get(tr.id) ?? "",
        // Contact segments only; topics render from threadTags.
        tags: tags.filter((t) => tagIds.includes(t.id) && t.kind === "segment"),
        threadTags: tags.filter((t) => threadTagIds.includes(t.id)),
        assignee: team.find((m) => m.id === tr.assignee_id) ?? null,
        hasPendingDraft: pendingDraftThreadIds.has(tr.id),
      });
    }
    // "Drafts waiting" tile: only tickets with a draft still waiting.
    return filter?.pendingDraft ? items.filter((i) => i.hasPendingDraft) : items;
  }

  async countThreads(filter?: { topicId?: string; segmentId?: string; inbox?: string; inboxes?: string[] | null; excludeInboxes?: string[] | null }): Promise<InboxCounts> {
    const db = await this.db();
    const empty: InboxCounts = { total: 0, open: 0, pending: 0, closed: 0, unassigned: 0, awaiting: 0 };

    // Inbox scope, IDENTICAL to listThreads(): the per-staff allowed set
    // (`inboxes`) takes precedence, otherwise the single chosen `inbox` dropdown
    // value applies. This keeps the tiles and the list in agreement. An empty
    // allowed set means "sees nothing" => all zeros.
    let inboxThreadIds: Set<string> | null = null;
    const inboxMatch = filter?.inboxes ?? (filter?.inbox ? [filter.inbox] : null);
    if (inboxMatch) {
      if (inboxMatch.length === 0) return empty;
      inboxThreadIds = await this.threadIdsForInboxes(inboxMatch);
      if (inboxThreadIds.size === 0) return empty;
    }

    // Same "shared" scope exclusion as listThreads, so the tiles match the list.
    let excludedThreadIds: Set<string> | null = null;
    if (filter?.excludeInboxes?.length) {
      excludedThreadIds = await this.threadIdsOnlyForInboxes(filter.excludeInboxes);
    }

    // Same topic / segment scoping as listThreads(), so the tiles match the list.
    let topicThreadIds: Set<string> | null = null;
    if (filter?.topicId) {
      const { data: tt } = await db
        .from("support_thread_tags")
        .select("thread_id")
        .eq("tag_id", filter.topicId);
      topicThreadIds = new Set((tt ?? []).map((r) => r.thread_id));
      if (topicThreadIds.size === 0) return empty;
    }
    let segmentContactIds: Set<string> | null = null;
    if (filter?.segmentId) {
      const { data: ct } = await db
        .from("contact_tags")
        .select("contact_id")
        .eq("tag_id", filter.segmentId);
      segmentContactIds = new Set((ct ?? []).map((r) => r.contact_id));
      if (segmentContactIds.size === 0) return empty;
    }

    // Minimal columns, no hydration: this whole method replaces a second full
    // listThreads() that would be run only to feed the overview tiles.
    const { data: rows } = await db
      .from("support_threads")
      .select("id, status, assignee_id, archived_at, deleted_at, spam_status, contact_id");
    const threads = ((rows ?? []) as {
      id: string;
      status: string;
      assignee_id: string | null;
      archived_at: string | null;
      deleted_at: string | null;
      spam_status: string | null;
      contact_id: string;
    }[]).filter((t) => {
      if (inboxThreadIds && !inboxThreadIds.has(t.id)) return false;
      if (excludedThreadIds?.has(t.id)) return false;
      if (topicThreadIds && !topicThreadIds.has(t.id)) return false;
      if (segmentContactIds && !segmentContactIds.has(t.contact_id)) return false;
      if (t.deleted_at) return false; // trashed threads are off the active axis
      if (t.spam_status) return false; // spam lives only in the Spam folder
      // Active axis only (not archived), matching the unfiltered listThreads scope.
      return !isArchived(t.archived_at ?? null);
    });
    if (threads.length === 0) return empty;

    let open = 0;
    let pending = 0;
    let closed = 0;
    let unassigned = 0;
    for (const t of threads) {
      if (t.status === "open") open += 1;
      else if (t.status === "pending") pending += 1;
      else if (t.status === "closed") closed += 1;
      if (!t.assignee_id) unassigned += 1;
    }

    // "Drafts waiting": active threads carrying a saved reply draft.
    const { data: drafts } = await db
      .from("support_messages")
      .select("thread_id")
      .in("thread_id", threads.map((t) => t.id))
      .eq("author_type", "agent")
      .eq("state", "draft");
    const awaiting = new Set((drafts ?? []).map((r) => r.thread_id)).size;

    return { total: threads.length, open, pending, closed, unassigned, awaiting };
  }

  async getThread(threadId: string): Promise<ThreadDetail | null> {
    const db = await this.db();
    const { data: tr } = await db.from("support_threads").select("*").eq("id", threadId).maybeSingle();
    if (!tr) return null;
    const thread = mapThread(tr as ThreadRow);

    // These reads depend only on threadId and the contactId carried by the
    // thread row, so run them together instead of six sequential round-trips.
    // listTeam/listTags are cached and independent, so they ride along too.
    const [
      { data: cRow },
      { data: ctRows },
      { data: ttRows },
      { data: msgRows },
      { data: historyRows },
      { data: noteRows },
      team,
      tags,
    ] = await Promise.all([
      db.from("contacts").select("*").eq("id", thread.contactId).maybeSingle(),
      db.from("contact_tags").select("tag_id").eq("contact_id", thread.contactId),
      db.from("support_thread_tags").select("tag_id").eq("thread_id", threadId),
      db
        .from("support_messages")
        .select("*")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true }),
      db
        .from("support_threads")
        .select("*")
        .eq("contact_id", thread.contactId)
        .neq("id", threadId)
        .order("last_message_at", { ascending: false }),
      db
        .from("support_thread_notes")
        .select("id, thread_id, author_name, body, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: false }),
      this.listTeam(),
      this.listTags(),
    ]);
    if (!cRow) return null;
    const tagIds = (ctRows ?? []).map((x) => x.tag_id);
    const contact = mapContact(cRow as ContactRow, tagIds);
    const threadTagIds = (ttRows ?? []).map((x) => x.tag_id);
    const messages = (msgRows ?? []).map((m) => mapMessage(m as MessageRow));
    await this.attachAttachments(messages);
    return {
      thread,
      contact,
      messages,
      tags: tags.filter((t) => tagIds.includes(t.id) && t.kind === "segment"),
      threadTags: tags.filter((t) => threadTagIds.includes(t.id)),
      notes: (noteRows ?? []).map((n) => ({
        id: n.id,
        threadId: n.thread_id,
        authorName: n.author_name,
        body: n.body,
        createdAt: n.created_at,
      })),
      assignee: team.find((m) => m.id === thread.assigneeId) ?? null,
      contactHistory: (historyRows ?? []).map((t) => mapThread(t as ThreadRow)),
    };
  }

  async setStatus(threadId: string, status: ThreadStatus): Promise<void> {
    const db = await this.db();
    await db.from("support_threads").update({ status }).eq("id", threadId);
  }

  async setArchived(threadId: string, archived: boolean): Promise<void> {
    const db = await this.db();
    await db
      .from("support_threads")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", threadId);
  }

  async setFollowUp(threadId: string, followUpAtIso: string | null): Promise<void> {
    const db = await this.db();
    await db.from("support_threads").update({ follow_up_at: followUpAtIso }).eq("id", threadId);
  }

  // Soft delete: move to Trash (set deleted_at) or restore (clear it).
  // Reversible until the purge cron hard-deletes it.
  async setTrashed(threadId: string, trashed: boolean): Promise<void> {
    const db = await this.db();
    await db
      .from("support_threads")
      .update({ deleted_at: trashed ? new Date().toISOString() : null })
      .eq("id", threadId);
  }

  // Permanent delete. Child rows (messages, attachments, thread tags, notes,
  // folder links) cascade off the thread FK. There is no undo, so the UI gates
  // this behind an explicit confirm. Permanent delete is only offered from
  // Trash, and that is enforced HERE, not just in the UI: server actions are
  // public POST endpoints, so a crafted/buggy call with any threadId could
  // otherwise hard-delete a LIVE conversation, skipping the Trash safety net.
  async deleteThread(threadId: string): Promise<void> {
    const db = await this.db();
    await db.from("support_threads").delete().eq("id", threadId).not("deleted_at", "is", null);
  }

  // Purge: hard-delete trashed threads whose deleted_at is older than the retention
  // window. Returns the count removed. Run by a daily purge cron.
  async purgeTrash(olderThanDays: number): Promise<number> {
    const db = await this.db();
    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await db
      .from("support_threads")
      .delete()
      .not("deleted_at", "is", null)
      .lt("deleted_at", cutoff)
      .select("id");
    return (data ?? []).length;
  }

  // Trash retention (days) lives in one support_settings row ('trash_retention').
  // Default 30 days when unset; clamped to a sane 1..365.
  async getTrashRetentionDays(): Promise<number> {
    const db = await this.db();
    const { data } = await db
      .from("support_settings")
      .select("value")
      .eq("key", "trash_retention")
      .maybeSingle();
    return normalizeTrashRetentionDays((data?.value as { days?: number } | null)?.days);
  }

  async setTrashRetentionDays(days: number): Promise<void> {
    const db = await this.db();
    await db.from("support_settings").upsert({
      key: "trash_retention",
      value: { days: normalizeTrashRetentionDays(days) },
      updated_at: new Date().toISOString(),
    });
  }

  // Empty Trash now: hard-delete EVERY trashed thread regardless of age (the manual
  // "Empty trash" button). Returns the count removed.
  async emptyTrashNow(): Promise<number> {
    const db = await this.db();
    const { data } = await db
      .from("support_threads")
      .delete()
      .not("deleted_at", "is", null)
      .select("id");
    return (data ?? []).length;
  }

  async countTrash(): Promise<number> {
    const db = await this.db();
    const { count } = await db
      .from("support_threads")
      .select("id", { count: "exact", head: true })
      .not("deleted_at", "is", null);
    return count ?? 0;
  }

  async setAssignee(threadId: string, assigneeId: string | null): Promise<void> {
    const db = await this.db();
    await db.from("support_threads").update({ assignee_id: assigneeId }).eq("id", threadId);
  }

  async addContactTag(contactId: string, tagId: string): Promise<void> {
    const db = await this.db();
    await db.from("contact_tags").upsert({ contact_id: contactId, tag_id: tagId });
  }

  async removeContactTag(contactId: string, tagId: string): Promise<void> {
    const db = await this.db();
    await db.from("contact_tags").delete().eq("contact_id", contactId).eq("tag_id", tagId);
  }

  async updateContactName(contactId: string, fullName: string): Promise<void> {
    const db = await this.db();
    await db.from("contacts").update({ full_name: fullName }).eq("id", contactId);
  }

  async addThreadTag(threadId: string, tagId: string): Promise<void> {
    const db = await this.db();
    await db.from("support_thread_tags").upsert({ thread_id: threadId, tag_id: tagId });
  }

  async removeThreadTag(threadId: string, tagId: string): Promise<void> {
    const db = await this.db();
    await db.from("support_thread_tags").delete().eq("thread_id", threadId).eq("tag_id", tagId);
  }

  // Manage the tag vocabulary itself (the Labels admin): create / rename /
  // recolor / delete topics (thread tags) and segments (contact tags). Deleting a
  // tag cascades to its contact_tags / support_thread_tags rows (FK on delete
  // cascade), so it is removed from every ticket and contact too.
  async createTag(name: string, color: string, kind: "topic" | "segment"): Promise<{ ok: boolean; error?: string }> {
    const db = await this.db();
    const { error } = await db.from("tags").insert({ name, color, kind });
    if (error) {
      const dup = error.code === "23505" || /duplicate|unique/i.test(error.message);
      return { ok: false, error: dup ? `A label named "${name}" already exists.` : error.message };
    }
    return { ok: true };
  }

  async updateTag(id: string, fields: { name?: string; color?: string }): Promise<{ ok: boolean; error?: string }> {
    const db = await this.db();
    const patch: Record<string, string> = {};
    if (fields.name !== undefined) patch.name = fields.name;
    if (fields.color !== undefined) patch.color = fields.color;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await db.from("tags").update(patch).eq("id", id);
    if (error) {
      const dup = error.code === "23505" || /duplicate|unique/i.test(error.message);
      return { ok: false, error: dup ? "Another label already has that name." : error.message };
    }
    return { ok: true };
  }

  async deleteTag(id: string): Promise<void> {
    const db = await this.db();
    await db.from("tags").delete().eq("id", id);
  }

  // Team-wide custom folders. Shared across all staff; owner_id only records
  // who created each folder.
  async listFolders(): Promise<Folder[]> {
    const db = await this.db();
    const { data } = await db
      .from("support_folders")
      .select("id, name")
      .order("position", { ascending: true })
      .order("name", { ascending: true });
    return (data ?? []) as Folder[];
  }

  async createFolder(createdBy: string, name: string): Promise<{ ok: boolean; error?: string; id?: string }> {
    const db = await this.db();
    const { data, error } = await db
      .from("support_folders")
      .insert({ owner_id: createdBy, name })
      .select("id")
      .single();
    if (error) {
      const dup = error.code === "23505" || /duplicate|unique/i.test(error.message);
      return { ok: false, error: dup ? `A folder named "${name}" already exists.` : error.message };
    }
    return { ok: true, id: data?.id as string | undefined };
  }

  // Shared folders: any staffer can delete (it's the team's filing system).
  async deleteFolder(id: string): Promise<void> {
    const db = await this.db();
    await db.from("support_folders").delete().eq("id", id);
  }

  async addThreadToFolder(threadId: string, folderId: string): Promise<void> {
    const db = await this.db();
    await db.from("support_thread_folders").upsert({ thread_id: threadId, folder_id: folderId });
  }

  async removeThreadFromFolder(threadId: string, folderId: string): Promise<void> {
    const db = await this.db();
    await db.from("support_thread_folders").delete().eq("thread_id", threadId).eq("folder_id", folderId);
  }

  // Which folders contain this thread (for the per-ticket control). Folders are
  // shared, so this is simply every folder link on the thread.
  async listThreadFolderIds(threadId: string): Promise<string[]> {
    const db = await this.db();
    const { data } = await db
      .from("support_thread_folders")
      .select("folder_id")
      .eq("thread_id", threadId);
    return (data ?? []).map((r) => r.folder_id);
  }

  async createOutboundThread(input: {
    name: string;
    email: string;
    subject: string;
  }): Promise<{ threadId: string; reference: string | null; email: string }> {
    const db = await this.db();
    const email = input.email.trim().toLowerCase();

    // Find or create the contact (email is a unique citext), mirroring the
    // inbound path so a New Mail to a known address lands on their record.
    let contactId: string | undefined;
    const { data: existing } = await db
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      contactId = existing.id;
    } else {
      const { data: created } = await db
        .from("contacts")
        .insert({
          email,
          full_name: input.name.trim() || email,
          consent_source: "Staff outbound (New Mail)",
          notes: "Created by staff via New Mail.",
        })
        .select("id")
        .maybeSingle();
      contactId = created?.id;
    }
    if (!contactId) throw new Error("Could not create the contact.");

    const now = new Date().toISOString();
    const { data: thread } = await db
      .from("support_threads")
      .insert({
        contact_id: contactId,
        subject: input.subject.trim() || "(no subject)",
        channel: "email",
        status: "open",
        last_message_at: now,
      })
      .select("id, reference")
      .maybeSingle();
    if (!thread) throw new Error("Could not start the conversation.");

    // Triage the new ticket by topic from its subject, like an inbound one.
    const topicIds = await this.topicTagIdsForNames(classifyTopics(input.subject ?? "", ""));
    if (topicIds.length) {
      await db
        .from("support_thread_tags")
        .upsert(topicIds.map((tagId) => ({ thread_id: thread.id, tag_id: tagId })));
    }

    return { threadId: thread.id, reference: thread.reference ?? null, email };
  }

  async saveDraft(threadId: string, bodyText: string): Promise<void> {
    const db = await this.db();
    const { data: thread } = await db
      .from("support_threads")
      .select("contact_id")
      .eq("id", threadId)
      .maybeSingle();
    if (!thread) return;
    const { data: contact } = await db
      .from("contacts")
      .select("email")
      .eq("id", thread.contact_id)
      .maybeSingle();
    const { data: existing } = await db
      .from("support_messages")
      .select("id")
      .eq("thread_id", threadId)
      .eq("author_type", "agent")
      .eq("state", "draft")
      .maybeSingle();
    if (existing) {
      await db.from("support_messages").update({ body_text: bodyText }).eq("id", existing.id);
      return;
    }
    await db.from("support_messages").insert({
      thread_id: threadId,
      direction: "outbound",
      author_type: "agent",
      from_address: process.env.SUPPORT_FROM_ADDRESS ?? DEFAULT_FROM,
      to_address: contact?.email ?? "",
      body_text: bodyText,
      state: "draft",
    });
  }

  async recordSentReply(
    threadId: string,
    bodyText: string,
    providerMessageId: string | null,
    attachments?: PendingAttachment[],
    recipients?: { to?: string[]; cc?: string[]; bcc?: string[]; from?: string },
  ): Promise<void> {
    const db = await this.db();
    const { data: thread } = await db
      .from("support_threads")
      .select("contact_id")
      .eq("id", threadId)
      .maybeSingle();
    if (!thread) return;
    const { data: contact } = await db
      .from("contacts")
      .select("email")
      .eq("id", thread.contact_id)
      .maybeSingle();

    // Clear pending drafts now that a reply has been sent.
    await db.from("support_messages").delete().eq("thread_id", threadId).eq("state", "draft");

    const now = new Date().toISOString();
    const toAddress = recipients?.to?.length ? recipients.to.join(", ") : contact?.email ?? "";
    const { data: inserted } = await db
      .from("support_messages")
      .insert({
        thread_id: threadId,
        direction: "outbound",
        author_type: "agent",
        // Store the From that actually went on the wire: a reply goes out from
        // the inbox the customer wrote to, not always the default sender.
        from_address: recipients?.from ?? process.env.SUPPORT_FROM_ADDRESS ?? DEFAULT_FROM,
        to_address: toAddress,
        cc_address: recipients?.cc?.length ? recipients.cc.join(", ") : "",
        bcc_address: recipients?.bcc?.length ? recipients.bcc.join(", ") : "",
        body_text: bodyText,
        state: "sent",
        provider_message_id: providerMessageId,
        sent_at: now,
      })
      .select("id")
      .maybeSingle();
    if (inserted?.id && attachments?.length) {
      await this.insertAttachmentRows(inserted.id, "outbound", attachments);
    }
    // Auto-move to "pending" (waiting on the customer) now that we have replied.
    await db.from("support_threads").update({ last_message_at: now, status: "pending" }).eq("id", threadId);
  }

  async recordEmailEvent(providerMessageId: string, type: string, atIso: string): Promise<void> {
    if (!providerMessageId) return;
    const db = await this.db();
    await db.rpc("support_message_mark_email_event", {
      p_provider_id: providerMessageId,
      p_type: type,
      p_at: atIso,
    });
  }

  async isContactUnsubscribed(email: string): Promise<boolean> {
    const clean = email.trim().toLowerCase();
    if (!clean) return false;
    const db = await this.db();
    const { data } = await db
      .from("contacts")
      .select("unsubscribed_at")
      .eq("email", clean)
      .maybeSingle();
    return Boolean(data?.unsubscribed_at);
  }

  async createInboundMessage(input: {
    name: string;
    email: string;
    subject: string;
    body: string;
    bodyHtml?: string | null;
    locale?: string;
    note?: string;
    toAddress?: string; // the full original To list (joined)
    ccAddress?: string; // the full original Cc list (joined)
    attachments?: PendingAttachment[];
    spamStatus?: "suspected" | "confirmed" | null;
    authResults?: MessageAuthResults | null;
  }): Promise<string> {
    const db = await this.db();
    const email = input.email.trim().toLowerCase();

    // Find or create the contact (email is unique citext).
    let contactId: string | undefined;
    const { data: existing } = await db
      .from("contacts")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existing) {
      contactId = existing.id;
    } else {
      const { data: created } = await db
        .from("contacts")
        .insert({
          email,
          full_name: input.name.trim() || email,
          locale: input.locale || "en",
          notes: input.note ?? "Created via the test tool.",
        })
        .select("id")
        .maybeSingle();
      contactId = created?.id;
    }
    if (!contactId) throw new Error("Could not create the contact.");

    const now = new Date().toISOString();
    const { data: thread } = await db
      .from("support_threads")
      .insert({
        contact_id: contactId,
        subject: input.subject.trim() || "(no subject)",
        channel: "email",
        status: "open",
        last_message_at: now,
        spam_status: input.spamStatus ?? null,
      })
      .select("id")
      .maybeSingle();
    if (!thread) throw new Error("Could not create the thread.");

    // Auto-tag the new ticket by topic so it lands triaged. Skipped for spam:
    // a phish mentioning "payment" must not arrive wearing a Billing tag that
    // makes it look like real work.
    if (!input.spamStatus) {
      const topicIds = await this.topicTagIdsForNames(
        classifyTopics(input.subject ?? "", input.body),
      );
      if (topicIds.length) {
        await db
          .from("support_thread_tags")
          .upsert(topicIds.map((tagId) => ({ thread_id: thread.id, tag_id: tagId })));
      }
    }

    const { data: inserted } = await db
      .from("support_messages")
      .insert({
        thread_id: thread.id,
        direction: "inbound",
        author_type: "customer",
        from_address: email,
        to_address: input.toAddress ?? process.env.SUPPORT_FROM_ADDRESS ?? DEFAULT_FROM,
        cc_address: input.ccAddress ?? "",
        body_text: input.body,
        body_html: input.bodyHtml ?? null,
        auth_results: input.authResults ?? null,
      })
      .select("id")
      .maybeSingle();
    if (inserted?.id && input.attachments?.length) {
      await this.insertAttachmentRows(inserted.id, "inbound", input.attachments);
    }
    return thread.id;
  }

  async appendInboundToThreadByReference(
    reference: string,
    msg: {
      name: string;
      email: string;
      body: string;
      bodyHtml?: string | null;
      toAddress?: string;
      ccAddress?: string;
      attachments?: PendingAttachment[];
      authResults?: MessageAuthResults | null;
    },
  ): Promise<string | null> {
    const ref = reference.trim().toUpperCase();
    if (!ref) return null;
    const db = await this.db();

    // Match the ticket by its EC-##### reference. No match -> let the caller
    // open a fresh ticket (a reply whose thread was deleted, or a spoofed
    // reference).
    const { data: thread } = await db
      .from("support_threads")
      .select("id, contact_id")
      .eq("reference", ref)
      .maybeSingle();
    if (!thread) return null;

    const email = msg.email.trim().toLowerCase();

    // Ownership check: only thread the reply onto this ticket if the sender IS
    // the ticket's own contact. EC-##### references are low-entropy (sequential)
    // and appear in every outbound subject line, so without this anyone who
    // learns or guesses a reference could inject a message into (and reopen)
    // another customer's conversation. On any mismatch, return null so the
    // caller opens a fresh ticket instead of cross-contaminating an existing one.
    const { data: owner } = thread.contact_id
      ? await db.from("contacts").select("email").eq("id", thread.contact_id).maybeSingle()
      : { data: null };
    const ownerEmail = (owner?.email ?? "").trim().toLowerCase();
    if (!ownerEmail || ownerEmail !== email) return null;
    const { data: inserted } = await db
      .from("support_messages")
      .insert({
        thread_id: thread.id,
        direction: "inbound",
        author_type: "customer",
        from_address: email,
        to_address: msg.toAddress ?? process.env.SUPPORT_FROM_ADDRESS ?? DEFAULT_FROM,
        cc_address: msg.ccAddress ?? "",
        body_text: msg.body,
        body_html: msg.bodyHtml ?? null,
        auth_results: msg.authResults ?? null,
      })
      .select("id")
      .maybeSingle();
    if (inserted?.id && msg.attachments?.length) {
      await this.insertAttachmentRows(inserted.id, "inbound", msg.attachments);
    }

    // A customer reply revives the conversation: bump the activity time (so it
    // sorts to the top) and reopen it, since a reply always needs staff eyes.
    await db
      .from("support_threads")
      .update({ last_message_at: new Date().toISOString(), status: "open" })
      .eq("id", thread.id);

    return thread.id;
  }

  // Every staffer's confirmed personal address. The manager's "shared" scope
  // excludes OTHER people's entries; the page filters out the caller's own.
  async listPersonalAddresses(): Promise<{ profileId: string; address: string }[]> {
    const db = await this.db();
    const { data } = await db
      .from("support_staff_prefs")
      .select("profile_id, personal_address")
      .not("personal_address", "is", null);
    return (data ?? [])
      .map((r) => ({
        profileId: r.profile_id as string,
        address: ((r.personal_address as string | null) ?? "").trim().toLowerCase(),
      }))
      .filter((r) => r.address);
  }

  // Spam triage. Humans only ever set 'confirmed' (Mark as spam) or null (Not
  // spam); 'suspected' is written exclusively by the inbound filter at arrival.
  async setSpamStatus(threadId: string, status: "confirmed" | null): Promise<void> {
    const db = await this.db();
    await db.from("support_threads").update({ spam_status: status }).eq("id", threadId);
  }

  // ---- Blocked senders (the team's blocklist) ----
  // Small table, read on every inbound webhook: fetch all and match in memory
  // with the same senderMatchesPattern the Block action uses, so a domain
  // pattern ("@imgsafe.org") catches subdomains too, which SQL equality can't.

  async listBlockedSenders(): Promise<BlockedSender[]> {
    const db = await this.db();
    const { data } = await db
      .from("support_blocked_senders")
      .select("id, pattern, reason, created_at, hit_count, last_hit_at")
      .order("created_at", { ascending: false });
    return (data ?? []).map((r) => ({
      id: r.id,
      pattern: r.pattern,
      reason: r.reason,
      createdAt: r.created_at,
      hitCount: r.hit_count ?? 0,
      lastHitAt: r.last_hit_at,
    }));
  }

  async addBlockedSender(
    pattern: string,
    reason: string,
    createdBy: string | null,
  ): Promise<{ ok: boolean; error?: string }> {
    const clean = normalizeBlockPattern(pattern);
    if (!clean) return { ok: false, error: "Enter an address or domain to block." };
    const db = await this.db();
    // Upsert on the unique pattern: re-blocking an already-blocked sender is a
    // no-op, not an error (Mark as spam may run twice on the same sender).
    const { error } = await db
      .from("support_blocked_senders")
      .upsert({ pattern: clean, reason, created_by: createdBy }, { onConflict: "pattern" });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async removeBlockedSender(pattern: string): Promise<void> {
    const clean = normalizeBlockPattern(pattern);
    if (!clean) return;
    const db = await this.db();
    await db.from("support_blocked_senders").delete().eq("pattern", clean);
  }

  async matchBlockedSender(email: string): Promise<BlockedSender | null> {
    const all = await this.listBlockedSenders();
    return all.find((b) => senderMatchesPattern(email, b.pattern)) ?? null;
  }

  async recordBlockedHit(id: string): Promise<void> {
    const db = await this.db();
    const { data } = await db
      .from("support_blocked_senders")
      .select("hit_count")
      .eq("id", id)
      .maybeSingle();
    await db
      .from("support_blocked_senders")
      .update({ hit_count: (data?.hit_count ?? 0) + 1, last_hit_at: new Date().toISOString() })
      .eq("id", id);
  }

  // Test Lab cleanup: remove every contact created with a test address
  // (@example.* / *.test), which cascades to their threads, messages,
  // attachment rows, thread tags, and notes via FKs. Storage blobs uploaded
  // during tests are left behind (tiny, and the private bucket is not listed
  // anywhere); real customer data never matches these patterns.
  async clearTestData(): Promise<void> {
    const db = await this.db();
    const { error } = await db
      .from("contacts")
      .delete()
      .or("email.ilike.%@example.%,email.ilike.%.test");
    if (error) throw new Error(error.message);
  }

  async listCannedResponses(): Promise<CannedResponse[]> {
    const db = await this.db();
    const { data } = await db
      .from("support_canned_responses")
      .select("id, title, body, language")
      .order("title", { ascending: true });
    return (data ?? []) as CannedResponse[];
  }

  async addCannedResponse(title: string, body: string, language: string): Promise<void> {
    const db = await this.db();
    await db.from("support_canned_responses").insert({ title, body, language });
  }

  async deleteCannedResponse(id: string): Promise<void> {
    const db = await this.db();
    await db.from("support_canned_responses").delete().eq("id", id);
  }

  async addThreadNote(threadId: string, authorName: string, body: string): Promise<ThreadNote> {
    const db = await this.db();
    const { data, error } = await db
      .from("support_thread_notes")
      .insert({ thread_id: threadId, author_name: authorName, body })
      .select("id, thread_id, author_name, body, created_at")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: data.id as string,
      threadId: data.thread_id as string,
      authorName: data.author_name as string,
      body: data.body as string,
      createdAt: data.created_at as string,
    };
  }

  async updateThreadNote(id: string, body: string): Promise<void> {
    const db = await this.db();
    await db.from("support_thread_notes").update({ body }).eq("id", id);
  }

  async deleteThreadNote(id: string): Promise<void> {
    const db = await this.db();
    await db.from("support_thread_notes").delete().eq("id", id);
  }

  async setStaffSignature(profileId: string, signature: string): Promise<void> {
    if (!profileId) return;
    const db = await this.db();
    await db.from("support_staff_prefs").upsert({
      profile_id: profileId,
      signature: signature.slice(0, 2000),
      updated_at: new Date().toISOString(),
    });
  }

  // The full per-staff prefs (support_staff_prefs). Returns defaults (never
  // null) when the person has no row yet, so every caller can read a complete
  // object. The DB column defaults mirror these, so an existing row is already
  // complete; this just maps snake_case -> the StaffPrefs shape.
  async getStaffPrefs(profileId: string): Promise<StaffPrefs> {
    const fallback: StaffPrefs = {
      profileId,
      signature: "",
      inboxScope: "all",
      assignedInboxes: [],
      personalAddress: null,
      requestedAddress: null,
      careSections: [],
      canPhone: true,
      canAiToggle: false,
      restoreSession: true,
      defaultView: null,
      lastView: null,
      lastFilters: {},
    };
    if (!profileId) return fallback;
    const db = await this.db();
    const { data } = await db
      .from("support_staff_prefs")
      .select(
        "signature, inbox_scope, assigned_inboxes, personal_address, requested_address, care_sections, can_phone, can_ai_toggle, restore_session, default_view, last_view, last_filters",
      )
      .eq("profile_id", profileId)
      .maybeSingle();
    if (!data) return fallback;
    const r = data as Record<string, unknown>;
    return {
      profileId,
      signature: (r.signature ?? "").toString(),
      inboxScope: r.inbox_scope === "assigned" ? "assigned" : r.inbox_scope === "shared" ? "shared" : "all",
      assignedInboxes: Array.isArray(r.assigned_inboxes) ? (r.assigned_inboxes as string[]) : [],
      personalAddress: (r.personal_address as string | null) ?? null,
      requestedAddress: (r.requested_address as string | null) ?? null,
      careSections: Array.isArray(r.care_sections) ? (r.care_sections as string[]) : [],
      canPhone: r.can_phone !== false,
      canAiToggle: r.can_ai_toggle === true,
      restoreSession: r.restore_session !== false,
      defaultView: (r.default_view as string | null) ?? null,
      lastView: (r.last_view as string | null) ?? null,
      lastFilters:
        r.last_filters && typeof r.last_filters === "object"
          ? (r.last_filters as Record<string, string>)
          : {},
    };
  }

  // Upsert a partial patch of the prefs row. Maps the StaffPrefs camelCase keys to
  // the DB columns; only the provided keys are written. signature has its own
  // setter but is honored here too so the admin/personal forms can share one path.
  async setStaffPrefs(
    profileId: string,
    patch: Partial<Omit<StaffPrefs, "profileId">>,
  ): Promise<void> {
    if (!profileId) return;
    const row: Record<string, unknown> = {
      profile_id: profileId,
      updated_at: new Date().toISOString(),
    };
    if (patch.signature !== undefined) row.signature = patch.signature.slice(0, 2000);
    if (patch.inboxScope !== undefined)
      row.inbox_scope = ["assigned", "shared"].includes(patch.inboxScope) ? patch.inboxScope : "all";
    if (patch.assignedInboxes !== undefined) row.assigned_inboxes = patch.assignedInboxes;
    if (patch.personalAddress !== undefined) row.personal_address = patch.personalAddress;
    if (patch.requestedAddress !== undefined) row.requested_address = patch.requestedAddress;
    if (patch.careSections !== undefined) row.care_sections = patch.careSections;
    if (patch.canPhone !== undefined) row.can_phone = patch.canPhone;
    if (patch.canAiToggle !== undefined) row.can_ai_toggle = patch.canAiToggle;
    if (patch.restoreSession !== undefined) row.restore_session = patch.restoreSession;
    if (patch.defaultView !== undefined) row.default_view = patch.defaultView;
    if (patch.lastView !== undefined) row.last_view = patch.lastView;
    if (patch.lastFilters !== undefined) row.last_filters = patch.lastFilters;
    const db = await this.db();
    await db.from("support_staff_prefs").upsert(row);
  }
}

// Sanitize a set of Evercool inbox addresses for a PostgREST or()/ilike filter.
// The addresses come from our own config or a confirmed personal address, so this
// is belt-and-braces: strip the characters (%, parens, comma, *) that would break
// the filter, lower-case, and drop blanks. Shared by every place that enforces the
// per-staff inbox scope so the matching is identical (list, tiles).
function cleanInboxAddresses(addresses: string[]): string[] {
  return addresses
    .map((a) => a.toLowerCase().replace(/[%(),*]/g, "").trim())
    .filter(Boolean);
}
