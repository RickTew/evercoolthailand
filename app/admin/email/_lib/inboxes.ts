// The Evercool mail addresses that route into the email inbox. Every
// @evercoolthailand.com address comes into the ONE shared queue (domain-wide
// inbound); this list just drives the inbox filter and the labels. Add, remove,
// or rename freely as the team's addresses change. Order is the order shown in
// the filter.
export const EVERCOOL_INBOXES = [
  { address: "hi@evercoolthailand.com", label: "Hi" },
  // The legacy A2 Hosting addresses. After the Phase 3 MX cutover, mail to
  // these lands in this inbox too (Resend receives domain-wide), so customers
  // who reply to old threads or use saved addresses lose nothing.
  { address: "hello@evercoolthailand.com", label: "Hello" },
  { address: "info@evercoolthailand.com", label: "Info" },
] as const;

export type EvercoolInbox = (typeof EVERCOOL_INBOXES)[number]["address"];

// Friendly label for an address ("hi@evercoolthailand.com" -> "Hi"); falls back
// to the local part for any address not in the list.
export function inboxLabel(address: string): string {
  const known = EVERCOOL_INBOXES.find((i) => i.address === address.toLowerCase());
  if (known) return known.label;
  const local = address.split("@")[0] ?? address;
  return local.charAt(0).toUpperCase() + local.slice(1);
}
