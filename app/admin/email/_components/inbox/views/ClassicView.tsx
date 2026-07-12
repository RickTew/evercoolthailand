import Link from "next/link";
import type { Folder, Tag, TeamMember, ThreadDetail, ThreadListItem } from "@/app/admin/email/_lib/types";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { FilterBar } from "@/app/admin/email/_components/inbox/FilterBar";
import { FolderStrip } from "@/app/admin/email/_components/inbox/FolderStrip";
import { ThreadList } from "@/app/admin/email/_components/inbox/ThreadList";
import { ThreadView } from "@/app/admin/email/_components/inbox/ThreadView";
import { ContactPanel } from "@/app/admin/email/_components/inbox/ContactPanel";
import { ClassicSplit } from "@/app/admin/email/_components/inbox/ClassicSplit";
import { RightRail } from "@/app/admin/email/_components/inbox/RightRail";

// Layout 1: the classic three-pane split. List left, conversation center,
// contact right.
export function ClassicView({
  items,
  detail,
  team,
  tags,
  current,
  selectedId,
  threadHref,
  meId,
  folders = [],
  trashRetentionDays = 2,
}: {
  items: ThreadListItem[];
  detail: ThreadDetail | null;
  team: TeamMember[];
  tags: Tag[];
  current: InboxParams;
  selectedId: string | null;
  threadHref: (id: string) => string;
  meId?: string | null;
  folders?: Folder[];
  trashRetentionDays?: number;
}) {
  // On phones this is a master-detail: show the list, or the open conversation
  // (one at a time). A conversation is "open" only when one is explicitly in the
  // URL, so the desktop auto-select of the first thread doesn't trap mobile users
  // in the conversation with no way back to the list. On md+ all panes show.
  const open = Boolean(current.thread);
  const backHref = buildInboxHref(current, { thread: null });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Variant A: one band. Folder pills on the left (using the space they had),
          all the filters on the right of the SAME row. This collapses what used to
          be a folder row plus a two-line filter bar into a single band, freeing
          height to read and write the email. It wraps to a second line only on a
          narrow window. */}
      <div className="shrink-0 border-b border-line bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <FolderStrip folders={folders} current={current} bare trashRetentionDays={trashRetentionDays} />
          <FilterBar current={current} team={team} tags={tags} quickFilters compact />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <ClassicSplit
          open={open}
          list={
            <ThreadList items={items} selectedId={selectedId} current={current} meId={meId} team={team} folders={folders} />
          }
          conversation={
            detail ? (
              <ThreadView key={detail.thread.id} detail={detail} team={team} backHref={backHref} meId={meId} />
            ) : (
              <EmptyState current={current} />
            )
          }
        />

        <RightRail>
          {detail ? (
            <ContactPanel detail={detail} allTags={tags} threadHref={threadHref} />
          ) : (
            <div className="p-5 text-sm text-muted">No conversation selected.</div>
          )}
        </RightRail>
      </div>
    </div>
  );
}

// Clears filters while preserving the current view (matches the other views),
// instead of dropping back to the default Classic view.
function EmptyState({ current }: { current: InboxParams }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <p className="text-sm font-medium text-ink">No conversations match this filter.</p>
      <Link
        href={buildInboxHref(current, {
          status: null,
          assignee: null,
          folder: null,
          drafts: null,
          topic: null,
          segment: null,
        })}
        className="text-sm text-teal underline"
      >
        Clear filters
      </Link>
    </div>
  );
}
