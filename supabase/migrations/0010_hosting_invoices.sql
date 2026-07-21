-- 0010: R2 Hosting invoices shown on the Pay tab (Rick, 21 Jul).
--
-- R2 Hosting (Rick) bills Evercool $99/month for hosting, management and the
-- apps, starting August 2026. The Pay tab (admin + manager only) lists these
-- rows; each carries its Stripe hosted-invoice link so Evercool pays by card,
-- and Stripe's own receipt/PDF links land back here once paid.
--
-- Access model: like profiles writes, ALL reads and writes go through the
-- service-role client (the page is proxy-gated to admin/manager). The browser
-- session gets no access at all, so RLS stays locked with zero policies.

create table if not exists public.hosting_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  period_start date not null,
  period_end date not null,
  description_title text not null,
  description_lines text[] not null default '{}',
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null default 'due' check (status in ('due', 'paid', 'void')),
  invoice_date date not null,
  due_date date not null,
  stripe_invoice_id text,
  stripe_hosted_url text,
  stripe_pdf_url text,
  paid_at timestamptz,
  transaction_id text,
  gateway text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hosting_invoices enable row level security;
revoke all on table public.hosting_invoices from authenticated, anon;

-- The paid history (Mar 2025 - Jul 2026 at $80/month) lives in the R2H-1001
-- PDF, not in Stripe and not here: the Pay tab starts with the first invoice
-- at the new $99 rate, August 2026 (Rick, 21 Jul: "new rate starts August").
-- The Stripe columns stay null until the Stripe invoice is created, at which
-- point the Pay button goes live.
insert into public.hosting_invoices
  (invoice_no, period_start, period_end, description_title, description_lines,
   amount_cents, invoice_date, due_date)
values
  ('R2H-1002', '2026-08-01', '2026-08-31',
   'Managed Web Hosting & Applications - Evercoolthailand.com (08/01/2026 - 08/31/2026)',
   array[
     'EC Portal application: CRM, Quotes, Bookings, Customers, Projects, Service, Reports (hosting, management & updates)',
     'Email infrastructure: custom domain delivery, spam defense, mail storage',
     'Security & monitoring: firewall (WAF), SSL, daily backups',
     'Server Location: Global Edge Network'
   ],
   9900, '2026-08-01', '2026-08-01')
on conflict (invoice_no) do nothing;
