// Blob storage for message attachments. Files live in the private
// "support-attachments" bucket on the Evercool Supabase project, all I/O via
// the service-role client (which bypasses RLS). Server-only.
//
// The bucket is PRIVATE, so display always goes through a short-lived signed
// URL. Customer files are personal data.

import { createAdminClient } from "@/lib/supabase/server";

export const BUCKET = "support-attachments";
const SIGNED_URL_TTL_SECONDS = 3600; // 1 hour

export interface StoredFile {
  path: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

function safeExt(fileName: string): string {
  const ext = fileName.includes(".") ? fileName.split(".").pop() : "";
  return (ext ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8) || "bin";
}

// A one-time signed URL the BROWSER uploads to directly, so the file bytes never
// pass through a Server Action. This is the fix for large attachments: a Server
// Action body is capped (Next 1MB default, and Vercel's serverless body limit is
// ~4.5MB), so a normal phone photo failed the upload and crashed the page. The
// signed URL targets Supabase Storage directly, bypassing both limits.
export async function createUploadUrl(
  prefix: string,
  fileName: string,
): Promise<{ path: string; token: string }> {
  const path = `${prefix}/${crypto.randomUUID()}.${safeExt(fileName)}`;
  const sb = createAdminClient();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`Could not start upload: ${error?.message ?? "unknown"}`);
  return { path, token: data.token };
}

// Stores a file under <prefix>/<uuid>.<ext> and returns its storage reference.
export async function putAttachment(
  prefix: string,
  fileName: string,
  mimeType: string,
  bytes: Buffer,
): Promise<StoredFile> {
  const path = `${prefix}/${crypto.randomUUID()}.${safeExt(fileName)}`;
  const sb = createAdminClient();
  const { error } = await sb.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: mimeType, upsert: false });
  if (error) throw new Error(`Attachment upload failed: ${error.message}`);
  return { path, fileName, mimeType, sizeBytes: bytes.length };
}

// A short-lived URL the browser can use to view/download the file. Empty string
// if it cannot be resolved (the chip then renders without a working link).
export async function signedUrl(path: string): Promise<string> {
  const sb = createAdminClient();
  const { data, error } = await sb.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data) return "";
  return data.signedUrl;
}

// Raw bytes, used server-side to attach the file to an outgoing Resend email.
export async function readBytes(
  path: string,
): Promise<{ bytes: Buffer; mimeType: string; fileName: string } | null> {
  const sb = createAdminClient();
  const { data, error } = await sb.storage.from(BUCKET).download(path);
  if (error || !data) return null;
  const buf = Buffer.from(await data.arrayBuffer());
  return {
    bytes: buf,
    mimeType: data.type || "application/octet-stream",
    fileName: path.split("/").pop() ?? "file",
  };
}
