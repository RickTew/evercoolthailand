# Evercool Thailand CRM: Plan A

The portal's Email module is the CRM (nav tab renamed "CRM", 13 Jul). One shared
queue receives every @evercoolthailand.com email; per-user privileges decide who
sees which mailboxes; labels, folders, spam defense, and (coming) customers,
knowledge and AI assist sit on top. This plan is the single source of truth for
what exists, what is being built, and in which order. It supersedes the Phase 4
checklist in EMAIL-PORT-PLAN.md (that file stays as the port history).

## 1. Access model (LIVE, decided 13 Jul)

| Role | Portal pages | CRM mailboxes |
|---|---|---|
| admin (Rick) | everything incl. Users, Services, Gallery, Articles | every mailbox (bypasses scoping) |
| manager (Wanrawee) | all except the four admin-only pages | scope "shared": everything except other people's personal mailboxes |
| staff (5 techs/office) | Dashboard, CRM, (Jobs for technicians) | scope "assigned": own address only |

- Enforced server-side in listThreads/countThreads + the thread-URL guard.
- Database wall: RLS locks all support tables to the service role; staff JWTs
  read nothing directly (verified 13 Jul).
- Admin edits each person's access in Users > CRM access (checkboxes, ported
  from newnei's CareAccessEditor, 13 Jul).

## 2. Mailboxes (LIVE)

Registry: `app/admin/email/_lib/inboxes.ts`. Domain-wide receiving means EVERY
address at the domain lands in the queue even if unlisted; listing adds the
filter entry + label. All 17 verified end to end 13 Jul (test mail each,
ticket created, correct inbox pill, cleaned up).

- Role: hi@ hello@ info@ admin@ office@ sales@ support@
- Function (added 13 Jul, mirroring the portal modules + eq-tracker):
  bookings@ quotes@ service@ billing@
- Personal: blancheli@ jakkrit@ kongnatee@ tassanee@ theerachai@ wanrawee@

Replies go out FROM the address the customer wrote to. Spam defense (13 Jul):
SES SPF/DKIM/DMARC verdicts scored on arrival, Spam folder, blocked-senders
list, warning banners.

## 3. Topic labels (LIVE)

Auto-tagger: `_lib/support/classify.ts` (EN + Thai cues), seeds in migrations
0002 + 0005 + 0007: Quote, Booking, Service & repair, Installation, Warranty,
Billing, Complaint, Filter change, Maintenance plan, and (14 Jul, from scanning
the real traffic: the mail is B2B industrial HVAC) Purchase order, Shipping,
Supplier, Project (fires on EQ project refs like EQ068-07-26, tying mail to the
eq-tracker world). Editable in CRM > Labels.

## 4. CRM sections

- Inbox: LIVE (4 layouts, folders, spam, bulk ops, composer).
- Labels: LIVE.
- Settings: LIVE 13 Jul (You panel: signature, pick-up-where-you-left-off,
  personal-address request; Trash panel: retention + empty, admin only).
  14 Jul: "How to use" guide banner, company signature format button, and the
  Saved replies panel (library visible to all, admin + manager curate; 9
  bilingual starters seeded in migration 0007 covering quotations, POs,
  supplier catalogue requests and service scheduling). This delivers the
  canned-responses admin from Phase 4 item 2 early; Wisdom KB remains.
- Guide: LIVE 14 Jul (/admin/email/guide, bilingual EN+TH how-to for the whole
  CRM; "How to use" tab always visible, linked from Settings + the dashboard).
- Test Lab: LIVE (admin).
- Customers: LIVE 13 Jul (ported from newnei): searchable contact directory +
  per-customer profile with full ticket history, scoped like the inbox for
  assigned staff. The portal's Customers nav tab now redirects here (the old
  stub read an empty `customers` table).
- Wisdom (knowledge base): LATER (pure CRUD port, powers AI answers later).

## 5. Channels into the CRM

- Email: LIVE (all 17 addresses, domain-wide catch-all).
- Website contact form: LIVE 13 Jul. Every submission opens a CRM ticket
  (blocked senders file to Spam); the 14 historical Messages were imported
  (migration 0006) and the Messages nav tab retired (/admin/messages stays
  reachable by URL as the archive).
- Booking + quote forms: still notification-email only; fold into the CRM the
  same way when wanted.

## 6. Phase 4 remainder (from newnei, in port order)

1. Aide: deterministic draft templates + style settings (no API cost).
2. Wisdom KB + canned-responses admin.
3. AI drafts/after-hours agent (needs ANTHROPIC_API_KEY + usage plumbing).
4. Phone/voice + WhatsApp: investigate infra first; panels stay stubbed.

Known gaps (not urgent, tracked):
- Trash purge cron: repo.purgeTrash exists but nothing schedules it, so the
  "kept N days then permanently deleted" promise is not enforced yet.
- RLS hardening: the eq-tracker tables allow any authenticated user full CRUD
  via PostgREST even where the UI is role-hidden (inherited model).
- Full Thai translation of the CRM module (Projects/Service/Reports are
  bilingual; the CRM UI is English with Thai only in the dashboard guide).

## 7. App consolidation (CONFIRMED with Rick 13 Jul)

eq-tracker (equipment, filters, Service & Maintenance) merges INTO this
portal after CRM parity: one login, one nav, one deploy. Until then the nav
carries an "EQ Tracker" link to eq-tracker-theta.vercel.app (same database
already, so the merge is UI + auth + routing work, not a data migration).

## 8. Standing decisions

- No em dashes anywhere (golden rule).
- One Supabase project shared with eq-tracker; app consolidation later.
- A2 Hosting: export old mailboxes, move DNS, then cancel (all-in on Resend).
- Public auth signup stays OFF (bots found it; nothing uses it).
- Every fix: commit AND push.

## 9. Testing gates

- Any inbound-pipeline change: send a real external email, watch it become a
  ticket with the right pill/labels (Test Lab covers simulated cases).
- Any scope change: verify with the affected person's own login (or a JWT
  probe) that the wall holds, not just that the UI hides things.
- Deliverability: outbound test to Gmail must land in Inbox (checked 13 Jul).
