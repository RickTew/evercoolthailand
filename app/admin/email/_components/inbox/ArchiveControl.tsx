"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setArchivedAction } from "@/app/admin/email/inbox/actions";

// Archive / unarchive a conversation. Archive hides it from the active Inbox (for
// spam or non-support items); Done conversations self-archive after a while, so
// this is mostly for things that were never a real support request.
export function ArchiveControl({
  threadId,
  archived,
}: {
  threadId: string;
  archived: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setArchivedAction(threadId, !archived);
          router.refresh();
        })
      }
      className={`rounded-md border border-line px-2 py-1 text-xs font-medium text-muted hover:bg-canvas disabled:opacity-50 ${
        pending ? "opacity-60" : ""
      }`}
    >
      {archived ? "Unarchive" : "Archive"}
    </button>
  );
}
