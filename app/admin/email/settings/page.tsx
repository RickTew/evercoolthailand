import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { getCurrentUserContext } from "@/app/admin/email/_lib/auth";
import { getMyStaffPrefs, requireCareSection } from "@/app/admin/email/_lib/sections.server";
import { defaultStaffPrefs } from "@/app/admin/email/_lib/sections";
import { SupportSubBar } from "@/app/admin/email/_components/SupportSubBar";
import { YouPanel } from "@/app/admin/email/_components/settings/YouPanel";
import { TrashPanel } from "@/app/admin/email/_components/settings/TrashPanel";

// CRM Settings (ported from newnei Care Settings, trimmed to what Evercool
// runs today): the staffer's own preferences plus the admin Trash policy.
// Access itself (inbox visibility, sections) is edited by the admin in the
// Users console; here each person only SEES their own access. Aide/AI, Phone
// and WhatsApp panels arrive with Phase 4.

export default async function EmailSettingsPage() {
  await requireCareSection("settings");

  const repo = await getRepo();
  const [userCtx, prefsOrNull, retentionDays, trashCount] = await Promise.all([
    getCurrentUserContext(),
    getMyStaffPrefs(),
    repo.getTrashRetentionDays(),
    repo.countTrash(),
  ]);
  const me = userCtx.teamMember;
  const prefs = prefsOrNull ?? defaultStaffPrefs(me?.id ?? "");

  // Plain-language description of this person's real inbox visibility.
  const scopeSummary = userCtx.isAdmin
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
          <YouPanel prefs={prefs} isAdmin={userCtx.isAdmin} scopeSummary={scopeSummary} />
          {userCtx.isAdmin && <TrashPanel retentionDays={retentionDays} trashCount={trashCount} />}
        </div>
      </div>
    </div>
  );
}
