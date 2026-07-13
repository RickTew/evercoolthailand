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
0002 + 0005: Quote, Booking, Service & repair, Installation, Warranty, Billing,
Complaint, Filter change, Maintenance plan. Editable in CRM > Labels.

## 4. CRM sections

- Inbox: LIVE (4 layouts, folders, spam, bulk ops, composer).
- Labels: LIVE.
- Settings: LIVE 13 Jul (You panel: signature, pick-up-where-you-left-off,
  personal-address request; Trash panel: retention + empty, admin only).
- Test Lab: LIVE (admin).
- Customers: NEXT (port newnei `app/support/customers/*`: searchable contact
  directory + per-customer history, scoped like the inbox). Distinct from the
  portal's existing Customers page; decide merge direction when porting.
- Wisdom (knowledge base): LATER (pure CRUD port, powers AI answers later).

## 5. Phase 4 remainder (from newnei, in port order)

1. Customers section (pure CRUD, no dependencies).
2. Aide: deterministic draft templates + style settings (no API cost).
3. Wisdom KB + canned-responses admin.
4. AI drafts/after-hours agent (needs ANTHROPIC_API_KEY + usage plumbing).
5. Phone/voice + WhatsApp: investigate infra first; panels stay stubbed.

## 6. Standing decisions

- No em dashes anywhere (golden rule).
- One Supabase project shared with eq-tracker; app consolidation later.
- A2 Hosting: export old mailboxes, move DNS, then cancel (all-in on Resend).
- Public auth signup stays OFF (bots found it; nothing uses it).
- Every fix: commit AND push.

## 7. Testing gates

- Any inbound-pipeline change: send a real external email, watch it become a
  ticket with the right pill/labels (Test Lab covers simulated cases).
- Any scope change: verify with the affected person's own login (or a JWT
  probe) that the wall holds, not just that the UI hides things.
- Deliverability: outbound test to Gmail must land in Inbox (checked 13 Jul).
