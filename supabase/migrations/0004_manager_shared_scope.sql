-- Manager "shared" inbox scope (Rick, 13 Jul): the manager must see ALL
-- non-personal mail, or company mail to an address nobody listed (a typo, a
-- future alias) would be visible to the admin only and get lost. A fixed
-- assigned_inboxes list cannot express "everything except other people's
-- personal mail", so this adds a third scope value:
--   'all'      = every thread (admins behave like this regardless of prefs)
--   'assigned' = only the addresses in assigned_inboxes (the 5 staff)
--   'shared'   = everything EXCEPT mail that went only to another staffer's
--                personal address (the manager)

alter table public.support_staff_prefs
  drop constraint support_staff_prefs_inbox_scope_check;

alter table public.support_staff_prefs
  add constraint support_staff_prefs_inbox_scope_check
  check (inbox_scope in ('all', 'assigned', 'shared'));
