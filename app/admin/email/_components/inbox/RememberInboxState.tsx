"use client";

import { useEffect } from "react";
import { rememberInboxStateAction } from "@/app/admin/email/inbox/actions";

// Records the inbox layout + filters this person is currently looking at, so Care
// can reopen there next time (the "Pick up where you left off" preference). Renders
// nothing. Debounced and fire-and-forget; the action does not revalidate, so this
// never triggers a re-render. Keyed by content (view + serialized filters), so it
// only writes when something actually changed.
export function RememberInboxState({
  view,
  filters,
}: {
  view: string;
  filters: Record<string, string>;
}) {
  const fkey = JSON.stringify(filters);
  useEffect(() => {
    const t = setTimeout(() => {
      void rememberInboxStateAction(view, JSON.parse(fkey) as Record<string, string>);
    }, 700);
    return () => clearTimeout(t);
  }, [view, fkey]);
  return null;
}
