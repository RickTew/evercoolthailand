-- 0008: Save Draft for Compose (New Mail).
-- A personal drafts drawer: each staff member's unsent Compose emails, saved
-- server-side so a draft survives closing the modal, the tab, or moving to a
-- different computer. No thread or contact is created until the mail is
-- actually sent; sending (or discarding) removes the draft.

create table if not exists public.support_compose_drafts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references public.profiles(id) on delete cascade,
  to_text    text not null default '',
  name_text  text not null default '',
  cc_text    text not null default '',
  bcc_text   text not null default '',
  subject    text not null default '',
  body_text  text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_compose_drafts_author_idx
  on public.support_compose_drafts (author_id, updated_at desc);

-- Same lockdown as every other support table: RLS on, service_role only.
-- All reads/writes go through the server-side service-role client, which pins
-- every query to the signed-in staffer's author_id.
alter table public.support_compose_drafts enable row level security;
grant all on public.support_compose_drafts to service_role;
