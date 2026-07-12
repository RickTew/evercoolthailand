import Link from "next/link";
import type { Message, TeamMember, ThreadDetail } from "@/app/admin/email/_lib/types";
import { formatBytes, isArchived } from "@/app/admin/email/_lib/ui";
import { LocalTime } from "@/app/admin/email/_components/inbox/LocalTime";
import { StatusControl } from "@/app/admin/email/_components/inbox/StatusControl";
import { AssigneeControl } from "@/app/admin/email/_components/inbox/AssigneeControl";
import { ArchiveControl } from "@/app/admin/email/_components/inbox/ArchiveControl";
import { DeleteThreadControl } from "@/app/admin/email/_components/inbox/DeleteThreadControl";
import { TrashControls } from "@/app/admin/email/_components/inbox/TrashControls";
import { ThreadFolderControl } from "@/app/admin/email/_components/inbox/ThreadFolderControl";
import { Composer } from "@/app/admin/email/_components/inbox/Composer";
import { channelLabel } from "@/app/admin/email/_lib/ui";
import { LinkifiedText } from "@/app/admin/email/_components/inbox/LinkifiedText";
import { RichEmailBody } from "@/app/admin/email/_components/inbox/RichEmailBody";
import { findActionLink } from "@/app/admin/email/_lib/actionLink";
import { splitAddresses, isOwnInbox, otherThreadRecipients } from "@/app/admin/email/_lib/mail/recipients";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { getSessionProfile } from "@/app/admin/email/_lib/auth";

export async function ThreadView({
  detail,
  team,
  expand = false,
  backHref,
  hideContactLine = false,
  meId = null,
}: {
  detail: ThreadDetail;
  team: TeamMember[];
  // When true, the messages grow with their content and the page scrolls,
  // instead of scrolling inside a fixed-height pane (used by the Top dash view).
  expand?: boolean;
  // When set, a mobile-only "back to list" link appears (the Classic view's
  // master-detail on phones).
  backHref?: string;
  // When a ContactSummary is already shown above this header (the drawer + top
  // dash views), drop the duplicate contact name/email + tags line so the header
  // is just the reference + subject and the action row.
  hideContactLine?: boolean;
  // The signed-in staff member's id, so we can warn when this ticket is already
  // owned by someone else (two-people-on-one-mail guard).
  meId?: string | null;
}) {
  const { thread, contact, messages, threadTags } = detail;
  const existingDraft =
    messages.find((m) => m.authorType === "agent" && m.state === "draft")?.bodyText ?? "";
  // Lightweight collision guard: if this ticket is assigned to a different staff
  // member, flag it so a colleague does not unknowingly reply to the same mail at
  // the same time. Auto-assign on first reply (see sendReplyAction) already gives
  // every worked ticket an owner; this surfaces that owner before you start typing.
  const otherOwner = detail.assignee && detail.assignee.id !== meId ? detail.assignee : null;
  const profile = await getSessionProfile();
  // The signed-in staff member's personal signature, prefilled into the composer.
  const myId = meId ?? profile?.id ?? "";
  const signature = myId ? (await (await getRepo()).getStaffPrefs(myId)).signature : "";
  // Everyone else who was on the customer's mail (the To/Cc people, minus our own
  // inboxes and the contact themselves), so the composer can offer "reply to all".
  const replyAllRecipients = otherThreadRecipients(detail);

  return (
    <div className="@container flex min-h-0 flex-1 flex-col">
      {backHref && (
        <Link
          href={backHref}
          className="flex shrink-0 items-center gap-1 border-b border-line bg-white px-5 py-2 text-xs font-medium text-teal md:hidden"
        >
          <span aria-hidden>&lsaquo;</span> Back to conversations
        </Link>
      )}
      {/* Conversation header. Stacks (subject row, then action row) until the
          container is wide; only the roomy Classic split goes side-by-side, so the
          narrow drawer never crams the subject and the controls onto one line. */}
      <div className="flex shrink-0 flex-col gap-2 border-b border-line bg-white px-5 py-3 @4xl:flex-row @4xl:items-center @4xl:justify-between @4xl:gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {thread.reference && (
              <span
                title="Ticket reference. A unique ID for this conversation. Quote it in a reply, an internal note, or to a colleague so everyone can find the exact ticket."
                className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-navy"
              >
                {thread.reference}
              </span>
            )}
            {channelLabel(thread.channel) && (
              <span
                className="shrink-0 rounded-full bg-green/15 px-1.5 py-0.5 text-[10px] font-semibold text-green"
                title={`This conversation came in on ${channelLabel(thread.channel)}.`}
              >
                {channelLabel(thread.channel)}
              </span>
            )}
            <h2 className="truncate text-sm font-semibold text-ink">{thread.subject}</h2>
          </div>
          {/* Topic tags always show here (they are not repeated by the
              ContactSummary, which lists contact segments). The contact
              name/email is dropped when a ContactSummary already shows it above. */}
          {(!hideContactLine || threadTags.length > 0) && (
            <div className="mt-0.5 flex items-center gap-2">
              {!hideContactLine && (
                <p className="truncate text-xs text-muted">
                  {`${contact.fullName} <${contact.email}>`}
                </p>
              )}
              {threadTags.map((t) => (
                <span
                  key={t.id}
                  className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: t.color }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 @4xl:justify-end">
          <AssigneeControl threadId={thread.id} assigneeId={thread.assigneeId} team={team} />
          <ThreadFolderControl threadId={thread.id} />
          <StatusControl threadId={thread.id} status={thread.status} />
          {/* In Trash, the conversation offers Restore + Delete-for-good. Otherwise
              Archive (reversible hide) sits next to Delete (which moves to Trash). */}
          {thread.deletedAt ? (
            <TrashControls threadId={thread.id} />
          ) : (
            <>
              <ArchiveControl threadId={thread.id} archived={isArchived(thread.archivedAt)} />
              <DeleteThreadControl threadId={thread.id} />
            </>
          )}
        </div>
      </div>

      {otherOwner && (
        <div className="flex shrink-0 items-center gap-2 border-b border-orange/30 bg-orange/5 px-5 py-1.5 text-[11px] text-ink">
          <span aria-hidden>👤</span>
          <span>
            <span className="font-semibold text-orange">{otherOwner.displayName}</span> is handling
            this conversation. Check with them before replying so you do not both answer the same mail.
          </span>
        </div>
      )}

      {/* Messages */}
      <div
        className={
          expand
            ? "space-y-3 px-5 py-4"
            : "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4"
        }
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} contactName={contact.fullName} />
        ))}
      </div>

      <Composer
        threadId={thread.id}
        initialDraft={existingDraft}
        customerLocale={contact.locale}
        customerUnsubscribed={Boolean(contact.unsubscribedAt)}
        signature={signature}
        replyAllRecipients={replyAllRecipients}
      />
    </div>
  );
}

// The NEWNEI inbox a message came to (info@, sales@, healing@, ...): the first
// @newnei.com address across its To then Cc. All addresses share the Care queue;
// this just shows which one it landed in. Null for non-newnei.com recipients
// (e.g. test/mock). Reads To + Cc so a mail cc'd to a NEWNEI inbox still labels.
// Delivery + read receipt under a sent outbound bubble. "Opened" is a soft signal
// (a tracking pixel, so Apple Mail Privacy Protection inflates it and image
// blockers suppress it); a click is reliable. Bounce / spam complaint take
// priority because they mean the reply did not land.
function DeliveryReceipt({ message }: { message: Message }) {
  if (message.bouncedAt) {
    return (
      <p data-testid="delivery-receipt" className="mt-1 text-right text-[10px] font-medium text-red">
        Bounced, not delivered
      </p>
    );
  }
  if (message.complainedAt) {
    return (
      <p data-testid="delivery-receipt" className="mt-1 text-right text-[10px] font-medium text-red">
        Marked as spam
      </p>
    );
  }
  return (
    <p
      data-testid="delivery-receipt"
      className="mt-1 flex flex-wrap items-center justify-end gap-x-1.5 text-[10px] text-muted"
    >
      {message.openedAt ? (
        <span className="font-medium text-green">
          Opened{(message.openCount ?? 0) > 1 ? ` ${message.openCount}x` : ""}{" "}
          <LocalTime iso={message.openedAt} />
        </span>
      ) : message.deliveredAt ? (
        <span>Delivered</span>
      ) : (
        <span>Sent</span>
      )}
      {message.clickedAt && <span className="text-teal">&middot; Link clicked</span>}
    </p>
  );
}

function inboxFor(message: Message): string | null {
  const all = [...splitAddresses(message.toAddress), ...splitAddresses(message.ccAddress)];
  return all.find(isOwnInbox) ?? null;
}

function MessageBubble({
  message,
  contactName,
}: {
  message: Message;
  contactName: string;
}) {
  const inbound = message.direction === "inbound";
  const inbox = inbound ? inboxFor(message) : null;
  // The full recipient list on an inbound mail, so the team can see (and reply to)
  // everyone it was sent to / cc'd. Only shown when it went beyond the one inbox
  // address (it was also To/Cc'd to others), so ordinary one-recipient mail stays
  // clean. Before this, CC recipients were dropped, making "reply to all" impossible.
  const inToList = inbound ? splitAddresses(message.toAddress) : [];
  const inCcList = inbound ? splitAddresses(message.ccAddress) : [];
  const showInboundRecipients = inbound && (inCcList.length > 0 || inToList.length > 1);
  // Surface a single auth-action link (sign-in / verify / reset) for inbound
  // system mail. Null for ordinary helpdesk tickets, so they show nothing extra.
  const actionLink = inbound ? findActionLink(message.bodyText) : null;
  const isAiDraft = message.authorType === "ai_draft";
  const isAgentDraft = message.authorType === "agent" && message.state === "draft";
  const isAiAuto = message.authorType === "ai_auto";
  const who = inbound
    ? contactName
    : isAiDraft
      ? "AI draft"
      : isAiAuto
        ? "AI auto-reply"
        : "Team";

  return (
    <div className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[80%] ${inbound ? "" : "items-end"}`}>
        <div className="mb-1 flex items-center gap-2 text-[10px] text-muted">
          <span className="font-medium">{who}</span>
          <LocalTime iso={message.createdAt} />
          {inbox && (
            <span
              className="rounded bg-navy/10 px-1.5 py-0.5 font-semibold text-navy"
              title={`Sent to ${inbox} (all Evercool addresses come into the shared inbox)`}
            >
              to {inbox}
            </span>
          )}
          {isAiDraft && (
            <span className="rounded bg-purple/15 px-1.5 py-0.5 font-semibold text-purple">
              AI suggested draft
            </span>
          )}
          {isAgentDraft && (
            <span className="rounded bg-muted/15 px-1.5 py-0.5 font-semibold text-muted">
              Draft
            </span>
          )}
          {isAiAuto && (
            <span className="rounded bg-purple/15 px-1.5 py-0.5 font-semibold text-purple">
              Sent automatically (web chat)
            </span>
          )}
        </div>
        {!inbound && (message.ccAddress || message.bccAddress) && (
          <div className="mb-1 text-[10px] text-muted">
            {message.ccAddress && <span>Cc: {message.ccAddress}</span>}
            {message.ccAddress && message.bccAddress && <span> &middot; </span>}
            {message.bccAddress && <span>Bcc: {message.bccAddress}</span>}
          </div>
        )}
        {showInboundRecipients && (
          <div className="mb-1 text-[10px] text-muted">
            {inToList.length > 0 && <span>To: {inToList.join(", ")}</span>}
            {inToList.length > 0 && inCcList.length > 0 && <span> &middot; </span>}
            {inCcList.length > 0 && <span>Cc: {inCcList.join(", ")}</span>}
          </div>
        )}
        <div
          className={`whitespace-pre-wrap break-words rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
            inbound
              ? "border border-line bg-white text-ink"
              : isAiDraft
                ? "border border-dashed border-purple/50 bg-purple/5 text-ink"
                : isAgentDraft
                  ? "border border-dashed border-line bg-white text-ink"
                  : isAiAuto
                    ? "border border-purple/40 bg-purple/5 text-ink"
                    : "bg-teal text-white"
          }`}
        >
          {actionLink && (
            <a
              href={actionLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 flex w-fit items-center gap-1.5 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white no-underline hover:bg-teal/90"
            >
              {actionLink.label}
              <span aria-hidden>↗</span>
            </a>
          )}
          {inbound && message.bodyHtml ? (
            <RichEmailBody html={message.bodyHtml} text={message.bodyText} />
          ) : (
            <LinkifiedText text={message.bodyText} />
          )}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className={`mt-1.5 flex flex-wrap gap-1.5 ${inbound ? "" : "justify-end"}`}>
            {message.attachments.map((a) => (
              <a
                key={a.id}
                href={a.url || undefined}
                target="_blank"
                rel="noopener noreferrer"
                download={a.fileName}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1 text-[11px] text-ink hover:border-teal hover:text-teal"
                title={`Download ${a.fileName}`}
              >
                <span aria-hidden>📎</span>
                <span className="max-w-[14rem] truncate font-medium">{a.fileName}</span>
                {a.sizeBytes ? <span className="text-muted">{formatBytes(a.sizeBytes)}</span> : null}
              </a>
            ))}
          </div>
        )}
        {!inbound && message.state === "sent" && <DeliveryReceipt message={message} />}
      </div>
    </div>
  );
}
