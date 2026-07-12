"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  composeNewMailAction,
  createAttachmentUploadAction,
} from "@/app/admin/email/inbox/actions";
import { buildInboxHref } from "@/app/admin/email/_lib/inbox-url";
import { createClient } from "@/lib/supabase/client";
import { formatBytes } from "@/app/admin/email/_lib/ui";
import type { PendingAttachment } from "@/app/admin/email/_lib/types";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // keep in sync with the server action

// R4 "New Mail": start an outbound conversation from scratch. A button in the
// inbox header opens this modal (To / Name / Subject / Message + attachments);
// sending opens a new email thread, delivers the first message, and jumps to the
// conversation.
export function NewMailButton({ signature = "" }: { signature?: string }) {
  // The composer opens with the staff member's personal signature already at the
  // bottom of the message (Raphael's request), editable before sending.
  const sigBody = signature ? `\n\n${signature}` : "";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(sigBody);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [supabase] = useState(() => createClient());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function reset() {
    setEmail("");
    setCc("");
    setBcc("");
    setShowCc(false);
    setName("");
    setSubject("");
    setBody(sigBody);
    setAttachments([]);
    setError(null);
  }

  // Uploads each file straight to storage via a one-time signed URL (the bytes
  // never travel through a Server Action, so big photos/PDFs do not blow the body
  // limit). Same path the thread Composer uses; here there is no thread yet, so the
  // files go under a "compose" prefix and are linked to the new thread on send.
  function uploadFiles(list: File[]) {
    if (list.length === 0) return;
    setUploading(true);
    setError(null);
    startTransition(async () => {
      const added: PendingAttachment[] = [];
      for (const file of list) {
        if (file.size === 0) {
          setError(`${file.name} is empty.`);
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          setError(`${file.name} is too large (max 10 MB).`);
          continue;
        }
        const start = await createAttachmentUploadAction("compose", file.name, file.size);
        if (!start.ok) {
          setError(start.error ?? `Could not attach ${file.name}.`);
          continue;
        }
        const { error: upErr } = await supabase.storage
          .from(start.bucket)
          .uploadToSignedUrl(start.path, start.token, file, {
            contentType: file.type || undefined,
          });
        if (upErr) {
          setError(`Could not attach ${file.name}.`);
          continue;
        }
        added.push({
          path: start.path,
          fileName: file.name || "file",
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        });
      }
      if (added.length) setAttachments((prev) => [...prev, ...added]);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    uploadFiles(Array.from(files));
  }

  // Drag-and-drop, same as the reply Composer: drop an image or file anywhere on
  // the Compose card to attach it.
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  }

  function onDragOver(e: React.DragEvent) {
    if (!Array.from(e.dataTransfer.types).includes("Files")) return;
    e.preventDefault();
    setDragOver(true);
  }

  function removeAttachment(path: string) {
    setAttachments((prev) => prev.filter((a) => a.path !== path));
  }

  function close() {
    if (pending) return;
    setOpen(false);
    reset();
  }

  function send() {
    setError(null);
    startTransition(async () => {
      const res = await composeNewMailAction({ name, email, cc, bcc, subject, body, attachments });
      if (!res.ok) {
        setError(res.error ?? "Could not send the message.");
        return;
      }
      setOpen(false);
      reset();
      if (res.threadId) {
        router.push(buildInboxHref({}, { thread: res.threadId }));
      }
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Start a new outbound conversation from scratch."
        className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90"
      >
        Compose
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 pt-[10vh]"
          onMouseDown={close}
        >
          <div
            className="relative w-full max-w-lg rounded-xl border border-line bg-white p-5 shadow-xl"
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onDragOver={onDragOver}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {dragOver && (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-xl border-2 border-dashed border-teal bg-teal/5">
                <span className="text-sm font-semibold text-teal">Drop files to attach</span>
              </div>
            )}
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-navy">Compose</h2>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="leading-none text-muted hover:text-ink disabled:opacity-50"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted">
                    <label htmlFor="compose-to">To (one or several)</label>
                    {!showCc && (
                      <button
                        type="button"
                        onClick={() => setShowCc(true)}
                        className="text-[11px] font-semibold text-teal hover:underline"
                      >
                        Cc/Bcc
                      </button>
                    )}
                  </div>
                  <input
                    id="compose-to"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="person@example.com, another@example.com"
                    autoFocus
                    className="mt-1 block w-full rounded-md border border-line px-2.5 py-1.5 text-sm text-ink outline-none focus:border-teal"
                  />
                </div>
                <label className="flex-1 text-[11px] font-medium text-muted">
                  Name (optional)
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Their name"
                    className="mt-1 block w-full rounded-md border border-line px-2.5 py-1.5 text-sm text-ink outline-none focus:border-teal"
                  />
                </label>
              </div>
              {showCc && (
                <div className="flex gap-2.5">
                  <label className="flex-1 text-[11px] font-medium text-muted">
                    Cc
                    <input
                      type="text"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com, another@example.com"
                      className="mt-1 block w-full rounded-md border border-line px-2.5 py-1.5 text-sm text-ink outline-none focus:border-teal"
                    />
                  </label>
                  <label className="flex-1 text-[11px] font-medium text-muted">
                    Bcc
                    <input
                      type="text"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="bcc@example.com"
                      className="mt-1 block w-full rounded-md border border-line px-2.5 py-1.5 text-sm text-ink outline-none focus:border-teal"
                    />
                  </label>
                </div>
              )}
              <label className="block text-[11px] font-medium text-muted">
                Subject
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What is this about?"
                  className="mt-1 block w-full rounded-md border border-line px-2.5 py-1.5 text-sm text-ink outline-none focus:border-teal"
                />
              </label>
              <label className="block text-[11px] font-medium text-muted">
                Message
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={7}
                  placeholder="Write your message..."
                  className="mt-1 block w-full resize-y rounded-md border border-line p-2.5 text-sm text-ink outline-none focus:border-teal"
                />
              </label>

              {/* Attachments: same direct-to-storage upload the reply Composer
                  uses, so photos/PDFs attach without blowing the Server Action
                  body limit. */}
              <div>
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {attachments.map((a) => (
                      <span
                        key={a.path}
                        className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-1 text-[11px] text-ink"
                      >
                        <span aria-hidden>📎</span>
                        <span className="max-w-[12rem] truncate font-medium">{a.fileName}</span>
                        {a.sizeBytes > 0 && <span className="text-muted">{formatBytes(a.sizeBytes)}</span>}
                        <button
                          type="button"
                          onClick={() => removeAttachment(a.path)}
                          disabled={pending}
                          className="ml-0.5 leading-none text-muted hover:text-red"
                          aria-label={`Remove ${a.fileName}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={onPickFiles}
                  className="hidden"
                />
                <div ref={addRef} className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={pending}
                    title="Attach a file or image."
                    className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas disabled:opacity-50"
                  >
                    {uploading ? "Attaching..." : "Attach"}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="mt-2 text-xs text-red">{error}</p>}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={send}
                disabled={pending}
                className="rounded-md bg-green px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {pending ? "Sending..." : "Send"}
              </button>
            </div>
            <p className="mt-2 text-[10px] text-muted">
              Opens a new conversation and emails the recipient. Their replies thread
              back into this inbox.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
