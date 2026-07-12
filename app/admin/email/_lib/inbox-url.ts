// One place that builds /inbox links so view, filters, and the open thread are
// preserved consistently across the switcher, filters, and cards. The view is in
// the URL, so any layout is shareable and bookmarkable.

export type InboxView = "classic" | "topdash" | "board" | "grid";

export const INBOX_VIEWS: {
  key: InboxView;
  label: string;
  group: "Layouts" | "Overviews";
}[] = [
  { key: "classic", label: "Classic split", group: "Layouts" },
  { key: "topdash", label: "Top dash", group: "Layouts" },
  { key: "board", label: "Board", group: "Overviews" },
  { key: "grid", label: "Cards", group: "Overviews" },
];

// Default to the visual Board (N9): testers and staff land on the overview, with
// the compact List one click away. An explicit ?view= (or the per-user cookie)
// still wins; only an unset/unknown value falls back to the board.
export function parseView(value?: string): InboxView {
  return value === "classic" || value === "topdash" || value === "board" || value === "grid"
    ? value
    : "board";
}

export interface InboxParams {
  view?: string;
  status?: string;
  assignee?: string; // all | desk (my desk: me + unclaimed, the landing default) | me | unassigned | <team-member id>
  thread?: string;
  folder?: string; // all (active) | followups | archived
  drafts?: string; // "pending" = only tickets with an AI draft awaiting approval
  topic?: string; // a topic tag id: only tickets carrying that topic
  segment?: string; // a segment tag id: only tickets whose contact is in that segment
  inbox?: string; // a NEWNEI® address: only tickets that came to that inbox (sales@, ...)
  q?: string; // search text; scope set by qmode
  qmode?: string; // search scope: "all" (default) | "contact" (name + email) | "text" (subject + message body). Ticket reference (N-####) always matches.
}

// The search scopes offered next to the inbox search box (Raphael's request to
// distinguish "search Mail-Address/Name" from "search Full text"). The ticket
// reference (N-#####) always matches in every scope so a handle lookup never fails.
export type SearchMode = "all" | "contact" | "text";

export function parseSearchMode(value?: string): SearchMode {
  return value === "contact" || value === "text" ? value : "all";
}

export const SEARCH_MODES: { key: SearchMode; label: string; hint: string }[] = [
  { key: "all", label: "All", hint: "Name, email, subject and message text" },
  { key: "contact", label: "Name / email", hint: "Only the sender's name and email address" },
  { key: "text", label: "Message text", hint: "Only the subject and message body" },
];

// Patch values may be null/"" to remove a param (e.g. closing the open thread).
export type InboxPatch = { [K in keyof InboxParams]?: string | null };

// Merge patch over current. A patch value of null or "" removes that param.
export function buildInboxHref(current: InboxParams, patch: InboxPatch): string {
  const merged: Record<string, string | undefined> = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") delete merged[k];
    else merged[k] = v;
  }
  const q = new URLSearchParams();
  // Board is the default (N9), so it is the omitted view; any other view (classic,
  // topdash, grid) is written to the URL so it sticks and is shareable.
  if (merged.view && merged.view !== "board") q.set("view", merged.view);
  if (merged.status && merged.status !== "all") q.set("status", merged.status);
  if (merged.assignee && merged.assignee !== "all") q.set("assignee", merged.assignee);
  if (merged.folder && merged.folder !== "all") q.set("folder", merged.folder);
  if (merged.drafts) q.set("drafts", merged.drafts);
  if (merged.topic) q.set("topic", merged.topic);
  if (merged.segment) q.set("segment", merged.segment);
  if (merged.inbox) q.set("inbox", merged.inbox);
  if (merged.q) q.set("q", merged.q);
  // "all" is the default scope, so it is the omitted value; contact/text stick.
  if (merged.qmode && merged.qmode !== "all") q.set("qmode", merged.qmode);
  if (merged.thread) q.set("thread", merged.thread);
  const s = q.toString();
  return s ? `/admin/email/inbox?${s}` : "/admin/email/inbox";
}
