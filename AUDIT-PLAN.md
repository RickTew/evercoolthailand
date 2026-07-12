# Evercool Thailand — Full App Audit Plan

Created 2026-07-12. Two-session audit: **Part A (frontend) this session, Part B (backend) next session.**
Bugs found along the way get fixed immediately. Improvement/new ideas get ADDED (not built) to `IMPROVEMENT-IDEAS.md`.

## Part A — Frontend (this session)

1. **Health check**: `npm run build`, TypeScript check, ESLint — fix anything broken.
2. **Static review** of every public page and component:
   - Pages: Home, Services, Products, Solutions/About, Quote, Book, Gallery, Learn (+ article pages), Contact, Account, Login, not-found
   - Components: BookingWizard, QuoteBuilder, ACSizingCalculator, EnergyCostCalculator, ContactForm, GalleryGrid, TestimonialsCarousel, CustomerPortal, AccountAuth, PromptPaySheet, TopBar/BottomNav/Footer, LanguageSwitcher (i18n EN/TH), CookieConsent, InstallPrompt/PushOptIn (PWA)
   - Admin UI screens (visual/UX layer only — logic is Part B): Dashboard, Bookings, Quotes, Messages, Customers, Gallery, Articles, Services, Team, Users, Jobs, Reports, StaffInbox/HelpButton
3. **Playtest in the browser** (dev server + Chrome): walk every page in both languages, exercise the wizards/calculators/forms, test mobile viewport, PWA install prompt, navigation, empty states, error states.
4. **Fix bugs** as found; re-verify in browser.
5. **Compile ideas**: visuals, UX, value-adds, and brand-new feature ideas → `IMPROVEMENT-IDEAS.md`.

## Part B — Backend (next session)

1. **API route audit**: every route in `app/api/**` — auth checks, validation, error handling, status codes.
2. **Auth flow**: login, session/cookie handling, middleware protection of /admin, logout, Supabase auth callback.
3. **Database**: Supabase tables, RLS policies, indexes, advisors (`get_advisors` security + performance), migrations hygiene.
4. **Integrations**: Resend email sending (`lib/email/send.ts`), web-push (subscribe/send), PromptPay, QR codes.
5. **Playtest end-to-end**: submit real booking/quote/contact from the public site → verify it lands in admin, status changes flow back, notifications fire.
6. **Security pass**: service-role key usage, secrets, rate limiting, input sanitization.
7. Continue adding ideas to `IMPROVEMENT-IDEAS.md`.

## Plan C — Per-Staff Email System (design only, build later)

Copy the CARE strategy from `newnei-app` (`/Users/ricktew/Dev/Roy Martina/newnei-app`), adjusted for Evercool:

- **Model (from CARE)**: Resend handles both directions. Outbound: `resend.emails.send()` from `lib/email`. Inbound: domain-wide inbound routing → Resend webhook → store messages/threads in Supabase → staff UI reads from DB. An inbox registry (like `NEWNEI_INBOXES` in `app/support/_lib/inboxes.ts`) maps addresses to labels.
- **Evercool adjustment — per-staff privacy**: instead of one shared queue, each staff user's profile gets an `email_address` column (their `name@evercoolthailand.com` address, pulled from the hosting provider's mailbox list). The Email section shows ONLY threads where `to`/`from` matches the logged-in user's address (enforced in the query AND by RLS). Admin optionally sees all.
- **Steps when we build it**:
  1. Grab the mailbox list from hosting; add `email_address` to staff profiles.
  2. Verify `evercoolthailand.com` domain in Resend; set up inbound routing (MX) → webhook endpoint `app/api/email/inbound`.
  3. Tables: `email_threads`, `email_messages` (+ attachments), keyed by inbox address; RLS per staff address.
  4. UI: "Email" tab in admin nav → thread list + reader + composer (port slimmed-down versions of newnei-app's ThreadList/ThreadView/Composer).
  5. Send via Resend with the staff member's address as `from` (domain-verified so any @evercoolthailand.com from-address works).
- **Note**: switching MX to Resend inbound affects existing hosting mailboxes — decide whether Resend fully takes over inbound or we dual-route. Flag before flipping DNS.
