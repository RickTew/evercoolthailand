"use client";

import { useState, useTransition } from "react";
import { claimThreadAction } from "@/app/admin/email/inbox/actions";

// The "Assign to me" affordance shown in place of the "Unassigned" label on an
// unowned card. The card itself is a <Link>, so we stop the click from bubbling
// into navigation and claim the ticket inline instead.
export function ClaimButton({ threadId }: { threadId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      title="Assign this ticket to me"
      onClick={(e) => {
        // Inside a <Link>: block both client navigation and the native anchor.
        e.preventDefault();
        e.stopPropagation();
        setError(false);
        startTransition(async () => {
          const res = await claimThreadAction(threadId);
          if (!res.ok) setError(true);
        });
      }}
      className={`ml-auto rounded-full border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
        error
          ? "border-red/40 text-red"
          : "border-teal/40 text-teal hover:border-teal hover:bg-teal/10"
      } ${pending ? "opacity-60" : ""}`}
    >
      {pending ? "Assigning…" : error ? "Retry" : "Assign to me"}
    </button>
  );
}
