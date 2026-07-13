"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markSpamAction, notSpamAction } from "@/app/admin/email/inbox/actions";
import type { SpamStatus } from "@/app/admin/email/_lib/types";

// The warning band across the top of a flagged conversation: says WHY the mail
// was flagged (the reasons captured at arrival) and carries the triage actions.
// "Not spam" moves it back to the inbox (and unblocks the sender); "Block
// sender" confirms the flag and blocks the address so the next mail from them
// lands in Spam automatically.
export function SpamBanner({
  threadId,
  spamStatus,
  senderEmail,
  reasons,
}: {
  threadId: string;
  spamStatus: SpamStatus;
  senderEmail: string;
  reasons: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  if (!spamStatus) return null;

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "Something went wrong.");
      else router.refresh();
    });

  return (
    <div className="shrink-0 border-b border-red/30 bg-red/5 px-5 py-2.5 text-xs text-ink">
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden>⚠️</span>
        <span className="font-semibold text-red">
          {spamStatus === "confirmed"
            ? "Marked as spam."
            : "This looks like spam or a fake email."}
        </span>
        <span className="text-muted">
          Do not click its links, open attachments, or reply.
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => notSpamAction(threadId))}
            className="rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-ink hover:bg-canvas disabled:opacity-50"
          >
            Not spam
          </button>
          {spamStatus !== "confirmed" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => markSpamAction(threadId, true))}
              className="rounded-md bg-red px-2 py-1 text-xs font-semibold text-white hover:bg-red/90 disabled:opacity-50"
              title={`Confirm as spam and block ${senderEmail}`}
            >
              Block sender
            </button>
          )}
        </span>
      </div>
      {reasons.length > 0 && (
        <ul className="mt-1.5 list-disc space-y-0.5 pl-6 text-[11px] text-muted">
          {reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-[11px] font-medium text-red">{error}</p>}
    </div>
  );
}
