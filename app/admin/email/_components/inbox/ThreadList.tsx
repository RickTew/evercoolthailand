"use client";

import { useState } from "react";
import Link from "next/link";
import type { Folder, TeamMember, ThreadListItem } from "@/app/admin/email/_lib/types";
import { STATUS_META, channelLabel, initials, ticketAttention } from "@/app/admin/email/_lib/ui";
import { LocalTime } from "@/app/admin/email/_components/inbox/LocalTime";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { BulkBar } from "@/app/admin/email/_components/inbox/BulkBar";

export function ThreadList({
  items,
  selectedId,
  current,
  meId,
  team,
  folders = [],
}: {
  items: ThreadListItem[];
  selectedId: string | null;
  current: InboxParams;
  meId?: string | null;
  team: TeamMember[];
  folders?: Folder[];
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());

  // Prune the selection against what is actually IN VIEW (derived-state
  // pattern): the component instance survives filter/search changes, so stale
  // ids used to stay picked and a bulk action (archive, "Reply to several")
  // silently hit conversations the agent could no longer see.
  const visibleIds = new Set(items.map((i) => i.thread.id));
  const stale = [...picked].some((id) => !visibleIds.has(id));
  if (stale) {
    setPicked(new Set([...picked].filter((id) => visibleIds.has(id))));
  }

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (items.length === 0) {
    return <div className="p-4 text-sm text-muted">No conversations here.</div>;
  }

  // Select-all toggles every conversation currently in view, so you can filter
  // (e.g. by a segment/topic) and act on the whole result in one go.
  const allPicked = picked.size === items.length && items.length > 0;
  function toggleAll() {
    setPicked(allPicked ? new Set() : new Set(items.map((i) => i.thread.id)));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 border-b border-line px-3 py-1.5 text-[11px] font-medium text-muted">
        <input
          type="checkbox"
          checked={allPicked}
          onChange={toggleAll}
          className="h-3.5 w-3.5 accent-teal"
          aria-label="Select all conversations in view"
        />
        Select all ({items.length})
      </label>
      <ul className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
        {items.map(({ thread, contact, snippet, tags, threadTags, assignee }) => {
          const active = thread.id === selectedId;
          const meta = STATUS_META[thread.status];
          const checked = picked.has(thread.id);
          const attention = ticketAttention(thread.status, thread.lastMessageAt);
          return (
            <li
              key={thread.id}
              className={`flex items-stretch border-b border-line ${
                active ? "bg-teal/10" : ""
              } ${checked ? "bg-navy/5" : ""}`}
            >
              <label className="flex cursor-pointer items-start pl-2 pt-3.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(thread.id)}
                  className="h-3.5 w-3.5 accent-teal"
                  aria-label={`Select ${contact.fullName}`}
                />
              </label>
              <Link
                href={buildInboxHref(current, { thread: thread.id })}
                // No prefetch: each thread href re-renders the whole inbox plus
                // getThread(detail). Classic shows 40+ rows, so prefetching every
                // row hammered the EU DB and starved real navigations. Detail
                // loads on click.
                prefetch={false}
                // min-w-0 lets the inner `truncate` actually clip: without it a
                // flex child keeps its content's intrinsic width, so long names /
                // subjects pushed the row wider than the pane (sideways scroll +
                // the half-grey selected-row background bug).
                className={`block min-w-0 flex-1 px-3 py-3 transition-colors ${active ? "" : "hover:bg-canvas"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{contact.fullName}</span>
                  <LocalTime iso={thread.lastMessageAt} className="shrink-0 text-[10px] text-muted" />
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {thread.reference && (
                    <span className="shrink-0 font-mono text-[10px] font-semibold text-muted">
                      {thread.reference}
                    </span>
                  )}
                  <span className="truncate text-xs font-medium text-navy">{thread.subject}</span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted">{snippet}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${meta.chip}`}>
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
                  {assignee && (
                    <span
                      className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-navy text-[9px] font-bold text-white"
                      title={`Assigned to ${assignee.displayName}`}
                    >
                      {initials(assignee.displayName)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {picked.size > 0 && (
        <div className="shrink-0 border-t border-line bg-white px-3 py-2">
          <BulkBar
            ids={[...picked]}
            team={team}
            meId={meId}
            folders={folders}
            onDone={() => setPicked(new Set())}
          />
        </div>
      )}
    </div>
  );
}
