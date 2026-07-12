import Link from "next/link";
import type { Folder, Tag, TeamMember, ThreadDetail, ThreadListItem } from "@/app/admin/email/_lib/types";
import type { InboxCounts } from "@/app/admin/email/_lib/data/repo";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { FilterBar } from "@/app/admin/email/_components/inbox/FilterBar";
import { MetricsBar } from "@/app/admin/email/_components/inbox/MetricsBar";
import { SelectableStrip } from "@/app/admin/email/_components/inbox/SelectableStrip";
import { ThreadView } from "@/app/admin/email/_components/inbox/ThreadView";
import { ContactSummary } from "@/app/admin/email/_components/inbox/ContactSummary";

// Layout 2: top-down dashboard. Metric tiles and filters up top, a horizontal
// strip of conversation cards, then the selected conversation full width below.
export function TopDashView({
  items,
  counts,
  detail,
  team,
  tags = [],
  current,
  selectedId,
  meId,
  folders = [],
}: {
  items: ThreadListItem[];
  counts: InboxCounts;
  detail: ThreadDetail | null;
  team: TeamMember[];
  tags?: Tag[];
  current: InboxParams;
  selectedId: string | null;
  meId?: string | null;
  folders?: Folder[];
}) {
  return (
    // The header + strip stay pinned; only the selected conversation region
    // below scrolls internally (its own messages area), so the composer never
    // gets pushed off-screen on a long thread. The whole column no longer
    // scrolls as one, which used to bury the reply box.
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <div className="shrink-0 space-y-3 border-b border-line bg-white px-5 py-3">
        <FilterBar current={current} team={team} tags={tags} />
        <MetricsBar counts={counts} current={current} />
      </div>

      {/* Horizontal thread strip */}
      <div className="shrink-0 border-b border-line px-5 py-3">
        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Conversations ({items.length})
          {items.length > 4 && (
            <span className="font-medium normal-case tracking-normal text-muted/80">
              &middot; scroll sideways for more &rsaquo;
            </span>
          )}
        </p>
        {items.length === 0 ? (
          <p className="text-sm text-muted">No conversations match this filter.</p>
        ) : (
          <SelectableStrip
            items={items}
            team={team}
            meId={meId}
            selectedId={selectedId}
            current={current}
            folders={folders}
          />
        )}
      </div>

      {/* Selected conversation, full width. Bounded height with its own internal
          scroll (ThreadView in non-expand mode scrolls the messages area and
          pins the composer at the bottom), so a long thread keeps the reply box
          reachable instead of pushing it down the page. */}
      <div className="flex min-h-0 flex-1 flex-col">
        {detail ? (
          <>
            <ContactSummary detail={detail} />
            <ThreadView key={detail.thread.id} detail={detail} team={team} hideContactLine meId={meId} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted">
            <span>
              Select a conversation above.{" "}
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
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
