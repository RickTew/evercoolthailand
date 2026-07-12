import Link from "next/link";
import type { Tag, TeamMember, ThreadStatus } from "@/app/admin/email/_lib/types";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { AssigneeSelect } from "@/app/admin/email/_components/inbox/AssigneeSelect";
import { InboxSelect } from "@/app/admin/email/_components/inbox/InboxSelect";
import { InboxSearch } from "@/app/admin/email/_components/inbox/InboxSearch";
import { RefreshButton } from "@/app/admin/email/_components/inbox/RefreshButton";
import { TagFilters } from "@/app/admin/email/_components/inbox/TagFilters";
import { STATUS_META } from "@/app/admin/email/_lib/ui";

// Filters are plain links that set query params, so the list stays server
// rendered and the URL is shareable. Used vertically in the Classic left rail
// and horizontally in the dashboard/overview toolbars.
export function FilterBar({
  current,
  team,
  tags = [],
  quickFilters = false,
  hideStatus = false,
  compact = false,
}: {
  current: InboxParams;
  team: TeamMember[];
  tags?: Tag[];
  // Classic split has no MetricsBar, so it opts into inline Unassigned + AI-draft
  // quick filters here (R15). The overview views show those as metric tiles.
  quickFilters?: boolean;
  // The Board already groups by status into columns, so the status tabs are
  // redundant (and confusing) there (N9b). Hide them on the board.
  hideStatus?: boolean;
  // Tighter search + gaps so the whole bar fits on ONE row next to the folder
  // pills in the Classic "one band" layout (variant A).
  compact?: boolean;
}) {
  const topics = tags.filter((t) => t.kind === "topic");
  const segments = tags.filter((t) => t.kind === "segment");
  const status = (current.status as ThreadStatus | "all") ?? "all";
  const assignee = current.assignee ?? "all";
  const deskActive = assignee === "desk";
  const everyoneActive = assignee === "all";
  const unassignedActive = assignee === "unassigned";
  const draftsActive = current.drafts === "pending";
  const statusTabs: { key: ThreadStatus | "all"; label: string }[] = [
    // "All status", not bare "All": it sits one row under the folder strip's
    // "All" (the all-mail view), and two identical "All" pills read as a clash.
    // This one resets the status filter; that one resets the folder.
    { key: "all", label: "All status" },
    { key: "open", label: STATUS_META.open.label },
    { key: "pending", label: STATUS_META.pending.label },
    { key: "closed", label: STATUS_META.closed.label },
  ];

  return (
    // Full-width, wrapping toolbar. In every view the bar now lives in a wide
    // band (the overview toolbars, and the Classic/List header above the panes),
    // so it wraps to use the whole width instead of being trapped in the narrow
    // list pane and scrolling sideways (which hid the status/assignee filters).
    <div className={`flex flex-wrap items-center gap-y-2 ${compact ? "gap-x-2.5" : "gap-x-4"}`}>
      {/* My desk / Everyone: the scope switch. First control so the bar answers
          "whose work am I looking at" before anything narrows it. My desk =
          tickets assigned to me + the unclaimed ones, and it is the landing
          default; Everyone is the whole shared queue, one click away. Picking a
          specific person in the assignee dropdown lights neither pill. */}
      <div className="flex items-center gap-0.5 rounded-lg border border-line bg-white p-0.5">
        <Link
          href={buildInboxHref(current, { assignee: "desk" })}
          prefetch={false}
          aria-pressed={deskActive}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            deskActive ? "bg-teal text-white" : "text-muted hover:bg-canvas"
          }`}
        >
          My desk
        </Link>
        <Link
          href={buildInboxHref(current, { assignee: null })}
          prefetch={false}
          aria-pressed={everyoneActive}
          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
            everyoneActive ? "bg-teal text-white" : "text-muted hover:bg-canvas"
          }`}
        >
          Everyone
        </Link>
      </div>
      {/* Free-text search (N1): reads as the primary way to find a ticket.
          Fixed-ish width so it does not crowd the filters. */}
      <div className={compact ? "w-44" : "w-56"}>
        <InboxSearch key={current.q ?? ""} current={current} />
      </div>
      {/* Inbox/Archived/Trash + the custom folders now live in the full-width
          FolderStrip above the opened mail (Rick's request), not here. */}
      {!hideStatus && (
        <div className="flex items-center gap-1">
          {statusTabs.map((t) => {
            const active = status === t.key;
            return (
              <Link
                key={t.key}
                href={buildInboxHref(current, { status: t.key })}
                prefetch={false}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active ? "bg-navy text-white" : "text-muted hover:bg-canvas"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      )}

      {quickFilters && (
        <div className="flex items-center gap-1">
          <Link
            href={buildInboxHref(current, { assignee: unassignedActive ? null : "unassigned" })}
            prefetch={false}
            aria-pressed={unassignedActive}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              unassignedActive ? "bg-teal text-white" : "text-muted hover:bg-canvas"
            }`}
          >
            Unassigned
          </Link>
          <Link
            href={buildInboxHref(current, { drafts: draftsActive ? null : "pending" })}
            prefetch={false}
            aria-pressed={draftsActive}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              draftsActive ? "bg-purple text-white" : "text-muted hover:bg-canvas"
            }`}
          >
            AI draft
          </Link>
        </div>
      )}

      <TagFilters current={current} topics={topics} segments={segments} />

      <div className="flex items-center gap-2">
        <InboxSelect current={current} />
        <AssigneeSelect current={current} team={team} assignee={assignee} />
        <RefreshButton />
      </div>
    </div>
  );
}
