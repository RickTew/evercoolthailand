// The portal's top-level tabs as a shared registry (Rick, 15 Jul: some people
// must not use the CRM at all, others should not see the Build page). Each
// person's ROLE decides the widest set of tabs they could have; the per-user
// `profiles.portal_tabs` list then RESTRICTS below that (empty = everything
// the role allows, the default). The checkboxes can only take tabs away,
// never grant beyond the role, and admins are never restricted. Consumed by
// the nav (hide tabs), the proxy (block direct URLs) and the Users console
// (the checkbox editor), so all three always agree.
//
// Dashboard is deliberately NOT here: it is the landing page and the map, and
// must always be reachable.

export type PortalRole = "admin" | "owner" | "manager" | "sales" | "technician" | "staff";

const ALL: PortalRole[] = ["admin", "owner", "manager", "sales", "technician", "staff"];

export const PORTAL_TABS: {
  key: string;
  label: string;
  pathPrefix: string;
  roles: PortalRole[];
}[] = [
  { key: "crm", label: "CRM", pathPrefix: "/admin/email", roles: ALL },
  { key: "quotes", label: "Quotes", pathPrefix: "/admin/quotes", roles: ["admin", "sales", "manager", "owner"] },
  { key: "bookings", label: "Bookings", pathPrefix: "/admin/bookings", roles: ["admin", "sales", "manager", "owner"] },
  { key: "customers", label: "Customers", pathPrefix: "/admin/customers", roles: ["admin", "sales", "manager", "owner"] },
  { key: "projects", label: "Projects", pathPrefix: "/admin/projects", roles: ["admin", "sales", "manager", "owner"] },
  { key: "service", label: "Service", pathPrefix: "/admin/service", roles: ["admin", "manager", "owner", "technician"] },
  { key: "team", label: "Team", pathPrefix: "/admin/team", roles: ["admin", "manager", "owner"] },
  { key: "reports", label: "Reports", pathPrefix: "/admin/reports", roles: ["admin", "manager", "owner"] },
  { key: "users", label: "Users", pathPrefix: "/admin/users", roles: ["admin", "manager"] },
  { key: "build", label: "Build", pathPrefix: "/admin/build", roles: ALL },
];

// The tab a path belongs to, or null for unmapped admin pages (dashboard,
// website admin, ...), which are never restricted here.
export function portalTabForPath(pathname: string): string | null {
  const hit = PORTAL_TABS.find(
    (t) => pathname === t.pathPrefix || pathname.startsWith(`${t.pathPrefix}/`),
  );
  return hit?.key ?? null;
}

// Is this path allowed for a person with this role + portal_tabs value?
// Restriction-only semantics: an empty/unknown list means "everything the
// role allows"; a non-empty list hides the unticked tabs. Role gates on the
// pages themselves still apply on top.
export function portalPathAllowed(
  pathname: string,
  role: string,
  portalTabs: string[] | null | undefined,
): boolean {
  if (role === "admin") return true;
  if (!portalTabs || portalTabs.length === 0) return true;
  const key = portalTabForPath(pathname);
  if (!key) return true;
  return portalTabs.includes(key);
}

// The tabs this role could ever see: what the Users console offers as
// checkboxes for a person of that role.
export function tabsForRole(role: string): { key: string; label: string }[] {
  return PORTAL_TABS.filter((t) => t.roles.includes(role as PortalRole)).map((t) => ({
    key: t.key,
    label: t.label,
  }));
}
