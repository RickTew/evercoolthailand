"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Folder } from "@/app/admin/email/_lib/types";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { createFolderAction, deleteFolderAction } from "@/app/admin/email/folders/actions";

// The signed-in user's custom inbox folders (#11), shown beside Inbox/Archived.
// Click a folder to filter to it; "+ Folder" creates one; the × deletes it
// (tickets stay, they just leave the folder).
export function FolderBar({ folders, current }: { folders: Folder[]; current: InboxParams }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  // Optimistic created/removed folders so a new shared folder shows instantly,
  // not only after the server prop catches up on the next navigation.
  const [created, setCreated] = useState<Folder[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  // Merge: server folders + locally-created, minus locally-deleted, deduped by id.
  const seen = new Set(folders.map((f) => f.id));
  const shown = [...folders, ...created.filter((c) => !seen.has(c.id))].filter(
    (f) => !removed.has(f.id),
  );

  function create() {
    if (name.trim() === "") return;
    startTransition(async () => {
      const res = await createFolderAction(name);
      if (res.ok) {
        if (res.id) setCreated((prev) => [...prev, { id: res.id!, name: name.trim() }]);
        setName("");
        setAdding(false);
        router.refresh();
      }
    });
  }

  function del(f: Folder) {
    if (!window.confirm(`Delete the shared folder "${f.name}"? It disappears for the whole team; the tickets stay, they just leave the folder.`)) return;
    setRemoved((prev) => new Set(prev).add(f.id)); // optimistic
    startTransition(async () => {
      await deleteFolderAction(f.id);
      // If we were viewing the deleted folder, drop back to the Inbox.
      if (current.folder === f.id) {
        router.push(buildInboxHref(current, { folder: null }));
      }
      router.refresh();
    });
  }

  return (
    // A fragment, so each folder chip and the "+ Folder" button are direct children
    // of the parent FolderStrip's flex-wrap row and wrap individually onto a new
    // line when the bar is full (rather than sitting in one sideways-scrolling lump).
    <>
      {shown.map((f) => {
            const active = current.folder === f.id;
            return (
          <span
            key={f.id}
            className={`group inline-flex shrink-0 items-center rounded-md ${pending ? "opacity-70" : ""} ${
              active ? "bg-purple text-white" : "text-muted hover:bg-canvas"
            }`}
          >
            <Link
              href={buildInboxHref(current, { folder: f.id })}
              prefetch={false}
              title={f.name}
              className="max-w-[12rem] truncate py-1 pl-2.5 text-xs font-medium"
            >
              {f.name}
            </Link>
            <button
              type="button"
              onClick={() => del(f)}
              title="Delete folder"
              aria-label={`Delete folder ${f.name}`}
              // The × is hover-revealed on a mouse, but always visible on a coarse
              // (touch) pointer where there is no hover, so it stays reachable.
              className={`px-1.5 text-xs leading-none ${
                active
                  ? "text-white/70 hover:text-white"
                  : "text-transparent group-hover:text-muted hover:!text-red pointer-coarse:text-muted"
              }`}
            >
              ×
            </button>
          </span>
            );
          })}

      {adding ? (
        <span className="inline-flex items-center gap-1">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") create();
              if (e.key === "Escape") setAdding(false);
            }}
            placeholder="Folder name"
            className="w-28 rounded-md border border-line px-2 py-1 text-xs outline-none focus:border-teal"
          />
          <button
            type="button"
            onClick={create}
            disabled={pending}
            className="rounded-md border border-teal px-2 py-1 text-[11px] font-semibold text-teal hover:bg-teal/5 disabled:opacity-50"
          >
            Add
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          title="Create a shared team folder"
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-teal hover:bg-teal/5"
        >
          + Folder
        </button>
      )}
    </>
  );
}
