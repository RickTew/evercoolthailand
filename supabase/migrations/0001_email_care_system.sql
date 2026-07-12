-- ============================================================================
-- Evercool Email / Care inbox  (migration 0001)
-- ----------------------------------------------------------------------------
-- Ports the newnei-app CARE support-inbox schema to Evercool. Consolidates
-- newnei migrations 0002 (core CRM+support), 0005/0017 (folders), 0038
-- (settings), 0044 (CC/BCC + trash), 0056 (ref prefix), 0057 (staff prefs),
-- 0063 (per-staff access), 0068 (email delivery/open events) into one install.
--
-- Evercool adaptations:
--   * Ticket reference prefix "N-"/"NEI-"  ->  "EC-" (EC-10001, EC-10002, ...).
--   * updated_at touch uses a self-named function (support_touch_updated_at)
--     so it never collides with any existing Evercool touch function.
--   * RLS is LOCKED on every table; only service_role is granted. All reads /
--     writes run server-side through the admin (service-role) client behind the
--     admin gate. No anon/authenticated grants (consistent with the security
--     pass — the app never hits these tables from the browser).
--   * profiles(id) is Evercool's existing staff table (assignee / author / owner).
--   * v1 access model: admin manages everything; per-staff visibility is the
--     soft support_staff_prefs.inbox_scope/assigned_inboxes filter (enforced in
--     app code). A true per-user RLS wall is a later hardening step.
-- ============================================================================

create extension if not exists citext;

-- Self-contained updated_at touch (avoids clobbering any existing function).
create or replace function public.support_touch_updated_at()
returns trigger language plpgsql set search_path = public as $func$
begin
  new.updated_at := now();
  return new;
end;
$func$;

-- ---------------------------------------------------------------------------
-- A. CRM backbone
-- ---------------------------------------------------------------------------
create table if not exists public.contacts (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid references public.profiles (id) on delete set null,
  email              citext not null unique,
  full_name          text not null default '',
  locale             text not null default 'en',
  consent_email      boolean not null default false,
  consent_source     text,
  consent_updated_at timestamptz,
  unsubscribed_at    timestamptz,
  channel_handles    jsonb not null default '{}'::jsonb,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists contacts_profile_idx on public.contacts (profile_id);

create table if not exists public.tags (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  color text not null default '#00b2d4',
  kind  text not null default 'topic' check (kind in ('segment','topic'))
);

create table if not exists public.contact_tags (
  contact_id uuid not null references public.contacts (id) on delete cascade,
  tag_id     uuid not null references public.tags (id) on delete cascade,
  primary key (contact_id, tag_id)
);

-- ---------------------------------------------------------------------------
-- B. Support-owned tables (support_* prefix)
-- ---------------------------------------------------------------------------
create sequence if not exists support_thread_reference_seq start 10001;

create table if not exists public.support_threads (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references public.contacts (id) on delete cascade,
  subject         text not null default '',
  channel         text not null default 'email'
                    check (channel in ('email','instagram','whatsapp','telegram','webchat')),
  status          text not null default 'open'
                    check (status in ('open','pending','closed')),
  reference       text unique,
  assignee_id     uuid references public.profiles (id) on delete set null,
  archived_at     timestamptz,
  deleted_at      timestamptz,
  follow_up_at    timestamptz,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists support_threads_status_idx     on public.support_threads (status, last_message_at desc);
create index if not exists support_threads_contact_idx    on public.support_threads (contact_id);
create index if not exists support_threads_archived_idx   on public.support_threads (archived_at);
create index if not exists support_threads_deleted_at_idx on public.support_threads (deleted_at);
create index if not exists support_threads_followup_idx   on public.support_threads (follow_up_at);

-- Auto-assign the EC-#### reference on insert.
create or replace function public.support_set_thread_reference()
returns trigger language plpgsql set search_path = public as $func$
begin
  if new.reference is null then
    new.reference := 'EC-' || nextval('support_thread_reference_seq');
  end if;
  return new;
end;
$func$;
drop trigger if exists trg_support_set_thread_reference on public.support_threads;
create trigger trg_support_set_thread_reference
  before insert on public.support_threads
  for each row execute function public.support_set_thread_reference();

drop trigger if exists support_threads_touch_updated_at on public.support_threads;
create trigger support_threads_touch_updated_at
  before update on public.support_threads
  for each row execute procedure public.support_touch_updated_at();

drop trigger if exists contacts_touch_updated_at on public.contacts;
create trigger contacts_touch_updated_at
  before update on public.contacts
  for each row execute procedure public.support_touch_updated_at();

create table if not exists public.support_messages (
  id                  uuid primary key default gen_random_uuid(),
  thread_id           uuid not null references public.support_threads (id) on delete cascade,
  direction           text not null check (direction in ('inbound','outbound')),
  author_type         text not null check (author_type in ('customer','agent','ai_draft','ai_auto')),
  from_address        text not null default '',
  to_address          text not null default '',
  cc_address          text not null default '',
  bcc_address         text not null default '',
  body_text           text not null default '',
  body_html           text,
  state               text check (state in ('draft','approved','sent','failed')),
  provider_message_id text,
  -- delivery / engagement tracking (Resend events webhook)
  delivered_at        timestamptz,
  opened_at           timestamptz,
  last_opened_at      timestamptz,
  open_count          integer not null default 0,
  clicked_at          timestamptz,
  last_clicked_at     timestamptz,
  click_count         integer not null default 0,
  bounced_at          timestamptz,
  complained_at       timestamptz,
  created_at          timestamptz not null default now(),
  sent_at             timestamptz
);
create index if not exists support_messages_thread_idx on public.support_messages (thread_id, created_at);
create index if not exists support_messages_provider_idx
  on public.support_messages (provider_message_id) where provider_message_id is not null;

create table if not exists public.support_message_attachments (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references public.support_messages (id) on delete cascade,
  storage_path text not null,
  file_name    text not null,
  mime_type    text not null default 'application/octet-stream',
  size_bytes   bigint,
  direction    text not null check (direction in ('inbound','outbound')),
  created_at   timestamptz not null default now()
);
create index if not exists support_message_attachments_message_idx
  on public.support_message_attachments (message_id);

create table if not exists public.support_thread_tags (
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  tag_id    uuid not null references public.tags (id) on delete cascade,
  primary key (thread_id, tag_id)
);
create index if not exists support_thread_tags_thread_idx on public.support_thread_tags (thread_id);
create index if not exists support_thread_tags_tag_idx    on public.support_thread_tags (tag_id);

create table if not exists public.support_thread_notes (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.support_threads (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  author_name text not null default 'Team',
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists support_thread_notes_thread_idx on public.support_thread_notes (thread_id, created_at);

-- Team-wide filing folders (shared, case-insensitive unique names).
create table if not exists public.support_folders (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  position   integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists support_folders_name_key on public.support_folders (lower(name));
create index if not exists support_folders_owner_idx on public.support_folders (owner_id, position, name);

create table if not exists public.support_thread_folders (
  thread_id uuid not null references public.support_threads (id) on delete cascade,
  folder_id uuid not null references public.support_folders (id) on delete cascade,
  primary key (thread_id, folder_id)
);
create index if not exists support_thread_folders_folder_idx on public.support_thread_folders (folder_id);
create index if not exists support_thread_folders_thread_idx on public.support_thread_folders (thread_id);

-- Knowledge base / canned responses / AI-assist scaffolding (ported so the
-- support repo code runs unchanged; unused sections simply stay empty).
create table if not exists public.support_kb_articles (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  language     text not null default 'en',
  is_verified  boolean not null default false,
  show_in_help boolean not null default true,
  updated_at   timestamptz not null default now()
);

create table if not exists public.support_canned_responses (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  language   text not null default 'en',
  created_at timestamptz not null default now()
);

create table if not exists public.support_agent_requests (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid not null references public.support_threads (id) on delete cascade,
  origin       text not null default 'manual' check (origin in ('auto','manual')),
  instruction  text not null,
  status       text not null default 'queued' check (status in ('queued','claimed','done','discarded')),
  claimed_by   text,
  result       text,
  model        text,
  review_score integer,
  review_notes text,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now(),
  claimed_at   timestamptz,
  completed_at timestamptz
);
create index if not exists support_agent_requests_status_idx on public.support_agent_requests (status, created_at);
create index if not exists support_agent_requests_thread_idx on public.support_agent_requests (thread_id);

create table if not exists public.support_answer_reviews (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid references public.support_threads (id) on delete set null,
  question      text not null default '',
  answer        text not null,
  score         integer,
  notes         text,
  status        text not null default 'pending' check (status in ('pending','promoted','rejected')),
  kb_article_id uuid references public.support_kb_articles (id) on delete set null,
  created_at    timestamptz not null default now(),
  reviewed_at   timestamptz
);
create index if not exists support_answer_reviews_status_idx on public.support_answer_reviews (status, created_at);

create table if not exists public.support_onboarding_progress (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles (id) on delete cascade,
  task_id    text not null,
  done       boolean not null default false,
  feedback   text,
  updated_at timestamptz not null default now(),
  unique (member_id, task_id)
);

-- Care-wide key/value settings.
create table if not exists public.support_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Per-staff Care preferences + per-user inbox scoping.
create table if not exists public.support_staff_prefs (
  profile_id        uuid primary key references public.profiles(id) on delete cascade,
  signature         text    not null default '',
  inbox_scope       text    not null default 'all' check (inbox_scope in ('all','assigned')),
  assigned_inboxes  text[]  not null default '{}',
  personal_address  text,
  requested_address text,
  care_sections     text[]  not null default '{}',
  can_phone         boolean not null default true,
  can_ai_toggle     boolean not null default false,
  restore_session   boolean not null default true,
  default_view      text,
  last_view         text,
  last_filters      jsonb   not null default '{}'::jsonb,
  updated_at        timestamptz not null default now()
);

-- Private attachments bucket (never public; service role + signed URLs only).
insert into storage.buckets (id, name, public)
values ('support-attachments', 'support-attachments', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- C. RLS: locked everywhere; only service_role is granted. No anon reads.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'contacts','tags','contact_tags',
    'support_threads','support_messages','support_message_attachments',
    'support_thread_tags','support_thread_notes','support_folders',
    'support_thread_folders','support_kb_articles','support_canned_responses',
    'support_agent_requests','support_answer_reviews','support_onboarding_progress',
    'support_settings','support_staff_prefs'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('grant all on public.%I to service_role;', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- D. Email delivery/open/click event recorder (called by the events webhook).
-- ---------------------------------------------------------------------------
create or replace function public.support_message_mark_email_event(
  p_provider_id text,
  p_type text,
  p_at timestamptz
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_provider_id is null then return; end if;
  update public.support_messages m set
    delivered_at   = case when p_type = 'email.delivered'  then coalesce(m.delivered_at, p_at) else m.delivered_at end,
    opened_at      = case when p_type = 'email.opened'     then coalesce(m.opened_at, p_at)    else m.opened_at end,
    last_opened_at = case when p_type = 'email.opened'     then p_at                           else m.last_opened_at end,
    open_count     = case when p_type = 'email.opened'     then m.open_count + 1               else m.open_count end,
    clicked_at     = case when p_type = 'email.clicked'    then coalesce(m.clicked_at, p_at)   else m.clicked_at end,
    last_clicked_at= case when p_type = 'email.clicked'    then p_at                           else m.last_clicked_at end,
    click_count    = case when p_type = 'email.clicked'    then m.click_count + 1              else m.click_count end,
    bounced_at     = case when p_type = 'email.bounced'    then coalesce(m.bounced_at, p_at)   else m.bounced_at end,
    complained_at  = case when p_type = 'email.complained' then coalesce(m.complained_at, p_at) else m.complained_at end
  where m.provider_message_id = p_provider_id;
end;
$$;
grant execute on function public.support_message_mark_email_event(text, text, timestamptz) to service_role;

-- ---------------------------------------------------------------------------
-- E. Aggregates-only analytics for the inbox dashboard (service-role only).
--    Agent roll-up adapted to Evercool roles.
-- ---------------------------------------------------------------------------
create or replace function public.get_support_analytics()
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'totals', jsonb_build_object(
      'tickets', (select count(*) from support_threads where deleted_at is null),
      'last_7d', (select count(*) from support_threads where deleted_at is null and created_at >= now() - interval '7 days'),
      'today',   (select count(*) from support_threads where deleted_at is null and created_at >= date_trunc('day', now()))
    ),
    'status', jsonb_build_object(
      'new',          (select count(*) from support_threads where deleted_at is null and status = 'open'),
      'pending',      (select count(*) from support_threads where deleted_at is null and status = 'pending'),
      'done',         (select count(*) from support_threads where deleted_at is null and status = 'closed'),
      'open_backlog', (select count(*) from support_threads where deleted_at is null and status = 'open' and archived_at is null)
    ),
    'oldest_open_hours', coalesce((
      select round(extract(epoch from (now() - min(created_at))) / 3600.0)::int
      from support_threads where status = 'open' and archived_at is null and deleted_at is null
    ), 0),
    'by_topic', coalesce((
      select jsonb_agg(jsonb_build_object('tag', name, 'count', c) order by c desc)
      from (
        select tg.name, count(*) c
        from support_thread_tags tt join tags tg on tg.id = tt.tag_id
        where tg.kind = 'topic'
        group by tg.name
      ) s
    ), '[]'::jsonb),
    'by_channel', coalesce((
      select jsonb_agg(jsonb_build_object('channel', channel, 'count', c) order by c desc)
      from (select channel, count(*) c from support_threads where deleted_at is null group by channel) s
    ), '[]'::jsonb),
    'by_agent', coalesce((
      select jsonb_agg(jsonb_build_object('name', nm, 'open', c) order by c desc)
      from (
        select coalesce(p.name, p.email, 'Unassigned') nm, count(t.id) c
        from profiles p
        left join support_threads t on t.assignee_id = p.id and t.status = 'open' and t.deleted_at is null
        where p.role in ('admin','owner','manager','sales','technician','staff')
        group by coalesce(p.name, p.email, 'Unassigned')
      ) s
    ), '[]'::jsonb),
    'volume_30d', coalesce((
      select jsonb_agg(jsonb_build_object('date', d::date, 'count', coalesce(c, 0)) order by d)
      from generate_series(
        date_trunc('day', now()) - interval '29 days',
        date_trunc('day', now()),
        interval '1 day'
      ) d
      left join (
        select date_trunc('day', created_at) dd, count(*) c from support_threads where deleted_at is null group by 1
      ) v on v.dd = d
    ), '[]'::jsonb)
  );
$$;
grant execute on function public.get_support_analytics() to service_role;

notify pgrst, 'reload schema';
