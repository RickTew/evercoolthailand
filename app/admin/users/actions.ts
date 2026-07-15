"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { EVERCOOL_INBOXES } from "@/app/admin/email/_lib/inboxes";
import { CARE_SECTION_KEYS, type CareSectionKey } from "@/app/admin/email/_lib/sections";
import type { StaffPrefs } from "@/app/admin/email/_lib/types";

// Server actions for the Users console's "CRM access" panel (ported from
// newnei's CareAccessEditor): the checkboxes that decide which mailboxes and
// CRM sections each staffer can see. Admin AND manager (Rick, 15 Jul:
// Wanrawee sets up new hires), but a manager can never touch an ADMIN's
// access. Server Actions are public HTTP endpoints, so the gate lives here,
// not just in the UI.

async function requireUserManagerId(targetUserId?: string): Promise<string | null> {
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
  if (profile?.role !== "admin" && profile?.role !== "manager") return null;
  // The manager tier stops at admins: reading or writing an admin's access
  // needs an admin caller.
  if (profile.role === "manager" && targetUserId) {
    const { data: target } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", targetUserId)
      .maybeSingle();
    if (target?.role === "admin") return null;
  }
  return user.id;
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
  if (!(await requireUserManagerId(userId))) return { ok: false, error: "Not allowed." };
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
  if (!(await requireUserManagerId(userId))) return { ok: false, error: "Not allowed." };
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
  if (!(await requireUserManagerId(userId))) return { ok: false, error: "Not allowed." };
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
