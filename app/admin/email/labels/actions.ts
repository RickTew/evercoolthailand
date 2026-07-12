"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { getSessionProfile, staffActionAal2Ok } from "@/app/admin/email/_lib/auth";
import { isStaffRole } from "@/app/admin/email/_lib/auth";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

// Any STAFF member can manage the shared label vocabulary. A plain signed-in
// customer also has a teamMember id, so check the role, not just presence: the
// tag vocabulary is shared data (deleteTag cascades to every ticket + contact),
// which a customer must not be able to mutate. Includes the AAL2 backstop:
// server actions are public POST endpoints, so the 2FA level is checked here.
async function requireTeam(): Promise<boolean> {
  const session = await getSessionProfile();
  return session != null && isStaffRole(session.role) && staffActionAal2Ok(session);
}

function revalidate() {
  // Labels appear on the inbox, customers, and the Settings page (Labels tab).
  revalidatePath("/admin/email/labels");
  revalidatePath("/admin/email/inbox");
  
}

export async function createTagAction(
  name: string,
  color: string,
  kind: "topic" | "segment",
): Promise<ActionResult> {
  if (!(await requireTeam())) return { ok: false, error: "Not authorized." };
  const clean = name.trim();
  if (!clean) return { ok: false, error: `Give the ${kind} a name.` };
  const repo = await getRepo();
  const res = await repo.createTag(clean, color, kind);
  if (res.ok) revalidate();
  return res;
}

export async function renameTagAction(id: string, name: string): Promise<ActionResult> {
  if (!(await requireTeam())) return { ok: false, error: "Not authorized." };
  const clean = name.trim();
  if (!clean) return { ok: false, error: "A label needs a name." };
  const repo = await getRepo();
  const res = await repo.updateTag(id, { name: clean });
  if (res.ok) revalidate();
  return res;
}

export async function setTagColorAction(id: string, color: string): Promise<ActionResult> {
  if (!(await requireTeam())) return { ok: false, error: "Not authorized." };
  const repo = await getRepo();
  const res = await repo.updateTag(id, { color });
  if (res.ok) revalidate();
  return res;
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  if (!(await requireTeam())) return { ok: false, error: "Not authorized." };
  const repo = await getRepo();
  await repo.deleteTag(id);
  revalidate();
  return { ok: true };
}
