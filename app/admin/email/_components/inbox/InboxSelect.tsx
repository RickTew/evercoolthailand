"use client";

import { useRouter } from "next/navigation";
import { buildInboxHref, type InboxParams } from "@/app/admin/email/_lib/inbox-url";
import { useInboxOptions } from "@/app/admin/email/_components/inbox/InboxScope";

// Inbox filter: every @newnei.com address shares one Care queue, so this narrows
// the view to mail that came to one address (sales@, healing@, ...). A dropdown
// so the row stays short; navigates by query param, so the result is shareable.
// The options come from the per-staff scope (a person scoped to their own inboxes
// only sees those here), defaulting to every NEWNEI address.
export function InboxSelect({ current }: { current: InboxParams }) {
  const router = useRouter();
  const options = useInboxOptions();
  // When a person is scoped to a single inbox, "All inboxes" already means that
  // one, so the dropdown would be redundant: hide it.
  if (options.length <= 1) return null;
  return (
    // No "Inbox:" label: the default option already reads "All inboxes", so the
    // prefix was redundant and only added to the row's clutter.
    <select
      aria-label="Filter by inbox"
      value={current.inbox ?? "all"}
      onChange={(e) =>
        router.push(buildInboxHref(current, { inbox: e.target.value === "all" ? null : e.target.value }))
      }
      className="rounded-md border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-teal"
    >
      <option value="all">All inboxes</option>
      {options.map((i) => (
        <option key={i.address} value={i.address}>
          {i.label} ({i.address})
        </option>
      ))}
    </select>
  );
}
