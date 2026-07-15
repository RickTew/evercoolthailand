// The build status board for the Evercool portal (NOT a fixed plan). The LIVE
// picture is the real portal: the sections in the admin nav plus the public
// website. Building and Planned are loose lists, edited freely, "that we know
// of". Ported from the newnei build page, adapted to Evercool.

import { BUILD_LOG, BUILD_TODO } from "@/lib/dashboard/buildLog";

export interface LiveSection {
  name: string;
  what: string;
  href: string;
}

// Everything running today. The staff tools mirror the admin nav; the public
// website is listed once as its own live piece.
export const LIVE_SECTIONS: LiveSection[] = [
  { name: "Public website", what: "The Evercool site: services, products, gallery, articles, quote builder, TH/EN, PWA.", href: "/" },
  { name: "CRM", what: "Shared inbox on one contact record: labels, saved replies, drafts, Knowledge tab.", href: "/admin/email/inbox" },
  { name: "Quotes", what: "Quote requests from the website, tracked to accepted.", href: "/admin/quotes" },
  { name: "Bookings", what: "Job bookings and scheduling.", href: "/admin/bookings" },
  { name: "Customers", what: "The customer record behind quotes, bookings and the CRM.", href: "/admin/customers" },
  { name: "Projects", what: "The quotation pipeline, consolidated in from EQ Tracker.", href: "/admin/projects" },
  { name: "Service", what: "Service & Maintenance: contracts, visits, technician work.", href: "/admin/service" },
  { name: "Team", what: "Staff and assignments.", href: "/admin/team" },
  { name: "Reports", what: "The analytics dashboard, consolidated in from EQ Tracker.", href: "/admin/reports" },
  { name: "Users", what: "Accounts, six staff roles, care access.", href: "/admin/users" },
  { name: "Website content", what: "Services, Gallery and Articles managed from the portal.", href: "/admin/services" },
  { name: "Dashboard", what: "The staff landing: live counts, recent quotes and conversations.", href: "/admin/dashboard" },
];

export interface BuildItem {
  name: string;
  gloss: string;
}

// Actively being built right now. Loose by design; edit freely.
export const BUILDING: BuildItem[] = [
  { name: "Work / time / token recording", gloss: "The instrumentation behind this page: every session logged with work, time and tokens, measured instead of estimated." },
  { name: "Post-deploy verification pass", gloss: "Confirm on the live site: the EVERCOOL logo on a real send, the Draft button, Waiting for customer chips, EQ project chips, saved replies." },
  { name: "CRM staff launch", gloss: "Each staff member sets their signature, walks the How to use guide, and feeds back; fix whatever they hit." },
  { name: "Supplier-thread triage", gloss: "Work the restored supplier threads with the manager; spam-flag on authentication evidence only, never origin." },
];

// On the radar, that we know of. Not a committed plan; meant to stay loose.
// (Old-host cancellation, EQ Tracker retirement and consolidation phase 2 are
// tracked internally, not shown here: Rick, 15 Jul.)
export const PLANNED: BuildItem[] = [
  { name: "Aide draft templates port", gloss: "Deterministic draft templates plus style settings, ported from the sister CRM." },
  { name: "Smarter drafts and after-hours replies", gloss: "The assisted-reply layer: needs setup, usage logging, and a budget decision." },
  { name: "Booking and quote forms into the CRM", gloss: "Both public forms still send notification email only; fold them into the CRM ticket channel like the contact form." },
  { name: "Full Thai translation of the CRM", gloss: "The CRM UI is English with Thai only in the guide; Projects, Service and Reports are already bilingual." },
  { name: "RLS hardening on EQ Tracker tables", gloss: "Bring the ported tables up to the portal's stricter access model." },
  { name: "Trash purge cron", gloss: "purgeTrash exists but nothing schedules it; the kept-N-days promise is unenforced until it runs." },
  { name: "LINE Official Account integration", gloss: "LINE beats WhatsApp for Thai customers; customer contact plus staff alerts on new quotes." },
  { name: "Complete Thai coverage on the public site", gloss: "About, Products hero, Contact labels and Learn headings are English-only in Thai mode; needs Rick's Thai copy." },
  { name: "IP rate limiting on public endpoints", gloss: "Honeypot and length caps are live; true per-IP throttling needs a Redis-backed limiter." },
];

/** Cross-cutting cards that apply to every build, not their own section. */
export const STANDING_CARDS: { name: string; gloss: string }[] = [
  { name: "One shared backend", gloss: "Three apps (website + portal, EQ Tracker, Service & Maintenance) consolidated onto ONE shared backend, one login, one deploy." },
  { name: "Email done right", gloss: "The cutover from the old hosting mailboxes to the new system: sending, receiving, spam defense, signatures, the EVERCOOL logo on outgoing mail." },
  { name: "Bilingual by default", gloss: "Thai and English across the public site and the ported staff sections; staff are Thai, TH is the default." },
  { name: "Data, privacy & security", gloss: "Roles, RLS on the shared database, spam defense, backups; hardening continues every build." },
];

// --- The layered picture ------------------------------------------------------
// The same work seen at every altitude: broadest at the top (the whole stack),
// down to every individual edit. Counts derive from BUILD_LOG and LIVE_SECTIONS
// except the foundation figures, which are the only numbers not derivable in
// code and so live as labelled constants here.

/** Bump these when you add a migration or a screen; everything else updates
 * itself. Screens = app route page.tsx files a person can open. */
export const FOUNDATION = {
  migrations: 9, // in-repo: 7 (portal) + 2 (EQ Tracker); the earlier schema was built directly in the shared database
  screens: 44, // 37 portal + public site, 7 EQ Tracker
  apps: 4, // public website, staff portal + CRM, EQ Tracker, Service & Maintenance
  zones: 2, // public site + staff portal
} as const;

export interface BuildLayer {
  key: string;
  emoji: string;
  /** 0 = a top layer, 1 = "items inside" the layer above it. */
  depth: 0 | 1;
  count: number;
  unit: string;
  detail: string;
}

export function buildLayers(): BuildLayer[] {
  const builds = BUILD_LOG.length;
  const edits = BUILD_LOG.reduce((s, e) => s + e.changes.length, 0);
  return [
    {
      key: "apps",
      emoji: "🏗️",
      depth: 0,
      count: FOUNDATION.apps,
      unit: "apps built (and rebuilt)",
      detail:
        "The public website, this portal + CRM, EQ Tracker, and Service & Maintenance; the last two were built standalone, then REBUILT into this one portal.",
    },
    {
      key: "foundation",
      emoji: "🏛️",
      depth: 0,
      count: FOUNDATION.screens,
      unit: "screens",
      detail: `One shared backend, ${FOUNDATION.zones} security zones, one login for staff.`,
    },
    {
      key: "tools",
      emoji: "📊",
      depth: 0,
      count: LIVE_SECTIONS.length,
      unit: "live sections",
      detail: "The website plus every staff tool in the nav, running today.",
    },
    {
      key: "builds",
      emoji: "🔨",
      depth: 0,
      count: builds,
      unit: "builds + fixes shipped",
      detail: "Logged with receipts, newest first, back to the pre-app era.",
    },
    {
      key: "edits",
      emoji: "🧾",
      depth: 1,
      count: edits,
      unit: "individual edits inside them",
      detail: "Every fix, change, and edit captured, nothing invisible.",
    },
  ];
}

export function buildCounts(): { live: number; building: number; planned: number } {
  return {
    live: LIVE_SECTIONS.length,
    building: BUILDING.length,
    planned: PLANNED.length,
  };
}

// (The "until truly done" completion meter was removed 15 Jul on Rick's call:
// we do not know the true total, so no percentage is shown.)

/** The four status counts for the chip row. */
export function buildStatus(): { live: number; building: number; todo: number; ideas: number } {
  return {
    live: LIVE_SECTIONS.length,
    building: BUILDING.length,
    todo: BUILD_TODO.length,
    ideas: PLANNED.length,
  };
}
