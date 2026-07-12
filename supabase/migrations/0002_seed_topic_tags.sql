-- Seed the topic tags the inbound auto-tagger (app/admin/email/_lib/support/
-- classify.ts) assigns. Names MUST match TOPIC_TAG_NAMES there. Idempotent:
-- re-running never duplicates (tags.name is unique) and never overwrites a
-- color/kind an admin has since edited in the Labels admin.
insert into public.tags (name, color, kind) values
  ('Quote',            '#00b2d4', 'topic'),
  ('Booking',          '#004d7a', 'topic'),
  ('Service & repair', '#f5a524', 'topic'),
  ('Installation',     '#13612e', 'topic'),
  ('Warranty',         '#7a4a9c', 'topic'),
  ('Billing',          '#5a6a7e', 'topic'),
  ('Complaint',        '#d64545', 'topic')
on conflict (name) do nothing;
