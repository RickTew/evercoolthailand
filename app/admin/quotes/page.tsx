import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import StatusSelect from "@/components/admin/StatusSelect";
import DeleteButton from "@/components/admin/DeleteButton";

export const metadata: Metadata = { title: "Quotes | Admin" };
export const dynamic = "force-dynamic";

const QUOTE_STATUSES = [
  { value: "new", label: "New" },
  { value: "in-review", label: "In Review" },
  { value: "quoted", label: "Quoted" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

export default async function AdminQuotesPage() {
  const admin = createAdminClient();
  const { data: quotes } = await admin
    .from("quotes")
    .select("id, name, phone, email, service_type, property_type, area_sqm, preferred_tier, status, notes, created_at")
    .order("created_at", { ascending: false });

  const all = quotes ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ec-text">Quotes ({all.length})</h1>
      </div>

      <div className="flex flex-col gap-3">
        {all.map((q) => (
          <div key={q.id} className="bg-ec-card rounded-2xl border border-ec-border p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-bold text-ec-text">{q.name}</p>
                <p className="text-xs text-ec-text-muted">{q.phone}{q.email ? ` · ${q.email}` : ""}</p>
              </div>
              <StatusSelect
                table="quotes"
                id={q.id}
                current={q.status}
                options={QUOTE_STATUSES}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-ec-border/40 rounded-lg px-2 py-0.5 text-ec-text-muted capitalize">
                {String(q.service_type ?? "").replace(/-/g, " ")}
              </span>
              <span className="bg-ec-border/40 rounded-lg px-2 py-0.5 text-ec-text-muted capitalize">
                {q.property_type as string}
              </span>
              {q.area_sqm && (
                <span className="bg-ec-border/40 rounded-lg px-2 py-0.5 text-ec-text-muted">
                  {q.area_sqm} m²
                </span>
              )}
              {q.preferred_tier && (
                <span className="bg-ec-teal/10 text-ec-teal rounded-lg px-2 py-0.5 capitalize">
                  {q.preferred_tier}
                </span>
              )}
            </div>
            {q.notes && (
              <p className="text-xs text-ec-text-muted mt-2 border-t border-ec-border/50 pt-2">
                {q.notes}
              </p>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-ec-text-muted/50">
                {new Date(q.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}
              </p>
              <DeleteButton table="quotes" id={q.id} />
            </div>
          </div>
        ))}
        {all.length === 0 && (
          <p className="text-sm text-ec-text-muted text-center py-8">No quotes yet.</p>
        )}
      </div>
    </div>
  );
}
