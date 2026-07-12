import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Customers | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const admin = createAdminClient();
  const { data: customers } = await admin
    .from("customers")
    .select("id, name, phone, email, referral_code, created_at")
    .order("created_at", { ascending: false });

  const all = customers ?? [];

  // Get booking/quote counts per customer
  const { data: bookingCounts } = await admin
    .from("bookings")
    .select("email")
    .not("email", "is", null);

  const bookingsByEmail: Record<string, number> = {};
  for (const b of bookingCounts ?? []) {
    if (b.email) bookingsByEmail[b.email as string] = (bookingsByEmail[b.email as string] ?? 0) + 1;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ec-text">Customers ({all.length})</h1>
      </div>

      <div className="flex flex-col gap-3">
        {all.map((c) => (
          <div key={c.id} className="bg-ec-card rounded-2xl border border-ec-border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-ec-text">{c.name ?? "No name"}</p>
                <p className="text-xs text-ec-text-muted">{c.email}</p>
                {c.phone && <p className="text-xs text-ec-text-muted">{c.phone}</p>}
              </div>
              <div className="text-right">
                {c.referral_code && (
                  <p className="text-xs font-mono text-ec-teal">{c.referral_code}</p>
                )}
                <p className="text-xs text-ec-text-muted mt-1">
                  {bookingsByEmail[c.email ?? ""] ?? 0} booking{bookingsByEmail[c.email ?? ""] !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-ec-border/50">
              <p className="text-[10px] text-ec-text-muted/50">
                Joined {new Date(c.created_at).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "Asia/Bangkok" })}
              </p>
              {c.phone && (
                <a href={`tel:${c.phone}`} className="text-xs text-ec-teal hover:underline">Call</a>
              )}
              {c.email && (
                <a href={`mailto:${c.email}`} className="text-xs text-ec-teal hover:underline">Email</a>
              )}
            </div>
          </div>
        ))}
        {all.length === 0 && (
          <p className="text-sm text-ec-text-muted text-center py-8">No registered customers yet.</p>
        )}
      </div>
    </div>
  );
}
