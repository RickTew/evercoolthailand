import { redirect } from "next/navigation";
import { createAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

// R2 Hosting billing (the Pay tab). The proxy already blocks the /admin/pay
// URLs for other roles via lib/portalTabs.ts; this in-page gate is the second
// wall, same belt-and-braces as the Users console, because server components
// and future actions here read with the service-role client.
export const PAY_ROLES = ["admin", "manager"];

export type HostingInvoice = {
  id: string;
  invoice_no: string;
  period_start: string;
  period_end: string;
  description_title: string;
  description_lines: string[];
  amount_cents: number;
  currency: string;
  status: "due" | "paid" | "void";
  invoice_date: string;
  due_date: string;
  stripe_invoice_id: string | null;
  stripe_hosted_url: string | null;
  stripe_pdf_url: string | null;
  paid_at: string | null;
  transaction_id: string | null;
  gateway: string | null;
};

export async function requirePayAccess(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_active || !PAY_ROLES.includes(profile.role)) {
    redirect("/admin/dashboard");
  }
}

// All invoices, oldest first, with Stripe as the source of truth for payment:
// when STRIPE_SECRET_KEY is set, any still-due invoice that has a Stripe id is
// re-checked live on load, and a paid one is written back (status, paid_at,
// receipt PDF, transaction id) so the row keeps the receipt even if the key
// is later rotated. No webhook needed at this volume.
export async function getInvoices(): Promise<HostingInvoice[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("hosting_invoices")
    .select("*")
    .order("period_start", { ascending: true });
  const rows = (data ?? []) as HostingInvoice[];

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return rows;

  for (const row of rows) {
    if (row.status !== "due" || !row.stripe_invoice_id) continue;
    try {
      const res = await fetch(
        `https://api.stripe.com/v1/invoices/${row.stripe_invoice_id}`,
        { headers: { Authorization: `Bearer ${key}` }, cache: "no-store" },
      );
      if (!res.ok) continue;
      const inv = await res.json();

      const patch: Record<string, unknown> = {};
      if (inv.hosted_invoice_url && inv.hosted_invoice_url !== row.stripe_hosted_url) {
        patch.stripe_hosted_url = inv.hosted_invoice_url;
      }
      if (inv.invoice_pdf && inv.invoice_pdf !== row.stripe_pdf_url) {
        patch.stripe_pdf_url = inv.invoice_pdf;
      }
      if (inv.status === "paid") {
        patch.status = "paid";
        patch.paid_at = inv.status_transitions?.paid_at
          ? new Date(inv.status_transitions.paid_at * 1000).toISOString()
          : new Date().toISOString();
        patch.gateway = "Credit / Debit Card (Stripe)";
        patch.transaction_id =
          (typeof inv.payment_intent === "string" && inv.payment_intent) ||
          (typeof inv.charge === "string" && inv.charge) ||
          null;
      }
      if (Object.keys(patch).length > 0) {
        patch.updated_at = new Date().toISOString();
        await admin.from("hosting_invoices").update(patch).eq("id", row.id);
        Object.assign(row, patch);
      }
    } catch {
      // Stripe unreachable: show the stored state, never block the page.
    }
  }
  return rows;
}

export async function getInvoiceByNo(invoiceNo: string): Promise<HostingInvoice | null> {
  const rows = await getInvoices();
  return rows.find((r) => r.invoice_no === invoiceNo) ?? null;
}

export function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// "1st Jun 2026", the format the R2 Hosting PDFs use.
export function fmtDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  const day = d.getUTCDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st"
    : day % 10 === 2 && day !== 12 ? "nd"
    : day % 10 === 3 && day !== 13 ? "rd"
    : "th";
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${day}${suffix} ${month} ${d.getUTCFullYear()}`;
}

export function isDueNow(row: HostingInvoice): boolean {
  return row.status === "due" && new Date(`${row.due_date}T00:00:00Z`) <= new Date();
}
