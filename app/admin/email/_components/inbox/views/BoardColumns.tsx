"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ThreadListItem, ThreadStatus } from "@/app/admin/email/_lib/types";
import { STATUS_META, STATUSES } from "@/app/admin/email/_lib/ui";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { ThreadCard } from "@/app/admin/email/_components/inbox/ThreadCard";
import { setStatusAction } from "@/app/admin/email/inbox/actions";

// The board columns with drag-and-drop. Dragging a card to another column changes
// its status (the drop target's status). Clicking a card still opens it (the
// non-drag alternative, so the board stays accessible: WCAG 2.5.7).
// Takes `current` (a plain object) and builds card hrefs itself, because a
// function prop cannot cross the server -> client boundary.
export function BoardColumns({
  items,
  current,
}: {
  items: ThreadListItem[];
  current: InboxParams;
}) {
  const router = useRouter();
  const threadHref = (id: string) => buildInboxHref(current, { thread: id });
  const [pending, startTransition] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ThreadStatus | null>(null);

  const DT = "application/x-thread-id";

  // A status tile can focus a single column (toggle); otherwise show every status.
  const focus: ThreadStatus | null =
    current.status === "open" || current.status === "pending" || current.status === "closed"
      ? current.status
      : null;
  const visibleStatuses = focus ? [focus] : STATUSES;

  function drop(e: React.DragEvent, status: ThreadStatus) {
    e.preventDefault();
    // Read the dragged ticket from the dataTransfer (standard HTML5 DnD); fall
    // back to local state if the platform did not carry it.
    const id = e.dataTransfer.getData(DT) || dragId || "";
    setDragId(null);
    setOverCol(null);
    if (!id) return;
    const item = items.find((i) => i.thread.id === id);
    if (!item || item.thread.status === status) return; // no-op: dropped in its own column
    startTransition(async () => {
      await setStatusAction(id, status);
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto p-5">
      {visibleStatuses.map((status) => {
        const meta = STATUS_META[status];
        const column = items.filter((i) => i.thread.status === status);
        const isOver = overCol === status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              if (overCol !== status) setOverCol(status);
            }}
            onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
            onDrop={(e) => drop(e, status)}
            data-status={status}
            className={`flex w-80 shrink-0 flex-col rounded-lg p-1 transition-colors ${
              isOver ? "bg-teal/5 outline-2 outline-dashed outline-teal/50" : ""
            }`}
          >
            <div className="mb-2 flex items-center gap-2 border-b border-line px-1 pb-2">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
              <span className="text-sm font-semibold text-ink">{meta.label}</span>
              <span className="text-xs text-muted">{column.length}</span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-1 pr-1">
              {column.length === 0 ? (
                <p className="py-3 text-xs text-muted">{isOver ? "Drop to move here" : "Nothing here."}</p>
              ) : (
                column.map((item) => (
                  <div
                    key={item.thread.id}
                    data-thread-id={item.thread.id}
                    draggable={!pending}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DT, item.thread.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(item.thread.id);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverCol(null);
                    }}
                    className={`cursor-grab active:cursor-grabbing ${
                      dragId === item.thread.id ? "opacity-50" : ""
                    } ${pending ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <ThreadCard item={item} href={threadHref(item.thread.id)} />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
