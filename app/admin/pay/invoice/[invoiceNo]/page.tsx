import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fmtDate, getInvoiceByNo, requirePayAccess, usd } from "../../_lib/invoices";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Invoice | Evercool Portal" };
export const dynamic = "force-dynamic";

const BLUE = "#1d4ed8";
const NAVY = "#1e2a44";

// The R2 Hosting logo, same mark as on the PDF invoices.
function R2Logo() {
  return (
    <svg width="300" height="52" viewBox="0 0 300 52" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="r2g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <circle cx="26" cy="26" r="24" fill="url(#r2g)" />
      <path
        d="M 26 6 A 20 20 0 0 1 46 26"
        fill="none"
        stroke="#93c5fd"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <text x="26" y="35" fontFamily="Helvetica, Arial, sans-serif" fontSize="26" fontWeight="bold" fill="#ffffff" textAnchor="middle">
        R2
      </text>
      <text x="58" y="30" fontFamily="Helvetica, Arial, sans-serif" fontSize="26" fill={NAVY}>
        <tspan fontWeight="bold">R2</tspan> HOSTING
      </text>
      <text x="59" y="46" fontFamily="Helvetica, Arial, sans-serif" fontSize="10.5" letterSpacing="1.5" fill={BLUE}>
        HOSTING, MANAGEMENT, APPS
      </text>
    </svg>
  );
}

// Printable copy of an R2 Hosting invoice: same layout as the PDF originals,
// so "Print / Save as PDF" from the browser produces the exportable document.
export default async function InvoicePage({
  params,
}: {
  params: Promise<{ invoiceNo: string }>;
}) {
  await requirePayAccess();
  const { invoiceNo } = await params;
  const inv = await getInvoiceByNo(decodeURIComponent(invoiceNo));
  if (!inv) notFound();

  const paid = inv.status === "paid";
  const amount = `${usd(inv.amount_cents)} USD`;

  return (
    <div className="space-y-4">
      {/* On paper only the white document survives: the portal chrome (nav,
          toolbar) is hidden by the print rules below. */}
      <style>{`@media print {
        nav, .no-print { display: none !important; }
        body { background: #fff !important; }
        .invoice-sheet { border: none !important; border-radius: 0 !important; box-shadow: none !important; margin: 0 !important; }
      }`}</style>

      <div className="no-print flex items-center justify-between gap-3">
        <Link
          href="/admin/pay"
          className="rounded-lg border border-ec-border px-3.5 py-2 text-xs font-semibold text-ec-text transition-colors hover:bg-black/5"
        >
          Back to Pay
        </Link>
        <div className="flex items-center gap-2">
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
          <PrintButton />
        </div>
      </div>

      <div className="invoice-sheet relative mx-auto max-w-[820px] overflow-hidden rounded-xl border border-ec-border bg-white p-8 text-[13px] text-[#222] sm:p-12">
        {/* PAID / UNPAID corner ribbon */}
        <div
          className="absolute right-[-70px] top-[22px] w-[220px] rotate-45 py-1.5 text-center text-2xl font-bold tracking-widest text-white"
          style={{ background: paid ? BLUE : "#dc2626" }}
        >
          {paid ? "PAID" : "UNPAID"}
        </div>

        <div className="mb-7 flex items-start justify-between">
          <R2Logo />
          <div className="mt-16 text-right leading-relaxed">
            <div className="text-[15px] font-bold" style={{ color: NAVY }}>
              R2 Hosting
            </div>
            <div>ricktew.com</div>
            <div>info@ricktew.com</div>
          </div>
        </div>

        <div className="mb-8 bg-[#f0f2f5] px-4 pb-1 pt-3">
          <h1 className="mb-2 text-xl font-bold" style={{ color: NAVY }}>
            Invoice #{inv.invoice_no}
          </h1>
          <div className="py-1.5">Invoice Date: {fmtDate(inv.invoice_date)}</div>
          <div className="border-t border-[#e2e5ea] py-1.5">
            Due Date: {fmtDate(inv.due_date)}
          </div>
        </div>

        <div className="mb-9 leading-relaxed">
          <h2 className="mb-1.5 font-bold" style={{ color: NAVY }}>
            Invoiced To
          </h2>
          <div className="font-bold">EverCool Thailand</div>
          <div>383 (3Fl.) Bond-street</div>
          <div>road, Bangphut, Pakkret,</div>
          <div>Nonthaburi 11120</div>
          <div>Thailand</div>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-[#d6dae1] bg-[#eef1f5] p-2 font-bold" style={{ color: NAVY }}>
                Description
              </th>
              <th className="w-[130px] border border-[#d6dae1] bg-[#eef1f5] p-2 font-bold" style={{ color: NAVY }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-[#d6dae1] p-2.5 align-top leading-relaxed">
                <div>{inv.description_title}</div>
                {inv.description_lines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </td>
              <td className="whitespace-nowrap border border-[#d6dae1] p-2.5 text-center align-top">
                {amount}
              </td>
            </tr>
            {(["Sub Total", "Credit", "Total"] as const).map((label) => (
              <tr key={label}>
                <td className="border border-[#d6dae1] bg-[#eef1f5] p-2 text-right font-bold">
                  {label}
                </td>
                <td className="border border-[#d6dae1] bg-[#eef1f5] p-2 text-center font-bold">
                  {label === "Credit" ? "$0.00 USD" : amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="mb-3 mt-9 text-base font-bold" style={{ color: NAVY }}>
          Transactions
        </h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Transaction Date", "Gateway", "Transaction ID", "Amount"].map((h) => (
                <th key={h} className="border border-[#d6dae1] bg-[#eef1f5] p-2 font-bold" style={{ color: NAVY }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paid && inv.paid_at ? (
              <tr>
                <td className="border border-[#d6dae1] p-2.5 text-center">{fmtDate(inv.paid_at)}</td>
                <td className="border border-[#d6dae1] p-2.5 text-center">
                  {inv.gateway ?? "Credit / Debit Card (Stripe)"}
                </td>
                <td className="border border-[#d6dae1] p-2.5 text-center">
                  {inv.transaction_id ?? "on file"}
                </td>
                <td className="border border-[#d6dae1] p-2.5 text-center">{amount}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={4} className="border border-[#d6dae1] p-2.5 text-center text-[#666]">
                  No Related Transactions Found
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={3} className="border border-[#d6dae1] bg-[#eef1f5] p-2 text-right font-bold">
                Balance
              </td>
              <td className="w-[130px] border border-[#d6dae1] bg-[#eef1f5] p-2 text-center font-bold">
                {paid ? "$0.00 USD" : amount}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mt-14 text-center text-[11.5px] text-[#555]">
          PDF Generated on {fmtDate(new Date().toISOString())}
        </div>
      </div>
    </div>
  );
}
