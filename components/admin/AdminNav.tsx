"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n } from "@/lib/eqt/i18n";

export type UserRole = "admin" | "sales" | "manager" | "owner" | "technician" | "staff";

interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

// Nav diet (Rick, 13 Jul): Messages folded into the CRM (contact-form
// submissions now open CRM tickets), and the website-content pages (Services,
// Gallery, Articles) live under one "Website" dropdown so daily operations
// keep the bar. /admin/messages still exists by URL as the pre-CRM archive.
const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard",  label: "Dashboard",  roles: ["admin", "sales", "manager", "owner", "technician", "staff"] },
  // The Care/CRM module (shared inbox, labels, later customers + settings).
  // Renamed from "Email" (Rick, 13 Jul): it is the CRM, mail is just the channel.
  { href: "/admin/email/inbox", label: "CRM",       roles: ["admin", "sales", "manager", "owner", "technician", "staff"] },
  { href: "/admin/quotes",     label: "Quotes",     roles: ["admin", "sales", "manager", "owner"] },
  { href: "/admin/bookings",   label: "Bookings",   roles: ["admin", "sales", "manager", "owner"] },
  { href: "/admin/customers",  label: "Customers",  roles: ["admin", "sales", "manager", "owner"] },
  // Projects (quotation pipeline) + Service (Service & Maintenance) are the
  // eq-tracker sections consolidated into the portal (13 Jul). They replace
  // the blank Jobs stub; Reports below is eq-tracker's analytics dashboard.
  { href: "/admin/projects",   label: "Projects",   roles: ["admin", "sales", "manager", "owner"] },
  { href: "/admin/service",    label: "Service",    roles: ["admin", "manager", "owner", "technician"] },
  { href: "/admin/team",       label: "Team",       roles: ["admin", "manager", "owner"] },
  { href: "/admin/reports",    label: "Reports",    roles: ["admin", "manager", "owner"] },
  { href: "/admin/users",      label: "Users",      roles: ["admin"] },
];

// Website content management, grouped under one dropdown (admin-only, as the
// individual pages always were).
const WEBSITE_ITEMS = [
  { href: "/admin/services", label: "Services" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/articles", label: "Articles" },
];

// The old separate eq-tracker app. HIDDEN since 13 Jul (Rick: staff would get
// confused and enter data there); its Projects/Service/Reports now live in
// this portal, reading the same tables. Flip SHOW_EQ_TRACKER to true to bring
// the link back if something turns out to be missing.
const SHOW_EQ_TRACKER = false;
const EQ_TRACKER_URL = "https://eq-tracker-theta.vercel.app";
const EQ_TRACKER_ROLES: UserRole[] = ["admin", "manager", "owner", "technician"];

const ROLE_BADGE: Record<UserRole, string> = {
  admin:      "bg-red-500/20 text-red-400",
  owner:      "bg-purple-500/20 text-purple-400",
  manager:    "bg-amber-500/20 text-amber-400",
  sales:      "bg-blue-500/20 text-blue-400",
  technician: "bg-teal-500/20 text-teal-400",
  staff:      "bg-gray-500/20 text-gray-400",
};

export default function AdminNav({
  userEmail,
  userName,
  role,
}: {
  userEmail: string;
  userName: string;
  role: UserRole;
}) {
  const pathname = usePathname();
  const { locale, setLocale } = useI18n();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [websiteOpen, setWebsiteOpen] = useState(false);

  const visibleLinks = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const websiteActive = WEBSITE_ITEMS.some((w) => pathname.startsWith(w.href));

  async function handleSignOut() {
    setSigningOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <nav className="bg-ec-navy border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-[1100px] mx-auto px-4 flex items-center gap-3 h-14">
        {/* Brand */}
        <Link href="/admin/dashboard" className="text-sm font-bold text-white shrink-0">
          EC <span className="text-ec-teal">Portal</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide flex-1">
          {visibleLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                pathname.startsWith(item.href)
                  ? "bg-ec-teal text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Website dropdown + EQ Tracker live OUTSIDE the scrolling link strip:
            an absolutely positioned menu inside an overflow-x-auto container
            gets clipped by it, which made the dropdown look dead. */}
        {role === "admin" && (
          <div className="relative shrink-0">
            <button
              onClick={() => setWebsiteOpen((o) => !o)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                websiteActive
                  ? "bg-ec-teal text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              Website
              <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
              </svg>
            </button>
            {websiteOpen && (
              <>
                {/* click-away backdrop */}
                <div className="fixed inset-0 z-40" onClick={() => setWebsiteOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-xl border border-white/10 bg-ec-navy p-1 shadow-lg">
                  {WEBSITE_ITEMS.map((w) => (
                    <Link
                      key={w.href}
                      href={w.href}
                      onClick={() => setWebsiteOpen(false)}
                      className={`block rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                        pathname.startsWith(w.href)
                          ? "bg-ec-teal text-white"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {w.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {SHOW_EQ_TRACKER && EQ_TRACKER_ROLES.includes(role) && (
          <a
            href={EQ_TRACKER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-2 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
            title="Equipment + Service & Maintenance (opens the EQ Tracker app)"
          >
            EQ Tracker <span aria-hidden className="text-[10px]">↗</span>
          </a>
        )}

        {/* TH/EN toggle. The staff are Thai; Projects, Service and Reports are
            fully bilingual (the eq-tracker translations), so the switch lives
            here where every page can reach it. */}
        <button
          onClick={() => setLocale(locale === "th" ? "en" : "th")}
          className="shrink-0 rounded-lg border border-white/20 px-2 py-1 text-[11px] font-semibold text-white/70 hover:text-white transition-colors"
          title={locale === "th" ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
        >
          {locale === "th" ? "TH" : "EN"}
        </button>

        {/* User info + sign out */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-white/80 font-medium leading-none">{userName || userEmail}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 uppercase tracking-wide ${ROLE_BADGE[role] ?? ROLE_BADGE.staff}`}>
              {role}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-xs text-white/60 hover:text-white border border-white/20 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            {signingOut ? "..." : "Sign Out"}
          </button>
        </div>
      </div>
    </nav>
  );
}
