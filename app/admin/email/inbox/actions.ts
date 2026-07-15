"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { getMailSender, buildFrom } from "@/app/admin/email/_lib/mail/send";
import { isEmailOptedOut } from "@/app/admin/email/_lib/mail/consent";
import { otherThreadRecipients, splitAddresses, isOwnInbox } from "@/app/admin/email/_lib/mail/recipients";
import { createUploadUrl, readBytes, BUCKET } from "@/app/admin/email/_lib/storage/attachments";
import { getCurrentUserContext, requireStaff } from "@/app/admin/email/_lib/auth";
import { retrieveRelevantArticles } from "@/app/admin/email/_lib/ai/kb";
import { templateDraft, templateComposeDraft, type DraftTurn } from "@/app/admin/email/_lib/ai/template";
import { runQc, type QcResult } from "@/app/admin/email/_lib/ai/qc";
import type { SupportRepo } from "@/app/admin/email/_lib/data/repo";
import { isThreadStatus } from "@/app/admin/email/_lib/types";
import type { ComposeDraft, PendingAttachment, ThreadDetail, ThreadStatus } from "@/app/admin/email/_lib/types";

// Every inbox server action is staff-only. Next.js Server Actions are public
// HTTP endpoints: an action id can be POSTed from any route, so authorization
// MUST live in the action itself, not only in the layout gate. This gate runs
// before any service-role DB access or outbound mail. Actions that touch the
// repo get it through getStaffRepo(); actions with no repo (attachment URL)
// call requireStaff() directly.
async function getStaffRepo(): Promise<SupportRepo> {
  await requireStaff();
  return getRepo();
}

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB per file

// Starts a direct-to-storage attachment upload. Returns a one-time signed URL
// target (bucket + path + token) that the BROWSER uploads the file to itself, so
// the bytes never travel through this Server Action. That is the fix for the
// "page couldn't load" crash on attaching: a Server Action body is capped (Next
// 1MB default, Vercel serverless ~4.5MB), so any normal photo/PDF blew the limit
// before the function ran. Only the small metadata round-trips here.
export async function createAttachmentUploadAction(
  prefix: string,
  fileName: string,
  sizeBytes: number,
): Promise<
  { ok: true; bucket: string; path: string; token: string } | { ok: false; error: string }
> {
  await requireStaff();
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return { ok: false, error: "The file is empty." };
  if (sizeBytes > MAX_ATTACHMENT_BYTES) return { ok: false, error: "File is too large (max 10 MB)." };
  try {
    const safePrefix = (prefix || "outbound").replace(/[^a-zA-Z0-9_-]/g, "") || "outbound";
    const { path, token } = await createUploadUrl(safePrefix, fileName || "file");
    return { ok: true, bucket: BUCKET, path, token };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not start upload." };
  }
}

// All inbox mutations. Each calls the repo and revalidates the inbox so
// server-rendered data refreshes.

export async function setStatusAction(threadId: string, status: ThreadStatus) {
  // The status arrives as untrusted client input; only the three known values
  // may ever reach the database (the type is erased at runtime).
  if (!isThreadStatus(status)) return;
  const repo = await getStaffRepo();
  await repo.setStatus(threadId, status);
  revalidatePath("/admin/email/inbox");
}

// Bulk triage: apply one change to many tickets at once (from the list multi-select).
export async function bulkUpdateThreadsAction(
  threadIds: string[],
  op: { status?: ThreadStatus; assigneeId?: string | null; archived?: boolean },
): Promise<{ ok: boolean; count: number }> {
  const repo = await getStaffRepo();
  for (const id of threadIds) {
    if (op.status && isThreadStatus(op.status)) await repo.setStatus(id, op.status);
    if (op.assigneeId !== undefined) await repo.setAssignee(id, op.assigneeId);
    if (op.archived !== undefined) await repo.setArchived(id, op.archived);
  }
  revalidatePath("/admin/email/inbox");
  return { ok: true, count: threadIds.length };
}

// Internal team-only notes on a ticket. The author is the signed-in staff user,
// so the client only sends the text.
export async function addThreadNoteAction(threadId: string, body: string) {
  if (!body.trim()) return null;
  const repo = await getStaffRepo();
  const ctx = await getCurrentUserContext();
  const author = ctx.teamMember?.displayName ?? "Team";
  const note = await repo.addThreadNote(threadId, author, body.trim());
  revalidatePath("/admin/email/inbox");
  return note;
}

export async function updateThreadNoteAction(noteId: string, body: string) {
  if (!body.trim()) return;
  const repo = await getStaffRepo();
  await repo.updateThreadNote(noteId, body.trim());
  revalidatePath("/admin/email/inbox");
}

export async function deleteThreadNoteAction(noteId: string) {
  const repo = await getStaffRepo();
  await repo.deleteThreadNote(noteId);
  revalidatePath("/admin/email/inbox");
}

// Saved replies (canned responses) for the composer.
export async function listCannedResponsesAction() {
  const repo = await getStaffRepo();
  return repo.listCannedResponses();
}

export async function addCannedResponseAction(title: string, body: string) {
  if (!title.trim() || !body.trim()) return { ok: false };
  const repo = await getStaffRepo();
  await repo.addCannedResponse(title.trim(), body.trim(), "en");
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

export async function deleteCannedResponseAction(id: string) {
  const repo = await getStaffRepo();
  await repo.deleteCannedResponse(id);
  revalidatePath("/admin/email/inbox");
}

export async function setAssigneeAction(threadId: string, assigneeId: string | null) {
  const repo = await getStaffRepo();
  await repo.setAssignee(threadId, assigneeId);
  revalidatePath("/admin/email/inbox");
}

// One-click "Assign to me" on a card. Resolves the actor server-side (the client
// never knows its own profile id) and claims the ticket. Used by ClaimButton.
export async function claimThreadAction(
  threadId: string,
): Promise<{ ok: boolean; displayName?: string; error?: string }> {
  const repo = await getStaffRepo();
  const me = (await getCurrentUserContext()).teamMember;
  if (!me) return { ok: false, error: "Could not identify the signed-in staff user." };
  await repo.setAssignee(threadId, me.id);
  revalidatePath("/admin/email/inbox");
  return { ok: true, displayName: me.displayName };
}

// Staff renames a contact (R12): inbound mail with no From name shows the email
// address until a human sets the real name here.
export async function renameContactAction(
  contactId: string,
  fullName: string,
): Promise<{ ok: boolean }> {
  if (!fullName.trim()) return { ok: false };
  const repo = await getStaffRepo();
  await repo.updateContactName(contactId, fullName.trim());
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

export async function toggleTagAction(contactId: string, tagId: string, add: boolean) {
  const repo = await getStaffRepo();
  if (add) await repo.addContactTag(contactId, tagId);
  else await repo.removeContactTag(contactId, tagId);
  revalidatePath("/admin/email/inbox");
}

// Topic tags on the ticket (Billing, Refund, ...), distinct from contact segments.
export async function toggleThreadTagAction(threadId: string, tagId: string, add: boolean) {
  const repo = await getStaffRepo();
  if (add) await repo.addThreadTag(threadId, tagId);
  else await repo.removeThreadTag(threadId, tagId);
  revalidatePath("/admin/email/inbox");
}

export async function saveDraftAction(threadId: string, bodyText: string) {
  const repo = await getStaffRepo();
  await repo.saveDraft(threadId, bodyText);
  revalidatePath("/admin/email/inbox");
}

export async function setArchivedAction(threadId: string, archived: boolean) {
  const repo = await getStaffRepo();
  await repo.setArchived(threadId, archived);
  revalidatePath("/admin/email/inbox");
}

// "Delete" now moves a conversation to Trash (soft delete), reversible for 30 days.
// Archive is the soft hide for spam that might still matter; Trash is "I want this
// gone" but with a safety net, after which the purge cron clears it.
export async function trashThreadAction(threadId: string): Promise<{ ok: boolean }> {
  const repo = await getStaffRepo();
  await repo.setTrashed(threadId, true);
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

// Restore a conversation out of Trash back to the inbox.
export async function restoreThreadAction(threadId: string): Promise<{ ok: boolean }> {
  const repo = await getStaffRepo();
  await repo.setTrashed(threadId, false);
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

// Permanent delete of a conversation from Trash (staff-only, no undo): removes the
// thread and its messages from the database entirely. Only offered inside Trash.
export async function deleteThreadAction(threadId: string): Promise<{ ok: boolean }> {
  const repo = await getStaffRepo();
  await repo.deleteThread(threadId);
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

// Spam triage. "Mark as spam" confirms the flag (and the conversation moves to
// the Spam folder); blockSender also puts the sender's address on the blocked
// list so their next mail lands in Spam automatically. "Not spam" clears the
// flag AND unblocks the sender, so a wrong block is undone in the same click.
export async function markSpamAction(
  threadId: string,
  blockSender: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const repo = await getStaffRepo();
  const detail = await repo.getThread(threadId);
  if (!detail) return { ok: false, error: "Conversation not found." };
  await repo.setSpamStatus(threadId, "confirmed");
  if (blockSender && detail.contact.email) {
    const me = (await getCurrentUserContext()).teamMember;
    await repo.addBlockedSender(
      detail.contact.email,
      `Blocked from ${detail.thread.reference || "the inbox"} (Mark as spam)`,
      me?.id ?? null,
    );
  }
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

export async function notSpamAction(threadId: string): Promise<{ ok: boolean; error?: string }> {
  const repo = await getStaffRepo();
  const detail = await repo.getThread(threadId);
  if (!detail) return { ok: false, error: "Conversation not found." };
  await repo.setSpamStatus(threadId, null);
  if (detail.contact.email) await repo.removeBlockedSender(detail.contact.email);
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

export async function setFollowUpAction(threadId: string, followUpAtIso: string | null) {
  const repo = await getStaffRepo();
  await repo.setFollowUp(threadId, followUpAtIso);
  revalidatePath("/admin/email/inbox");
}

// Remember where this person left off in the inbox (their last layout + filters),
// so Care can reopen there next time (Settings > You "Pick up where you left off").
// Fire-and-forget from a client effect on navigation; deliberately does NOT
// revalidate (it must not cause a re-render loop). Sanitizes to known keys.
// NOTE: narrowing filters (topic/segment/q, and since the audit also "drafts")
// never reach this action anymore: page.tsx REMEMBER_SKIP drops them before
// saving, so a restored session cannot silently hide most of the mail.
const REMEMBERED_FILTER_KEYS = [
  "status",
  "assignee",
  "folder",
  "drafts",
  "topic",
  "segment",
  "inbox",
  "q",
  "qmode",
] as const;

export async function rememberInboxStateAction(
  view: string,
  filters: Record<string, string>,
): Promise<{ ok: boolean }> {
  const ctx = await getCurrentUserContext();
  if (!ctx.teamMember) return { ok: false };
  await requireStaff();
  const clean: Record<string, string> = {};
  for (const k of REMEMBERED_FILTER_KEYS) {
    const v = filters?.[k];
    if (v) clean[k] = String(v).slice(0, 200);
  }
  const v = ["classic", "topdash", "board", "grid"].includes(view) ? view : "board";
  const repo = await getRepo();
  await repo.setStaffPrefs(ctx.teamMember.id, { lastView: v, lastFilters: clean });
  return { ok: true };
}

// Which Evercool inbox this conversation came to (hi@, later per-staff addresses),
// from the most recent inbound message's recipient. Used to reply FROM that same
// address, so a mail to hi@ is answered by hi@. Returns the bare address, or
// undefined to fall back to the default sender; buildFrom adds the display name.
function replyFromInbox(detail: ThreadDetail): string | undefined {
  for (let i = detail.messages.length - 1; i >= 0; i--) {
    const m = detail.messages[i];
    if (m.direction !== "inbound") continue;
    // The To/Cc may hold several addresses; reply FROM the first Evercool inbox
    // among them (To preferred, then Cc).
    const addr = [...splitAddresses(m.toAddress), ...splitAddresses(m.ccAddress)].find(isOwnInbox);
    if (addr) return addr;
  }
  return undefined;
}

// Build a quoted transcript of the conversation so far, to append BELOW a reply
// when the team member ticks "Include previous messages". Only real, sent messages
// are quoted (never an unsent draft or AI proposal), oldest first, in the classic
// email "On <date>, <who> wrote:" style. The in-app thread already shows the full
// history, so this is appended to the OUTGOING email only, giving the customer the
// context in their own inbox without cluttering the staff conversation record.
function buildQuotedHistory(detail: ThreadDetail): string {
  const prior = detail.messages.filter((m) => m.state !== "draft" && m.authorType !== "ai_draft");
  if (prior.length === 0) return "";
  const blocks = prior.map((m) => {
    const who = m.authorType === "customer" ? detail.contact.fullName : "Evercool";
    const when = m.createdAt ? new Date(m.createdAt).toUTCString() : "";
    const quoted = m.bodyText
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    return `On ${when}, ${who} wrote:\n${quoted}`;
  });
  return `\n\n----- Previous messages -----\n\n${blocks.join("\n\n")}`;
}

export interface GenerateDraftResult {
  ok: boolean;
  bodyText?: string;
  citations?: string[]; // titles of the knowledge articles the draft drew on
  qc?: QcResult;
  error?: string;
}

// The Draft button: writes a reply from the verified Knowledge base. FREE, no
// AI call: it opens in the customer's language, pastes the best-matching
// verified article (or an honest holding line when nothing matches), and
// closes with the staffer's own signature. A human always edits and approves.
export async function generateDraftAction(threadId: string): Promise<GenerateDraftResult> {
  const repo = await getStaffRepo();
  const detail = await repo.getThread(threadId);
  if (!detail) return { ok: false, error: "Conversation not found." };

  try {
    const articles = await repo.listKbArticles();
    // Exclude unsent drafts; the reply is written from the real exchange.
    const turns: DraftTurn[] = detail.messages
      .filter((m) => m.state !== "draft")
      .map((m) => ({
        author: m.authorType === "customer" ? "customer" : "agent",
        text: m.bodyText,
      }));
    const lastCustomer = [...detail.messages].reverse().find((m) => m.authorType === "customer");
    const query = `${detail.thread.subject} ${lastCustomer?.bodyText ?? ""}`;
    const relevant = retrieveRelevantArticles(query, articles);

    const style = await repo.getDraftStyle();
    // The drafting staffer's personal signature (when set) becomes the
    // draft's closing.
    const actorId = (await getCurrentUserContext()).teamMember?.id ?? null;
    const signature = actorId ? (await repo.getStaffPrefs(actorId)).signature : "";
    const draft = templateDraft(
      {
        customerName: detail.contact.fullName,
        customerLocale: detail.contact.locale,
        conversation: turns,
        articles: relevant,
        signature,
      },
      style,
    );
    // QC is free (keyword heuristic) and advisory: it flags, never blocks.
    const qc = runQc(draft.bodyText);
    return { ok: true, bodyText: draft.bodyText, citations: relevant.map((a) => a.title), qc };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not write a draft." };
  }
}

// AIDE inside Compose (New Mail): scaffolds a brand-new outbound email from
// the verified Knowledge base. FREE, no AI call: it greets the recipient (in
// Thai when the subject/message is typed in Thai, English otherwise), pastes
// the best-matching verified article for the subject, and closes with the
// staffer's own signature. A human always edits and approves before sending.
export async function generateComposeDraftAction(input: {
  name: string;
  subject: string;
  body: string;
}): Promise<GenerateDraftResult> {
  const repo = await getStaffRepo();
  try {
    const articles = await repo.listKbArticles();
    const query = `${input.subject} ${input.body}`.trim();
    const relevant = query ? retrieveRelevantArticles(query, articles) : [];
    // No inbound mail to read the language from, so key off what the staffer
    // has typed: any Thai character in the subject or message means Thai.
    const locale = /[฀-๿]/.test(query) ? "th" : "en";

    const style = await repo.getDraftStyle();
    const actorId = (await getCurrentUserContext()).teamMember?.id ?? null;
    const signature = actorId ? (await repo.getStaffPrefs(actorId)).signature : "";
    const draft = templateComposeDraft(
      { recipientName: input.name, locale, articles: relevant, signature },
      style,
    );
    const qc = runQc(draft.bodyText);
    return { ok: true, bodyText: draft.bodyText, citations: relevant.map((a) => a.title), qc };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not write a draft." };
  }
}

// Compose (New Mail) drafts: each staff member's own drawer of unsent Compose
// emails, persisted server-side so a draft survives closing the modal, the
// tab, or moving to another computer. The author is always the signed-in
// staffer; the repo pins every read/write to that id.
export interface ComposeDraftSaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function saveComposeDraftAction(input: {
  id?: string | null;
  name: string;
  email: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
}): Promise<ComposeDraftSaveResult> {
  const repo = await getStaffRepo();
  const me = (await getCurrentUserContext()).teamMember;
  if (!me) return { ok: false, error: "No staff profile." };
  if (!input.email.trim() && !input.subject.trim() && !input.body.trim()) {
    return { ok: false, error: "Nothing to save yet." };
  }
  return repo.saveComposeDraft(me.id, {
    id: input.id ?? null,
    toText: input.email,
    nameText: input.name,
    ccText: input.cc,
    bccText: input.bcc,
    subject: input.subject,
    bodyText: input.body,
  });
}

export async function listComposeDraftsAction(): Promise<ComposeDraft[]> {
  const repo = await getStaffRepo();
  const me = (await getCurrentUserContext()).teamMember;
  if (!me) return [];
  return repo.listComposeDrafts(me.id);
}

export async function deleteComposeDraftAction(id: string): Promise<{ ok: boolean }> {
  const repo = await getStaffRepo();
  const me = (await getCurrentUserContext()).teamMember;
  if (!me) return { ok: false };
  await repo.deleteComposeDraft(me.id, id);
  return { ok: true };
}

export interface SendReplyResult {
  ok: boolean;
  via?: "resend" | "mock";
  error?: string;
}

export async function sendReplyAction(
  threadId: string,
  bodyText: string,
  attachments?: PendingAttachment[],
  includeHistory?: boolean,
  replyAll?: boolean,
): Promise<SendReplyResult> {
  if (!bodyText.trim() && !(attachments && attachments.length)) {
    return { ok: false, error: "The reply is empty." };
  }
  const repo = await getStaffRepo();
  const detail = await repo.getThread(threadId);
  if (!detail) return { ok: false, error: "Conversation not found." };

  // Consent (N6): a direct reply to a ticket the customer opened is transactional,
  // so it is always allowed (they must be able to get an answer). If they have
  // opted out of email we still send, but log it for the audit trail; the composer
  // also shows an "unsubscribed contact" notice.
  if (isEmailOptedOut(detail.contact)) {
    console.log(`[consent] transactional reply to opted-out contact ${detail.contact.email} (thread ${threadId})`);
  }

  const actor = (await getCurrentUserContext()).teamMember ?? null;
  const actorId = actor?.id ?? null;

  try {
    // Pull the bytes for each attachment so they ride on the outgoing email.
    const sendAttachments = [];
    for (const a of attachments ?? []) {
      const blob = await readBytes(a.path);
      if (blob) sendAttachments.push({ filename: a.fileName, content: blob.bytes });
    }

    const sender = getMailSender();
    // Keep the ticket reference in the subject so replies thread back reliably.
    const ref = detail.thread.reference ? ` [${detail.thread.reference}]` : "";
    // When asked, quote the whole conversation under the reply in the email the
    // customer receives. The in-app record keeps the clean new reply (the thread
    // shows the history right above it), so the staff view never double-quotes.
    // Passed separately from the fresh text so the sender can place the company
    // logo between the signature and the quote.
    const quotedText = includeHistory ? buildQuotedHistory(detail) : undefined;
    // Reply to all: Cc everyone else who was on the customer's mail (computed
    // server-side from the thread, never trusting the client), so the whole
    // original group stays in the loop. Empty unless the toggle was on.
    const cc = replyAll ? otherThreadRecipients(detail) : [];
    // Reply from the inbox the customer wrote to, with the replying staff
    // member's name in front so the customer sees who answered.
    const from = buildFrom(actor?.displayName, replyFromInbox(detail));
    const sent = await sender.send({
      to: detail.contact.email,
      cc: cc.length ? cc : undefined,
      subject: `Re: ${detail.thread.subject}${ref}`,
      text: bodyText,
      quotedText,
      from,
      attachments: sendAttachments.length ? sendAttachments : undefined,
    });
    // Record what actually went on the wire, including the real From (so a
    // reply sent from sales@ is not stored as the default hi@ sender).
    await repo.recordSentReply(threadId, bodyText, sent.providerMessageId, attachments, {
      to: [detail.contact.email],
      cc: cc.length ? cc : undefined,
      from,
    });
    // Auto-assign on first reply: whoever sends the first human response owns the
    // ticket, so triage is one step. Only claims an UNASSIGNED ticket (never steals
    // one a colleague already owns).
    if (!detail.thread.assigneeId && actorId) {
      await repo.setAssignee(threadId, actorId);
    }
    // Learning loop: log the question + the sent answer to the Knowledge review
    // queue, where a reviewer can promote it into a verified article the Draft
    // button reuses. Only when a customer actually asked something (never on
    // outbound-only threads), and never blocking the send result.
    const asked = [...detail.messages].reverse().find((m) => m.authorType === "customer");
    if (asked && bodyText.trim()) {
      try {
        await repo.logAnswerReview(threadId, `${detail.thread.subject}\n\n${asked.bodyText}`, bodyText);
      } catch {
        // The review queue is best-effort; a failure must never fail the send.
      }
    }
    revalidatePath("/admin/email/inbox");
    return { ok: true, via: sent.via };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed." };
  }
}

export interface ComposeMailResult {
  ok: boolean;
  threadId?: string;
  via?: "resend" | "mock";
  error?: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Split a free-text recipient field into clean, unique, lower-cased emails. Staff
// type "to several recipients at once", separated by commas, semicolons, spaces or
// new lines (per Rick: comma-separation alone was rejected before, now any of these
// work). Invalid fragments are dropped.
function parseEmails(raw: string | undefined): string[] {
  const parts = (raw ?? "").split(/[\s,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const valid = parts.filter((e) => EMAIL_RE.test(e));
  return [...new Set(valid)];
}

// R4 "Compose": start a brand-new outbound conversation from scratch. Opens an
// email thread on the first recipient's contact record (creating the contact if
// new), sends the first message to every To recipient plus any CC/BCC, and records
// it as a sent outbound reply so the thread reads like any other conversation. A
// human composes and approves every word.
export async function composeNewMailAction(input: {
  name: string;
  email: string; // the To field: one or several addresses (comma/semicolon/space separated)
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  attachments?: PendingAttachment[];
  // When this send resumes a saved Compose draft, its id: the draft is deleted
  // once the mail has actually gone out (never on a failed send).
  draftId?: string | null;
}): Promise<ComposeMailResult> {
  const toList = parseEmails(input.email);
  if (toList.length === 0) return { ok: false, error: "Enter at least one valid email address." };
  const ccList = parseEmails(input.cc);
  const bccList = parseEmails(input.bcc);
  if (!input.subject.trim()) return { ok: false, error: "Add a subject." };
  if (!input.body.trim() && !(input.attachments && input.attachments.length)) {
    return { ok: false, error: "The message is empty." };
  }

  const repo = await getStaffRepo();

  // Consent (N6): a brand-new outbound (not a reply to a request they sent) is the
  // marketing-risk case, so drop any To recipient who has opted out; if every To
  // recipient has, block. Replies to their own thread are still allowed elsewhere.
  const allowedTo: string[] = [];
  for (const e of toList) {
    if (await repo.isContactUnsubscribed(e)) continue;
    allowedTo.push(e);
  }
  if (allowedTo.length === 0) {
    return {
      ok: false,
      error:
        "Every recipient has unsubscribed from email, so nothing was sent. You can still reply within their own support thread.",
    };
  }
  const primary = allowedTo[0];

  let created;
  try {
    created = await repo.createOutboundThread({ name: input.name, email: primary, subject: input.subject });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not start the conversation." };
  }

  // The staff member who starts an outbound conversation owns it from the off.
  const actor = (await getCurrentUserContext()).teamMember ?? null;
  if (actor) await repo.setAssignee(created.threadId, actor.id);

  // Send from the person's own @evercoolthailand.com address when an admin has
  // confirmed one, otherwise the shared default; either way their name rides in
  // the From so the recipient sees more than just "Evercool".
  const personalAddress = actor ? (await repo.getStaffPrefs(actor.id)).personalAddress : null;
  const from = buildFrom(actor?.displayName, personalAddress);

  try {
    const sendAttachments = [];
    for (const a of input.attachments ?? []) {
      const blob = await readBytes(a.path);
      if (blob) sendAttachments.push({ filename: a.fileName, content: blob.bytes });
    }
    const sender = getMailSender();
    // Carry the new ticket reference in the subject so the reply threads back.
    const ref = created.reference ? ` [${created.reference}]` : "";
    const sent = await sender.send({
      to: allowedTo,
      cc: ccList.length ? ccList : undefined,
      bcc: bccList.length ? bccList : undefined,
      subject: `${input.subject.trim()}${ref}`,
      text: input.body,
      from,
      attachments: sendAttachments.length ? sendAttachments : undefined,
    });
    await repo.recordSentReply(created.threadId, input.body, sent.providerMessageId, input.attachments, {
      to: allowedTo,
      cc: ccList,
      bcc: bccList,
      from,
    });
    // The mail is out: a resumed Compose draft has served its purpose.
    if (input.draftId && actor) await repo.deleteComposeDraft(actor.id, input.draftId);
    revalidatePath("/admin/email/inbox");
    return { ok: true, threadId: created.threadId, via: sent.via };
  } catch (e) {
    // The thread exists; surface the send failure but keep the conversation.
    return {
      ok: false,
      threadId: created.threadId,
      error: e instanceof Error ? e.message : "Send failed.",
    };
  }
}

export interface BulkReplyResult {
  ok: boolean;
  sent: number;
  failed: number;
  skipped: number; // contacts skipped because they have opted out of email (N6)
  via?: "resend" | "mock";
  error?: string;
}

// R5 "Reply to several": send ONE message to every selected ticket's contact (a
// broadcast), mirroring the bulk assign / bulk move pattern. Each send is
// recorded on its own thread as a normal sent reply (so each conversation keeps
// its own history and moves to pending). Per Rick: one message, many tickets.
export async function bulkReplyAction(
  threadIds: string[],
  bodyText: string,
): Promise<BulkReplyResult> {
  if (!bodyText.trim()) return { ok: false, sent: 0, failed: 0, skipped: 0, error: "The message is empty." };
  const repo = await getStaffRepo();
  const sender = getMailSender();
  // The broadcast goes out under the sender's own name too (same as replies).
  const from = buildFrom((await getCurrentUserContext()).teamMember?.displayName);
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let via: "resend" | "mock" | undefined;
  for (const threadId of threadIds) {
    try {
      const detail = await repo.getThread(threadId);
      if (!detail) {
        failed += 1;
        continue;
      }
      // Consent (N6): a broadcast is the marketing-risk case, so opted-out
      // contacts are skipped (not emailed) and reported back.
      if (isEmailOptedOut(detail.contact)) {
        console.log(`[consent] bulk reply skipped opted-out contact ${detail.contact.email} (thread ${threadId})`);
        skipped += 1;
        continue;
      }
      const ref = detail.thread.reference ? ` [${detail.thread.reference}]` : "";
      const res = await sender.send({
        to: detail.contact.email,
        subject: `Re: ${detail.thread.subject}${ref}`,
        text: bodyText,
        from,
      });
      via = res.via;
      await repo.recordSentReply(threadId, bodyText, res.providerMessageId, undefined, { from });
      sent += 1;
    } catch {
      failed += 1;
    }
  }
  revalidatePath("/admin/email/inbox");
  // A run that only skipped opt-outs is not a failure; ok means nothing errored.
  return { ok: failed === 0, sent, failed, skipped, via };
}
