"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markSpamAction } from "@/app/admin/email/inbox/actions";

// "Spam" in the conversation action row: files a conversation the filter did
// not catch into the Spam folder AND blocks the sender, so their next mail is
// flagged automatically. One confirm, because blocking is the part with teeth
// (undone by "Not spam" on the conversation, which also unblocks).
export function SpamControl({ threadId, senderEmail }: { threadId: string; senderEmail: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Move this conversation to Spam and block ${senderEmail}?`)) return;
        startTransition(async () => {
          await markSpamAction(threadId, true);
          router.refresh();
        });
      }}
      className={`rounded-md border border-line px-2 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-red disabled:opacity-50 ${
        pending ? "opacity-60" : ""
      }`}
      title={`Move to Spam and block ${senderEmail}`}
    >
      Spam
    </button>
  );
}
