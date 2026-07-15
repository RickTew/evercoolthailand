// Build log: what got built, fixed, and shipped for Evercool Thailand. THE
// record the team can open to see what was done and what it took. Every entry
// expands to its individual edits, fixes, and changes, so nothing is invisible.
//
// HONESTY: hours are ESTIMATES (reconstructed from commit timestamps and diff
// sizes; in-repo work logging only started 2026-07-15 with WORK-LOG.md).
// Tokens are only shown where they were actually logged; we never invent token
// numbers, so most historical entries simply have none. The pre-app era (the
// original websites, the old host management) is included as dated backfill
// entries with approximate dates, flagged in their summaries. Newest first.
//
// KEEPING IT CURRENT: WORK-LOG.md (repo root) is the running per-session log;
// at session wrap, the same entry is appended here (newest first) so this page
// stays the live proof.

export type BuildLogType = "feature" | "fix" | "content" | "infra" | "data" | "strategy";

export type BuildLogEntry = {
  date: string; // YYYY-MM-DD
  title: string;
  type: BuildLogType;
  summary: string;
  hours: number; // estimated effort
  tokensK?: number; // tokens in thousands, ONLY when actually logged (never invented)
  changes: string[]; // every individual edit / fix / change in this item
};

// Reconstructed 2026-07-15 from the git histories of evercoolthailand and
// eq-tracker, WORK-LOG.md, the plan docs, and the pre-app record (the original
// old CMS site and the old hosting years). Newest first.
export const BUILD_LOG: BuildLogEntry[] = [
  {
    "date": "2026-07-15",
    "title": "This page: the Build board and Rick's Proof ported from newnei, the whole history researched and logged",
    "type": "feature",
    "summary": "The page you are reading. The newnei Build page and its Rick's Proof section were ported into the portal and restyled, and the complete work record was researched and reconstructed: three parallel agents mined the 122 commits of this repo, the 36 commits of the EQ Tracker repo, and the non-git record (work log, plan docs, the old-site build brief, the reference library, and the hosting and email facts), then the results were merged, deduplicated and dated into 41 entries with 331 individual changes back to the original 2023 site. The token figure on this entry covers only the research agents (actually measured); the session around them was not instrumented.",
    "hours": 1,
    "tokensK": 175,
    "changes": [
      "Full history research: evercoolthailand git log, EQ Tracker git log, WORK-LOG.md, plan docs, evercoolthailandbuild.rtf, reference/, memory and email platform records mined in parallel",
      "41 build entries merged, deduplicated (overlapping cutover-night and EQ Tracker coverage) and sorted, ~185 estimated hours reconstructed",
      "lib/dashboard/buildLog.ts: the log data and the still-to-be-done board, with tokens shown only where actually logged",
      "lib/dashboard/buildPlan.ts: the Live / Building / Planned board, standing cards, layered stack and honest completion meter",
      "/admin/build page with hero stats, status chips, Rick's Proof in the Pudding collapsible and the expandable receipts list, in the portal's own palette",
      "Build tab added to the admin nav for every staff role; the public site never links here and anonymous visits bounce to /login (verified)",
      "WORK-LOG.md rule extended: every session entry is mirrored into this page's log"
    ]
  },
  {
    "date": "2026-07-15",
    "title": "Launch-day staff feedback fixed within hours",
    "type": "fix",
    "summary": "Staff reported two problems on launch morning and both were fixed the same session. Outgoing mail that showed only 'evercool' as the sender now goes out as 'Name, EVERCOOL' with the correct reply and compose addresses, and the Sent folder's confusing Waiting chip was relabeled Waiting for customer everywhere. The guide also gained a plain-language section answering the team's question about who can see which mailbox.",
    "hours": 1,
    "changes": [
      "Outgoing mail sends as 'Name, EVERCOOL <address>' instead of a bare 'evercool' sender",
      "Replies keep the inbox address the customer wrote to; Compose uses the staffer's confirmed personal @evercoolthailand.com address when they have one; bulk replies carry the name too",
      "Pending status relabeled Waiting for customer across the board column, tiles, chips and filters, with the guide explaining the email was sent and a reply is awaited",
      "New bilingual guide section spelling out the three access levels (admin sees all, manager sees all company mail but not colleagues' personal addresses, staff see only their own), pointing at the Your access box and explaining shared-mailbox grants"
    ]
  },
  {
    "date": "2026-07-15",
    "title": "Draft button and Knowledge tab: the CRM learns from its own replies",
    "type": "feature",
    "summary": "The missing knowledge layer was ported from newnei's Wisdom system on the free tier, deliberately with no AI call. A Draft button in the reply box composes a deterministic reply from verified Knowledge articles, greeting the customer in their own language with a topic-aware opener and the staffer's signature. The new Knowledge tab manages verified answers and closes the learning loop: every sent reply queues for review and promoting one creates a verified article the Draft button reuses. A work log was also started so every session records its work and time.",
    "hours": 1.5,
    "changes": [
      "Draft button in the reply box writes a reply from verified Knowledge articles: greeting in the customer's language (EN/TH), a topic-aware opener via the existing classifier, the best-matching article, and the staffer's own signature",
      "Free and deterministic by design: no AI call needed",
      "Honest holding reply generated when no article matches",
      "Advisory QC flags overpromises and credential mentions before sending",
      "Knowledge tab with CRUD on verified answers",
      "Learning loop: every sent reply lands in an Answers-to-review queue; promoting one creates a verified article with EN/TH language auto-detected",
      "Retrieval built for both languages: keyword overlap for English, substring runs for Thai, and a topic-anchor bridge for cross-language matches",
      "No schema change needed: the support_kb_articles and support_answer_reviews tables already existed in production from migration 0001",
      "Test Lab explainer and the How to use guide now teach the Draft and Knowledge flow",
      "WORK-LOG.md started at the repo root: one entry per session recording work and time, with estimates marked as estimates"
    ]
  },
  {
    "date": "2026-07-15",
    "title": "Launch-day operations outside the repo: catch-all verified, scopes confirmed",
    "type": "infra",
    "summary": "From WORK-LOG.md, the non-code portion of the 2026-07-15 session. Verified in production data and live DNS that inbound mail is a domain-wide catch-all: mail to typo, unknown, or ex-staff addresses still lands in the CRM (live proof: mail to a misspelled address, a project@ alias and an ex-staff address arrived 14 to 15 July). Confirmed per-person staff scope in support_staff_prefs, establishing that info@ (the busiest address) is visible only to the admin and the manager. Time estimate covers only this out-of-repo slice.",
    "hours": 0.5,
    "changes": [
      "Domain-wide catch-all behavior verified against production data and live DNS",
      "Per-staff mailbox scopes confirmed in support_staff_prefs",
      "Open decision surfaced for Rick: whether any staff get shared mailboxes ticked in Users > CRM access",
      "Global tooling settings updated (git allow rules)"
    ]
  },
  {
    "date": "2026-07-14",
    "title": "CRM launch polish: branded outgoing mail, B2B auto-labels, saved replies, project chips",
    "type": "feature",
    "summary": "The CRM was tuned for its real users the night before staff launch. Every outgoing email now carries the EVERCOOL logo and a one-click company signature format. A scan of the 48 live threads showed the traffic is B2B industrial HVAC, so new auto-labels for Purchase order, Shipping, Supplier and Project were built and tested against real subject lines, 9 bilingual saved replies were seeded, and conversations mentioning an EQ reference now show a chip deep-linking to the matching project in Projects. A bilingual How to use guide answers the staff feedback that the tool felt complicated.",
    "hours": 2.5,
    "changes": [
      "Every email sent from the CRM (reply, Compose, bulk reply) carries the EVERCOOL logo under the signature, matching the team's Apple Mail signatures",
      "Quoted history renders muted below the logo instead of inline plain text",
      "Use the company format button in Settings fills the standard signature block with the staffer's name, with a preview of the automatic logo",
      "Bilingual EN/TH How to use guide tab covering the daily flow, always visible and linked from the dashboard map",
      "48 live threads scanned to learn the real traffic profile: supplier quotations, purchase orders, freight, vendor introductions",
      "New auto-labels Purchase order, Shipping, Supplier and Project, with the Project label firing on EQ references and regexes tested against real subject lines",
      "Migration 0007 applied to production: 4 tags plus 9 bilingual starter saved replies (quotation ack, need details, PO confirmed, supplier catalogue request, service scheduling)",
      "Saved replies panel in Settings: everyone sees the library, admin and manager can add and delete",
      "How to use banner in Settings linking to the guide; guide gains auto-label, saved replies and daily routine sections",
      "EQ project chips under the thread subject showing the reference and project name, deep-linking to /admin/projects with base-code matching (EQ068 matches EQ068-07-26)",
      "Chips render only for roles that can open Projects; deep links open with the my-projects filter off so the target row always shows"
    ]
  },
  {
    "date": "2026-07-13",
    "title": "Spam and phishing defense plus the manager's all-company inbox view",
    "type": "feature",
    "summary": "Every inbound email is now scored from the authentication headers the new mail platform stamps (SPF, DKIM, DMARC, spam and virus verdicts, Reply-To mismatch). Flagged mail lands in a new Spam folder, never threads onto existing tickets, and staff get an evidence banner with Not spam and Block sender actions backed by a team blocklist. The defense was calibrated against real attacks: a live phishing email and an RFQ scam both flag while legitimate Thai and Singaporean business mail stays clean. The manager also gained a shared inbox scope that sees all company mail except colleagues' personal addresses.",
    "hours": 2.5,
    "changes": [
      "Inbound webhook scores every arrival from the mail platform's authentication headers: SPF, DKIM, DMARC, spam verdict, virus verdict and Reply-To mismatch",
      "New Spam folder; flagged mail skips topic auto-tagging and the shared queue",
      "Flagged mail can never thread onto an existing ticket, closing the forged-From threading hole",
      "Warning banner shows staff the evidence with Not spam and Block sender actions",
      "Team blocklist by address or whole domain that auto-confirms future mail as spam (migration 0003)",
      "Calibrated against real traffic: a live phish (SPF and DMARC fail) and an RFQ scam both flag; Gmail-hosted senders, an authenticated Thai newsletter and a Singapore B2B mail stay clean",
      "New shared inbox scope for the manager (migration 0004): sees every conversation except mail sent only to another staffer's personal address, so misspelled or unlisted company addresses can never hide",
      "Shared scope enforced in thread listing and counting, mirrored by the thread URL guard, and the inbox dropdown hides excluded addresses",
      "Users page shows the server's error when a role or name save fails instead of silently doing nothing, with save progress shown"
    ]
  },
  {
    "date": "2026-07-13",
    "title": "CRM build-out: Settings, per-staff access controls, contact form folded in",
    "type": "feature",
    "summary": "The Email tab officially became the CRM. Admins got a per-staff access panel controlling inbox visibility and CRM sections, staff got a Settings area with signature and session preferences, and the website contact form now opens CRM tickets directly, retiring the old Messages tab after importing its 14 historical messages. All 17 mailbox addresses were routing-tested end to end with real email before shipping.",
    "hours": 2,
    "changes": [
      "Per-staff CRM access panel in the Users console: inbox visibility (All / All company mail / Only assigned with per-mailbox checkboxes), CRM-section checkboxes, and confirm/decline of personal-address requests",
      "New CRM Settings section: You panel with signature, pick-up-where-you-left-off and request-your-own-address, plus an admin Trash panel with retention and empty-now",
      "Users pages server-gated to admins on top of nav hiding and the 403ing API",
      "Nav tab renamed from Email to CRM",
      "Four function mailboxes registered: bookings@, quotes@, service@ and billing@, plus Filter change and Maintenance plan topic labels with EN and Thai classifier rules (migration 0005)",
      "All 17 mailbox addresses routing-tested end to end with real email, 17 of 17 tickets created and cleaned up",
      "Access panel selects rebuilt with a custom chevron and clearer All company mail labeling",
      "Contact form submissions now open CRM tickets, with blocked senders filed straight to Spam",
      "14 historical contact messages imported into the CRM (migration 0006) and the Messages nav tab retired",
      "hello@ added to the webhook's self-send drop list so notification emails cannot loop back as junk tickets",
      "Website content pages grouped under one admin-only Website dropdown; dropdown clipping bug fixed",
      "Two departed staff removed from the inbox registry with the catch-all still collecting their mail",
      "Dashboard tiles and Recent Conversations now read the CRM instead of the retired archive, plus a follow-up typecheck fix"
    ]
  },
  {
    "date": "2026-07-13",
    "title": "EQ Tracker consolidation phase 1 plus Customers directory and orientation dashboard",
    "type": "feature",
    "summary": "The biggest single merge of the project: the EQ Tracker app's three business sections, Projects (the quotation pipeline with kanban and CSV import), Service and Maintenance, and Reports, moved into the portal, about 12,000 lines reading the same shared database tables under the portal's own auth. The CRM gained a searchable Customers directory with per-customer ticket history, the whole admin area got a TH/EN toggle, and a bilingual orientation dashboard now shows every new user where everything is. The old EQ Tracker link was hidden behind a flag only after a triple-check that the port matched the source.",
    "hours": 2.5,
    "changes": [
      "/admin/projects: the quotation pipeline with table and kanban views, CSV import and stage logs, plus admin-only stage and quarter management",
      "/admin/service: Service and Maintenance with records, visits, equipment, filter inventory, calendar and monthly report export, visible to technicians",
      "/admin/reports: the EQ Tracker analytics dashboard replaces the old stub",
      "Ported sections authenticate against the portal's profiles table; the manager role gets the powers EQ Tracker gave its admins",
      "Infra for the port: UI primitives, EQ Tracker design tokens scoped so the public site is untouched, a lightweight TH/EN i18n provider, sonner toasts in the admin layout",
      "Em dashes stripped from ported code per the golden rule",
      "CRM Customers directory: searchable contacts and per-customer profiles with full ticket history, scoped server-side by staff access",
      "Portal Customers nav tab redirects to the CRM directory instead of a blank page",
      "Em-dash audit across the admin and CRM UI: 14 spots fixed",
      "Nav tabs tightened so Users no longer clips at around 1300px",
      "PortalGuide on the dashboard: a bilingual where-everything-is map filtered to the viewer's role",
      "I18nProvider moved up to the admin layout with a TH/EN button in the top bar so Projects, Service and Reports switch language anywhere, Thai default",
      "EQ Tracker nav link hidden behind a flag after verifying the ported components diff clean against the source with matching tables, counts and writes",
      "Production write path verified end to end: project create, stage complete and stage log, test row cleaned up",
      "Known gaps recorded in the plan: no trash purge cron yet, access-policy tightening on the ported tables queued, CRM not yet fully bilingual"
    ]
  },
  {
    "date": "2026-07-13",
    "title": "Go-live proof gate passed, staff accounts issued, access model set, signup locked down",
    "type": "infra",
    "summary": "Morning-after verification and account operations, largely outside the repo. Proof gate passed: a real Gmail test to hi@ became a ticket in the portal, and outbound mail landed in the Gmail Inbox with authentication accepted. Five staff accounts were created with generated passwords and verified against the auth API; a staff JWT probe confirmed the database wall holds. The access model was decided: Rick sole admin, the manager with shared scope, five staff scoped to their own address only. Public signup was turned OFF in the auth settings after bot signups were found. All 17 CRM addresses were routing-tested the same day with real email, 17 out of 17 tickets created and cleaned up.",
    "hours": 3,
    "changes": [
      "First real root-domain inbound and outbound both proven live",
      "5 staff the auth service accounts created, passwords generated and verified",
      "Role and mailbox-scope model configured in production (admin, manager shared, staff assigned)",
      "Public auth signup disabled in the auth settings after bot accounts found"
    ]
  },
  {
    "date": "2026-07-12",
    "title": "Frontend audit: 17 bugs found and fixed in one pass",
    "type": "fix",
    "summary": "A systematic Part A audit of the whole public site and admin area surfaced and fixed 17 bugs in a single sweep, from a Thai-content-wiping article form and a broken sitemap to silent admin save failures, a calculator that lost focus every keystroke, and duplicate service workers. The audit plan and an improvement backlog were written down so nothing found got lost.",
    "hours": 3,
    "changes": [
      "Duplicate legacy landing sections removed (the page had two heroes and two why-us blocks)",
      "Article edit form no longer wipes Thai title, excerpt and content; TH fields added",
      "Sitemap fixed: correct is_published column, /products and /about added, dead /book redirect dropped",
      "Cookie banner positioning fixed (undefined CSS class)",
      "Graceful fallbacks when the database is unreachable on services, gallery and learn pages",
      "Calculator input focus loss fixed (nested Field component recreated each render)",
      "Null crashes guarded in admin bookings and quotes renders",
      "Errors surfaced on all admin mutations (StatusSelect, DeleteButton, forms)",
      "Users page infinite spinner on load failure fixed; avatar empty-string crash fixed",
      "Bangkok timezone applied to all admin timestamps and the booking calendar",
      "PromptPay QR uses the correct static point-of-initiation code when no amount is set",
      "Gallery-to-quote service slug mapping fixed",
      "QuoteBuilder blob URL leak fixed; photo rejection feedback added in both wizards",
      "Customer portal surfaces profile save errors and guards clipboard access",
      "html lang syncs with the language switch; robots disallows /login; metadataBase set",
      "Three duplicate service workers removed and generated sw.js gitignored",
      "AUDIT-PLAN.md and IMPROVEMENT-IDEAS.md created to track the rest"
    ]
  },
  {
    "date": "2026-07-12",
    "title": "Backend security audit plus form spam protection",
    "type": "fix",
    "summary": "Part B closed three real security holes: user input is now escaped before landing in staff notification emails (HTML injection), the auth callback no longer allows open redirects, and deactivated staff are rejected at the proxy layer under the new framework's new convention. Public forms gained honeypot fields and length caps, and a the database advisor review led to dropping the always-true public INSERT policies that let bots write straight past the API.",
    "hours": 1.5,
    "changes": [
      "User input escaped in notification emails for contact, quote and booking forms, blocking HTML injection into staff inboxes",
      "middleware.ts migrated to proxy.ts per the framework's new convention; deactivated staff rejected at the proxy layer",
      "Open redirect in /auth/callback fixed by allowing only same-origin relative paths",
      "Hidden honeypot field on contact, quote and booking forms; bot submissions silently dropped",
      "Per-field length limits reject oversized payloads before they hit the database or email",
      "database security and performance advisors run and findings recorded",
      "Always-true public INSERT RLS policies dropped on bookings, quotes and contact_messages so direct-to-the database API writes are blocked"
    ]
  },
  {
    "date": "2026-07-12",
    "title": "Email inbox port begins: schema, webhooks and data layer",
    "type": "feature",
    "summary": "Phases 1.1 to 1.3 of the email cutover: the complete inbox and CRM database schema was ported from the newnei-app Care system and rebranded for Evercool with EC- ticket references, the mail platform inbound and delivery-event webhooks were brought over with signature verification and attachment handling, and a trimmed 1,500-line data layer landed with a bilingual keyword auto-tagger tuned to Evercool topics. The old-host exit plan and a full port map were written down along the way.",
    "hours": 2,
    "changes": [
      "Migration 0001: full email/CRM schema with contacts, tags, support threads, messages, attachments, notes, folders, per-user staff prefs, delivery-event tracking and aggregates-only analytics",
      "RLS locked to service_role only; ticket reference prefix rebranded to EC-",
      "Port plan document with the full newnei-app Care map, phases, decisions and env vars",
      "/api/email/inbound: signature-verified inbound mail webhook fetching full bodies and attachments, with self-loop and foreign-domain filters and EC- reference threading",
      "/api/email/events: delivery, open, click, bounce and complaint webhook",
      "Mail helpers (real or mock sender), private-bucket attachment storage, and the Evercool inbox registry",
      "dependency alerts fixed: js-yaml, @babel/core, and a postcss override with build verified green",
      "Decision recorded: the old hosting account will be fully canceled; DNS must move off the old nameservers first",
      "the database repo: thread listing and counting with inbox-scope enforcement, inbound threading with sender-ownership checks, sent-reply recording, email event RPC, staff prefs, thread state management, tags and folders CRUD, outbound threads and drafts",
      "Keyword auto-tagger with Evercool topics (Quote, Booking, Service and repair, Installation, Warranty, Billing, Complaint) using English and Thai cues"
    ]
  },
  {
    "date": "2026-07-12",
    "title": "Shared inbox UI and Test Lab land in the admin portal",
    "type": "feature",
    "summary": "Phases 1.4 and 1.5: the full inbox interface was ported into the admin Email tab, about 7,400 lines across 46 components including four layout modes and a composer with drag-and-drop attachments, saved replies and reply-all. A Test Lab followed so the team could practice on roughly 19 simulated English and Thai customer emails without touching live mail, and the whole flow was click-tested end to end in the browser.",
    "hours": 1.5,
    "changes": [
      "Inbox page with Classic, Top dash, Board and Grid layouts plus session restore",
      "Server actions for send, compose, bulk reply, drafts, notes, canned responses, tags, folders, trash, claim/assign and direct-to-storage attachment uploads",
      "46 ported components including the Composer with drag-and-drop attachments, saved replies, signature and reply-all",
      "All incoming HTML sanitized before rendering",
      "Labels admin page and an Email entry in the admin nav",
      "newnei AI, WhatsApp, voice and help-center features deliberately dropped from the port",
      "Evercool profiles-based staff gate and section sub-nav; newnei color tokens aliased onto the Evercool palette",
      "7 classifier topic tags seeded in production (migration 0002)",
      "Test Lab at /admin/email/test: simulate customer emails with attachments and EC- threading, load about 19 EN and Thai practice emails, admin-only test-data cleanup",
      "Full end-to-end click-through verified: practice load, bilingual auto-labels, mock reply with EC- subject, auto-assign, inbound threading without duplicate tickets, trash and restore",
      "Dashboard tile renamed to Drafts waiting after the live test"
    ]
  },
  {
    "date": "2026-07-12",
    "title": "mail receiving live, dress rehearsal passed, DNS moved to the hosting platform",
    "type": "infra",
    "summary": "The evening the email system became real. inbound mail receiving and both webhooks went live and were proven end to end, the full old-host mailbox inventory (6 role plus 6 staff addresses) was registered for the cutover, and a dress rehearsal on a test subdomain passed with real email. server functions were moved to Singapore next to the database, shaving about 200ms per query, and by midnight the domain's DNS had moved to the new nameservers with staff accounts and the privacy wall live, leaving go-live as a single root MX flip.",
    "hours": 3,
    "changes": [
      "Decision recorded: reuse the shared mail platform team with filters preventing cross-domain copies",
      "inbound mail receiving live with both webhooks proven end to end",
      "Legacy hello@ and info@ addresses added to the inbox registry for the cutover",
      "Full old-host mailbox inventory registered: 6 role addresses and 6 staff addresses",
      "Phase 3 cutover checklist: mailbox exports and per-staff visibility decision",
      "Inbound filter accepts subdomain addresses for the test.evercoolthailand.com rehearsal",
      "Dress rehearsal passed with real email sent and received through the new stack",
      "server functions pinned to Singapore (sin1) beside the database, removing about 200ms of round trips per admin query",
      "Email inbox pinned to the light palette in dark mode, fixing pale-on-white text",
      "Composer confirmation reworded to Reply sent without naming the provider",
      "DNS for evercoolthailand.com moved to the new nameservers",
      "Staff accounts created and the privacy wall live ahead of go-live",
      "Em-dash audit of ported UI copy added to the backlog; Phase 4 full parity directive recorded"
    ]
  },
  {
    "date": "2026-07-12",
    "title": "EQ Tracker: cleared remaining dependency alerts and dependency audit findings",
    "type": "infra",
    "summary": "A dedicated security pass that resolved the outstanding dependency alerts and dependency audit findings in one commit, rewriting a large portion of the lockfile (about 3,300 lines changed) and pinning overrides in package.json. This left the EQ Tracker repo clean ahead of its planned consolidation into the evercoolthailand portal.",
    "hours": 0.75,
    "changes": [
      "Resolved all open dependency alerts",
      "Fixed dependency audit findings with package.json overrides (5 lines added)",
      "Regenerated package-lock.json (roughly 1,467 insertions and 1,874 deletions)"
    ]
  },
  {
    "date": "2026-07-12",
    "title": "Old-host exit decided and mailbox inventory taken, quota emergency caught",
    "type": "strategy",
    "summary": "Firm decision, stated twice: the old hosting account gets fully canceled, all email moves to the new mail platform with the app CRM as the mailbox UI. Safe sequence established: export mailbox contents, move DNS hosting off the old nameservers first (canceling the old host without that would take down the website and mail), then cancel. A complete control-panel mailbox inventory was taken (12 mailboxes confirmed, export sizes recorded, the largest at 4.2 GB). During the inventory a live problem was caught: the main public mailbox was over quota and actively bouncing customer mail; quota raises were advised immediately.",
    "hours": 2,
    "changes": [
      "Exit sequence defined: export mailboxes, move DNS, archive window, cancel the old host",
      "Complete 12-mailbox inventory with per-mailbox export sizes",
      "info@ over-quota bounce emergency flagged and quota fix advised",
      "Decision recorded that all 12 addresses continue receiving via the new CRM after cutover"
    ]
  },
  {
    "date": "2026-07-12",
    "title": "Cutover night: root MX flipped to the new mail platform and DNS hosting moved off the old host to the new DNS host",
    "type": "infra",
    "summary": "The decisive infrastructure night. At about 22:01 Thai time the root MX record was changed from the old mail server to the new inbound mail endpoint, fully verifying the root domain on the new mail platform and routing all company email into the new CRM. At about 23:15 the nameservers were changed at the registrar from the old host to the new DNS and the entire DNS zone was rebuilt on the hosting platform: site A record, mail MX, DKIM, SPF and DMARC, the test subdomain set, plus mail and webmail records pointing back to the old host so the old webmail archive stays reachable. A known gotcha was solved with a retry loop (the DNS API rejects adds for about 15 minutes after a nameserver change). DNS cache propagation delayed the first root inbound by a few hours, as predicted.",
    "hours": 4,
    "changes": [
      "Root MX edited to the new inbound endpoint (the new inbound mail endpoint)",
      "Nameservers moved at the registrar from the old host to the new DNS",
      "Full DNS zone recreated on the hosting platform: site A record, mail MX/DKIM/SPF/DMARC, test subdomain, mail and webmail records kept pointing at the old host for the archive",
      "All records verified live on the new nameservers the same night",
      "a DNS setup script with a retry loop written to handle the 15-minute zone-activation delay"
    ]
  },
  {
    "date": "2026-06-17",
    "title": "Dependency and security version bumps",
    "type": "infra",
    "summary": "Maintenance window between build pushes: automated dependency updates were reviewed and merged, moving the web framework to a patched version, bumping ws, and updating the mail platform's SDK to 6.12.4 which also dropped the now-unused uuid dependency.",
    "hours": 0.5,
    "changes": [
      "Web framework upgraded to a patched version",
      "ws upgraded 8.20.0 to 8.21.0",
      "email SDK upgraded 6.10.0 to 6.12.4 and the redundant uuid package removed"
    ]
  },
  {
    "date": "2026-06-17",
    "title": "EQ Tracker: dependency security bumps from the automated dependency scanner",
    "type": "infra",
    "summary": "Merged six automated dependency-security PRs to patch security advisories across the stack: the web framework plus six utility packages. Routine hygiene keeping the deployed app clear of known vulnerabilities.",
    "hours": 0.5,
    "changes": [
      "Web framework bumped to a patched version",
      "Bumped hono from 4.12.13 to 4.12.25",
      "Bumped qs from 6.15.1 to 6.15.2",
      "Bumped ws from 8.20.0 to 8.21.0",
      "Bumped ip-address and express-rate-limit together",
      "Bumped fast-uri from 3.1.0 to 3.1.2"
    ]
  },
  {
    "date": "2026-05-28",
    "title": "EQ Tracker: CSV project import with preview and dedupe",
    "type": "feature",
    "summary": "Admins can now bulk-load the projects pipeline from a CSV file. The import flow parses the file, shows a preview dialog before anything is written, and dedupes against existing projects. Also opened up the Service & Maintenance + New buttons to all users instead of admins only.",
    "hours": 1.5,
    "changes": [
      "CSV import for projects, admin only, with a 384-line import dialog",
      "370-line CSV parsing and mapping library (lib/csv-import.ts)",
      "Preview step showing exactly what will be imported before committing",
      "Dedupe against existing projects so re-imports do not create duplicates",
      "EN and TH translations for the import flow",
      "Service & Maintenance + New buttons made visible to all users, not just admins"
    ]
  },
  {
    "date": "2026-04-28",
    "title": "Service & Maintenance section added to EQ Tracker, plus mobile table fixes",
    "type": "feature",
    "summary": "EQ Tracker grew a second module: a Service & Maintenance section with due-date tracking for customer equipment, built as a 635-line client in one sitting. The rest of the morning went to making data tables behave on phones: lower sidebar breakpoint, forced horizontal scroll with min-widths, an always-visible scrollbar, and edge fades so users know a table scrolls.",
    "hours": 1.5,
    "changes": [
      "New Service & Maintenance section with its own page, sidebar entry, and due-date tracking",
      "Service client component (635 lines) with equipment list and service scheduling",
      "New Service & Maintenance types and full EN plus TH translations",
      "Sidebar breakpoint lowered from 1024px to 768px so tablets get the full sidebar",
      "Min-width on the service table so columns scroll horizontally instead of squishing",
      "Min-width on the equipment table for the same horizontal scroll behavior",
      "min-w-0 on the main flex child to stop horizontal overflow blowing out the page",
      "Explicit overflow-x-hidden on main as a second guard against table blowout",
      "Always-visible horizontal scrollbar plus edge fade on data tables so scrollability is obvious"
    ]
  },
  {
    "date": "2026-04-28",
    "title": "Service & Maintenance grown into a full tool: visits, calendar, inventory, reports",
    "type": "feature",
    "summary": "Same day, second session: the Service & Maintenance section was rebuilt into a full standalone tool. A 2,300-line expansion added equipment CRUD with a slide-over editor, service visit records, a calendar view, a filter inventory view, and printable reports, all bilingual. Follow-up polish covered mobile chrome (hamburger safe area, tab grid), a professional report design, making the monthly report viewable instead of auto-printing, and stronger location grouping with visible edit cues.",
    "hours": 2,
    "changes": [
      "Service & Maintenance rebuilt as a full responsive tool (2,356 lines added across 12 files)",
      "Equipment CRUD with a dedicated equipment slide-over editor",
      "Service visit records with a 532-line record slide-over form",
      "Calendar view of upcoming and past service visits",
      "Filter inventory view for tracking filter stock",
      "Report generation wired into the shared export library",
      "New service helpers module and expanded types",
      "Full EN and TH translations for the whole module",
      "Mobile chrome polish: hamburger safe-area handling and a tab grid layout",
      "Professional report design in the export library (322 lines reworked)",
      "Monthly report now opens as a viewable page instead of auto-triggering the print dialog",
      "Stronger location grouping in equipment and inventory views with visible edit cues"
    ]
  },
  {
    "date": "2026-04-17",
    "title": "EQ Tracker: follow-up tracking, win rate chart, Thai translations, and Thai-safe exports",
    "type": "feature",
    "summary": "Added follow-up date tracking and quick status changes to the projects table, plus a win rate by quarter chart on the dashboard. Translated all the new features into Thai. Reworked exports: replaced the Excel export with CSV including Quotation Sent and Follow Up columns, and swapped the PDF library for a browser print window so Thai text renders correctly in PDF exports.",
    "hours": 2.5,
    "changes": [
      "Follow-up date column added to the projects table",
      "Quick status change directly from the table row",
      "Win rate by quarter chart added to the dashboard",
      "Fixed a TypeScript error on the chart tooltip formatter",
      "Thai translations added for every new component and feature (EN and TH message files)",
      "Export dropdown changed to click-toggle and duplicate + removed from the New Project button",
      "Excel export replaced with CSV export, with Quotation Sent and Follow Up columns added",
      "The PDF library replaced with a browser print window so PDF exports render Thai characters correctly",
      "Removed the project.number display from the projects table"
    ]
  },
  {
    "date": "2026-04-16",
    "title": "Staff-to-admin help messaging inside the portal",
    "type": "feature",
    "summary": "Staff got a floating help button anywhere in the portal that sends a message straight to an inbox on the admin dashboard, giving the team an internal channel before the full CRM existed. A duplicated components image folder was also cleaned up.",
    "hours": 1,
    "changes": [
      "Floating help button for staff to message the admin from anywhere in the portal",
      "Staff message inbox surfaced on the admin dashboard",
      "Duplicate public/images/components folder removed and files restored to the correct location"
    ]
  },
  {
    "date": "2026-04-16",
    "title": "EQ Tracker: roles, in-app messaging, and faster pipeline actions",
    "type": "feature",
    "summary": "Second day of building made EQ Tracker a multi-user tool. Added role-based UX so admins and staff see different controls, an in-app messaging system with an admin inbox, and a Needs Attention panel on the dashboard. Also sped up daily pipeline work with one-click stage advance, bulk status updates, a quarter summary, and a per-project stage timeline.",
    "hours": 3,
    "changes": [
      "Role-based UX so admin and regular users get different controls",
      "In-app messaging system: message bubbles for users, message inbox for admins",
      "Needs Attention panel on the dashboard highlighting stalled projects",
      "KPI cards and dashboard client reworked to respect roles and new data",
      "User manager expanded in the admin panel",
      "Quick stage-advance button to move a project to the next pipeline stage in one click",
      "Bulk status update across selected projects",
      "Quarter summary view of the pipeline",
      "Stage timeline shown inside the project slide-over",
      "Fixed an invalid ringColor inline style by switching to boxShadow for the ring effect"
    ]
  },
  {
    "date": "2026-04-15",
    "title": "EQ Tracker app built from scratch in one afternoon",
    "type": "feature",
    "summary": "Scaffolded a new app and built the complete first version of EQ Tracker, an equipment quotation pipeline tracker for Evercool Thailand. Day one delivered login, a KPI dashboard with charts, a projects pipeline with slide-over detail view, and an admin panel for stages, quarters, and users, all backed by the new database. Same-day fixes covered a login prerender error and a full mobile layout pass.",
    "hours": 3.5,
    "changes": [
      "Scaffolded the app project from the framework starter",
      "Built the full first version of EQ Tracker in a single 4,400-line commit across 43 files",
      "Login page with the auth serviceentication",
      "Dashboard with KPI cards, charts, filters, and a recent activity feed",
      "Projects pipeline page with table, project form, slide-over detail panel, and status badges",
      "Admin panel with stage manager, quarter manager, and user manager",
      "Sidebar navigation layout for the whole app",
      "database schema plus seed data migration",
      "UI component library set added (dialog, popover, calendar, command, input group, toasts)",
      "Fixed a prerender error on the login page with force-dynamic",
      "Added user creation to the admin panel via a new admin users API route",
      "Mobile layout fix: stacked dashboard cards, reworked the filter bar, cleared the hamburger menu overlap"
    ]
  },
  {
    "date": "2026-04-14",
    "title": "Role-based dashboards and staff user management",
    "type": "feature",
    "summary": "The admin area became a real multi-role portal. The profiles table gained sales and owner roles plus department, active-status and last-login columns; the nav and dashboard now adapt per role (admin, owner, manager, sales, technician); and a Users console lets admins create, edit and deactivate staff. Login moved to /login after fixing a redirect loop, and admins got a role preview switcher.",
    "hours": 2,
    "changes": [
      "profiles table extended with sales and owner roles plus department, is_active and last_login columns",
      "AdminLayout fetches the role and redirects inactive accounts",
      "AdminNav filters links by role with a color-coded role badge",
      "Role-specific dashboard views for admin, owner, manager, sales and technician",
      "/admin/users console: create users, assign roles, edit, deactivate and reactivate",
      "/api/admin/users GET/POST/PATCH/DELETE, admin only",
      "Stub pages for team, reports and jobs",
      "Login redirect loop fixed and login relocated to /login",
      "Admin role preview switcher on the dashboard"
    ]
  },
  {
    "date": "2026-04-14",
    "title": "PWA icons and favicon brought onto Evercool branding",
    "type": "content",
    "summary": "The installable app finally looked like Evercool. An SVG favicon and PWA icon were created from the brand mark, then iterated through several rounds of padding and sizing until the home-screen icon sat correctly.",
    "hours": 1.5,
    "changes": [
      "SVG favicon and PWA icon generated from the EverCool brand SVG",
      "PWA icon set replaced with new EverCool branding",
      "Icon padding corrected so the EC logo sits properly in the icon frame",
      "Three further icon refinement rounds to get the installed-app look right"
    ]
  },
  {
    "date": "2026-04-13",
    "title": "Product photo corrections across the catalog",
    "type": "content",
    "summary": "Eleven product image assignments were corrected or upgraded so every product shows its own proper photo: dedicated shots for the Pre-Cooling, Hygienic and VRF AHUs, a clean product photo replacing a factory test shot for the Dual System Heat Recovery Unit, and new transparent PNGs for four more products.",
    "hours": 1,
    "changes": [
      "Pre-Cooling AHU, Hygienic AHU and VRF AHU given their correct dedicated photos",
      "Dual System Heat Recovery swapped from a factory test shot to a clean product photo",
      "Packaged Condensing, EC Fan Coil and TFF Fresh Air images upgraded",
      "Acoustic EC Fan Cube, Variable Refrigerant Flow AHU, Dual System Heat Recovery Unit and Cabinet Fresh Air System X-Series updated to new transparent PNGs"
    ]
  },
  {
    "date": "2026-04-13",
    "title": "Brand and content asset library assembled from the parent company",
    "type": "data",
    "summary": "Collected and organized the EverCool Thailand Files asset library in the repo's reference/ folder: official logos (EverCool, TECHFREE), the EverCool 2023 catalogue PDF, TECH FREE job references 2016 to 2023, EN1886/EN13053 and hygienic AHU standards PDFs, VDI 6022 certificates for five Thai team members, the company video, a company details spreadsheet, and photo sets (FAT tests, workshop and production line, lab, exhibitions, activities and visits, products). This library feeds the new app's About, Products, and Gallery content.",
    "hours": 3,
    "changes": [
      "Logos and brand files gathered (EverCool logo PNG, TF logo.ai, PSD source, color card)",
      "Certification documents collected (VDI 6022 x5, EN standards PDFs, catalogue)",
      "Photo library organized: FAT, workshop and production, lab, exhibition, activities, product photos",
      "Company video and details spreadsheet added"
    ]
  },
  {
    "date": "2026-04-12",
    "title": "About and Solutions page overhaul with image surgery",
    "type": "feature",
    "summary": "Both flagship marketing pages were rebuilt: a new AboutDashboard with founders hero, team and events sections, photo mosaic and DNA bento, and a new SolutionsDashboard with product hero and an 8-component AHU grid. Services became Solutions in the nav. Half the session was image forensics, including re-extracting a truncated 576KB AHU component diagram from the old site's HTML so it stopped rendering with a grey void.",
    "hours": 2.5,
    "changes": [
      "New AboutDashboard: founders hero, team zigzag, events zigzag, photo mosaic, DNA bento, certifications row",
      "New SolutionsDashboard: product hero, 8-component grid, AHU images and application chips from the old Solutions site",
      "Services renamed to Solutions across TopBar, BottomNav and translations",
      "GrayscaleOnScroll component for a mobile scroll-to-color photo reveal",
      "20+ activity, certification and team photos added",
      "force-dynamic added to gallery and learn pages; sitemap try/catch fix",
      "Performance lab and factory floor photos added to the Fans and Frame tabs",
      "Product hero image corrected to a clean unit shot on white",
      "Annotated 3D AHU component diagram restored to match the original page",
      "Truncated diagram JPEG re-extracted in full (576KB, proper end-of-image marker) fixing the grey void",
      "Diagram capped at a sane width and centered; mobile section spacing tightened",
      "Tab overflow fixed on mobile; StepBar rebuilt as a single continuous progress bar"
    ]
  },
  {
    "date": "2026-04-12",
    "title": "Thai/English switcher actually wired across the whole site",
    "type": "feature",
    "summary": "The language switcher looked like it worked but every component held its own private language state, so flipping it changed almost nothing. A shared LanguageProvider context fixed that, then over 100 new EN and TH translation key pairs were wired through the nav, homepage, Solutions, About and Products pages. Stale Koh Tao area references and a JobThai link were also removed to reposition as Thailand-wide.",
    "hours": 1.5,
    "changes": [
      "LanguageProvider React context so all components share one language state; public layout wrapped",
      "useLanguage hook re-exported from the provider so no component imports changed",
      "50 new EN and TH translation keys wired through TopBar, SolutionsDashboard, AboutDashboard, ProductDashboard and homepage CTAs",
      "55 more EN and TH key pairs covering the hero, trust banner, core solution cards, Why Evercool bento, certifications strip and TECH FREE teaser",
      "Logo filter fixed for clean visibility on the dark navy header",
      "Areas card (Koh Tao/Surat) removed from Contact; meta description now says all of Thailand",
      "JobThai recruitment link removed from the footer; area chips replaced with Thailand"
    ]
  },
  {
    "date": "2026-04-12",
    "title": "Branded email notifications for contact and quote forms",
    "type": "feature",
    "summary": "Form notifications stopped looking like raw dumps. Contact form and quote submissions now arrive at hello@evercoolthailand.com as branded navy and teal HTML emails with structured detail cards, clickable photo links for quotes, Call Back and Reply by Email buttons, and Bangkok-timezone timestamps.",
    "hours": 1,
    "changes": [
      "Contact form notifications rerouted to hello@evercoolthailand.com",
      "Branded navy/teal HTML template for contact notifications with sender details card and message block",
      "Call Back and Reply by Email CTAs plus Bangkok timezone timestamps",
      "Matching branded quote email: property/service/tier/concerns summary, clickable photo buttons linking to cloud storage, notes block, quote ID in footer",
      "Contact success message softened from '24 hours' to 'soon'",
      "About headline and header logo presentation copy fixes"
    ]
  },
  {
    "date": "2026-04-12",
    "title": "Products page completed: full TECH FREE lineup",
    "type": "content",
    "summary": "The product catalog reached full coverage. Six more products were added (Mini AHU, Dual System Heat Recovery, Heat Exchange Coils, Pre-Cooling AHU, Acoustic EC Fan Cube, Cabinet Fresh Air X-Series), a new Components category was created, the page got a proper Industrial-Grade hero with a quote CTA, and product photos were swapped to clean transparent PNG versions.",
    "hours": 1.5,
    "changes": [
      "Mini AHU, Dual System Heat Recovery and Heat Exchange Coils added to the catalog",
      "New Components category with gear icon; EC Fan Coil moved into it",
      "Products page header replaced with an Industrial-Grade hero and Get a Quote CTA; duplicate bottom list and filter tabs removed",
      "Pre-Cooling AHU, Acoustic EC Fan Cube and Cabinet Fresh Air X-Series added with specs, certs and images extracted from the reference HTML",
      "Four product images swapped to transparent PNG versions",
      "Mini AHU and Heat Pipe image assignments corrected",
      "Stale image reference fixed in SolutionsDashboard"
    ]
  },
  {
    "date": "2026-04-12",
    "title": "New stack provisioned: database, hosting and mail platforms domain verification",
    "type": "infra",
    "summary": "Platform setup outside the codebase for the new app era. The database project was created as the production database (later shared with EQ Tracker). The hosting project was set up for continuous deploys. evercoolthailand.com was verified on the new mail platform on 2026-04-12 with sending enabled, powering booking, quote and contact notification emails from day one. Exact per-service setup dates are approximate around the app's first build days; the mail platform verification date is confirmed from the email platform's API.",
    "hours": 4,
    "changes": [
      "database project provisioned (auth, tables, RLS, storage)",
      "hosting project created and wired to the code repo for continuous deploys",
      "evercoolthailand.com domain verified on the new mail platform, sending enabled (SPF and DKIM records added at the old host's DNS)",
      "Environment variables (the database keys, email platform's API key) configured in the hosting platform"
    ]
  },
  {
    "date": "2026-04-11",
    "title": "Content seeding, visual overhaul and responsive layout",
    "type": "content",
    "summary": "A late-night polish run followed by a midday fix. Five real Learning Hub articles were seeded, every em dash was stripped from customer-visible copy, emoji icons were replaced with professional SVG icons, the hero was redesigned, and the site got its foundational responsive desktop layout with the real Evercool logo in the header.",
    "hours": 2,
    "changes": [
      "Admin services form aligned with real database column names; consultation category added to the DB constraint",
      "5 Learning Hub articles seeded: AC service frequency, IAQ explainer, AC sizing, HEPA filters, maintenance checklist",
      "All em dashes removed from customer-visible strings across components, translations and the OG image",
      "Office address added to the contact page and footer",
      "All emoji icons replaced with SVG icons in colored rounded containers across homepage sections",
      "Hero redesigned: larger headline, decorative rings, better buttons; near-duplicate badge and subtitle copy fixed",
      "Why Evercool Thailand credential section added",
      "Article admin form and API fixed to match DB columns, including slug auto-generation",
      "Real Evercool logo replacing the EC circle placeholder",
      "Responsive foundation: desktop TopBar nav with phone and Get Quote CTA, BottomNav hidden on desktop, wider max-widths, 3-column services grid, responsive hero",
      "Services page ICON_MAP so database icon names render proper SVG icons"
    ]
  },
  {
    "date": "2026-04-11",
    "title": "Real company content: About page, real references, Products page",
    "type": "content",
    "summary": "The placeholder content era ended. A full About page with the 1998 to 2023 company history, real certifications and notable projects went live, all 8 invented testimonials were deleted and replaced with real project references (Londoner Hotel UK, Theme Park Macau), and a Products page launched with 12 real TECH FREE products and catalog photos. The landing page gained new hero, trust banner, core category and bento sections plus an upgraded footer.",
    "hours": 3,
    "changes": [
      "/about page with company history 1998 to 2023, certifications (ISO 9001, EN1886, AHRI, VDI 6022, BS476), notable projects and factory details",
      "Homepage Why Choose Us replaced with real credentials: international certs, 20-year history, 250k sqft factory, Broan distributor, VDI 6022 technicians",
      "Certifications strip added to the homepage",
      "Null service descriptions filled in via the database (Air Purifier, Custom AHU, Broan Distribution, IAQ Consultation)",
      "Reference HTML folder removed from the repo and gitignored",
      "All 8 invented testimonials removed; real ProjectReferences component added with sectors served and global markets",
      "/products page with 12 TECH FREE product listings and real catalog photos, added to desktop and mobile nav",
      "TECH FREE products teaser section on the homepage with 4 category cards",
      "Desktop hero gained a two-column layout with a Modular AHU product photo and ISO 9001 badge",
      "New landing sections: photo-background hero, trust banner (Hospitals, Pharmaceutical Plants, Hotels, Data Centres), 3-column core categories, Why Choose Us bento",
      "Footer upgraded to a 4-column desktop layout with a Products column",
      "Header logo iterations to show true brand colors"
    ]
  },
  {
    "date": "2026-04-10",
    "title": "New Evercool website born: scaffold plus Phases 1 to 3",
    "type": "feature",
    "summary": "The new Evercool Thailand site went from empty repo to a working product in one afternoon. Project scaffolded on a modern web framework, wired to the new backend and mail service, then three build phases shipped: the homepage and Quote Builder with PWA and dark mode, the Services and Contact pages with a working contact API, and a full booking wizard plus gallery, testimonials and a Learning Hub with calculators.",
    "hours": 4.5,
    "changes": [
      "New app project scaffolded and pushed",
      "Base setup: database client, mail helper, project folder structure",
      "Homepage with hero, services grid and IAQ section",
      "Quote Builder wizard with photo upload, backed by the new database",
      "PWA foundation (manifest, service worker), dark mode, TH/EN i18n groundwork",
      "Services page server-fetched from the database with category filter pills and expandable cards",
      "Contact page: click-to-call, WhatsApp link, office hours, contact form",
      "/api/contact route inserting to contact_messages plus email notification",
      "SEO helpers: serviceJsonLd, breadcrumbJsonLd, faqJsonLd",
      "database migration 002: products table with 9 seeded items, contact_messages with RLS",
      "BookingWizard: 5-step flow (service, date/time with inline calendar, location, photos, confirm)",
      "/api/bookings route writing to the bookings table plus the mail platform notification",
      "TestimonialsCarousel with 5-second auto-advance and swipe support",
      "GalleryGrid with category filters and before/after toggle, 8 seeded projects",
      "Learning Hub: AC sizing calculator (BTU with sunlight and ceiling adjustments), energy cost calculator, filterable article list, individual article pages",
      "database migration 003: bookings, gallery_items, testimonials, articles tables with RLS"
    ]
  },
  {
    "date": "2026-04-10",
    "title": "Phases 4 to 6: customer accounts, payments, push, admin CMS",
    "type": "feature",
    "summary": "The same evening the site gained its account layer and back office. Customers got magic-link login, a portal with quotes and booking history, PromptPay QR payment, push notification opt-in and loyalty/referral features. Staff got an admin dashboard with a full CMS for services, gallery and articles, plus footer, PDPA consent, 404, sitemap and OpenGraph images, with four quick build fixes to get it deploying clean on the hosting platform.",
    "hours": 3,
    "changes": [
      "Magic link customer auth with /auth/callback exchange route",
      "Customer portal: profile management, quotes and bookings history",
      "Admin dashboard for quotes, bookings and messages with inline status updates",
      "Middleware protecting all /admin routes; admin login/logout verified against the profiles table",
      "PromptPay QR payment sheet generating an EMV payload after booking success",
      "Push notification opt-in (VAPID) with subscribe/unsubscribe API routes",
      "analytics and ad-pixel hooks, lazy-loaded and env-var activated",
      "Loyalty points display and referral code card; push_subscriptions, loyalty_points, referrals tables (migration 005) with auto-generated referral codes",
      "Admin CMS: Services CRUD, Gallery CRUD with cloud storage uploads, Articles CRUD with publish toggle, Customers read view",
      "Public footer, PDPA/cookie consent banner (EN and TH), custom 404 page",
      "sitemap.ts, robots.ts, OpenGraph image via next/og",
      "Build fix: VAPID setup moved inside the request handler so cloud builds without keys",
      "Three OG image fixes: bundle size, nodejs runtime, next/og JSX constraints"
    ]
  },
  {
    "date": "2026-04-10",
    "title": "Old-site audit and full product brief for the replacement app",
    "type": "strategy",
    "summary": "Pre-code planning captured in evercoolthailandbuild.rtf: a structured review of the live evercoolthailand.com (strengths: clear services, certifications, case studies; gaps: no mobile-first PWA, no online booking or instant quotes, no visual galleries, no customer portal, no bilingual polish, no SEO content, no payments), followed by a complete build specification for the 2026 replacement: PWA, EN/TH i18n, quote builder, booking wizard, customer portal, learning hub, gallery, PromptPay, push notifications, admin dashboard. This brief drove the app whose first commit landed the same day.",
    "hours": 5,
    "changes": [
      "Competitive and gap analysis of the existing old site against 2026 HVAC app expectations",
      "Full feature specification written (screens, features, tech and UX requirements, Thailand-specific UX)",
      "Old-site page snapshots saved to reference/ so existing content and branding could be carried over"
    ]
  },
  {
    "date": "2023-08-01",
    "title": "Original Evercool Thailand website built on a page-builder CMS (the old host)",
    "type": "content",
    "summary": "The original evercoolthailand.com, built with a page-builder CMS and hosted with the old provider, long before any app existed. Pages included Home, About Us, Products, and Solutions plus a contact form. Content covered AC installation, repair, maintenance, air purifiers, custom AHU solutions, Broan distribution, ISO/AHRI certifications, and case studies (Londoner Hotel, Macau Theme Park). Date is approximate: the newest media in the saved pages is from August 2023, so the site was live by then; the actual build spans earlier months.",
    "hours": 60,
    "changes": [
      "Page-builder CMS site designed and populated: Home, About Us, Products, Solutions pages",
      "Bilingual presence (English pages plus Thai homepage title)",
      "Service listings, certifications, case studies, contact form wired to company mail",
      "Media library uploaded (photos, video) through at least August 2023",
      "Five full-page HTML snapshots of this site preserved in the repo at reference/ (captured April 2026) as the content source for the new app"
    ]
  },
  {
    "date": "2023-08-01",
    "title": "Old-host administration: 12 company mailboxes, DNS zone, webmail (ongoing 2023 to 2026)",
    "type": "infra",
    "summary": "Ongoing management of the company's hosting on the old host from the old-site era until the 2026 cutover; date approximate (start of the documented era). The DNS zone for evercoolthailand.com lived on the old nameservers with mail at mail.evercoolthailand.com. Twelve mailboxes were provisioned and maintained in the hosting control panel: six role addresses (admin@, hello@, info@, office@, sales@, support@) and six staff addresses, with webmail for everyone. Mailbox sizes grew to 4.2 GB at the largest.",
    "hours": 40,
    "changes": [
      "12 @evercoolthailand.com mailboxes created and administered in the old host's control panel",
      "DNS zone managed at the old host's nameservers (site records, MX, mail subdomains)",
      "Staff phone and desktop mail clients supported against the old host's IMAP",
      "Quota monitoring that later (2026-07-12) caught two mailboxes over quota, one actively bouncing customer mail (raised the same day)"
    ]
  }
];

export type BuildTodo = {
  group: "accounting" | "queue";
  title: string;
  detail: string;
};

export const BUILD_TODO: BuildTodo[] = [
  {
    group: "accounting",
    title: "Real work / time / token recording",
    detail:
      "Instrument every session so hours and tokens are measured, not estimated. WORK-LOG.md started 2026-07-15; the automatic recording build is queued as the next task.",
  },
  {
    group: "accounting",
    title: "Backfill verification",
    detail:
      "The pre-app entries (original websites, the old host years) carry approximate dates. Anchor them against invoices, emails and hosting records where possible.",
  },
  {
    group: "queue",
    title: "Old-host exit",
    detail:
      "Export all mailboxes and move DNS hosting off the old nameservers FIRST, then cancel the old host fully. Decided twice; all-in on the new mail platform.",
  },
  {
    group: "queue",
    title: "EQ Tracker app retirement",
    detail:
      "Projects, Service and Reports already live in this portal on the same tables; retire the separate EQ Tracker deployment once nothing is missed.",
  },
  {
    group: "queue",
    title: "RLS hardening",
    detail: "Tighten row level security across the shared database now that three apps became one portal.",
  },
  {
    group: "queue",
    title: "Trash purge cron",
    detail: "Scheduled cleanup of trashed CRM conversations.",
  },
  {
    group: "queue",
    title: "Aide port",
    detail: "Port the Aide helper into the portal.",
  },
];
