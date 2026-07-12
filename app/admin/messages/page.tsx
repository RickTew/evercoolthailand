import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import StatusSelect from "@/components/admin/StatusSelect";

export const metadata: Metadata = { title: "Messages | Admin" };
export const dynamic = "force-dynamic";

const MESSAGE_STATUSES = [
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "responded", label: "Responded" },
];

export default async function AdminMessagesPage() {
  const admin = createAdminClient();
  const { data: messages } = await admin
    .from("contact_messages")
    .select("id, name, phone, email, subject, message, status, created_at")
    .order("created_at", { ascending: false });

  const all = messages ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-ec-text">Messages ({all.length})</h1>
      </div>

      <div className="flex flex-col gap-3">
        {all.map((m) => (
          <div key={m.id} className="bg-ec-card rounded-2xl border border-ec-border p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-bold text-ec-text">{m.name}</p>
                <p className="text-xs text-ec-text-muted">{m.phone}{m.email ? ` · ${m.email}` : ""}</p>
              </div>
              <StatusSelect
                table="messages"
                id={m.id}
                current={m.status}
                options={MESSAGE_STATUSES}
              />
            </div>
            {m.subject && (
              <p className="text-xs font-semibold text-ec-text mb-1">{m.subject}</p>
            )}
            <p className="text-sm text-ec-text-muted leading-relaxed whitespace-pre-wrap">{m.message}</p>
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-ec-border/50">
              <p className="text-[10px] text-ec-text-muted/50">
                {new Date(m.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Bangkok" })}
              </p>
              {m.phone && (
                <a href={`tel:${m.phone}`} className="text-xs text-ec-teal hover:underline">Call</a>
              )}
              {m.email && (
                <a href={`mailto:${m.email}?subject=Re: ${m.subject ?? "Your enquiry"}`} className="text-xs text-ec-teal hover:underline">Reply by email</a>
              )}
              {m.phone && (
                <a href={`https://wa.me/${(m.phone as string).replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#25D366] hover:underline">WhatsApp</a>
              )}
            </div>
          </div>
        ))}
        {all.length === 0 && (
          <p className="text-sm text-ec-text-muted text-center py-8">No messages yet.</p>
        )}
      </div>
    </div>
  );
}
