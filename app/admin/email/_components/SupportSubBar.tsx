import type { ReactNode } from "react";
import { getSessionProfile } from "@/app/admin/email/_lib/auth";
import { allowedCareSections } from "@/app/admin/email/_lib/sections";
import { getMyStaffPrefs } from "@/app/admin/email/_lib/sections.server";
import { SupportSubnav } from "./SupportSubnav";

// The thin contextual bar at the top of every Email page, under the shared
// admin chrome. It carries the page title, the section nav, and an optional
// right-hand slot for page-specific controls (search, view switcher). It is
// shrink-0 so the page body below owns the scroll.
export async function SupportSubBar({
  title,
  right,
}: {
  title?: string;
  right?: ReactNode;
}) {
  // Which sections this person may open, so the sub-nav only shows their tabs.
  const profile = await getSessionProfile();
  const prefs = await getMyStaffPrefs();
  const allowed = prefs ? allowedCareSections(prefs, profile?.role === "admin") : undefined;

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-line bg-white px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-4">
        {title && (
          <span className="hidden shrink-0 text-sm font-semibold text-navy md:block">
            {title}
          </span>
        )}
        <SupportSubnav allowed={allowed} />
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}
