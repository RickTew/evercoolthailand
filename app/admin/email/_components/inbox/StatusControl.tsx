"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ThreadStatus } from "@/app/admin/email/_lib/types";
import { STATUSES, STATUS_META } from "@/app/admin/email/_lib/ui";
import { setStatusAction } from "@/app/admin/email/inbox/actions";

export function StatusControl({
  threadId,
  status,
}: {
  threadId: string;
  status: ThreadStatus;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  // Optimistic mirror, like AssigneeControl: the control reflects the choice
  // instantly and never sticks in a disabled-pending state (the async-transition
  // reconcile can lag). Reconciles when the server prop changes.
  const [cur, setCur] = useState<ThreadStatus>(status);
  // Track the previous prop in state and adjust during render (the React
  // derived-state pattern) instead of in an effect.
  const [prevStatus, setPrevStatus] = useState(status);
  if (prevStatus !== status) {
    setPrevStatus(status);
    setCur(status);
  }

  function change(next: ThreadStatus) {
    // Clicking the already-active "Done" reopens the ticket (un-done) so a closed
    // ticket is never a dead end (R21). The other states stay a plain radio.
    const target: ThreadStatus | null =
      next === cur ? (cur === "closed" ? "open" : null) : next;
    if (!target) return;
    setCur(target);
    startTransition(async () => {
      await setStatusAction(threadId, target);
      router.refresh();
    });
  }

  return (
    <div
      className={`flex items-center gap-0.5 rounded-md border border-line p-0.5 ${
        pending ? "opacity-70" : ""
      }`}
    >
      {STATUSES.map((s) => {
        const active = s === cur;
        const meta = STATUS_META[s];
        // The active "Done" reads "Reopen" so it's clear you can un-done (R21).
        const isReopen = active && s === "closed";
        return (
          <button
            key={s}
            type="button"
            onClick={() => change(s)}
            title={isReopen ? "Click to reopen (mark not done)" : undefined}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              active ? "bg-navy text-white" : "text-muted hover:bg-canvas"
            }`}
          >
            {isReopen ? "Reopen" : meta.label}
          </button>
        );
      })}
    </div>
  );
}
