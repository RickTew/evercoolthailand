import Link from "next/link";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { getCurrentUserContext, getSessionProfile } from "@/app/admin/email/_lib/auth";
import { getMyStaffPrefs, requireCareSection } from "@/app/admin/email/_lib/sections.server";
import { defaultStaffPrefs } from "@/app/admin/email/_lib/sections";
import { SupportSubBar } from "@/app/admin/email/_components/SupportSubBar";
import { YouPanel } from "@/app/admin/email/_components/settings/YouPanel";
import { SavedRepliesPanel } from "@/app/admin/email/_components/settings/SavedRepliesPanel";
import { TrashPanel } from "@/app/admin/email/_components/settings/TrashPanel";

// CRM Settings (ported from newnei Care Settings, trimmed to what Evercool
// runs today): the staffer's own preferences plus the admin Trash policy.
// Access itself (inbox visibility, sections) is edited by the admin in the
// Users console; here each person only SEES their own access. Aide/AI, Phone
// and WhatsApp panels arrive with Phase 4.

export default async function EmailSettingsPage() {
  await requireCareSection("settings");

  const repo = await getRepo();
  const [userCtx, profile, prefsOrNull, retentionDays, trashCount, savedReplies] = await Promise.all([
    getCurrentUserContext(),
    getSessionProfile(),
    getMyStaffPrefs(),
    repo.getTrashRetentionDays(),
    repo.countTrash(),
    repo.listCannedResponses(),
  ]);
  const me = userCtx.teamMember;
  const prefs = prefsOrNull ?? defaultStaffPrefs(me?.id ?? "");
  // Saved replies are the team's shared voice: admin and manager curate them.
  const canManageReplies = profile?.role === "admin" || profile?.role === "manager";

  // Plain-language description of this person's real inbox visibility. An
  // admin can opt into the 'shared' scope (hide other people's personal
  // mailboxes), so that case is described before the admin catch-all.
  const scopeSummary = userCtx.isAdmin && prefs.inboxScope === "shared"
    ? "You are an admin on the shared scope: you see all company mail; only other people's personal mailboxes are hidden from the inbox."
    : userCtx.isAdmin
    ? "You are an admin: you see every mailbox and every section."
    : prefs.inboxScope === "shared"
      ? "You see all company mail; only other people's personal mailboxes are hidden."
      : prefs.inboxScope === "assigned"
        ? prefs.assignedInboxes.length || prefs.personalAddress
          ? `You see: ${[...prefs.assignedInboxes, ...(prefs.personalAddress && !prefs.assignedInboxes.includes(prefs.personalAddress) ? [prefs.personalAddress] : [])].join(", ")}.`
          : "You are scoped to no mailboxes yet, so the inbox is empty for you."
        : "You see every mailbox.";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <SupportSubBar />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {/* The manual, right where people change their setup (Rick, 14 Jul:
              "a simple how to use it that they can access in Settings"). */}
          <section className="flex items-center justify-between gap-3 rounded-lg border border-teal/40 bg-teal/5 p-4">
            <div>
              <h2 className="text-sm font-semibold text-ink">New here? Read the guide</h2>
              <p className="mt-0.5 text-xs text-muted">
                Step-by-step instructions for the whole CRM: reading, replying, Compose,
                signatures and labels. คู่มือวิธีใช้ระบบ CRM ทีละขั้นตอน มีภาษาไทยทุกหัวข้อ
              </p>
            </div>
            <Link
              href="/admin/email/guide"
              className="shrink-0 rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90"
            >
              How to use
            </Link>
          </section>
          <YouPanel
            prefs={prefs}
            isAdmin={userCtx.isAdmin}
            scopeSummary={scopeSummary}
            displayName={me?.displayName ?? ""}
          />
          <SavedRepliesPanel replies={savedReplies} canManage={canManageReplies} />
          {userCtx.isAdmin && <TrashPanel retentionDays={retentionDays} trashCount={trashCount} />}
        </div>
      </div>
    </div>
  );
}
