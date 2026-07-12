"use client";

import Link from "next/link";
import { buildInboxHref, type InboxParams, type InboxView } from "@/app/admin/email/_lib/inbox-url";

// Simple Board | List toggle (N9). Board is the visual overview (default); List is
// the compact split. The choice is remembered in a cookie so the inbox reopens the
// same way after visiting another section. (Cross-device, per-account persistence
// is a small follow-up; the cookie covers per-browser today.)
const OPTIONS: { key: InboxView; label: string }[] = [
  { key: "board", label: "Board" },
  { key: "classic", label: "List" },
];

export function ViewSwitcher({
  current,
  active,
}: {
  current: InboxParams;
  active: InboxView;
}) {
  function remember(view: InboxView) {
    // Writing the browser cookie API in a click handler; the immutability rule
    // mis-reads `document.cookie =` as mutating an outer value.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `lastView=${view}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">View</span>
      <div className="flex items-center gap-0.5 rounded-md border border-line p-0.5">
        {OPTIONS.map((v) => {
          const isActive = v.key === active;
          return (
            <Link
              key={v.key}
              href={buildInboxHref(current, { view: v.key })}
              prefetch={false}
              onClick={() => remember(v.key)}
              aria-pressed={isActive}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive ? "bg-navy text-white" : "text-muted hover:bg-canvas"
              }`}
            >
              {v.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
