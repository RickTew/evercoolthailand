import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/app/admin/email/_lib/auth";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import type { StaffPrefs } from "@/app/admin/email/_lib/types";
import { canSeeCareSection, firstAllowedCareHref, type CareSectionKey } from "@/app/admin/email/_lib/sections";

// Server-only Email-access plumbing: reads the signed-in staffer's full prefs
// (with the service-role client) and gates Email routes. The pure constants/
// helpers live in sections.ts so client components can share them.

// The signed-in staffer's full prefs, cached per request so the sub-bar, the
// page gate, and the page body all share ONE read. Returns defaults (never
// null) for a signed-in person with no row yet; null only when not signed in.
export const getMyStaffPrefs = cache(async function getMyStaffPrefs(): Promise<StaffPrefs | null> {
  const profile = await getSessionProfile();
  if (!profile) return null;
  const repo = await getRepo();
  return repo.getStaffPrefs(profile.id);
});

// The inbox addresses the signed-in staffer is restricted to (their assigned
// inboxes + confirmed personal address), or null when unscoped: an admin (never
// scoped), nobody signed in, or scope = 'all' (sees every inbox). This is the
// SAME allowed slice the inbox list + detail enforce. A non-null EMPTY array
// means scope = 'assigned' with nothing assigned, i.e. "sees nothing". Cached
// per request. NOTE: the manager's 'shared' scope is an EXCLUSION (everything
// except other people's personal mail) and cannot be expressed as an allowed
// list, so it also returns null here; inbox/page.tsx enforces it via
// excludeInboxes. Do not use this helper alone to gate shared-scope users.
export const getMyInboxScope = cache(async function getMyInboxScope(): Promise<string[] | null> {
  const profile = await getSessionProfile();
  if (!profile || profile.role === "admin") return null;
  const prefs = await getMyStaffPrefs();
  if (!prefs || prefs.inboxScope !== "assigned") return null;
  return Array.from(
    new Set([
      ...prefs.assignedInboxes.map((a) => a.toLowerCase()),
      ...(prefs.personalAddress ? [prefs.personalAddress.toLowerCase()] : []),
    ]),
  );
});

// Route gate: redirect anyone whose prefs do not allow this Email section to
// their first allowed one, so a hidden tab cannot be reached by typing the URL.
// The admin layout's signed-in + active gate already ran.
export async function requireCareSection(key: CareSectionKey): Promise<void> {
  const profile = await getSessionProfile();
  if (!profile) return; // the admin layout handles the unauthenticated case
  const isAdmin = profile.role === "admin";
  const prefs = await getMyStaffPrefs();
  if (!prefs) return;
  if (!canSeeCareSection(key, prefs, isAdmin)) {
    redirect(firstAllowedCareHref(prefs, isAdmin));
  }
}
