import Link from "next/link";
import type { Tag, TeamMember, ThreadDetail, ThreadListItem } from "@/app/admin/email/_lib/types";
import type { InboxCounts } from "@/app/admin/email/_lib/data/repo";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { FilterBar } from "@/app/admin/email/_components/inbox/FilterBar";
import { MetricsBar } from "@/app/admin/email/_components/inbox/MetricsBar";
import { ThreadView } from "@/app/admin/email/_components/inbox/ThreadView";
import { ContactSummary } from "@/app/admin/email/_components/inbox/ContactSummary";
import { ConversationDrawer } from "@/app/admin/email/_components/inbox/ConversationDrawer";
import { BoardColumns } from "@/app/admin/email/_components/inbox/views/BoardColumns";
import { STATUS_META } from "@/app/admin/email/_lib/ui";

// Overview 1: TEWBEDO-style Kanban board. One column per status, conversation
// cards inside. Drag a card to another column to change its status, or click a
// card to open it in a slide-over without leaving the board.
export function BoardView({
  items,
  counts,
  detail,
  team,
  tags = [],
  current,
  meId = null,
}: {
  items: ThreadListItem[];
  counts: InboxCounts;
  detail: ThreadDetail | null;
  team: TeamMember[];
  tags?: Tag[];
  current: InboxParams;
  meId?: string | null;
}) {
  // A status tile can focus the board on one column. Call that out clearly so it
  // never looks like the other columns were removed: say which column is showing
  // and give a one-click "show all columns" escape.
  const focusStatus =
    current.status === "open" || current.status === "pending" || current.status === "closed"
      ? current.status
      : null;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <div className="shrink-0 space-y-3 border-b border-line bg-white px-5 py-3">
        {/* Status lives in the columns here, so the status tabs are hidden (N9b).
            The MetricsBar status tiles (boardMode) toggle a focused column instead
            of filtering the whole list; their values are a breakdown of the items
            the board holds, so each tile matches the column it focuses. */}
        <FilterBar current={current} team={team} tags={tags} hideStatus />
        <MetricsBar counts={counts} current={current} boardMode />
      </div>

      {items.length === 0 && (
        <p className="shrink-0 px-5 pt-3 text-sm text-muted">
          No conversations match this filter.{" "}
          <Link
            href={buildInboxHref(current, {
              status: null,
              assignee: null,
              folder: null,
              drafts: null,
              topic: null,
              segment: null,
            })}
            className="text-teal underline"
          >
            Clear filters
          </Link>
        </p>
      )}

      {items.length > 0 &&
        (focusStatus ? (
          <p className="shrink-0 px-5 pt-3 text-xs text-muted">
            Showing only the{" "}
            <span className="font-semibold text-ink">{STATUS_META[focusStatus].label}</span>{" "}
            column.{" "}
            <Link
              href={buildInboxHref(current, { status: null })}
              className="font-semibold text-teal underline"
            >
              Show all columns
            </Link>
          </p>
        ) : (
          <p className="shrink-0 px-5 pt-3 text-xs text-muted">
            Each card is a conversation, grouped by status. Drag a card to another
            column to change its status, or click a card to open and reply.
          </p>
        ))}

      <BoardColumns items={items} current={current} />

      {detail && (
        <ConversationDrawer closeHref={buildInboxHref(current, { thread: null })}>
          <ContactSummary detail={detail} />
          <ThreadView key={detail.thread.id} detail={detail} team={team} hideContactLine meId={meId} />
        </ConversationDrawer>
      )}
    </div>
  );
}
