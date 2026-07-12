"use client";

import { useRef, useState } from "react";
import type { Folder, TeamMember, ThreadListItem } from "@/app/admin/email/_lib/types";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { ThreadCard } from "@/app/admin/email/_components/inbox/ThreadCard";
import { BulkBar } from "@/app/admin/email/_components/inbox/BulkBar";

// Top dash conversation strip with multi-select for bulk actions (#17). Each
// card gets a checkbox overlay; selecting any reveals the shared BulkBar. The
// checkbox sits above the card's link, so ticking it never opens the thread.
// Takes `current` (serializable) and builds hrefs itself, because a server
// component can't pass a function across to this client component.
export function SelectableStrip({
  items,
  team,
  meId,
  selectedId,
  current,
  folders = [],
}: {
  items: ThreadListItem[];
  team: TeamMember[];
  meId?: string | null;
  selectedId: string | null;
  current: InboxParams;
  folders?: Folder[];
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prune the selection against what is in view (same derived-state fix as
  // ThreadList): stale ids from a previous filter must not ride into a bulk
  // action on conversations the agent can no longer see.
  const visibleIds = new Set(items.map((i) => i.thread.id));
  if ([...picked].some((id) => !visibleIds.has(id))) {
    setPicked(new Set([...picked].filter((id) => visibleIds.has(id))));
  }

  // Keep a tabbed-to card fully in view (the strip scrolls horizontally, so a
  // focused card off the right edge would otherwise be hidden).
  function onFocusCapture(e: React.FocusEvent<HTMLDivElement>) {
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-strip-card]");
    card?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }

  // Arrow keys nudge the strip when it (not a card) holds focus, so it is
  // keyboard-scrollable like a native scroller.
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.target !== scrollRef.current) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollRef.current?.scrollBy({ left: 280, behavior: "smooth" });
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollRef.current?.scrollBy({ left: -280, behavior: "smooth" });
    }
  }

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allPicked = picked.size === items.length && items.length > 0;
  function toggleAll() {
    setPicked(allPicked ? new Set() : new Set(items.map((i) => i.thread.id)));
  }

  return (
    <>
      <label className="mb-2 flex w-fit cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted">
        <input
          type="checkbox"
          checked={allPicked}
          onChange={toggleAll}
          className="h-3.5 w-3.5 accent-teal"
          aria-label="Select all conversations in view"
        />
        Select all ({items.length})
      </label>
      {picked.size > 0 && (
        <div className="mb-2 rounded-lg border border-line bg-white px-3 py-2">
          <BulkBar ids={[...picked]} team={team} meId={meId} folders={folders} onDone={() => setPicked(new Set())} />
        </div>
      )}
      <div className="relative">
        <div
          ref={scrollRef}
          tabIndex={0}
          role="group"
          aria-label="Conversations, scroll left or right with the arrow keys"
          onKeyDown={onKeyDown}
          onFocusCapture={onFocusCapture}
          className="flex gap-3 overflow-x-auto pb-1 outline-none focus-visible:ring-2 focus-visible:ring-teal/40"
        >
          {items.map((item) => (
            <div key={item.thread.id} data-strip-card className="relative w-64 shrink-0">
              <label
                onClick={(e) => e.stopPropagation()}
                className="absolute left-2 top-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-white/90 shadow-sm"
                title="Select for bulk actions"
              >
                <input
                  type="checkbox"
                  checked={picked.has(item.thread.id)}
                  onChange={() => toggle(item.thread.id)}
                  className="h-3.5 w-3.5 accent-teal"
                  aria-label={`Select ${item.contact.fullName}`}
                />
              </label>
              <ThreadCard
                item={item}
                href={buildInboxHref(current, { thread: item.thread.id })}
                active={item.thread.id === selectedId}
                leadingInset
              />
            </div>
          ))}
        </div>
        {items.length > 4 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-canvas to-transparent"
          />
        )}
      </div>
    </>
  );
}
