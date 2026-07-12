import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import StatusSelect from "@/components/admin/StatusSelect";

export const metadata: Metadata = { title: "Bookings | Admin" };
export const dynamic = "force-dynamic";

const BOOKING_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default async function AdminBookingsPage() {
  const admin = createAdminClient();
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, name, phone, email, service_name, booking_date, booking_time, area, address, notes, status, created_at")
    .order("booking_date", { ascending: true });

  const all = bookings ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ec-text">Bookings ({all.length})</h1>
      </div>

      <div className="flex flex-col gap-3">
        {all.map((b) => (
          <div key={b.id} className="bg-ec-card rounded-2xl border border-ec-border p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-bold text-ec-text">{b.name}</p>
                <p className="text-xs text-ec-text-muted">{b.phone}{b.email ? ` · ${b.email}` : ""}</p>
              </div>
              <StatusSelect
                table="bookings"
                id={b.id}
                current={b.status}
                options={BOOKING_STATUSES}
              />
            </div>
            <div className="flex flex-wrap gap-2 text-xs mb-2">
              <span className="bg-ec-teal/10 text-ec-teal rounded-lg px-2 py-0.5 font-semibold">
                {b.booking_date as string} · {b.booking_time as string}
              </span>
              <span className="bg-ec-border/40 rounded-lg px-2 py-0.5 text-ec-text-muted capitalize">
                {b.service_name as string}
              </span>
              <span className="bg-ec-border/40 rounded-lg px-2 py-0.5 text-ec-text-muted capitalize">
                {String(b.area ?? "").replace(/-/g, " ")}
              </span>
            </div>
            <p className="text-xs text-ec-text-muted">{b.address as string}</p>
            {b.notes && (
              <p className="text-xs text-ec-text-muted mt-2 border-t border-ec-border/50 pt-2">{b.notes}</p>
            )}
            <p className="text-[10px] text-ec-text-muted/50 mt-2">
              Booked {new Date(b.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}
            </p>
          </div>
        ))}
        {all.length === 0 && (
          <p className="text-sm text-ec-text-muted text-center py-8">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
