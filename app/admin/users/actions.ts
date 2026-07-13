"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { EVERCOOL_INBOXES } from "@/app/admin/email/_lib/inboxes";
import { CARE_SECTION_KEYS, type CareSectionKey } from "@/app/admin/email/_lib/sections";
import type { StaffPrefs } from "@/app/admin/email/_lib/types";

// Server actions for the Users console's "CRM access" panel (ported from
// newnei's CareAccessEditor): the admin-side checkboxes that decide which
// mailboxes and CRM sections each staffer can see. Admin only; Server Actions
// are public HTTP endpoints, so the gate lives here, not just in the UI.

async function requireAdminId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  return profile?.role === "admin" ? user.id : null;
}

export interface CareAccess {
  inboxScope: StaffPrefs["inboxScope"];
  assignedInboxes: string[];
  personalAddress: string | null;
  requestedAddress: string | null;
  careSections: string[];
}

// The current access for one staffer (loaded when the admin expands the panel).
export async function loadCareAccessAction(
  userId: string,
): Promise<{ ok: boolean; access?: CareAccess; error?: string }> {
  if (!(await requireAdminId())) return { ok: false, error: "Admin only." };
  const repo = await getRepo();
  const prefs = await repo.getStaffPrefs(userId);
  return {
    ok: true,
    access: {
      inboxScope: prefs.inboxScope,
      assignedInboxes: prefs.assignedInboxes,
      personalAddress: prefs.personalAddress,
      requestedAddress: prefs.requestedAddress,
      careSections: prefs.careSections,
    },
  };
}

export async function setUserCareAccessAction(
  userId: string,
  patch: {
    inboxScope: StaffPrefs["inboxScope"];
    assignedInboxes: string[];
    careSections: string[];
  },
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdminId())) return { ok: false, error: "Admin only." };
  if (!userId) return { ok: false, error: "No user." };

  const scope = (["all", "shared", "assigned"] as const).includes(patch.inboxScope)
    ? patch.inboxScope
    : "all";

  // Only known addresses may be assigned: the shared registry plus this
  // person's own confirmed personal address.
  const repo = await getRepo();
  const prefs = await repo.getStaffPrefs(userId);
  const allowed = new Set<string>([
    ...EVERCOOL_INBOXES.map((i) => i.address),
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
  revalidatePath("/admin/users");
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

// Confirm or decline a staffer's personal-address request (made in CRM
// Settings > You). Approving also assigns the new address so they see its mail.
export async function resolveAddressRequestAction(
  userId: string,
  approve: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdminId())) return { ok: false, error: "Admin only." };
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
