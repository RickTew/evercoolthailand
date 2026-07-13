"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setTrashRetentionAction, emptyTrashNowAction } from "@/app/admin/email/settings/actions";

// Trash policy (admin only, ported from newnei Care Settings): how long
// trashed conversations are kept before the daily purge, plus "Empty now".
export function TrashPanel({
  retentionDays,
  trashCount,
}: {
  retentionDays: number;
  trashCount: number;
}) {
  const [days, setDays] = useState(retentionDays);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <section className="rounded-lg border border-line bg-white p-4">
      <h2 className="text-sm font-semibold text-ink">Trash</h2>
      <p className="mt-0.5 text-xs text-muted">
        Deleted conversations stay restorable in Trash until the daily purge removes them.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="text-xs font-semibold text-ink">Keep for</label>
        <input
          type="number"
          min={1}
          max={365}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="w-20 rounded-md border border-line px-2 py-1.5 text-sm text-ink focus:border-teal focus:outline-none"
        />
        <span className="text-xs text-muted">days</span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setNotice(null);
              const res = await setTrashRetentionAction(days);
              setNotice(res.ok ? "Retention saved." : res.error ?? "Could not save.");
            })
          }
          className="rounded-md bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
        >
          Save
        </button>
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <button
          type="button"
          disabled={pending || trashCount === 0}
          onClick={() => {
            if (!window.confirm(`Permanently delete all ${trashCount} conversations in Trash? This cannot be undone.`)) return;
            startTransition(async () => {
              setNotice(null);
              const res = await emptyTrashNowAction();
              setNotice(res.ok ? `Emptied: ${res.removed ?? 0} conversations permanently deleted.` : res.error ?? "Could not empty.");
              router.refresh();
            });
          }}
          className="rounded-md border border-red/40 px-3 py-1.5 text-xs font-semibold text-red hover:bg-red/5 disabled:opacity-50"
        >
          Empty trash now ({trashCount})
        </button>
      </div>

      {notice && <p className="mt-2 text-[11px] font-medium text-green">{notice}</p>}
    </section>
  );
}
