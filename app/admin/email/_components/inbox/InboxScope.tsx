"use client";

import { createContext, useContext, type ReactNode } from "react";
import { EVERCOOL_INBOXES } from "@/app/admin/email/_lib/inboxes";

// Carries the inbox options a given staffer is allowed to see down to the
// InboxSelect dropdown, without threading a prop through every view + FilterBar.
// The inbox page resolves the person's scope and provides it once around all the
// views; InboxSelect reads it. No provider (or an empty value) falls back to every
// NEWNEI address, so anywhere the dropdown renders outside the scoped page still
// shows the full list.
export type InboxOption = { address: string; label: string };

const DEFAULT_OPTIONS: InboxOption[] = EVERCOOL_INBOXES.map((i) => ({
  address: i.address,
  label: i.label,
}));

const InboxScopeContext = createContext<InboxOption[] | null>(null);

export function InboxScopeProvider({
  options,
  children,
}: {
  options: InboxOption[];
  children: ReactNode;
}) {
  return <InboxScopeContext.Provider value={options}>{children}</InboxScopeContext.Provider>;
}

export function useInboxOptions(): InboxOption[] {
  const ctx = useContext(InboxScopeContext);
  return ctx && ctx.length > 0 ? ctx : DEFAULT_OPTIONS;
}
