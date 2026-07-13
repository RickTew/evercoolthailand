// The Evercool mail addresses that route into the email inbox. Every
// @evercoolthailand.com address comes into the ONE shared queue (domain-wide
// inbound); this list just drives the inbox filter and the labels. Add, remove,
// or rename freely as the team's addresses change. Order is the order shown in
// the filter.
export const EVERCOOL_INBOXES = [
  { address: "hi@evercoolthailand.com", label: "Hi" },
  // The legacy A2 Hosting addresses (full cPanel inventory, 2026-07-12). After
  // the Phase 3 MX cutover, mail to ALL of these lands in this inbox too
  // (Resend receives domain-wide), so customers who reply to old threads or
  // use saved addresses lose nothing. Role addresses first, then staff.
  { address: "hello@evercoolthailand.com", label: "Hello" },
  { address: "info@evercoolthailand.com", label: "Info" },
  { address: "admin@evercoolthailand.com", label: "Admin" },
  { address: "office@evercoolthailand.com", label: "Office" },
  { address: "sales@evercoolthailand.com", label: "Sales" },
  { address: "support@evercoolthailand.com", label: "Support" },
  // Function addresses for the CRM (added 13 Jul, matching the portal's own
  // modules: Quotes, Bookings, Service & Maintenance, invoicing). Domain-wide
  // receiving means these already collect mail; listing them here gives them
  // a filter entry + label, and replies go out FROM the address written to.
  { address: "bookings@evercoolthailand.com", label: "Bookings" },
  { address: "quotes@evercoolthailand.com", label: "Quotes" },
  { address: "service@evercoolthailand.com", label: "Service" },
  { address: "billing@evercoolthailand.com", label: "Billing" },
  // Staff personal addresses (current staff only; jakkrit@ and theerachai@
  // removed 13 Jul when they left the company. Mail to a removed address still
  // arrives via the domain catch-all and is visible to admin + manager).
  { address: "blancheli@evercoolthailand.com", label: "Blancheli" },
  { address: "kongnatee@evercoolthailand.com", label: "Kongnatee" },
  { address: "tassanee@evercoolthailand.com", label: "Tassanee" },
  { address: "wanrawee@evercoolthailand.com", label: "Wanrawee" },
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
