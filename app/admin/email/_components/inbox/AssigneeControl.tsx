"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TeamMember } from "@/app/admin/email/_lib/types";
import { setAssigneeAction } from "@/app/admin/email/inbox/actions";

export function AssigneeControl({
  threadId,
  assigneeId,
  team,
}: {
  threadId: string;
  assigneeId: string | null;
  team: TeamMember[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  // Local mirror so the dropdown reflects the choice immediately (optimistic)
  // instead of after the server round-trip + refresh (the "1-click delay" bug).
  const [value, setValue] = useState(assigneeId ?? "");
  // Reconcile when the server prop changes: track the previous prop in state and
  // adjust during render (the React derived-state pattern) instead of in an effect.
  const [prevAssigneeId, setPrevAssigneeId] = useState(assigneeId);
  if (prevAssigneeId !== assigneeId) {
    setPrevAssigneeId(assigneeId);
    setValue(assigneeId ?? "");
  }

  function change(v: string) {
    setValue(v);
    const next = v === "" ? null : v;
    startTransition(async () => {
      await setAssigneeAction(threadId, next);
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-muted">
      <span>Assign to</span>
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={pending}
        className="rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-ink"
      >
        <option value="">Unassigned</option>
        {team.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}
