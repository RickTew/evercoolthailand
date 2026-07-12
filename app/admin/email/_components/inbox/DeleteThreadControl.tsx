"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { trashThreadAction } from "@/app/admin/email/inbox/actions";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";

// "Delete" moves a conversation to Trash (a soft, reversible delete). It can be
// restored from the Trash folder until the purge cron empties it; the retention
// window is ADMIN-SET (Settings, default 2 days), so the copy here must never
// promise a number: the old "30 days" tooltip invited real data loss. Because
// it is reversible, this is a single click (no scary confirm); Archive sits next
// to it for the lighter "just hide it" case.
export function DeleteThreadControl({ threadId }: { threadId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function doTrash() {
    const current = Object.fromEntries(
      new URLSearchParams(window.location.search).entries(),
    ) as InboxParams;
    startTransition(async () => {
      await trashThreadAction(threadId);
      router.push(buildInboxHref(current, { thread: null }));
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={doTrash}
      disabled={pending}
      title="Move this conversation to Trash. You can restore it from the Trash folder until Trash is emptied (see Settings for the retention window)."
      className="rounded-md border border-line px-2 py-1 text-xs font-medium text-red hover:bg-red/5 disabled:opacity-50"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
