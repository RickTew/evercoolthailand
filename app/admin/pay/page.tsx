import type { Metadata } from "next";
import Link from "next/link";
import {
  fmtDate,
  getInvoices,
  isDueNow,
  requirePayAccess,
  usd,
  type HostingInvoice,
} from "./_lib/invoices";

export const metadata: Metadata = { title: "Pay | Evercool Portal" };
export const dynamic = "force-dynamic";

function InvoiceCard({ inv }: { inv: HostingInvoice }) {
  const overdue = isDueNow(inv);
  const badge =
    inv.status === "paid"
      ? { label: "Paid", cls: "bg-green-500/15 text-green-600" }
      : overdue
        ? { label: "Due now", cls: "bg-red-500/15 text-red-600" }
        : { label: "Upcoming", cls: "bg-amber-500/15 text-amber-600" };
  return (
    <div className="rounded-2xl border border-ec-border bg-ec-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-ec-text">Invoice #{inv.invoice_no}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badge.cls}`}
            >
              {badge.label}
            </span>
          </div>
          <div className="mt-1 text-sm text-ec-text-muted">
            R2 Hosting, {fmtDate(inv.period_start)} to {fmtDate(inv.period_end)}
            {inv.status === "due" && <> · due {fmtDate(inv.due_date)}</>}
            {inv.paid_at && <> · paid {fmtDate(inv.paid_at)}</>}
          </div>
        </div>
        <div className="text-xl font-bold tabular-nums text-ec-text">
          {usd(inv.amount_cents)}{" "}
          <span className="text-xs font-semibold text-ec-text-muted">USD</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {inv.status === "due" && inv.stripe_hosted_url && (
          <a
            href={inv.stripe_hosted_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-ec-teal px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
          >
            Pay with card
          </a>
        )}
        {inv.status === "due" && !inv.stripe_hosted_url && (
          <span className="rounded-lg border border-ec-border px-3.5 py-2 text-xs font-medium text-ec-text-muted">
            Card payment link coming shortly
          </span>
        )}
        <Link
          href={`/admin/pay/invoice/${encodeURIComponent(inv.invoice_no)}`}
          className="rounded-lg border border-ec-border px-3.5 py-2 text-xs font-semibold text-ec-text transition-colors hover:bg-black/5"
        >
          View invoice
        </Link>
        {inv.status === "paid" && inv.stripe_pdf_url && (
          <a
            href={inv.stripe_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-ec-border px-3.5 py-2 text-xs font-semibold text-ec-text transition-colors hover:bg-black/5"
          >
            Stripe receipt (PDF)
          </a>
        )}
      </div>
    </div>
  );
}

// The Pay tab: R2 Hosting's bills to Evercool, with card payment via Stripe.
// Manager + admin only (registered that way in lib/portalTabs.ts; the proxy
// blocks everyone else, requirePayAccess double-checks here). Due bills sit on
// top; everything paid drops into the Invoices archive below, where each one
// stays available to view, print or save as PDF.
export default async function PayPage() {
  await requirePayAccess();
  const invoices = await getInvoices();

  const open = invoices.filter((i) => i.status !== "paid");
  const paid = invoices.filter((i) => i.status === "paid");
  const dueNow = invoices.filter(isDueNow);
  const dueTotal = dueNow.reduce((s, r) => s + r.amount_cents, 0);

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl bg-ec-navy p-6 text-white sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">
            💳
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">Pay</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/80">
              R2 Hosting bills for Evercoolthailand.com: hosting, management and the
              EC Portal apps. Pay by credit or debit card; every invoice, paid or
              due, can be viewed, printed or saved as PDF below.
            </p>
          </div>
        </div>
        {dueNow.length > 0 && (
          <div className="mt-6 rounded-2xl bg-white/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-4xl font-bold leading-none tabular-nums sm:text-5xl">
                {usd(dueTotal)}
              </span>
              <span className="text-sm font-semibold text-white/85 sm:text-base">
                due now, across {dueNow.length} invoice{dueNow.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* What the monthly fee covers. Rick, 21 Jul: it is far more than
          standard hosting, so spell it out, but fold it into a dropdown so
          the bills stay front and center. */}
      <details className="group rounded-2xl border border-ec-border bg-ec-card">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
          <div>
            <span className="font-bold text-ec-text">
              What the $99 / month covers
            </span>
            <span className="ml-2 text-sm text-ec-text-muted">
              far more than standard hosting
            </span>
          </div>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4 shrink-0 text-ec-text-muted transition-transform group-open:rotate-180"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l4 4 4-4" />
          </svg>
        </summary>
        <div className="border-t border-ec-border p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: "🌐",
                title: "Public website",
                body: "The Evercoolthailand.com front end: pages, services, gallery, articles, quote request and booking forms.",
              },
              {
                icon: "🧭",
                title: "EC Portal (backend dashboard)",
                body: "Dashboard, Quotes, Bookings, Customers, Projects, Team, Reports and the Users console.",
              },
              {
                icon: "💬",
                title: "Email CRM system",
                body: "Company mail on @evercoolthailand.com, the shared inbox with tickets, labels, saved replies, the AIDE draft assistant, and the EN + TH guides.",
              },
              {
                icon: "🔑",
                title: "User accounts & access",
                body: "Staff sign-in, roles, per-person tab access and the manager hiring console.",
              },
              {
                icon: "🔧",
                title: "EQ Tracker, built in",
                body: "Equipment projects plus Service & Maintenance schedules and reports, consolidated from the old separate app into this portal.",
              },
              {
                icon: "🛡️",
                title: "Infrastructure & security",
                body: "Hosting on a global edge network, domain & DNS, SSL, firewall (WAF), spam defense, daily backups, monitoring and updates.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-ec-border p-3.5"
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden className="text-lg">
                    {item.icon}
                  </span>
                  <span className="text-sm font-bold text-ec-text">{item.title}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ec-text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 rounded-xl bg-ec-navy/5 p-3.5 text-xs leading-relaxed text-ec-text-muted dark:bg-white/5">
            <p>
              <b className="text-ec-text">Not included:</b> new build work recorded on
              the{" "}
              <Link href="/admin/build" className="font-semibold text-ec-teal hover:underline">
                Build page
              </Link>{" "}
              after 1st Jul 2026. New features beyond upkeep are quoted and billed
              separately.
            </p>
            <p>
              The original design and build of everything above (the website, the
              portal, the CRM and the email system) was never invoiced. The monthly
              fee covers hosting, management and upkeep.
            </p>
          </div>
        </div>
      </details>

      <div className="space-y-3">
        {invoices.length === 0 && (
          <div className="rounded-2xl border border-ec-border bg-ec-card p-6 text-sm text-ec-text-muted">
            No invoices yet.
          </div>
        )}
        {open.map((inv) => (
          <InvoiceCard key={inv.id} inv={inv} />
        ))}
      </div>

      {paid.length > 0 && (
        <div className="space-y-3">
          <h2 className="pt-2 text-lg font-bold text-ec-text">Invoices</h2>
          <p className="-mt-1 text-xs text-ec-text-muted">
            Paid invoices stay here for the record: open one to print or save it as
            PDF, or grab Stripe&apos;s own receipt where there is one.
          </p>
          {paid.map((inv) => (
            <InvoiceCard key={inv.id} inv={inv} />
          ))}
        </div>
      )}

      <p className="text-xs leading-relaxed text-ec-text-muted">
        Payments are processed by Stripe on a secure hosted page. Every invoice can
        be opened, printed or saved as PDF from “View invoice”; paid invoices also
        carry Stripe’s own receipt.
      </p>
    </div>
  );
}
