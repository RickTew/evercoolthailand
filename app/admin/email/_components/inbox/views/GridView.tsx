import Link from "next/link";
import type { Tag, TeamMember, ThreadDetail, ThreadListItem } from "@/app/admin/email/_lib/types";
import type { InboxCounts } from "@/app/admin/email/_lib/data/repo";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { FilterBar } from "@/app/admin/email/_components/inbox/FilterBar";
import { MetricsBar } from "@/app/admin/email/_components/inbox/MetricsBar";
import { ThreadCard } from "@/app/admin/email/_components/inbox/ThreadCard";
import { ThreadView } from "@/app/admin/email/_components/inbox/ThreadView";
import { ContactSummary } from "@/app/admin/email/_components/inbox/ContactSummary";
import { ConversationDrawer } from "@/app/admin/email/_components/inbox/ConversationDrawer";

// Overview 2: metric tiles plus a responsive grid of conversation cards.
// Clicking a card opens it in the same slide-over as the board.
export function GridView({
  items,
  counts,
  detail,
  team,
  tags = [],
  current,
  threadHref,
  meId = null,
}: {
  items: ThreadListItem[];
  counts: InboxCounts;
  detail: ThreadDetail | null;
  team: TeamMember[];
  tags?: Tag[];
  current: InboxParams;
  threadHref: (id: string) => string;
  meId?: string | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-canvas">
      <div className="shrink-0 space-y-3 border-b border-line bg-white px-5 py-3">
        <FilterBar current={current} team={team} tags={tags} />
        <MetricsBar counts={counts} current={current} />
      </div>

      <div className="p-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Conversations ({items.length})
        </p>
        {items.length === 0 ? (
          <p className="text-sm text-muted">
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
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <ThreadCard
                key={item.thread.id}
                item={item}
                href={threadHref(item.thread.id)}
              />
            ))}
          </div>
        )}
      </div>

      {detail && (
        <ConversationDrawer closeHref={buildInboxHref(current, { thread: null })}>
          <ContactSummary detail={detail} />
          <ThreadView key={detail.thread.id} detail={detail} team={team} hideContactLine meId={meId} />
        </ConversationDrawer>
      )}
    </div>
  );
}
