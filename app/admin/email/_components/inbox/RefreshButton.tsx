"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

// Manual inbox refresh (R11). The inbox is server-rendered, so new inbound mail
// only appears on navigation or a server-action refresh; this gives staff an
// explicit "check for new mail now" without a full page reload.
export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      title="Check for new mail now"
      aria-label="Refresh the inbox"
      className="inline-flex items-center justify-center rounded-md border border-line px-2 py-1 text-sm font-medium text-muted hover:bg-canvas disabled:opacity-50"
    >
      <span aria-hidden className={pending ? "inline-block animate-spin" : ""}>
        ↻
      </span>
    </button>
  );
}
