import type { ThreadStatus } from "@/app/admin/email/_lib/types";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const STATUS_META: Record<
  ThreadStatus,
  { label: string; dot: string; chip: string }
> = {
  // Locked color map: teal = New/active, orange = Waiting, green = Resolved.
  // One source of truth, so the board, list, cards, filters, and detail agree.
  // "Waiting for customer" (not just "Waiting"): staff read the bare word in the
  // Sent folder as "this email is waiting to be sent". It means we replied and
  // the ball is in the customer's court.
  open: { label: "New", dot: "bg-teal", chip: "bg-teal/10 text-teal" },
  pending: { label: "Waiting for customer", dot: "bg-orange", chip: "bg-orange/10 text-orange" },
  closed: { label: "Resolved", dot: "bg-green", chip: "bg-green/10 text-green" },
};

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
// paint use this so server and client agree (no hydration mismatch); the
// <LocalTime> component then re-renders each timestamp in the VIEWER's own
// zone. Evercool's team is in Thailand.
export const DISPLAY_TIME_ZONE = "Asia/Bangkok";

// Short, human time from an ISO string, in the given timezone (default: the team
// zone). Pass the viewer's zone (via <LocalTime>) to show it in their local time.
// dateOnly drops the hour/minute (used where only the calendar day is shown).
export function formatWhen(
  iso: string,
  timeZone: string = DISPLAY_TIME_ZONE,
  opts?: { dateOnly?: boolean },
): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    ...(opts?.dateOnly ? {} : { hour: "2-digit", minute: "2-digit" }),
    timeZone,
  });
}

// Label for non-email channels (returns null for email, which needs no badge).
export function channelLabel(channel: string): string | null {
  const map: Record<string, string> = {
    webchat: "Web chat",
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    instagram: "Instagram",
  };
  return map[channel] ?? null;
}

// "Needs attention" age for a ticket still waiting on us (status open / New). Returns
// a short label once it has been waiting a while, and whether it is overdue, so the
// inbox can flag tickets before they rot. Null for tickets not waiting on us.
export function ticketAttention(
  status: string,
  waitingSinceIso: string,
  nowMs: number = Date.now(),
): { label: string; overdue: boolean } | null {
  if (status !== "open") return null;
  const hours = (nowMs - new Date(waitingSinceIso).getTime()) / 3_600_000;
  if (hours < 24) return null;
  const days = Math.floor(hours / 24);
  const label = days >= 1 ? `${days}d waiting` : `${Math.floor(hours)}h waiting`;
  return { label, overdue: hours >= 72 };
}

export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${units[i]}`;
}

export function localeLabel(code: string): string {
  const map: Record<string, string> = {
    en: "English",
    th: "Thai",
  };
  return map[code] ?? code.toUpperCase();
}
