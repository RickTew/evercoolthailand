"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { getCurrentUserContext, requireStaff } from "@/app/admin/email/_lib/auth";
import { EVERCOOL_INBOXES } from "@/app/admin/email/_lib/inboxes";

// Server actions for the CRM Settings section (ported from newnei Care
// Settings, trimmed to what Evercool runs: personal prefs + the admin Trash
// policy. Aide/AI, Phone and WhatsApp panels come with Phase 4).
// Server Actions are public HTTP endpoints, so every action gates itself.

const SETTINGS_PATH = "/admin/email/settings";

// ---- "You" panel: the signed-in staffer's own preferences ----

export async function setMySignatureAction(signature: string): Promise<{ ok: boolean }> {
  await requireStaff();
  const me = (await getCurrentUserContext()).teamMember;
  if (!me) return { ok: false };
  const repo = await getRepo();
  await repo.setStaffSignature(me.id, signature);
  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}

export async function setMyRestoreSessionAction(on: boolean): Promise<{ ok: boolean }> {
  await requireStaff();
  const me = (await getCurrentUserContext()).teamMember;
  if (!me) return { ok: false };
  const repo = await getRepo();
  await repo.setStaffPrefs(me.id, { restoreSession: on });
  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}

// A personal @evercoolthailand.com address request: the staffer proposes a
// local part, an admin confirms it in the Users console (Care access panel).
// Domain-wide receiving means the address works the moment it is confirmed.
const ADDRESS_LOCAL_RE = /^[a-z0-9](?:[a-z0-9._-]{0,30}[a-z0-9])?$/;

export async function requestMyAddressAction(
  localPart: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireStaff();
  const me = (await getCurrentUserContext()).teamMember;
  if (!me) return { ok: false, error: "Could not identify you." };
  const local = localPart.trim().toLowerCase();
  if (!ADDRESS_LOCAL_RE.test(local)) {
    return { ok: false, error: "Use letters, numbers, dots or dashes (start and end with a letter or number)." };
  }
  const address = `${local}@evercoolthailand.com`;
  // Taken-check against the shared registry and every confirmed personal address.
  const repo = await getRepo();
  const taken =
    EVERCOOL_INBOXES.some((i) => i.address === address) ||
    (await repo.listPersonalAddresses()).some((p) => p.address === address && p.profileId !== me.id);
  if (taken) return { ok: false, error: `${address} is already in use.` };
  await repo.setStaffPrefs(me.id, { requestedAddress: address });
  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}

export async function cancelMyAddressRequestAction(): Promise<{ ok: boolean }> {
  await requireStaff();
  const me = (await getCurrentUserContext()).teamMember;
  if (!me) return { ok: false };
  const repo = await getRepo();
  await repo.setStaffPrefs(me.id, { requestedAddress: null });
  revalidatePath(SETTINGS_PATH);
  return { ok: true };
}

// ---- Trash panel (admin only) ----

export async function setTrashRetentionAction(days: number): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getCurrentUserContext();
  if (!ctx.isAdmin) return { ok: false, error: "Admin only." };
  const repo = await getRepo();
  await repo.setTrashRetentionDays(days);
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

export async function emptyTrashNowAction(): Promise<{ ok: boolean; removed?: number; error?: string }> {
  const ctx = await getCurrentUserContext();
  if (!ctx.isAdmin) return { ok: false, error: "Admin only." };
  const repo = await getRepo();
  const removed = await repo.emptyTrashNow();
  revalidatePath(SETTINGS_PATH);
  revalidatePath("/admin/email/inbox");
  return { ok: true, removed };
}
