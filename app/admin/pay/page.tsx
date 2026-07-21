import type { Metadata } from "next";
import Link from "next/link";
import {
  fmtDate,
  getInvoices,
  isDueNow,
  requirePayAccess,
  usd,
} from "./_lib/invoices";

export const metadata: Metadata = { title: "Pay | Evercool Portal" };
export const dynamic = "force-dynamic";

// The Pay tab: R2 Hosting's bills to Evercool, with card payment via Stripe.
// Manager + admin only (registered that way in lib/portalTabs.ts; the proxy
// blocks everyone else, requirePayAccess double-checks here).
export default async function PayPage() {
  await requirePayAccess();
  const invoices = await getInvoices();

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
              EC Portal apps. Pay by credit or debit card; once a bill is paid the
              receipt appears here to save or print as PDF.
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

      <div className="space-y-3">
        {invoices.length === 0 && (
          <div className="rounded-2xl border border-ec-border bg-ec-card p-6 text-sm text-ec-text-muted">
            No invoices yet.
          </div>
        )}
        {invoices.map((inv) => {
          const overdue = isDueNow(inv);
          const badge =
            inv.status === "paid"
              ? { label: "Paid", cls: "bg-green-500/15 text-green-600" }
              : overdue
                ? { label: "Due now", cls: "bg-red-500/15 text-red-600" }
                : { label: "Upcoming", cls: "bg-amber-500/15 text-amber-600" };
          return (
            <div
              key={inv.id}
              className="rounded-2xl border border-ec-border bg-ec-card p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-ec-text">
                      Invoice #{inv.invoice_no}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-ec-text-muted">
                    R2 Hosting, {fmtDate(inv.period_start)} to {fmtDate(inv.period_end)}
                    {" · "}due {fmtDate(inv.due_date)}
                    {inv.paid_at && ` · paid ${fmtDate(inv.paid_at)}`}
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
        })}
      </div>

      <p className="text-xs leading-relaxed text-ec-text-muted">
        Payments are processed by Stripe on a secure hosted page. Every invoice can
        be opened, printed or saved as PDF from “View invoice”; paid invoices also
        carry Stripe’s own receipt.
      </p>
    </div>
  );
}
