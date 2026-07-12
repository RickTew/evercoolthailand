"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  listCannedResponsesAction,
  addCannedResponseAction,
  saveDraftAction,
  sendReplyAction,
  createAttachmentUploadAction,
} from "@/app/admin/email/inbox/actions";
import { createClient } from "@/lib/supabase/client";
import { formatBytes } from "@/app/admin/email/_lib/ui";
import type { CannedResponse, PendingAttachment } from "@/app/admin/email/_lib/types";

export function Composer({
  threadId,
  initialDraft,
  customerLocale,
  customerUnsubscribed,
  signature = "",
  replyAllRecipients = [],
}: {
  threadId: string;
  initialDraft: string;
  customerLocale?: string;
  customerUnsubscribed?: boolean;
  // The signed-in staff member's personal signature (Raphael's request). When the
  // reply box opens empty, it is prefilled at the bottom so the reply carries the
  // sender's own sign-off; staff can edit or delete it before sending.
  signature?: string;
  // Everyone else on the customer's mail (the To/Cc people, minus our own inboxes
  // and the contact). When non-empty the composer offers "reply to all", which
  // Cc's them on the outgoing reply. Empty => the toggle is hidden.
  replyAllRecipients?: string[];
}) {
  // Prefill the empty box with the signature (two lines below the cursor), unless
  // there is already a saved draft to restore.
  const [text, setText] = useState(
    initialDraft || (signature ? `\n\n${signature}` : ""),
  );
  // The signature prefill makes text.trim() non-empty from the start, so a
  // stray click could send an email containing ONLY the sign-off. "Has the
  // agent actually written something" = more than the bare signature.
  const signatureOnly = text.trim() === (signature ?? "").trim();
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  // When on, the outgoing email quotes the whole conversation under the reply, so
  // the customer has the full context in their own inbox (Raphael's ask).
  const [includeHistory, setIncludeHistory] = useState(false);
  // When on, the reply is also Cc'd to everyone else on the customer's mail
  // (replyAllRecipients). Off by default so a reply never reaches extra people
  // unless the agent deliberately picks "reply to all".
  const [replyAll, setReplyAll] = useState(false);
  const hasOthers = replyAllRecipients.length > 0;
  const [dragOver, setDragOver] = useState(false);
  const [supabase] = useState(() => createClient());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | "send" | "save" | "upload">(null);
  // Saved replies (canned responses).
  const [canned, setCanned] = useState<CannedResponse[] | null>(null);
  const [showCanned, setShowCanned] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const router = useRouter();

  // Auto-grow the reply box with its content (up to a cap, then it scrolls
  // internally), instead of a manual resize handle that fought the split-view
  // layout and felt janky. Runs whenever the text changes, including when a
  // canned reply is inserted.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [text]);

  const MAX_FILE_BYTES = 10 * 1024 * 1024; // keep in sync with the server action

  // Uploads each file straight to storage via a one-time signed URL (the bytes
  // never go through a Server Action, so big photos/PDFs no longer crash). Shared
  // by the Attach button and drag-and-drop.
  function uploadFiles(list: File[]) {
    if (list.length === 0) return;
    setBusy("upload");
    setBanner(null);
    startTransition(async () => {
      const added: PendingAttachment[] = [];
      for (const file of list) {
        if (file.size === 0) {
          setBanner({ kind: "err", text: `${file.name} is empty.` });
          continue;
        }
        if (file.size > MAX_FILE_BYTES) {
          setBanner({ kind: "err", text: `${file.name} is too large (max 10 MB).` });
          continue;
        }
        const start = await createAttachmentUploadAction(threadId, file.name, file.size);
        if (!start.ok) {
          setBanner({ kind: "err", text: start.error ?? `Could not attach ${file.name}.` });
          continue;
        }
        const { error } = await supabase.storage
          .from(start.bucket)
          .uploadToSignedUrl(start.path, start.token, file, {
            contentType: file.type || undefined,
          });
        if (error) {
          setBanner({ kind: "err", text: `Could not attach ${file.name}.` });
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
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    uploadFiles(Array.from(files));
  }

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

  function toggleCannedPicker() {
    setShowCanned((v) => !v);
    if (canned === null) {
      startTransition(async () => {
        const list = await listCannedResponsesAction();
        setCanned(list);
      });
    }
  }

  function insertCanned(c: CannedResponse) {
    setText((prev) => (prev.trim() === "" ? c.body : `${prev.trim()}\n\n${c.body}`));
    setShowCanned(false);
    setBanner({ kind: "ok", text: `Inserted "${c.title}".` });
  }

  // Append the staff member's personal signature (if it is not already there).
  function insertSignature() {
    if (!signature) return;
    setText((prev) => {
      if (prev.includes(signature)) return prev;
      return prev.trim() === "" ? `\n\n${signature}` : `${prev.replace(/\s+$/, "")}\n\n${signature}`;
    });
  }

  function saveAsCanned() {
    if (text.trim() === "") return;
    const title = window.prompt("Save this reply as a template. Short title:");
    if (!title || !title.trim()) return;
    startTransition(async () => {
      const res = await addCannedResponseAction(title.trim(), text);
      if (res?.ok) {
        setCanned(null); // refetch next open
        setBanner({ kind: "ok", text: `Saved template "${title.trim()}".` });
      } else {
        setBanner({ kind: "err", text: "Could not save the template." });
      }
    });
  }

  function save() {
    setBusy("save");
    startTransition(async () => {
      await saveDraftAction(threadId, text);
      router.refresh();
      setBusy(null);
      setBanner({ kind: "ok", text: "Reply saved." });
    });
  }

  function send() {
    setBusy("send");
    setBanner(null);
    startTransition(async () => {
      const res = await sendReplyAction(threadId, text, attachments, includeHistory, replyAll && hasOthers);
      setBusy(null);
      if (!res.ok) {
        setBanner({ kind: "err", text: res.error ?? "Send failed." });
        return;
      }
      setText("");
      setAttachments([]);
      router.refresh();
      setBanner({
        kind: "ok",
        text: res.via === "resend" ? "Reply sent." : "Reply recorded (test mode, no email sent).",
      });
    });
  }

  return (
    <div
      className="relative shrink-0 border-t border-line bg-white px-5 py-3"
      onDragOver={onDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-teal bg-teal/5">
          <span className="text-sm font-semibold text-teal">Drop files to attach</span>
        </div>
      )}
      {customerUnsubscribed && (
        <div className="mb-2 rounded-lg border border-orange/40 bg-orange/5 px-3 py-2 text-[11px] text-ink">
          <span className="font-semibold text-orange">Unsubscribed contact. </span>
          Replying to this support request is fine (it is transactional), but do not send
          them marketing or newsletters.
        </div>
      )}
      <textarea
        id="composer-textarea"
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setBanner(null);
        }}
        rows={6}
        placeholder="Write your reply..."
        // Auto-sized (see effect above): no manual resize handle, capped height
        // with internal scroll so it never breaks the split-view layout.
        className="block max-h-80 w-full resize-none overflow-y-auto rounded-lg border border-line p-3 text-sm text-ink outline-none focus:border-teal"
      />

      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {attachments.map((a) => (
            <span
              key={a.path}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2 py-1 text-[11px] text-ink"
            >
              <span aria-hidden>📎</span>
              <span className="max-w-[14rem] truncate font-medium">{a.fileName}</span>
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

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
            title="Attach a file or image."
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas disabled:opacity-50"
          >
            {busy === "upload" ? "Attaching..." : "Attach"}
          </button>
          <Popover
            open={showCanned}
            onClose={() => setShowCanned(false)}
            width={320}
            trigger={
              <button
                type="button"
                onClick={toggleCannedPicker}
                disabled={pending}
                title="Insert a saved reply: a pre-written answer you reuse for common questions."
                className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas disabled:opacity-50"
              >
                Saved
              </button>
            }
          >
            {canned === null ? (
              <p className="px-2 py-1.5 text-[11px] text-muted">Loading...</p>
            ) : canned.length === 0 ? (
              <p className="px-2 py-1.5 text-[11px] text-muted">No saved replies yet.</p>
            ) : (
              canned.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => insertCanned(c)}
                  className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-canvas"
                  title={c.body}
                >
                  <span className="block truncate text-[11px] font-semibold text-ink">{c.title}</span>
                  <span className="block truncate text-[10px] text-muted">{c.body}</span>
                </button>
              ))
            )}
            <button
              type="button"
              onClick={saveAsCanned}
              disabled={text.trim() === ""}
              className="mt-1 block w-full rounded-md border-t border-line px-2 pt-1.5 text-left text-[11px] font-medium text-teal hover:bg-teal/5 disabled:opacity-40"
            >
              + Save current reply as a template
            </button>
          </Popover>
          {signature && (
            <button
              type="button"
              onClick={insertSignature}
              disabled={pending}
              title="Add your personal signature to the bottom of the reply."
              className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas disabled:opacity-50"
            >
              Sign
            </button>
          )}
          <button
            type="button"
            onClick={send}
            disabled={pending || ((text.trim() === "" || signatureOnly) && attachments.length === 0)}
            className="rounded-md bg-green px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy === "send" ? "Sending..." : "Send"}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label
            className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted hover:text-ink"
            title="Quote the whole conversation under your reply in the email the customer receives, so they have the full history in their inbox."
          >
            <input
              type="checkbox"
              checked={includeHistory}
              onChange={(e) => setIncludeHistory(e.target.checked)}
              className="h-3.5 w-3.5 accent-teal"
            />
            Include previous messages
          </label>
          {hasOthers && (
            <label
              className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-muted hover:text-ink"
              title={`Also Cc everyone else who was on this mail: ${replyAllRecipients.join(", ")}`}
            >
              <input
                type="checkbox"
                checked={replyAll}
                onChange={(e) => setReplyAll(e.target.checked)}
                className="h-3.5 w-3.5 accent-teal"
              />
              Reply to all
              <span className="text-muted/70">
                (Cc {replyAllRecipients.length === 1 ? replyAllRecipients[0] : `${replyAllRecipients.length} others`})
              </span>
            </label>
          )}
          <button
            type="button"
            onClick={save}
            disabled={pending || text.trim() === ""}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas disabled:opacity-50"
          >
            {busy === "save" ? "Saving..." : "Save draft"}
          </button>
        </div>
      </div>
      {/* Status banner on its own full-width row so a long message can never
          separate "Save draft" from its group or push the primary action onto a
          second line in a narrow pane (#9). */}
      {banner && (
        <p
          className={`mt-2 truncate text-xs ${banner.kind === "ok" ? "text-green" : "text-red"}`}
          title={banner.text}
        >
          {banner.text}
        </p>
      )}
    </div>
  );
}

// A picker popover that renders in a portal anchored to its trigger button, so it
// is never clipped by a short or overflow-hidden composer pane (the Board/Grid
// drawer once it scrolls). It measures the available space and flips above or
// below the trigger to fit, and closes on Escape or an outside click.
function Popover({
  open,
  onClose,
  width,
  trigger,
  children,
}: {
  open: boolean;
  onClose: () => void;
  width: number;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  // Drop the stale position the moment the popover closes, during render on the
  // open flip (the React derived-state pattern) rather than in the effect below.
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (!open) setPos(null);
  }

  // Position against the trigger and flip direction based on free space. Runs
  // before paint and again on scroll/resize so the panel tracks its button.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const margin = 8;
      const spaceAbove = r.top - margin;
      const spaceBelow = window.innerHeight - r.bottom - margin;
      const flipUp = spaceAbove >= spaceBelow;
      const maxHeight = Math.max(120, Math.min(320, flipUp ? spaceAbove : spaceBelow));
      const left = Math.max(margin, Math.min(r.left, window.innerWidth - width - margin));
      setPos(
        flipUp
          ? { left, bottom: window.innerHeight - r.top + 4, maxHeight }
          : { left, top: r.bottom + 4, maxHeight },
      );
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, width]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div ref={anchorRef} className="relative">
      {trigger}
      {open &&
        pos !== null &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              bottom: pos.bottom,
              width,
              maxHeight: pos.maxHeight,
            }}
            className="z-50 overflow-y-auto rounded-lg border border-line bg-white p-1.5 shadow-lg"
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}
