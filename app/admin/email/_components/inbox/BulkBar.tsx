"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Folder, TeamMember } from "@/app/admin/email/_lib/types";
import { bulkReplyAction, bulkUpdateThreadsAction } from "@/app/admin/email/inbox/actions";
import { bulkAddToFolderAction } from "@/app/admin/email/folders/actions";

// Shared bulk-action bar for multi-selected tickets. Used by the Classic list
// and the Top dash strip. Assign-to is a full team picker (not just "me"),
// plus Move to folder, Mark Done, Archive, and Clear.
export function BulkBar({
  ids,
  team,
  meId,
  folders = [],
  onDone,
}: {
  ids: string[];
  team: TeamMember[];
  meId?: string | null;
  folders?: Folder[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // R5 "Reply to several": compose ONE message and broadcast it to every
  // selected ticket. Inline, so it sits next to the other bulk actions.
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyNote, setReplyNote] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function run(op: { status?: "closed"; assigneeId?: string | null; archived?: boolean }) {
    if (ids.length === 0) return;
    startTransition(async () => {
      await bulkUpdateThreadsAction(ids, op);
      onDone();
      router.refresh();
    });
  }

  function sendReplyToSeveral() {
    if (ids.length === 0 || replyText.trim() === "") return;
    setReplyNote(null);
    startTransition(async () => {
      const res = await bulkReplyAction(ids, replyText);
      if (!res.ok) {
        setReplyNote({ kind: "err", text: res.error ?? "Could not send the message." });
        return;
      }
      router.refresh();
      if (res.skipped > 0) {
        // Some recipients had opted out and were skipped (N6): keep the panel open
        // with a summary so the staffer sees who was not emailed.
        const parts: string[] = [];
        if (res.sent) parts.push(`Sent to ${res.sent}`);
        parts.push(`skipped ${res.skipped} unsubscribed`);
        setReplyText("");
        setReplyNote({ kind: "ok", text: `${parts.join(", ")}.` });
      } else {
        setReplyOpen(false);
        setReplyText("");
        onDone();
      }
    });
  }

  // Bulk-move (R2): drop all selected tickets into one shared folder.
  function moveToFolder(folderId: string) {
    if (ids.length === 0 || !folderId) return;
    startTransition(async () => {
      await bulkAddToFolderAction(ids, folderId);
      onDone();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2 text-xs">
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-semibold text-navy">{ids.length} selected</span>

      {/* Assign to anyone (or unassign), in one go. */}
      <label className="flex items-center gap-1 text-muted">
        Assign to
        <select
          defaultValue=""
          disabled={pending}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") return;
            run({ assigneeId: v === "__none" ? null : v });
            e.currentTarget.value = "";
          }}
          className="rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-ink disabled:opacity-50"
        >
          <option value="">Choose…</option>
          {meId && <option value={meId}>Me</option>}
          <option value="__none">Unassigned</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </label>

      {/* Bulk-move into a shared folder (R2), mirroring the assign-to pattern. */}
      {folders.length > 0 && (
        <label className="flex items-center gap-1 text-muted">
          Move to folder
          <select
            defaultValue=""
            disabled={pending}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") return;
              moveToFolder(v);
              e.currentTarget.value = "";
            }}
            className="rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-ink disabled:opacity-50"
          >
            <option value="">Choose…</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="button"
        onClick={() => {
          setReplyOpen((v) => !v);
          setReplyNote(null);
        }}
        disabled={pending}
        aria-expanded={replyOpen}
        title="Send one message to every selected ticket."
        className={`rounded-md border px-2 py-1 font-medium disabled:opacity-50 ${
          replyOpen ? "border-teal bg-teal/10 text-teal" : "border-line text-navy hover:bg-canvas"
        }`}
      >
        Reply to several
      </button>

      <button
        type="button"
        onClick={() => run({ status: "closed" })}
        disabled={pending}
        className="rounded-md border border-line px-2 py-1 font-medium text-navy hover:bg-canvas disabled:opacity-50"
      >
        Mark Done
      </button>
      <button
        type="button"
        onClick={() => run({ archived: true })}
        disabled={pending}
        className="rounded-md border border-line px-2 py-1 font-medium text-navy hover:bg-canvas disabled:opacity-50"
      >
        Archive
      </button>
      <button
        type="button"
        onClick={onDone}
        disabled={pending}
        className="ml-auto text-muted hover:text-ink"
      >
        Clear
      </button>
    </div>

    {replyOpen && (
      <div className="rounded-lg border border-teal/40 bg-teal/5 p-2.5">
        <p className="mb-1.5 text-[11px] font-medium text-teal">
          One message to all {ids.length} selected ticket{ids.length === 1 ? "" : "s"}
        </p>
        <textarea
          value={replyText}
          onChange={(e) => {
            setReplyText(e.target.value);
            setReplyNote(null);
          }}
          rows={4}
          autoFocus
          placeholder="Write the message everyone receives..."
          className="block w-full resize-y rounded-md border border-line p-2.5 text-sm text-ink outline-none focus:border-teal"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={sendReplyToSeveral}
            disabled={pending || replyText.trim() === ""}
            className="rounded-md bg-green px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Sending..." : `Send to ${ids.length}`}
          </button>
          <button
            type="button"
            onClick={() => {
              setReplyOpen(false);
              setReplyText("");
              setReplyNote(null);
            }}
            disabled={pending}
            className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas disabled:opacity-50"
          >
            Cancel
          </button>
          {replyNote && (
            <span className={`text-xs ${replyNote.kind === "err" ? "text-red" : "text-green"}`}>
              {replyNote.text}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[10px] text-muted">
          Each ticket gets its own sent reply and moves to pending. A human wrote
          and approved this message.
        </p>
      </div>
    )}
    </div>
  );
}
