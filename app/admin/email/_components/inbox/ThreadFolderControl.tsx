"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Folder } from "@/app/admin/email/_lib/types";
import {
  listThreadFoldersAction,
  addToFolderAction,
  removeFromFolderAction,
  createFolderAction,
} from "@/app/admin/email/folders/actions";

// Per-ticket "Add to folder" control (#11). Lazy-loads the user's folders + this
// ticket's membership on open, so ThreadView needs no extra props. You can also
// create a new folder inline and the ticket is added to it.
export function ThreadFolderControl({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[] | null>(null);
  const [inIds, setInIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();

  async function load() {
    const res = await listThreadFoldersAction(threadId);
    setFolders(res.folders);
    setInIds(new Set(res.inIds));
  }

  function openMenu() {
    setOpen((o) => !o);
    if (folders === null) startTransition(load);
  }

  function toggle(f: Folder) {
    const isIn = inIds.has(f.id);
    setInIds((prev) => {
      const next = new Set(prev);
      if (isIn) next.delete(f.id);
      else next.add(f.id);
      return next;
    });
    startTransition(async () => {
      if (isIn) await removeFromFolderAction(threadId, f.id);
      else await addToFolderAction(threadId, f.id);
      router.refresh();
    });
  }

  function createAndAdd() {
    if (newName.trim() === "") return;
    startTransition(async () => {
      const res = await createFolderAction(newName);
      if (res.ok) {
        setNewName("");
        await load(); // refresh the list; the new folder appears
      }
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={openMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Add this ticket to one of your folders"
        className="rounded-md border border-line px-2 py-1 text-xs font-medium text-navy hover:bg-canvas"
      >
        Folders
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-56 rounded-lg border border-line bg-white p-1.5 text-xs shadow-lg"
          >
            {folders === null ? (
              <p className="px-2 py-1.5 text-muted">Loading…</p>
            ) : folders.length === 0 ? (
              <p className="px-2 py-1.5 text-muted">No folders yet. Create one below.</p>
            ) : (
              folders.map((f) => (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-canvas"
                >
                  <input
                    type="checkbox"
                    checked={inIds.has(f.id)}
                    onChange={() => toggle(f)}
                    className="h-3.5 w-3.5 accent-teal"
                  />
                  <span className="truncate text-ink">{f.name}</span>
                </label>
              ))
            )}
            <div className="mt-1 flex items-center gap-1 border-t border-line pt-1.5">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createAndAdd();
                }}
                placeholder="New folder…"
                className="min-w-0 flex-1 rounded-md border border-line px-2 py-1 outline-none focus:border-teal"
              />
              <button
                type="button"
                onClick={createAndAdd}
                disabled={pending || newName.trim() === ""}
                className="rounded-md border border-teal px-2 py-1 font-semibold text-teal hover:bg-teal/5 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
