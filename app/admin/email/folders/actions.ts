"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { getSessionProfile, staffActionAal2Ok } from "@/app/admin/email/_lib/auth";
import { isStaffRole } from "@/app/admin/email/_lib/auth";
import type { Folder } from "@/app/admin/email/_lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  id?: string;
}

// The signed-in staffer's id, recorded as the folder creator. Doubles as the
// staff-auth gate: returns null for anyone who is NOT staff (a plain signed-in
// customer also has a teamMember id, so the role must be checked, not just
// presence; folders/tags are shared data a customer must not be able to mutate).
// Also enforces the AAL2 backstop: server actions are public POST endpoints, so
// the 2FA level must be checked here, not only by proxy path-matching.
async function staffId(): Promise<string | null> {
  const session = await getSessionProfile();
  if (!session || !isStaffRole(session.role) || !staffActionAal2Ok(session)) return null;
  return session.id;
}

export async function createFolderAction(name: string): Promise<ActionResult> {
  const by = await staffId();
  if (!by) return { ok: false, error: "Not authorized." };
  if (!name.trim()) return { ok: false, error: "Give the folder a name." };
  const repo = await getRepo();
  const res = await repo.createFolder(by, name.trim());
  if (res.ok) revalidatePath("/admin/email/inbox");
  return res;
}

export async function deleteFolderAction(id: string): Promise<ActionResult> {
  if (!(await staffId())) return { ok: false, error: "Not authorized." };
  const repo = await getRepo();
  await repo.deleteFolder(id);
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

export async function addToFolderAction(threadId: string, folderId: string): Promise<ActionResult> {
  if (!(await staffId())) return { ok: false, error: "Not authorized." };
  const repo = await getRepo();
  await repo.addThreadToFolder(threadId, folderId);
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

export async function removeFromFolderAction(threadId: string, folderId: string): Promise<ActionResult> {
  if (!(await staffId())) return { ok: false, error: "Not authorized." };
  const repo = await getRepo();
  await repo.removeThreadFromFolder(threadId, folderId);
  revalidatePath("/admin/email/inbox");
  return { ok: true };
}

// Bulk-move (R2): drop many selected tickets into one shared folder at once.
export async function bulkAddToFolderAction(
  threadIds: string[],
  folderId: string,
): Promise<{ ok: boolean; count: number }> {
  if (!(await staffId())) return { ok: false, count: 0 };
  if (!folderId || threadIds.length === 0) return { ok: false, count: 0 };
  const repo = await getRepo();
  for (const id of threadIds) {
    await repo.addThreadToFolder(id, folderId);
  }
  revalidatePath("/admin/email/inbox");
  return { ok: true, count: threadIds.length };
}

// For the per-ticket "Add to folder" control: the shared folders + which the
// thread is currently in.
export async function listThreadFoldersAction(
  threadId: string,
): Promise<{ folders: Folder[]; inIds: string[] }> {
  if (!(await staffId())) return { folders: [], inIds: [] };
  const repo = await getRepo();
  const [folders, inIds] = await Promise.all([
    repo.listFolders(),
    repo.listThreadFolderIds(threadId),
  ]);
  return { folders, inIds };
}
