-- Two more topic tags for the CRM (13 Jul), mirroring the eq-tracker
-- Service & Maintenance world: filter swaps and PM/maintenance contracts are
-- their own workstreams. Names MUST match TOPIC_TAG_NAMES in
-- app/admin/email/_lib/support/classify.ts. Idempotent like 0002.
insert into public.tags (name, color, kind) values
  ('Filter change',    '#2e8b57', 'topic'),
  ('Maintenance plan', '#b8860b', 'topic')
on conflict (name) do nothing;
