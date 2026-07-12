"use client";

import { useState } from "react";
import type { ThreadNote } from "@/app/admin/email/_lib/types";
import { LocalTime } from "@/app/admin/email/_components/inbox/LocalTime";
import { addThreadNoteAction, updateThreadNoteAction, deleteThreadNoteAction } from "@/app/admin/email/inbox/actions";

// Internal, team-only notes on a ticket. Never sent to the customer; a place to
// leave context for whoever picks the ticket up next. Supports add, edit, delete.
//
// The note list is kept in LOCAL state and updated optimistically: each action
// persists in the background but the UI updates immediately. This deliberately
// avoids `router.refresh()` here, which re-renders the whole (heavy, dynamic)
// inbox route and would otherwise leave the buttons stuck disabled while it
// settles. The server actions still revalidate the route for the next load.
export function ThreadNotes({ threadId, notes }: { threadId: string; notes: ThreadNote[] }) {
  const [items, setItems] = useState<ThreadNote[]>(notes);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Resync when the user opens a different thread (notes belong to a thread).
  // Done during render on the thread switch (the React derived-state pattern),
  // deliberately NOT keyed on `notes`, so the optimistic local list survives
  // unrelated refreshes of the same thread.
  const [prevThreadId, setPrevThreadId] = useState(threadId);
  if (prevThreadId !== threadId) {
    setPrevThreadId(threadId);
    setItems(notes);
    setEditingId(null);
  }

  function add() {
    const body = text.trim();
    if (body === "") return;
    setText("");
    void addThreadNoteAction(threadId, body).then((created) => {
      if (created) setItems((prev) => [created, ...prev]);
    });
  }

  function startEdit(n: ThreadNote) {
    setEditingId(n.id);
    setEditText(n.body);
  }

  function saveEdit(id: string) {
    const body = editText.trim();
    if (body === "") return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, body } : n)));
    setEditingId(null);
    void updateThreadNoteAction(id, body);
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    if (editingId === id) setEditingId(null);
    void deleteThreadNoteAction(id);
  }

  return (
    <div>
      <ul className="space-y-1.5">
        {items.map((n) => (
          <li key={n.id} className="rounded-md bg-orange/5 px-2.5 py-1.5">
            {editingId === n.id ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                  className="resize-none rounded-md border border-line px-2 py-1.5 text-xs text-ink outline-none focus:border-orange"
                />
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={() => saveEdit(n.id)}
                    disabled={editText.trim() === ""}
                    className="rounded-md border border-orange px-2 py-0.5 font-semibold text-orange hover:bg-orange/5 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-xs text-ink">{n.body}</p>
                <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted">
                  <span>{n.authorName} &middot; <LocalTime iso={n.createdAt} /></span>
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(n)}
                      className="hover:text-navy"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      className="hover:text-red"
                    >
                      Delete
                    </button>
                  </span>
                </div>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="text-xs text-muted">No internal notes yet.</li>}
      </ul>

      <div className="mt-2 flex items-start gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Add a team-only note (not sent to the customer)..."
          className="flex-1 resize-none rounded-md border border-line px-2 py-1.5 text-xs text-ink outline-none focus:border-orange"
        />
        <button
          type="button"
          onClick={add}
          disabled={text.trim() === ""}
          className="shrink-0 rounded-md border border-orange px-2.5 py-1.5 text-[11px] font-semibold text-orange hover:bg-orange/5 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  );
}
