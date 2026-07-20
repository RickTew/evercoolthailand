"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient, createAdminClient } from "@/lib/supabase/server";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { EVERCOOL_INBOXES } from "@/app/admin/email/_lib/inboxes";
import { CARE_SECTION_KEYS, type CareSectionKey } from "@/app/admin/email/_lib/sections";
import { tabsForRole } from "@/lib/portalTabs";
import type { StaffPrefs } from "@/app/admin/email/_lib/types";

// Server actions for the Users console's "CRM access" panel (ported from
// newnei's CareAccessEditor): the checkboxes that decide which mailboxes and
// CRM sections each staffer can see. Admin AND manager (Rick, 15 Jul:
// Wanrawee sets up new hires), but a manager can never touch an ADMIN's
// access. Server Actions are public HTTP endpoints, so the gate lives here,
// not just in the UI.

// The tier a manager may never read or write: "owner" outranks manager exactly
// as "admin" does, so both are covered.
const ADMIN_TIER = ["admin", "owner"] as const;
function isAdminTier(role: string | null | undefined): boolean {
  return role != null && (ADMIN_TIER as readonly string[]).includes(role);
}

async function requireUserManagerId(
  targetUserId?: string,
  opts?: { write?: boolean },
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // is_active is re-checked here because the proxy only guards /admin/* page
  // routes; a deactivated account with a live session could otherwise still
  // invoke this server action directly.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_active === false) return null;
  if (profile?.role !== "admin" && profile?.role !== "manager") return null;
  // The manager tier stops at the admin tier: reading or writing an admin's or
  // owner's access needs an admin caller.
  if (profile.role === "manager" && targetUserId) {
    const { data: target } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", targetUserId)
      .maybeSingle();
    if (isAdminTier(target?.role)) return null;
  }
  // Nobody widens their own access. Without this a manager whose portal tabs an
  // admin had narrowed could simply save their own row with every tab ticked,
  // since their own role is not admin-tier and every check above passes.
  if (opts?.write && targetUserId && targetUserId === user.id && profile.role !== "admin") {
    return null;
  }
  return user.id;
}

export interface CareAccess {
  inboxScope: StaffPrefs["inboxScope"];
  assignedInboxes: string[];
  personalAddress: string | null;
  requestedAddress: string | null;
  careSections: string[];
  // The target's role + their portal-tab restriction (profiles.portal_tabs):
  // empty = every tab their role allows; non-empty = only the ticked tabs.
  role: string;
  portalTabs: string[];
}

// The current access for one staffer (loaded when the admin expands the panel).
export async function loadCareAccessAction(
  userId: string,
): Promise<{ ok: boolean; access?: CareAccess; error?: string }> {
  if (!(await requireUserManagerId(userId))) return { ok: false, error: "Not allowed." };
  const repo = await getRepo();
  const prefs = await repo.getStaffPrefs(userId);
  // Role + portal tabs live on profiles. portal_tabs is best-effort until
  // migration 0009 lands: a missing column reads as "no restriction".
  const admin = createAdminClient();
  const { data: roleRow } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
  const { data: tabsRow, error: tabsError } = await admin
    .from("profiles")
    .select("portal_tabs")
    .eq("id", userId)
    .maybeSingle();
  return {
    ok: true,
    access: {
      inboxScope: prefs.inboxScope,
      assignedInboxes: prefs.assignedInboxes,
      personalAddress: prefs.personalAddress,
      requestedAddress: prefs.requestedAddress,
      careSections: prefs.careSections,
      role: roleRow?.role ?? "staff",
      portalTabs: tabsError ? [] : ((tabsRow?.portal_tabs as string[] | null) ?? []),
    },
  };
}

export async function setUserCareAccessAction(
  userId: string,
  patch: {
    inboxScope: StaffPrefs["inboxScope"];
    assignedInboxes: string[];
    careSections: string[];
    // Portal-tab restriction; empty array = everything the role allows.
    portalTabs?: string[];
  },
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireUserManagerId(userId, { write: true }))) return { ok: false, error: "Not allowed." };
  if (!userId) return { ok: false, error: "No user." };

  const scope = (["all", "shared", "assigned"] as const).includes(patch.inboxScope)
    ? patch.inboxScope
    : "all";

  // Only assignable addresses may be saved: the shared/function registry plus
  // this person's OWN confirmed personal address. Another staffer's personal
  // mailbox is rejected here too, not just hidden in the UI.
  const repo = await getRepo();
  const prefs = await repo.getStaffPrefs(userId);
  const allowed = new Set<string>([
    ...EVERCOOL_INBOXES.filter((i) => !("personal" in i && i.personal)).map((i) => i.address),
    ...(prefs.personalAddress ? [prefs.personalAddress.toLowerCase()] : []),
  ]);
  const assignedInboxes = [...new Set(patch.assignedInboxes.map((a) => a.trim().toLowerCase()))].filter((a) =>
    allowed.has(a),
  );

  // Only known section keys; EMPTY = all sections (backward compatible).
  const careSections = patch.careSections.filter((s): s is CareSectionKey =>
    (CARE_SECTION_KEYS as readonly string[]).includes(s),
  );

  await repo.setStaffPrefs(userId, { inboxScope: scope, assignedInboxes, careSections });

  // Portal tabs (profiles.portal_tabs): restriction-only, so only keys the
  // target's role could see are kept; ticking everything is stored as [] =
  // "no restriction". Saved best-effort until migration 0009 adds the column.
  if (patch.portalTabs !== undefined) {
    const admin = createAdminClient();
    const { data: roleRow } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
    const roleTabs = tabsForRole(roleRow?.role ?? "staff").map((t) => t.key);
    const cleaned = patch.portalTabs.filter((k) => roleTabs.includes(k));
    const value = cleaned.length >= roleTabs.length ? [] : cleaned;
    const { error: tabsError } = await admin
      .from("profiles")
      .update({ portal_tabs: value, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (tabsError) {
      return { ok: false, error: "Mailboxes and sections saved, but portal tabs could not be saved yet (database migration 0009 pending)." };
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/email/inbox");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

// Confirm or decline a staffer's personal-address request (made in CRM
// Settings > You). Approving also assigns the new address so they see its mail.
export async function resolveAddressRequestAction(
  userId: string,
  approve: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireUserManagerId(userId, { write: true }))) return { ok: false, error: "Not allowed." };
  const repo = await getRepo();
  const prefs = await repo.getStaffPrefs(userId);
  const requested = (prefs.requestedAddress ?? "").trim().toLowerCase();
  if (!requested) return { ok: false, error: "No pending request." };
  if (!approve) {
    await repo.setStaffPrefs(userId, { requestedAddress: null });
  } else {
    await repo.setStaffPrefs(userId, {
      personalAddress: requested,
      requestedAddress: null,
      assignedInboxes: [...new Set([...prefs.assignedInboxes, requested])],
    });
  }
  revalidatePath("/admin/users");
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}
