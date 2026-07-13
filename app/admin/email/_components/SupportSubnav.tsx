"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The Email-internal section nav (Inbox / Labels). It lives in the thin
// sub-bar under the shared admin chrome, so Email reads as one section of the
// admin with its own rooms, not a separate product. Each item carries its
// section key, so the nav can hide the tabs a scoped staffer may not open.
// The keys match CARE_SECTIONS in _lib/sections.ts.
const ITEMS = [
  { href: "/admin/email/inbox", label: "Inbox", section: "inbox" },
  { href: "/admin/email/customers", label: "Customers", section: "contacts" },
  { href: "/admin/email/labels", label: "Labels", section: "labels" },
  { href: "/admin/email/settings", label: "Settings", section: "settings" },
  { href: "/admin/email/test", label: "Test Lab", section: "test" },
];

export function SupportSubnav({
  allowed,
}: {
  // The section keys this person may open. Undefined = show all (e.g. while
  // prefs are unavailable); a list filters the tabs to the allowed sections.
  allowed?: string[];
}) {
  const pathname = usePathname();
  const items = allowed ? ITEMS.filter((it) => allowed.includes(it.section)) : ITEMS;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-semibold transition ${
              active ? "bg-navy/10 text-navy" : "text-muted hover:bg-canvas hover:text-navy"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
