"use client";

import { useRouter } from "next/navigation";
import type { TeamMember } from "@/app/admin/email/_lib/types";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";

// Assignee filter as a single dropdown so the row stays short no matter how many
// team members exist (the chip-per-person version crowded the status tabs).
// Navigates by setting the query param, so the result is still shareable.
export function AssigneeSelect({
  current,
  team,
  assignee,
}: {
  current: InboxParams;
  team: TeamMember[];
  assignee: string;
}) {
  const router = useRouter();
  return (
    // No "Filter by assignee:" label: the option self-labels as "Assignee: All"
    // so the row stays short and there is not yet another bare "All".
    <select
      aria-label="Filter by assignee"
      value={assignee}
      onChange={(e) => router.push(buildInboxHref(current, { assignee: e.target.value }))}
      className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-teal"
    >
      <option value="all">Assignee: All</option>
      <option value="desk">My desk</option>
      <option value="me">Me</option>
      <option value="unassigned">Unassigned</option>
      {team.map((m) => (
        <option key={m.id} value={m.id}>
          {m.displayName}
        </option>
      ))}
    </select>
  );
}
