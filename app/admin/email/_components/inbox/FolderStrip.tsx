import Link from "next/link";
import type { Folder } from "@/app/admin/email/_lib/types";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { FolderBar } from "@/app/admin/email/_components/inbox/FolderBar";

// The Inbox / Archived / Trash + custom folders bar (Rick's request): a full-width
// bar ABOVE the opened mail, not a sideways-scrolling lump in the narrow left pane.
// It WRAPS onto more lines as folders are added (using the whole width), and only
// when it gets very tall does the bar itself scroll. Lives once, at the top of the
// inbox, above every view, so it reads as the section's folder navigation.
// "All" (not "Inbox") for the unfiltered view: the word "Inbox" already names the
// section tab, so reusing it here read as three "Inbox" on one screen. This pill
// is the all-mail view.
const SYSTEM_FOLDERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "archived", label: "Archived" },
  { key: "trash", label: "Trash" },
];

export function FolderStrip({
  folders,
  current,
  bare = false,
  trashRetentionDays = 2,
}: {
  folders: Folder[];
  current: InboxParams;
  // bare = render only the wrapping pills group, no outer band (border/padding).
  // The Classic "one band" layout puts folders on a row shared with the filters;
  // the other views keep the full-width band via the default.
  bare?: boolean;
  // How long Trash is kept before the daily purge (Care > Settings > Trash,
  // default 2). Shown in the Trash note so it never contradicts the real policy.
  trashRetentionDays?: number;
}) {
  const folder = current.folder ?? "all";
  // flex-wrap = use the full width and wrap to a new line when full; the
  // max-height + overflow means scrolling kicks in only once the wrapped bar
  // itself is tall.
  const inner = (
    <div className="flex max-h-24 flex-wrap items-center gap-1 overflow-y-auto">
      {SYSTEM_FOLDERS.map((f) => {
        const active = folder === f.key;
        return (
          <Link
            key={f.key}
            href={buildInboxHref(current, { folder: f.key })}
            prefetch={false}
            className={`shrink-0 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active ? "bg-purple text-white" : "text-muted hover:bg-canvas"
            }`}
          >
            {f.label}
          </Link>
        );
      })}
      <FolderBar folders={folders} current={current} />
      {folder === "trash" && (
        <p className="w-full text-[11px] text-muted">
          🗑️ Items in Trash are kept for {trashRetentionDays}{" "}
          {trashRetentionDays === 1 ? "day" : "days"}, then permanently deleted automatically.
          Restore one any time before then from its conversation. An admin can change this in
          Settings &rarr; Trash.
        </p>
      )}
    </div>
  );

  if (bare) return inner;
  return <div className="shrink-0 border-b border-line bg-white px-3 py-3">{inner}</div>;
}
