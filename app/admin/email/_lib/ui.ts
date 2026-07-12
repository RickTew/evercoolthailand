import type { ThreadStatus } from "@/app/admin/email/_lib/types";

export const STATUSES: ThreadStatus[] = ["open", "pending", "closed"];

// Archiving is EXPLICIT: a conversation is archived only when someone archives
// it (archived_at is set). There is no auto-archive-by-age, so a ticket can
// never sit in the Archived folder without an archived_at. That keeps the
// Archive/Unarchive button honest and one-click. Resolved tickets stay in the
// active inbox until archived; filter by the "Resolved" status to hide them.
export function isArchived(archivedAt: string | null | undefined): boolean {
  return archivedAt != null;
}

// The fallback display timezone. Server-rendered HTML and the very first client
// paint use this so server and client agree (no hydration mismatch). Evercool's
// team is in Thailand.
export const DISPLAY_TIME_ZONE = "Asia/Bangkok";
