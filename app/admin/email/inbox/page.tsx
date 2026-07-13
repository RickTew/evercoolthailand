import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { getCurrentUserContext } from "@/app/admin/email/_lib/auth";
import type { ThreadStatus } from "@/app/admin/email/_lib/types";
import { buildInboxHref, parseView, parseSearchMode, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { SupportSubBar } from "@/app/admin/email/_components/SupportSubBar";
import { ViewSwitcher } from "@/app/admin/email/_components/inbox/ViewSwitcher";
import { defaultStaffPrefs } from "@/app/admin/email/_lib/sections";
import { getMyStaffPrefs, requireCareSection } from "@/app/admin/email/_lib/sections.server";
import { EVERCOOL_INBOXES, inboxLabel } from "@/app/admin/email/_lib/inboxes";
import { InboxScopeProvider, type InboxOption } from "@/app/admin/email/_components/inbox/InboxScope";
import { NewMailButton } from "@/app/admin/email/_components/inbox/NewMailButton";
import { RememberInboxState } from "@/app/admin/email/_components/inbox/RememberInboxState";
import { FolderStrip } from "@/app/admin/email/_components/inbox/FolderStrip";
import { ClassicView } from "@/app/admin/email/_components/inbox/views/ClassicView";
import { TopDashView } from "@/app/admin/email/_components/inbox/views/TopDashView";
import { BoardView } from "@/app/admin/email/_components/inbox/views/BoardView";
import { GridView } from "@/app/admin/email/_components/inbox/views/GridView";

type SearchParams = {
  view?: string;
  status?: string;
  assignee?: string;
  thread?: string;
  folder?: string;
  drafts?: string;
  topic?: string;
  segment?: string;
  inbox?: string;
  q?: string;
  qmode?: string;
};

function parseStatus(value?: string): ThreadStatus | "all" {
  if (value === "open" || value === "pending" || value === "closed") return value;
  return "all";
}


export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  // Care section gate: bounce anyone whose access doesn't include the Inbox to
  // their first allowed section (a hidden tab can't be reached by URL).
  await requireCareSection("inbox");

  // Session restore: a FRESH landing (no view/filters in the URL) reopens where this
  // person left off, when they have "Pick up where you left off" on. The redirect
  // target carries params, so the next render skips this and renders normally.
  //
  // "Fresh" matters: clearing every filter (clicking All, or toggling the last
  // filter off) also lands on a bare /support/inbox, and the Board's default view
  // is omitted from the URL, so it is bare too. Without the referer check the
  // restore would snap those deliberate "show everything" clicks straight back to
  // the saved filter (it looked like All / Unassigned were locked and flashed
  // white). So only restore when we did NOT arrive from within the inbox itself;
  // an in-inbox navigation is the user deliberately changing their own filters.
  if (Object.keys(sp).length === 0) {
    const referer = (await headers()).get("referer") ?? "";
    let fromInbox = false;
    try {
      fromInbox = referer ? new URL(referer).pathname.startsWith("/admin/email/inbox") : false;
    } catch {
      fromInbox = false;
    }
    if (!fromInbox) {
      const restorePrefs = await getMyStaffPrefs();
      // My desk is the landing default (Rick, 2 July): a fresh login opens on
      // YOUR work (assigned to you + unclaimed), not the whole shared queue.
      // Remembered workspace filters still restore on top; only when the saved
      // state names its own assignee choice (me, a person, unassigned) does
      // that win. "Everyone" is always one click away and holds for the whole
      // session (in-inbox navigation never re-triggers this block).
      const saved: Record<string, string | undefined> = restorePrefs?.restoreSession
        ? { view: restorePrefs.lastView ?? undefined, ...(restorePrefs.lastFilters as Record<string, string>) }
        : {};
      if (!saved.assignee) saved.assignee = "desk";
      const target = buildInboxHref(saved, {});
      if (target !== "/admin/email/inbox") redirect(target);
    }
  }

  const cookieStore = await cookies();
  // Default to the layout the user last picked (cookie), unless the URL names one.
  const view = parseView(sp.view ?? cookieStore.get("lastView")?.value);
  const status = parseStatus(sp.status);

  const repo = await getRepo();
  // folder can now be "all", "archived", or a custom folder id (#11). A custom
  // folder filters by membership; otherwise the active/archived axis applies.
  const folderParam = sp.folder ?? "all";
  const folderView =
    folderParam === "archived"
      ? "archived"
      : folderParam === "trash"
        ? "trash"
        : folderParam === "sent"
          ? "sent"
          : folderParam === "spam"
            ? "spam"
            : "active";
  const folderId =
    folderParam !== "all" &&
    folderParam !== "archived" &&
    folderParam !== "trash" &&
    folderParam !== "sent" &&
    folderParam !== "spam"
      ? folderParam
      : undefined;
  // Only the overview layouts (topdash/board/grid) need the all-status counts for
  // their tiles; Classic doesn't, so skip that query there. A cheap count-only
  // query, NOT a second hydrated listThreads() (which doubled the heaviest render
  // and starved client navigations on this DB-bound page).
  const needsCounts = view !== "classic";

  const [team, userCtx, prefsOrNull, trashRetentionDays] = await Promise.all([
    repo.listTeam(),
    getCurrentUserContext(),
    getMyStaffPrefs(),
    repo.getTrashRetentionDays(),
  ]);
  const me = userCtx.teamMember;
  const prefs = prefsOrNull ?? defaultStaffPrefs(me?.id ?? "");
  // "desk" = My desk (mine + unclaimed), resolved to the signed-in staffer's id
  // and passed as its own filter so the repo can express "mine OR unowned".
  const deskId = sp.assignee === "desk" ? me?.id ?? undefined : undefined;
  const assigneeId =
    sp.assignee === "me" ? me?.id ?? "all" : sp.assignee === "desk" ? "all" : sp.assignee ?? "all";
  const pendingDraft = sp.drafts === "pending";
  const topicId = sp.topic || undefined;
  const segmentId = sp.segment || undefined;
  const q = sp.q?.trim() || undefined;
  const qmode = parseSearchMode(sp.qmode);

  // Per-staff inbox visibility. When a person is scoped to 'assigned', they see
  // ONLY mail to their assigned inboxes + their confirmed personal address; admins
  // are never scoped. The allowed set is enforced in listThreads (so the URL can't
  // escape it) and drives the inbox dropdown's options.
  const chosenInbox = sp.inbox?.trim().toLowerCase() || undefined;
  const scoped = prefs.inboxScope === "assigned" && !userCtx.isAdmin;
  const myAddresses = scoped
    ? Array.from(
        new Set([
          ...prefs.assignedInboxes.map((a) => a.toLowerCase()),
          ...(prefs.personalAddress ? [prefs.personalAddress.toLowerCase()] : []),
        ]),
      )
    : null;
  // The manager's 'shared' scope is the INVERSE: see everything (including mail
  // to addresses nobody has listed, so company mail can never hide) EXCEPT
  // threads that went only to another staffer's personal address. The excluded
  // set is every OTHER person's confirmed personal address.
  const sharedScope = prefs.inboxScope === "shared" && !userCtx.isAdmin;
  const excludeInboxes = sharedScope
    ? (await repo.listPersonalAddresses())
        .filter((p) => p.profileId !== (me?.id ?? ""))
        .map((p) => p.address)
    : undefined;
  // The filter passed to listThreads: the allowed set (scoped, narrowed to the
  // chosen one when it's in scope) or the single dropdown value (unscoped). A
  // shared-scope user may still pick any non-excluded inbox from the dropdown.
  const inboxesFilter = myAddresses
    ? chosenInbox && myAddresses.includes(chosenInbox)
      ? [chosenInbox]
      : myAddresses
    : undefined;
  const inboxFilter = myAddresses
    ? undefined
    : chosenInbox && excludeInboxes?.includes(chosenInbox)
      ? undefined
      : chosenInbox;
  // The dropdown options for this person.
  const inboxOptions: InboxOption[] = myAddresses
    ? myAddresses.map((a) => ({ address: a, label: inboxLabel(a) }))
    : EVERCOOL_INBOXES.filter((i) => !excludeInboxes?.includes(i.address)).map((i) => ({
        address: i.address,
        label: i.label,
      }));

  // When a specific thread is in the URL (the usual "clicked a conversation"
  // case), fetch its detail in the SAME batch as the lists instead of after
  // them, so a click is one parallel round-trip, not list-then-detail.
  // The Board groups by status into columns, so it must load ALL statuses and let
  // the columns split them; applying a status filter there would empty the other
  // columns and make the tiles disagree with the columns. Other views honor status.
  const listStatus = view === "board" ? "all" : status;

  const [items, counts, tags, preDetail, folders] = await Promise.all([
    repo.listThreads({ status: listStatus, assigneeId, deskId, view: folderView, pendingDraft, folderId, topicId, segmentId, inbox: inboxFilter, inboxes: inboxesFilter, excludeInboxes, q, qmode }),
    // The overview tiles reflect the same topic/segment scope (but all statuses),
    // and the same per-staff inbox scope as the list (inboxesFilter): a scoped
    // person's tiles count only their inboxes, never the whole queue. Unscoped
    // users pass undefined here, so their tiles stay global as before.
    needsCounts
      ? repo.countThreads({ topicId, segmentId, inbox: inboxFilter, inboxes: inboxesFilter, excludeInboxes })
      : Promise.resolve({ total: 0, open: 0, pending: 0, closed: 0, unassigned: 0, awaiting: 0 }),
    repo.listTags(),
    sp.thread ? repo.getThread(sp.thread) : Promise.resolve(null),
    repo.listFolders(),
  ]);
  // The composer prefill: this person's own signature (already loaded with prefs).
  const mySignature = prefs.signature;

  // The Board's tiles are a breakdown of exactly what it shows, so they are derived
  // from the displayed items (not the global count query). That guarantees the
  // tiles always match the column counts, including when a filter (AI drafts,
  // Unassigned, a folder) narrows the board.
  const boardCounts =
    view === "board"
      ? {
          total: items.length,
          open: items.filter((i) => i.thread.status === "open").length,
          pending: items.filter((i) => i.thread.status === "pending").length,
          closed: items.filter((i) => i.thread.status === "closed").length,
          unassigned: items.filter((i) => !i.assignee).length,
          awaiting: items.filter((i) => i.hasPendingDraft).length,
        }
      : counts;

  // The working layouts auto-open the first conversation; the overviews only open
  // one when a card is clicked (a thread is in the URL).
  const autoSelect = view === "classic" || view === "topdash";
  let selectedId = sp.thread ?? (autoSelect ? items[0]?.thread.id ?? null : null);
  // Already fetched above when the URL named a thread; otherwise resolve the
  // auto-selected first item now (depends on `items`, so it can't be in the batch).
  let detail = sp.thread
    ? preDetail
    : selectedId
      ? await repo.getThread(selectedId)
      : null;

  // A scoped person can't open an out-of-scope thread by URL id either: confirm the
  // opened thread actually received mail at one of their inboxes (mirrors the list
  // scoping). Auto-selected threads come from the already-scoped list, so this only
  // ever blocks an explicit ?thread=<id> for mail they shouldn't see.
  if (myAddresses && detail) {
    const allow = myAddresses.map((a) => a.toLowerCase());
    const inScope = detail.messages.some(
      (m) => m.direction === "inbound" && allow.some((a) => (m.toAddress ?? "").toLowerCase().includes(a)),
    );
    if (!inScope) {
      detail = null;
      selectedId = null;
    }
  }
  // Same by-URL guard for the shared scope: an opened thread is blocked when its
  // inbound Evercool recipients are all other staffers' personal addresses
  // (mirrors the list exclusion; anything else stays reachable).
  if (sharedScope && excludeInboxes?.length && detail) {
    const OWN_INBOX_RE = /@(?:[a-z0-9-]+\.)*evercoolthailand\.com$/i;
    const recipients = detail.messages
      .filter((m) => m.direction === "inbound")
      .flatMap((m) => `${m.toAddress ?? ""},${m.ccAddress ?? ""}`.split(","))
      .map((s) => (s.match(/<([^>]+)>/)?.[1] ?? s).trim().toLowerCase())
      .filter((a) => OWN_INBOX_RE.test(a));
    if (recipients.length > 0 && recipients.every((a) => excludeInboxes.includes(a))) {
      detail = null;
      selectedId = null;
    }
  }

  const current: InboxParams = {
    view: sp.view,
    status: sp.status,
    assignee: sp.assignee,
    thread: sp.thread,
    folder: sp.folder,
    drafts: sp.drafts,
    topic: sp.topic,
    segment: sp.segment,
    inbox: sp.inbox,
    q: sp.q,
    qmode: sp.qmode,
  };
  const threadHref = (id: string) => buildInboxHref(current, { thread: id });

  // What to remember for "pick up where you left off": the layout + durable
  // workspace filters (not the open thread, which may not exist next time).
  // Exploratory NARROWING filters (segment, topic, free-text search) are
  // deliberately NOT remembered across sessions: a saved segment silently hid mail
  // on the next login, so a person "could not see all mails anymore, even after
  // re-login" (Raphael). Status / assignee / folder / inbox are real workspace
  // choices, so those still persist.
  // "drafts" joins the skip list for the same reason as segment/q: a restored
  // drafts=pending silently narrowed the next login to AI-draft threads only,
  // the exact "most mail missing" class Raphael reported.
  const REMEMBER_SKIP = new Set(["view", "thread", "topic", "segment", "q", "qmode", "drafts"]);
  const rememberFilters: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (REMEMBER_SKIP.has(k)) continue;
    if (typeof v === "string" && v) rememberFilters[k] = v;
  }

  return (
    // h-full fills the staff-chrome content region (the layout column is h-dvh +
    // overflow-hidden), so the inner panes scroll, not the page. The shared
    // SupportSubBar carries the section nav; the inbox-only controls (view
    // switcher, agent controls) ride in its right-hand slot. The InboxScopeProvider
    // tells the inbox dropdown which addresses this person may filter by.
    <InboxScopeProvider options={inboxOptions}>
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {prefs.restoreSession && <RememberInboxState view={view} filters={rememberFilters} />}
      <SupportSubBar
        right={
          <div className="flex items-center gap-3">
            <NewMailButton signature={mySignature} />
            <ViewSwitcher current={current} active={view} />
          </div>
        }
      />

      {/* Folder navigation (Inbox / Archived / Trash + custom folders) as a single
          full-width bar above the opened mail, shared by the overview views. In
          Classic (List) the folders share ONE band with the filters (variant A),
          so that view renders its own folder strip and we skip the page-level one. */}
      {view !== "classic" && (
        <FolderStrip folders={folders} current={current} trashRetentionDays={trashRetentionDays} />
      )}

      {view === "classic" && (
        <ClassicView
          items={items}
          detail={detail}
          team={team}
          tags={tags}
          current={current}
          selectedId={selectedId}
          threadHref={threadHref}
          meId={me?.id ?? null}
          folders={folders}
          trashRetentionDays={trashRetentionDays}
        />
      )}
      {view === "topdash" && (
        <TopDashView
          items={items}
          counts={counts}
          detail={detail}
          team={team}
          tags={tags}
          current={current}
          selectedId={selectedId}
          meId={me?.id ?? null}
          folders={folders}
        />
      )}
      {view === "board" && (
        <BoardView
          items={items}
          counts={boardCounts}
          detail={detail}
          team={team}
          tags={tags}
          current={current}
          meId={me?.id ?? null}
        />
      )}
      {view === "grid" && (
        <GridView
          items={items}
          counts={counts}
          detail={detail}
          team={team}
          tags={tags}
          current={current}
          threadHref={threadHref}
          meId={me?.id ?? null}
        />
      )}
    </div>
    </InboxScopeProvider>
  );
}
