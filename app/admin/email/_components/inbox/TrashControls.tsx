"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { restoreThreadAction, deleteThreadAction } from "@/app/admin/email/inbox/actions";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";

// Controls shown on a conversation that is in Trash: Restore it to the inbox, or
// Delete it for good (permanent, behind a two-click confirm since there is no undo).
export function TrashControls({ threadId }: { threadId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function currentParams(): InboxParams {
    return Object.fromEntries(
      new URLSearchParams(window.location.search).entries(),
    ) as InboxParams;
  }

  function restore() {
    const current = currentParams();
    startTransition(async () => {
      await restoreThreadAction(threadId);
      router.push(buildInboxHref(current, { thread: null }));
      router.refresh();
    });
  }

  function deleteForGood() {
    const current = currentParams();
    startTransition(async () => {
      await deleteThreadAction(threadId);
      router.push(buildInboxHref(current, { thread: null }));
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={restore}
        disabled={pending}
        title="Restore this conversation to the inbox."
        className="rounded-md bg-teal px-2 py-1 text-xs font-semibold text-white hover:bg-teal/90 disabled:opacity-50"
      >
        {pending ? "..." : "Restore"}
      </button>
      {confirming ? (
        <>
          <button
            type="button"
            onClick={deleteForGood}
            disabled={pending}
            className="rounded-md bg-red px-2 py-1 text-xs font-semibold text-white hover:bg-red/90 disabled:opacity-50"
          >
            {pending ? "Deleting..." : "Delete for good"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={pending}
            className="rounded-md border border-line px-2 py-1 text-xs font-medium text-muted hover:bg-canvas disabled:opacity-50"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          title="Permanently delete this conversation. This cannot be undone."
          className="rounded-md border border-line px-2 py-1 text-xs font-medium text-red hover:bg-red/5"
        >
          Delete for good
        </button>
      )}
    </span>
  );
}
