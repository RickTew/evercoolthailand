"use server";

import { revalidatePath } from "next/cache";
import { getRepo } from "@/app/admin/email/_lib/data/repo";
import { requireStaff } from "@/app/admin/email/_lib/auth";

// Knowledge curation actions (ported from newnei's Wisdom actions). Staff-only:
// Server Actions are public HTTP endpoints, so the role gate runs in every
// action before any service-role write. Without it, anyone could insert a
// "verified" article the Draft button later quotes to customers.

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function promoteReviewAction(
  id: string,
  title: string,
  score: number | null,
  notes: string,
): Promise<ActionResult> {
  await requireStaff();
  if (!title.trim()) return { ok: false, error: "Give the new article a title." };
  const repo = await getRepo();
  await repo.promoteReview(id, title.trim(), score, notes.trim());
  revalidatePath("/admin/email/knowledge");
  return { ok: true };
}

export async function rejectReviewAction(
  id: string,
  score: number | null,
  notes: string,
): Promise<ActionResult> {
  await requireStaff();
  const repo = await getRepo();
  await repo.rejectReview(id, score, notes.trim());
  revalidatePath("/admin/email/knowledge");
  return { ok: true };
}

export async function addKbArticleAction(
  title: string,
  body: string,
  language: string,
): Promise<ActionResult> {
  await requireStaff();
  if (!title.trim() || !body.trim()) return { ok: false, error: "Title and answer are required." };
  const repo = await getRepo();
  await repo.addKbArticle(title.trim(), body.trim(), language === "th" ? "th" : "en");
  revalidatePath("/admin/email/knowledge");
  return { ok: true };
}

export async function updateKbArticleAction(
  id: string,
  title: string,
  body: string,
  isVerified: boolean,
): Promise<ActionResult> {
  await requireStaff();
  if (!title.trim() || !body.trim()) return { ok: false, error: "Title and answer are required." };
  const repo = await getRepo();
  await repo.updateKbArticle(id, { title: title.trim(), body: body.trim(), isVerified });
  revalidatePath("/admin/email/knowledge");
  return { ok: true };
}

export async function deleteKbArticleAction(id: string): Promise<ActionResult> {
  await requireStaff();
  const repo = await getRepo();
  await repo.deleteKbArticle(id);
  revalidatePath("/admin/email/knowledge");
  return { ok: true };
}
