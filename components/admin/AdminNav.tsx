"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type UserRole = "admin" | "sales" | "manager" | "owner" | "technician" | "staff";

interface NavItem {
  href: string;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard",  label: "Dashboard",  roles: ["admin", "sales", "manager", "owner", "technician", "staff"] },
  { href: "/admin/quotes",     label: "Quotes",     roles: ["admin", "sales", "manager", "owner"] },
  { href: "/admin/bookings",   label: "Bookings",   roles: ["admin", "sales", "manager", "owner"] },
  { href: "/admin/messages",   label: "Messages",   roles: ["admin", "sales", "manager", "owner"] },
  { href: "/admin/email/inbox", label: "Email",     roles: ["admin", "sales", "manager", "owner", "technician", "staff"] },
  { href: "/admin/customers",  label: "Customers",  roles: ["admin", "sales", "manager", "owner"] },
  { href: "/admin/jobs",       label: "Jobs",       roles: ["admin", "sales", "manager", "owner", "technician"] },
  { href: "/admin/team",       label: "Team",       roles: ["admin", "manager", "owner"] },
  { href: "/admin/reports",    label: "Reports",    roles: ["admin", "manager", "owner"] },
  { href: "/admin/services",   label: "Services",   roles: ["admin"] },
  { href: "/admin/gallery",    label: "Gallery",    roles: ["admin"] },
  { href: "/admin/articles",   label: "Articles",   roles: ["admin"] },
  { href: "/admin/users",      label: "Users",      roles: ["admin"] },
];

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
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleLinks = NAV_ITEMS.filter((item) => item.roles.includes(role));

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
              className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                pathname.startsWith(item.href)
                  ? "bg-ec-teal text-white"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

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
