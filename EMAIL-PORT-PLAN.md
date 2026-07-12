# Evercool Email Inbox — Port Plan & Handoff

**Goal:** port the working CARE email inbox from `newnei-app` to Evercool so staff send/receive real `@evercoolthailand.com` mail inside the admin panel (threads, attachments, drag-drop, labels, trash). Eventually replace A2 Hosting mail entirely with a **dedicated Evercool Resend account**.

**Source repo (read-only reference):** `/Users/ricktew/Dev/Roy Martina/newnei-app`
**Target repo:** this one (`evercoolthailand`).

---

## Decisions already made (do not re-litigate)

- **Access model v1: admin manages everything.** Per-staff privacy wall (each user sees only their own address) is DEFERRED until Rick talks to the team. Newnei is a shared queue + soft `support_staff_prefs.inbox_scope`/`assigned_inboxes` filter (no true per-user RLS) — that's fine for v1.
- **New inbox address = `hi@evercoolthailand.com`** (fresh). Old `hello@`/`info@` stay on A2 Hosting untouched until the final cutover.
- **Keep newnei's `support_*` / `contacts` / `tags` table names** so the ported data-layer code runs unchanged. UI is labeled "Email".
- **Ticket reference prefix = `EC-`** (e.g. `EC-10001`).
- **DROP when porting** (newnei-specific, not wanted): AI features (`after-hours`, `match-guide`, agent requests logic), the WhatsApp channel, and the marketing `email_sequence_*` / `app/admin/email` / `app/email` / `lib/email.ts` drip-campaign stack.
- **Dedicated Resend account** for Evercool (Rick got cross-project inbound mail on the shared account). Not the shared key currently in `.env.local`.

---

## STATUS

- **Phase 1.1 — DONE & verified (2026-07-12).** Schema applied to Evercool prod. 17 tables (`contacts`, `tags`, `contact_tags`, `support_threads`, `support_messages`, `support_message_attachments`, `support_thread_tags`, `support_thread_notes`, `support_folders`, `support_thread_folders`, `support_settings`, `support_staff_prefs`, `support_kb_articles`, `support_canned_responses`, `support_agent_requests`, `support_answer_reviews`, `support_onboarding_progress`) all exist, all RLS-locked to `service_role`, private `support-attachments` bucket created. Migration: `supabase/migrations/0001_email_care_system.sql`.
- **Phase 1.2 — DONE (2026-07-12).** Webhook routes (`app/api/email/{inbound,events}/route.ts`), mail helpers (`app/admin/email/_lib/mail/{send,inbound,recipients,consent}.ts`), storage (`_lib/storage/attachments.ts`), trimmed `_lib/types.ts`, `_lib/inboxes.ts` (hi@ only). Adapted: `@evercoolthailand.com`, `EC-` regex, `Evercool <hi@evercoolthailand.com>` fallback sender; AI calls dropped. `_lib/data/repo.ts` holds only the webhook-facing interface; `getRepo()` throws until 1.3 delivers `supabase-repo.ts`. Build green.
- **Phase 1.3 — DONE (2026-07-12).** Trimmed data layer live: `_lib/data/supabase-repo.ts` (threads list/count/detail, inbound create/append with ownership check, sent-reply + email-event recording, staff prefs, thread state, tags/folders CRUD, New Mail, drafts, consent check) + full `repo.ts` interface; `getRepo()` returns the real repo. `support/classify.ts` = Evercool topics (EN+Thai cues); `ui.ts` = Asia/Bangkok. hasPendingDraft/awaiting repurposed to the human saved draft. listTeam = all active profiles. Build green. NOTE: topic tags (Quote, Booking, Service & repair, Installation, Warranty, Billing, Complaint) are not seeded in `tags` yet — classifier no-ops until they are (optional, can seed in 1.4).
- **Phase 1.4 — DONE (2026-07-12).** Inbox UI live at `/admin/email/inbox` (Email entry in AdminNav, all roles): 4 layouts (Classic/Top dash/Board/Grid), thread view + composer (drag-drop attachments via signed uploads, saved replies, signature, reply-all, quoted history), sanitized HTML rendering, notes, tags, shared folders, Trash with retention, bulk bar, New Mail, session restore. Labels admin at `/admin/email/labels`. Dropped: AI/WhatsApp/voice/help-center. New `_lib/auth.ts` (profiles-based staff gate; server actions all re-check role). newnei color tokens aliased onto the Evercool palette in `globals.css`. 7 classifier topic tags seeded in prod (migration `0002_seed_topic_tags.sql`, verified). Build green. NOT yet exercised in a browser — that's 1.5.
- **Phase 1.5 — TODO.** Port newnei's Test Lab (`app/support/test/`, simulated inbound; wire to `/admin/email` paths) + click-through: inbound → thread → reply (mock sender) → attachments → labels → trash. Needs `.env.local` service-role key (currently empty — Rick runs `vercel env pull`).
- **`supabase-ricktew` MCP — WORKING (verified 2026-07-12,** `select 1` **OK).** Use `execute_sql` / `apply_migration` directly; no browser fallback needed.
- **GitHub repo moved** to `https://github.com/RickTew/evercoolthailand.git`. Local `origin` still points at the old URL (pushes redirect fine); update with `git remote set-url origin https://github.com/RickTew/evercoolthailand.git` when Rick confirms. Dependabot reports 3 vulnerabilities (2 moderate, 1 low) — review when convenient.

---

## Newnei source file map (what to port from)

**Backend routes**
- `app/api/email/inbound/route.ts` — Resend inbound webhook. Verifies Svix signature (`RESEND_INBOUND_WEBHOOK_SECRET`), fetches full email via `resend.emails.receiving.get()`, fetches attachments from `https://api.resend.com/emails/receiving/{id}/attachments`, self-loop filter, foreign-domain filter (`pickInboxAddress` hard-codes `@newnei.com` → change to `@evercoolthailand.com`), threading via `extractReference` (subject `EC-#####`), calls `repo.appendInboundToThreadByReference` or `repo.createInboundMessage`. **DROP** the `runMatchGuide`/`runAfterHoursAgent` calls.
- `app/api/email/events/route.ts` — second webhook (`RESEND_EVENTS_WEBHOOK_SECRET`), delivery/open/click/bounce/complaint → `repo.recordEmailEvent` → RPC `support_message_mark_email_event` (already in DB).

**Mail helpers** — `app/support/_lib/mail/`
- `send.ts` — `ResendSender`/`MockSender`, `fromAddress()` (env `SUPPORT_FROM_ADDRESS`, fallback → set to `Evercool <hi@evercoolthailand.com>`), `textToHtml()`.
- `inbound.ts` — `extractReference()` (regex — change `\b(N(?:EI)?-\d+)\b` → `\bEC-\d+\b`).
- `recipients.ts` — `splitAddresses`, `isOwnInbox` (hard-codes `@newnei.com` → `@evercoolthailand.com`), `otherThreadRecipients` (reply-all).
- `consent.ts` — `isEmailOptedOut` (gates on `contacts.unsubscribed_at`).

**Storage** — `app/support/_lib/storage/attachments.ts`: `BUCKET="support-attachments"`, `createUploadUrl` (browser-direct signed upload), `putAttachment` (server, inbound), `signedUrl` (1h TTL), `readBytes` (outbound attach).

**Data layer** — `app/support/_lib/data/`
- `repo.ts` (364) — interface + `getRepo()`.
- `supabase-repo.ts` (2464) — real impl. **Port a subset:** `listThreads`/`countThreads` (inbox-scope enforcement ~355-434), `getThread`, `createInboundMessage` (~1939), `appendInboundToThreadByReference` (~2023, incl. sender-email ownership check), `recordSentReply` (~1085), `recordEmailEvent` (~1131), staff-prefs load/save (~1408-1466). **SKIP** WhatsApp ingest (~2090+) and AI-agent methods.

**Inbox UI** — `app/support/` → port into new Evercool `app/admin/email/` (add a nav entry in `components/admin/AdminNav`).
- `inbox/page.tsx` + `inbox/actions.ts` (828 — server actions: send/compose/bulk, drafts, status/assign/claim, tags, notes, trash, follow-up, attachment upload). **DROP** AI draft/translate actions.
- `_components/inbox/` (~60 files). Core: `ThreadList.tsx`, `ThreadCard.tsx`, views (`BoardView`/`ClassicView`/`GridView`), `ThreadView.tsx` (404), `RichEmailBody.tsx` (sanitized HTML render), `Composer.tsx` (795 — attachment upload + drag-drop at state `attachments`/`dragOver`, `uploadFiles()` 157-201, `onDrop`/`onDragOver` 206-216), controls (`StatusControl`, `AssigneeControl`, `ArchiveControl`, `DeleteThreadControl`/`TrashControls`, `ThreadTagEditor`/`TagEditor`/`TagFilters`, `InboxSelect`/`InboxScope`, `FilterBar`, `BulkBar`).
- Labels admin: `_components/labels/LabelsAdmin.tsx` + `labels/page.tsx` + `labels/actions.ts` (tags with `kind` topic/segment).

**Inbox registry** — `app/support/_lib/inboxes.ts`: rewrite `NEWNEI_INBOXES` → Evercool addresses. Start with:
```ts
export const EVERCOOL_INBOXES = [
  { address: "hi@evercoolthailand.com", label: "Hi" },
] as const;
```
Add per-staff `name@evercoolthailand.com` addresses as assigned.

**Staff gate** — newnei uses `requireStaff()` in `lib/auth.ts` + AAL2. Evercool equivalent: reuse the existing admin gate (`app/admin/layout.tsx` checks `profiles.is_active`; API routes use the `verifyAdmin()` pattern). Wire assignment/authors to Evercool `profiles` (roles: admin/owner/manager/sales/technician/staff).

---

## Phase plan

- **1.2** Port `app/api/email/{inbound,events}` + mail helpers (`send`, `inbound`, `recipients`, `consent`) + `storage/attachments.ts`. Adapt domain literals to `@evercoolthailand.com`, ref regex to `EC-`, from-address to `hi@`.
- **1.3** Port the `data/repo.ts` interface + a trimmed `supabase-repo.ts` (methods listed above). Uses `createAdminClient()` from `lib/supabase/server.ts` (service role).
- **1.4** Port inbox UI into `app/admin/email/`, add nav entry, wire to Evercool profiles/roles (admin sees all).
- **1.5** Port newnei's Test Lab (`app/support/test/`) simulated-inbound so we verify thread creation → reply → attachments → labels locally, with NO real Resend/DNS.

**Then Phase 2 (Rick):** create dedicated Evercool Resend account → add domain → 2 webhooks (`/api/email/inbound` type `email.received`, `/api/email/events` for delivery/open/click/bounce) → API key into Vercel.

**Phase 3 (together) — A2 is being CANCELED ENTIRELY (Rick's firm decision, stated twice; never propose keeping it as an archive).** Everything moves to Resend. Order matters because the domain's nameservers ARE A2's (ns1–4.a2hosting.com) — canceling A2 without moving DNS first takes down the website AND mail:
1. Export the existing hello@/info@ mailbox contents from A2 (once A2 is gone, stored mail is gone).
2. Move DNS hosting off A2 — domain is registered at Squarespace Domains, so switch nameservers to Squarespace (or another DNS host) and recreate ALL records there: Vercel site records, SPF/DKIM/TXT for Resend, and MX → Resend inbound.
3. Confirm site + inbound/outbound mail all working on the new DNS.
4. Cancel A2 hosting.

---

## Env vars needed (add to Vercel + `.env.local` in Phase 2)
- `RESEND_API_KEY` — the DEDICATED Evercool account key (replaces shared key).
- `RESEND_INBOUND_WEBHOOK_SECRET`, `RESEND_EVENTS_WEBHOOK_SECRET` — Svix signing secrets from the two Resend webhooks.
- `SUPPORT_FROM_ADDRESS=Evercool <hi@evercoolthailand.com>`
- (optional) `SUPPORT_NOTIFY_ADDRESS`.

---

## Operational notes
- **Running SQL:** in the new session, TEST the reconfigured `supabase-ricktew` MCP (`execute_sql` "select 1"). If it works now, use `apply_migration` for DDL (save the file in `supabase/migrations/`). If still blocked, fall back to the browser SQL editor — see the `supabase-sql-execution` memory.
- **Evercool Supabase project ref:** `sqyhddztqfyhxgcqhzzv` (NOT winjitsu `hqmsimkugadjqhkuoltb`). Live production, no staging — reads free, writes deliberate, DDL as saved migrations.
- **Git workflow:** work on `main`, commit AND push every fix from the terminal (deploys to Vercel). Plain-English explanations for Rick.
- Migration already applied is idempotent (`create ... if not exists`), safe to re-run.
