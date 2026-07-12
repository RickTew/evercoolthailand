import Link from "next/link";
import type { InboxCounts } from "@/app/admin/email/_lib/data/repo";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { STATUS_META } from "@/app/admin/email/_lib/ui";

// Dashboard metric tiles for the Top dash and overview views. Status tiles are
// links that apply the matching filter; the AI-draft tile flags how many replies
// are waiting for a human to approve. Counts come from a cheap count-only query
// (repo.countThreads), not a second hydrated thread list.
export function MetricsBar({
  counts,
  current,
  boardMode = false,
}: {
  counts: InboxCounts;
  current: InboxParams;
  // On the Board, the status tiles FOCUS a single column (toggle) rather than
  // filtering the whole list, and their values stay a full per-status breakdown of
  // what the board holds, so the tile always equals the column it focuses. "All"
  // is a full reset so a stuck AI-drafts / Unassigned / focus filter is escapable.
  boardMode?: boolean;
}) {
  const { total, open, pending, closed, unassigned, awaiting } = counts;

  const draftsActive = current.drafts === "pending";
  const unassignedActive = current.assignee === "unassigned";
  const statusActive = Boolean(current.status && current.status !== "all");
  const allActive = boardMode
    ? !draftsActive && !unassignedActive && !statusActive
    : !statusActive;
  // A status tile toggles its focus: click to focus that column, click again (or
  // "All") to show every column.
  const statusHref = (s: "open" | "pending" | "closed") =>
    buildInboxHref(current, { status: current.status === s ? null : s });

  const tiles: {
    label: string;
    value: number;
    accent: string;
    // The bold FILLED look when this tile's filter is on, so an active tile reads
    // as clearly "pressed", not just a faint ring. Status colors match the board
    // column dots (New = teal, Waiting = orange, Resolved = green) so the tile and
    // the column it focuses are obviously the same thing.
    activeClass: string;
    href?: string;
    active?: boolean;
    // Whether clicking again clears this filter (shows the small × cue). "All" is
    // the reset, not a filter you turn off, so it never gets the ×.
    clearable?: boolean;
  }[] = [
    // "All" clears the status filter so the overview views aren't a dead end once
    // a status tile is picked (R16). On the Board it clears every tile filter
    // (status + AI drafts + Unassigned), so the full board is always one click away.
    {
      label: "All",
      value: total,
      accent: "text-navy",
      activeClass: "border-navy bg-navy text-white",
      href: boardMode
        ? buildInboxHref(current, { status: null, drafts: null, assignee: null })
        : buildInboxHref(current, { status: null }),
      active: allActive,
      clearable: false,
    },
    // Status tiles toggle their focused column in every mode (statusHref flips it
    // off when it is already on), so an active tile is always one click from "show
    // all". The board still loads every status, so each tile value stays the true
    // per-status count.
    { label: STATUS_META.open.label, value: open, accent: "text-teal", activeClass: "border-teal bg-teal text-white", href: statusHref("open"), active: current.status === "open", clearable: true },
    { label: STATUS_META.pending.label, value: pending, accent: "text-orange", activeClass: "border-orange bg-orange text-white", href: statusHref("pending"), active: current.status === "pending", clearable: true },
    { label: STATUS_META.closed.label, value: closed, accent: "text-green", activeClass: "border-green bg-green text-white", href: statusHref("closed"), active: current.status === "closed", clearable: true },
    // Clickable and toggles off, like the AI-draft tile (R22).
    { label: "Unassigned", value: unassigned, accent: "text-navy", activeClass: "border-navy bg-navy text-white", href: buildInboxHref(current, { assignee: unassignedActive ? null : "unassigned" }), active: unassignedActive, clearable: true },
    // Clickable: toggle the "AI replies awaiting approval" filter.
    { label: "Drafts waiting", value: awaiting, accent: "text-purple", activeClass: "border-purple bg-purple text-white", href: buildInboxHref(current, { drafts: draftsActive ? null : "pending" }), active: draftsActive, clearable: true },
  ];

  return (
    // Denser on small/short viewports: 6 columns kick in at sm (not lg), and the
    // number shrinks below sm, so the bar stays a couple of short rows instead of
    // three tall ones eating the Board's height.
    <nav aria-label="Ticket metrics" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {tiles.map((t) => {
        // An active, clearable tile shows a small × so it is obvious you can click
        // to turn the filter off (not just that it is selected).
        const showClear = Boolean(t.active && t.clearable);
        const inner = (
          <>
            {showClear && (
              <span
                aria-hidden
                className="absolute right-1.5 top-1 text-xs font-bold leading-none text-white/80"
              >
                ×
              </span>
            )}
            <div className={`text-lg font-bold sm:text-2xl ${t.active ? "text-white" : t.accent}`}>{t.value}</div>
            <div className={`text-[10px] font-medium sm:text-[11px] ${t.active ? "text-white/90" : "text-muted"}`}>{t.label}</div>
          </>
        );
        return t.href ? (
          <Link
            key={t.label}
            href={t.href}
            // No prefetch: each tile href re-renders the whole heavy inbox. Six
            // tiles prefetching at once added needless EU-DB load with no payoff
            // (these are filter toggles, navigated on click).
            prefetch={false}
            aria-pressed={t.active}
            title={showClear ? `Showing only ${t.label}. Click to clear.` : undefined}
            className={`relative rounded-lg border px-2.5 py-1.5 shadow-sm transition-colors sm:px-3 sm:py-2 ${
              t.active ? t.activeClass : "border-line bg-white shadow-none hover:border-teal"
            }`}
          >
            {inner}
          </Link>
        ) : (
          <div key={t.label} className="relative rounded-lg border border-line bg-white px-2.5 py-1.5 sm:px-3 sm:py-2">
            {inner}
          </div>
        );
      })}
    </nav>
  );
}
