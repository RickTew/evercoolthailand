-- Spam / phishing defense for the inbound email pipeline.
--
-- Resend receives our mail through AWS SES, which stamps every message with
-- authentication headers (Received-SPF, Authentication-Results with spf/dkim/
-- dmarc verdicts, X-SES-Spam-Verdict, X-SES-Virus-Verdict). The inbound
-- webhook now reads those and scores each arrival; this migration adds the
-- storage for that verdict plus a team-managed blocked-senders list.
--
-- spam_status on a thread:
--   null        = clean (default; every pre-existing thread stays visible)
--   'suspected' = auto-flagged by the filter (failed sender authentication,
--                 SES spam/virus verdict, reply-to mismatch); shown ONLY in
--                 the inbox Spam folder, awaiting a human decision
--   'confirmed' = a human marked it spam, or the sender was already on the
--                 blocked list when the mail arrived

alter table public.support_threads
  add column if not exists spam_status text
  check (spam_status in ('suspected', 'confirmed'));

-- The raw evidence for the verdict, stored on the inbound message so staff can
-- see WHY a mail was flagged: { spf, dkim, dmarc, sesSpam, sesVirus, score,
-- reasons: [...] }. Null on outbound messages and on mail ingested before this.
alter table public.support_messages
  add column if not exists auth_results jsonb;

-- Senders the team has blocked. pattern is either a full address
-- ('support@imgsafe.org') or a whole domain ('@imgsafe.org'). Mail from a
-- blocked sender still gets stored (nothing is silently lost) but lands as
-- spam_status 'confirmed', straight into the Spam folder.
create table if not exists public.support_blocked_senders (
  id          uuid primary key default gen_random_uuid(),
  pattern     citext not null unique,
  reason      text,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  hit_count   integer not null default 0,
  last_hit_at timestamptz
);

-- Same lockdown as every other support table: RLS on, service_role only.
alter table public.support_blocked_senders enable row level security;
grant all on public.support_blocked_senders to service_role;

-- The Spam folder query filters on spam_status; partial index keeps it cheap
-- (the flagged slice stays tiny relative to the whole thread table).
create index if not exists support_threads_spam_status_idx
  on public.support_threads (spam_status)
  where spam_status is not null;
