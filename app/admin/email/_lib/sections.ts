import type { StaffPrefs } from "@/app/admin/email/_lib/types";

// Pure (client-safe) Email-section constants + helpers. The server-only reader
// and route gate (getMyStaffPrefs, requireCareSection) live in sections.server.ts
// so a client component can import this list without pulling the service-role
// client in.

// The navigable sub-sections of the Email module, in nav order. An admin can
// scope a staffer to a subset of these (support_staff_prefs.care_sections);
// EMPTY means all, so nobody is locked out until they are deliberately scoped.
export const CARE_SECTIONS = [
  { key: "inbox", label: "Inbox", href: "/admin/email/inbox" },
  { key: "contacts", label: "Customers", href: "/admin/email/customers" },
  { key: "labels", label: "Labels", href: "/admin/email/labels" },
  { key: "settings", label: "Settings", href: "/admin/email/settings" },
  { key: "test", label: "Test Lab", href: "/admin/email/test" },
] as const;

export type CareSectionKey = (typeof CARE_SECTIONS)[number]["key"];

export const CARE_SECTION_KEYS = CARE_SECTIONS.map((s) => s.key) as readonly CareSectionKey[];

// The defaults a person has before any pref row exists (and the shape every
// missing column falls back to). Mirrors the migration defaults: every inbox,
// every section, restore on.
export function defaultStaffPrefs(profileId: string): StaffPrefs {
  return {
    profileId,
    signature: "",
    inboxScope: "all",
    assignedInboxes: [],
    personalAddress: null,
    requestedAddress: null,
    careSections: [],
    canPhone: true,
    canAiToggle: false,
    restoreSession: true,
    defaultView: null,
    lastView: null,
    lastFilters: {},
  };
}

// EMPTY care_sections = all (backward compatible); admin always sees all (so an
// admin can never scope themselves out). Otherwise it is an allow-list.
export function canSeeCareSection(
  key: CareSectionKey,
  prefs: Pick<StaffPrefs, "careSections">,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  if (!prefs.careSections || prefs.careSections.length === 0) return true;
  return prefs.careSections.includes(key);
}

// The sections this person may open, in nav order (used to filter the sub-nav).
export function allowedCareSections(
  prefs: Pick<StaffPrefs, "careSections">,
  isAdmin: boolean,
): CareSectionKey[] {
  return CARE_SECTIONS.filter((s) => canSeeCareSection(s.key, prefs, isAdmin)).map((s) => s.key);
}

// Where to send someone who hits a section they cannot open: their first allowed
// section, or the admin dashboard if (somehow) none are allowed.
export function firstAllowedCareHref(
  prefs: Pick<StaffPrefs, "careSections">,
  isAdmin: boolean,
): string {
  const first = CARE_SECTIONS.find((s) => canSeeCareSection(s.key, prefs, isAdmin));
  return first ? first.href : "/admin/dashboard";
}
