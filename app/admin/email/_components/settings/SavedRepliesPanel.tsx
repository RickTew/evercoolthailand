"use client";

import { useState, useTransition } from "react";
import {
  addSavedReplyAction,
  deleteSavedReplyAction,
} from "@/app/admin/email/settings/actions";
import type { CannedResponse } from "@/app/admin/email/_lib/types";

// Saved replies (canned responses): the pre-written answers the composer's
// "Saved replies" menu offers. Built 14 Jul from the traffic scan: quotation
// acknowledgements, PO confirmations, supplier catalogue requests and service
// scheduling, in English and Thai. Everyone sees the library here; admin and
// manager curate it (the team's shared voice).
export function SavedRepliesPanel({
  replies,
  canManage,
}: {
  replies: CannedResponse[];
  canManage: boolean;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [language, setLanguage] = useState("en");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      setError(null);
      setNotice(null);
      const res = await addSavedReplyAction(title, body, language);
      if (!res.ok) {
        setError(res.error ?? "Could not save the reply.");
        return;
      }
      setTitle("");
      setBody("");
      setAdding(false);
      setNotice("Saved. It is now in every composer's Saved replies menu.");
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      setError(null);
      setNotice(null);
      const res = await deleteSavedReplyAction(id);
      if (!res.ok) setError(res.error ?? "Could not delete the reply.");
    });
  }

  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">Saved replies</h2>
      <p className="mt-0.5 text-xs text-muted">
        Pre-written answers for common emails. In any reply, press Saved replies to
        insert one, adjust the details, and send.
        คำตอบสำเร็จรูปสำหรับอีเมลที่พบบ่อย กดปุ่ม Saved replies ในช่องตอบกลับเพื่อนำมาใช้
        แก้รายละเอียด แล้วส่งได้เลย
      </p>

      <ul className="mt-3 divide-y divide-line">
        {replies.map((r) => (
          <li key={r.id} className="py-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setOpenId(openId === r.id ? null : r.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                title="Show the full text."
              >
                <span className="truncate text-xs font-semibold text-ink">{r.title}</span>
                <span className="shrink-0 rounded bg-canvas px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">
                  {r.language}
                </span>
              </button>
              {canManage && (
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  disabled={pending}
                  className="shrink-0 text-[11px] font-medium text-muted hover:text-red disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
            {openId === r.id && (
              <p className="mt-1.5 whitespace-pre-wrap rounded-md bg-canvas/60 px-2.5 py-2 text-xs text-ink">
                {r.body}
              </p>
            )}
          </li>
        ))}
        {replies.length === 0 && (
          <li className="py-2 text-xs text-muted">No saved replies yet.</li>
        )}
      </ul>

      {canManage &&
        (adding ? (
          <div className="mt-3 space-y-2 rounded-md border border-line bg-canvas/40 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (shown in the menu)"
                className="flex-1 rounded-md border border-line px-2 py-1.5 text-xs text-ink focus:border-teal focus:outline-none"
              />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md border border-line px-2 py-1.5 text-xs text-ink focus:border-teal focus:outline-none"
              >
                <option value="en">EN</option>
                <option value="th">TH</option>
              </select>
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="The message text. Use [brackets] for parts to fill in each time."
              className="w-full rounded-md border border-line px-2 py-1.5 text-xs text-ink focus:border-teal focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={add}
                disabled={pending}
                className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
              >
                {pending ? "Saving..." : "Save reply"}
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                disabled={pending}
                className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="mt-3 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-navy hover:bg-canvas"
          >
            Add a saved reply
          </button>
        ))}

      {notice && <p className="mt-2 text-[11px] font-medium text-green">{notice}</p>}
      {error && <p className="mt-2 text-[11px] font-medium text-red">{error}</p>}
    </section>
  );
}
