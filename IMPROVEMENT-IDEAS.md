# Evercool Thailand — Improvement Ideas (compiled during audit)

Ideas only — nothing here is built yet. Compiled during the Part A frontend audit (2026-07-12).
Bugs found during the audit were FIXED already and are listed in the Part A summary, not here.

## Planned features (from Rick)

- **Per-staff email section (Plan C in AUDIT-PLAN.md)**: each staff user sees only their own @evercoolthailand.com inbox after login; check + send via Resend. Copy the CARE strategy from newnei-app, adjusted for per-staff privacy. Grab the mailbox list from hosting first.

## Frontend / visual

- **Finish Thai coverage (biggest content gap)**: whole pages are English-only even in Thai mode — About, Products hero, Contact labels, Learn headings ("Learning Hub", "Calculators"), Project References, Solutions FAQ/prose, gallery/service category badges, QuoteBuilder review values ("Residential", "Ac Installation"), "Step 1 of 5" in wizards, "Per year" in the energy calc. The translation table itself is complete (337/337 keys) — these strings just never got keys. Needs your Thai copy for the long prose.
- **Serve Thai to search engines**: today the language switch is client-side only, so Google only ever sees English. Consider cookie/route-based server i18n (e.g. /th/...) with hreflang alternates.
- **About page**: use the photo library already sitting in `public/images/team/` and `public/images/activities/` — the page is text-only while great photos go unused.
- **Product photos**: 2 of 18 products have no image; several would sell better with real photography from `public/images/products/`.
- **Product deep links**: home/footer link to `/products#ahu`, `#heat`, `#outdoor`, `#components`, `#ventilation` but the products page has no matching section ids — add ids so the links actually scroll (currently they just land at the top).
- **Hero performance**: the home hero is a CSS `background-image` — switch to `next/image` with `priority` for better LCP.
- **Footer micro-text**: `text-[9px] text-white/30` copy is below WCAG contrast for small text — bump size/contrast.
- **Gallery**: add a drag/slider before–after comparison (data model already has both URLs), category filter chips, and a lightbox.
- **Learn articles**: content renders as plain paragraphs only — support headings/lists/images (MDX or a richer renderer), add related articles and reading progress.
- **Dark/light theme**: theme toggle exists; audit light mode for the same polish as dark (dark is clearly the primary design).

## UX / experience

- **Mobile conversion gap**: "Get Quote" lives only in the desktop TopBar; the mobile BottomNav has no Quote/Contact CTA. Consider a center FAB-style Quote button in the bottom nav (order today: Home, Services, About, Account, Products).
- **Cookie policy page**: the consent banner links "cookie policy" to /contact — write a real privacy/cookie page (also a PDPA compliance point for Thailand).
- **Prompt fatigue**: first visit can stack cookie banner + iOS install prompt + push opt-in. Sequence them (e.g. install prompt only on 2nd visit).
- **ContactForm**: after success there's no way to send a second message without reloading — add "Send another".
- **AccountAuth**: add "resend magic link" with cooldown and a "wrong email? edit" affordance on the sent screen.
- **BookingWizard**: add an "Add to calendar (.ics)" button on the success screen; show which time slots are actually taken (today all 8 always show); localize the review labels (Service/Date/Time/Area).
- **ACSizingCalculator**: the 600 BTU/m² base is low for Thailand (common rule of thumb is 700–800) — risks undersizing advice. Add room-type presets and a "book a site survey" CTA under the result.
- **EnergyCostCalculator**: add BTU-class presets that auto-fill kW, an inverter-vs-fixed savings comparison, and a note that it's an upper-bound estimate.
- **Calculator → quote handoff**: "Get a quote for this size" button that deep-links `/quote?service=ac-installation&areaSqm=…`.
- **Language dropdown a11y**: no Escape-to-close, missing `aria-expanded`/`aria-haspopup`.
- **Login page**: add show/hide password, "Forgot password?", and honor a `?next=` return path (currently always lands on /admin/dashboard).

## Admin (UI ideas — backend items go to Part B)

- **Filters/search/tabs on Quotes, Bookings, Messages, Customers** — staff will want "only New" and name/phone search once volume grows. Add status-colored card borders for at-a-glance triage.
- **Pagination** on all admin lists (currently unbounded — fetches every row forever).
- **Unread badges** on Quotes/Messages nav items (counts already computed on dashboard).
- **Quotes cards**: add tap-to-call / WhatsApp quick actions (Messages already has them).
- **Bookings**: default sort puts past bookings first — default to "today & upcoming" view.
- **Gallery admin**: show the after image too (only "before" previews today), add edit/reorder, side-by-side preview, upload progress.
- **Articles admin**: draft/publish filter, preview button, autosave, richer editor.
- **Users admin**: surface `last_login` (already in the type, never displayed), add search, "reset password" action.
- **Customers**: booking counts match on exact email string (case-sensitive, ignores phone-only bookings) — match smarter and add a "top customers" sort.
- **Build out the three stubs**:
  - **Jobs** → scheduling/dispatch board: convert confirmed bookings into jobs, drag-assign technicians, day columns.
  - **Team** → operational view (availability, workload) as distinct from Users (access control).
  - **Reports** → conversion rate (quote→accepted), revenue by service/area, technician throughput, lead source via referral codes.
- **Audit log**: who changed a status / deleted a record.

## New feature ideas (from playtesting)

1. **LINE Official Account integration** — LINE beats WhatsApp for Thai customers; add LINE contact + notify. Also consider LINE Notify for staff alerts on new quotes.
2. **Live service tracking** — customer-facing status timeline (Booked → Assigned → En route → On site → Done) with push notifications (PushOptIn is already built).
3. **Registered units + maintenance reminders** — customers register their AC units (brand, BTU, install date) and get seasonal cleaning reminders; drives recurring maintenance revenue and pairs with the reports page.
4. **Real-time PM2.5/AQI widget** for Thai cities on the home/learn pages — converts air-quality anxiety into purifier/IAQ leads.
5. **Deposit payments via PromptPay** — the QR sheet exists but no amount is passed; wire a per-service deposit, "mark paid" flow, and award loyalty points.
6. **Quote → Booking conversion** — one-tap "Book this service" from an accepted quote in the customer portal, pre-filling the wizard.
7. **Financing/installment calculator** on product/quote pages (common purchase pattern in Thailand).
8. **Warranty & document vault** in the customer portal — invoices, warranty cards, service reports per unit.
9. **Referral program completion** — referral codes/links exist; capture `?ref=` on quote/booking submit and credit the referrer, show reward status in the portal.
10. **Photo-based instant estimate** — user uploads a room/unit photo + dimensions, gets a ballpark from the sizing calculator plus a "book a survey" CTA.
11. **Energy-savings report PDF** — extend the energy calculator into a shareable before/after savings report (sales tool for the EC-fan story).
12. **Spam hardening** — honeypot + rate limiting on the three public POST endpoints (contact/quotes/bookings). (Also flagged for Part B.)

## Part B carry-over notes (backend audit, next session)

- `.env.local` has empty `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `RESEND_API_KEY` — local dev can't reach the DB. Run `vercel env pull` to fix local parity; verify the values exist on Vercel prod.
- `tel:` links in quote/contact notification emails build `tel:+0955…` from local-format numbers (invalid) — normalize to +66.
- QuoteBuilder submits `preferredLang` captured at mount (stale if user switches language mid-flow).
- Verify gallery storage bucket is public (admin code comment says "signed URLs" but uses `getPublicUrl`).
- No rate limiting / abuse protection on public POST routes.
- Middleware file convention is deprecated in Next 16 — migrate `middleware.ts` to `proxy.ts` (build warns).
- Serwist logs "disabled" in dev — confirm the service worker + push actually register in production.

## Part B — Backend audit findings (2026-07-12)

### Fixed this session (bugs)
- **HTML injection in notification emails** — public form fields (name/phone/email/subject/message/notes/property/service) were interpolated raw into the Resend HTML for contact/quote/booking notifications. A form submitter could inject arbitrary markup/links (phishing) into staff inboxes. Added `escapeHtml()` in `lib/email/send.ts` and escaped every interpolated value in the three routes; `mailto:` now uses `encodeURIComponent`.
- **`middleware.ts` → `proxy.ts`** — migrated to the Next 16 file convention (function renamed `middleware`→`proxy`). Build now labels it "ƒ Proxy (Middleware)". Also added the missing `is_active` check so a deactivated staff account is rejected at the proxy layer (previously only the admin layout caught it).
- **Open redirect in `/auth/callback`** — the `next` query param was concatenated as `${origin}${next}`, so `next=@evil.com` → `https://evercoolthailand.com@evil.com` (navigates to evil.com). Now only same-origin relative paths (`/…`, not `//…`) are honored; anything else falls back to `/account`.

### Hardening backlog (not yet done — needs decisions / infra)
- **IP rate limiting** on the 3 public POST routes (contact/quotes/bookings) and `/api/admin/login` (brute-force). Honeypot + length caps are now in place (see `lib/spam.ts`), but true per-IP throttling needs a shared store — provision Upstash Redis (Vercel Marketplace) then add `@upstash/ratelimit`. (Also item #12 above.)
- **Email / phone format validation** on public submissions — length caps are done; format checks (valid email, Thai phone shape) are not.
- **Mass-assignment** in admin content routes — `articles`, `services`, `gallery` POST/PATCH spread the raw request `body` into insert/update. Staff-only so low risk, but a column allowlist (or zod schema) would prevent setting unexpected columns (`id`, timestamps, etc.).
- **Web-push is entirely non-functional** — no VAPID keys set (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`), so `PushOptIn` silently no-ops and `/api/push/send` returns 503. `/api/push/send` is also **dead code** (no caller anywhere) and gated on `ADMIN_API_KEY`, which isn't set either. Decide: wire it up (generate VAPID keys, call it from booking/quote status changes) or remove it.
- **Service-role key used on public SSR pages** — `services`, `gallery`, `learn`, `sitemap` server components use `createAdminClient()` (bypasses RLS) to read data that anon can already read. Switch these to the anon server client so RLS stays in force; keep service-role for admin/mutations only.
- **Authorization granularity** — the `[id]` status routes (bookings/quotes/messages) and content routes treat any profile as authorized (`!!profile`); only `users` requires `role === "admin"`. Confirm "any staff can edit all content/statuses" is intended, or tighten per-role.
- **Anon write-RLS unverified** — read-RLS is correctly locked (anon sees only articles/services/gallery; profiles/quotes/bookings/contact_messages return 0 rows). Anon *write* RLS could not be tested (would mutate production). Verify in Supabase that anon/authenticated INSERT is denied on quotes/bookings/contact_messages/profiles/staff_messages so PostgREST can't be hit directly to spam or self-promote to admin.
- **Advisors not run** — Supabase MCP `list_tables`/`get_advisors` were permission-denied this session; run the Security + Performance advisors from the dashboard for RLS-enabled confirmation and missing-index warnings.
- **Email recipient inconsistency** — bookings notify `info@evercoolthailand.com`; contact/quotes notify `hello@evercoolthailand.com`; all send `from: hello@`. Pick one inbox convention.
