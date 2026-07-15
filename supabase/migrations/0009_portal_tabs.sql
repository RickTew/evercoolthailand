-- 0009: Per-user portal tab access + close the profiles self-update hole.
--
-- (A) profiles.portal_tabs: which top-level portal tabs this person may open.
--     Empty (the default) = everything their role allows; a non-empty list
--     RESTRICTS below the role (it can never grant beyond it, and admins are
--     never restricted). Enforced in the proxy on every /admin request and
--     mirrored in the nav, the dashboard map and the Users console.
alter table public.profiles
  add column if not exists portal_tabs text[] not null default '{}';

-- (B) Security fix found while adding (A): the profiles_update_own policy let
--     ANY signed-in staffer update their own profiles row with no column
--     limits and no check clause - including role (self-promotion to admin)
--     and now portal_tabs. Every legitimate profile write in the app goes
--     through the service-role client, so the browser session needs no write
--     access to profiles at all.
drop policy if exists profiles_update_own on public.profiles;
revoke update, insert, delete on table public.profiles from authenticated, anon;
