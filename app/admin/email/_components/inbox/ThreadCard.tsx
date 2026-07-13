import Link from "next/link";
import type { ThreadListItem } from "@/app/admin/email/_lib/types";
import { STATUS_META, channelLabel, initials, ticketAttention } from "@/app/admin/email/_lib/ui";
import { LocalTime } from "@/app/admin/email/_components/inbox/LocalTime";
import { ClaimButton } from "@/app/admin/email/_components/inbox/ClaimButton";

// A conversation as a card. Shared by the Board (Kanban), Cards (grid), and the
// Top dash horizontal strip. The container controls its width.
export function ThreadCard({
  item,
  href,
  active = false,
  leadingInset = false,
}: {
  item: ThreadListItem;
  href: string;
  active?: boolean;
  // When the card carries an overlaid select checkbox (Top dash strip), inset the
  // title row so the name never sits under the checkbox.
  leadingInset?: boolean;
}) {
  const { thread, contact, snippet, tags, threadTags, assignee, hasPendingDraft } = item;
  const meta = STATUS_META[thread.status];
  const attention = ticketAttention(thread.status, thread.lastMessageAt);

  return (
    <Link
      href={href}
      // No prefetch: each thread href re-renders the whole (heavy) inbox AND
      // getThread(detail) on the server. Prefetching every visible card fired N
      // full inbox+detail RSC renders at once, saturating the EU DB pool and
      // starving the real navigation (the cause of the "tile/card doesn't
      // navigate" flake). Detail is fetched on click instead.
      prefetch={false}
      className={`flex flex-col rounded-lg border bg-white p-3 transition-shadow hover:shadow-md ${
        active ? "border-teal ring-1 ring-teal" : "border-line"
      }`}
    >
      <div className={`flex items-center justify-between gap-2 ${leadingInset ? "pl-5" : ""}`}>
        <span className="truncate text-sm font-semibold text-ink">{contact.fullName}</span>
        <LocalTime iso={thread.lastMessageAt} className="shrink-0 text-[10px] text-muted" />
      </div>
      <div className="mt-0.5 flex items-center gap-1.5">
        {thread.reference && (
          <span className="shrink-0 font-mono text-[10px] font-semibold text-muted">
            {thread.reference}
          </span>
        )}
        <span className="line-clamp-1 text-xs font-medium text-navy">{thread.subject}</span>
      </div>
      <div className="mt-1 line-clamp-2 text-xs text-muted">{snippet}</div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.chip}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
        {thread.spamStatus && (
          <span
            className="rounded-full bg-red/10 px-1.5 py-0.5 text-[10px] font-semibold text-red"
            title={
              thread.spamStatus === "confirmed"
                ? "Marked as spam"
                : "Flagged automatically: this mail failed sender checks"
            }
          >
            {thread.spamStatus === "confirmed" ? "Spam" : "Suspected spam"}
          </span>
        )}
        {hasPendingDraft && (
          <span className="rounded-full bg-purple/10 px-1.5 py-0.5 text-[10px] font-semibold text-purple">
            AI draft
          </span>
        )}
        {attention && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              attention.overdue ? "bg-red/10 text-red" : "bg-orange/10 text-orange"
            }`}
          >
            {attention.overdue ? "Overdue " : ""}{attention.label}
          </span>
        )}
        {channelLabel(thread.channel) && (
          <span className="rounded-full bg-teal/10 px-1.5 py-0.5 text-[10px] font-medium text-teal">
            {channelLabel(thread.channel)}
          </span>
        )}
        {thread.followUpAt && (
          <span className="rounded-full bg-purple/10 px-1.5 py-0.5 text-[10px] font-medium text-purple">
            Follow-up <LocalTime iso={thread.followUpAt} dateOnly />
          </span>
        )}
        {threadTags.map((t) => (
          <span
            key={t.id}
            className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
            style={{ backgroundColor: t.color }}
          >
            {t.name}
          </span>
        ))}
        {tags.map((t) => (
          <span
            key={t.id}
            className="rounded-full border px-1.5 py-0.5 text-[10px] font-semibold"
            style={{ borderColor: t.color, color: t.color }}
          >
            {t.name}
          </span>
        ))}
        {assignee ? (
          <span
            className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[9px] font-bold text-white"
            title={`Assigned to ${assignee.displayName}`}
          >
            {initials(assignee.displayName)}
          </span>
        ) : (
          <ClaimButton threadId={thread.id} />
        )}
      </div>
    </Link>
  );
}
