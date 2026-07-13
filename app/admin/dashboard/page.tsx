import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createAdminClient } from "@/lib/supabase/server";
import StaffInbox from "@/components/admin/StaffInbox";
import { PortalGuide } from "@/components/admin/PortalGuide";

export const metadata: Metadata = { title: "Dashboard | Evercool Portal" };
export const dynamic = "force-dynamic";

type Role = "admin" | "sales" | "manager" | "owner" | "technician" | "staff";

const ALL_ROLES: Role[] = ["admin", "owner", "manager", "sales", "technician", "staff"];

const ROLE_COLOR: Record<Role, string> = {
  admin:      "bg-red-500/20 text-red-400 border-red-500/30",
  owner:      "bg-purple-500/20 text-purple-400 border-purple-500/30",
  manager:    "bg-amber-500/20 text-amber-400 border-amber-500/30",
  sales:      "bg-blue-500/20 text-blue-400 border-blue-500/30",
  technician: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  staff:      "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function StatCard({ label, value, href, color }: {
  label: string; value: number | string; href?: string; color: string;
}) {
  const inner = (
    <div className="bg-ec-card rounded-2xl border border-ec-border p-4 hover:border-ec-teal/30 transition-all h-full">
      <p className="text-xs font-semibold text-ec-text-muted mb-3">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", user.id).maybeSingle();
  if (!profile) redirect("/login");

  const actualRole = profile.role as Role;
  const params = await searchParams;
  const previewParam = params?.preview as Role | undefined;
  const isPreviewing = actualRole === "admin" && previewParam && ALL_ROLES.includes(previewParam);
  const role: Role = isPreviewing ? previewParam! : actualRole;

  const admin = createAdminClient();

  // "Messages" on this dashboard = the CRM queue (contact-form submissions and
  // email both open CRM tickets since 13 Jul). Spam, archived and trashed
  // conversations do not count; this mirrors the CRM inbox's own Open tile.
  const [
    { count: newQuotes },
    { count: openConversations },
    { count: totalQuotes },
    { count: acceptedQuotes },
    { data: recentQuotes },
    { data: recentThreads },
    { data: staffMessages },
  ] = await Promise.all([
    admin.from("quotes").select("*", { count: "exact", head: true }).eq("status", "new"),
    admin
      .from("support_threads")
      .select("*", { count: "exact", head: true })
      .eq("status", "open")
      .is("deleted_at", null)
      .is("spam_status", null)
      .is("archived_at", null),
    admin.from("quotes").select("*", { count: "exact", head: true }),
    admin.from("quotes").select("*", { count: "exact", head: true }).eq("status", "accepted"),
    admin.from("quotes").select("id, name, service_type, status, created_at, property_type").order("created_at", { ascending: false }).limit(6),
    admin
      .from("support_threads")
      .select("id, subject, status, last_message_at, contacts(full_name)")
      .is("deleted_at", null)
      .is("spam_status", null)
      .is("archived_at", null)
      .order("last_message_at", { ascending: false })
      .limit(5),
    actualRole === "admin"
      ? admin.from("staff_messages").select("*").order("created_at", { ascending: false }).limit(20)
      : Promise.resolve({ data: [] }),
  ]);
  const newMessages = openConversations;

  const greeting = profile.name ? `Welcome back, ${profile.name.split(" ")[0]}` : "Welcome back";

  return (
    <div>
      {/* ── Admin role preview bar ────────────────────── */}
      {actualRole === "admin" && (
        <div className="mb-6 bg-ec-card border border-ec-border rounded-2xl p-3">
          <p className="text-[10px] font-bold text-ec-text-muted uppercase tracking-widest mb-2.5">
            Preview as role
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_ROLES.map((r) => (
              <Link
                key={r}
                href={r === "admin" ? "/admin/dashboard" : `/admin/dashboard?preview=${r}`}
                className={`text-xs font-semibold px-3 py-1 rounded-lg border capitalize transition-all ${
                  role === r
                    ? ROLE_COLOR[r]
                    : "bg-transparent text-ec-text-muted border-ec-border hover:border-ec-teal/40 hover:text-ec-text"
                }`}
              >
                {r}
              </Link>
            ))}
          </div>
          {isPreviewing && (
            <p className="text-[10px] text-ec-text-muted mt-2">
              Previewing as <span className="font-semibold capitalize">{role}</span>:{" "}
              <Link href="/admin/dashboard" className="text-ec-teal hover:underline">back to your view</Link>
            </p>
          )}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ec-text">{greeting}</h1>
        <p className="text-xs text-ec-text-muted mt-0.5 capitalize">
          {isPreviewing ? `Previewing ${role} dashboard` : `${role} dashboard`} · Evercool Thailand
        </p>
      </div>

      {/* ── ADMIN view ─────────────────────────────────── */}
      {role === "admin" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="New Quotes" value={newQuotes ?? 0} href="/admin/quotes" color="text-blue-400" />
            <StatCard label="CRM Inbox" value={newMessages ?? 0} href="/admin/email/inbox" color="text-purple-400" />
            <StatCard label="Total Quotes" value={totalQuotes ?? 0} href="/admin/quotes" color="text-ec-teal" />
            <StatCard label="Accepted Quotes" value={acceptedQuotes ?? 0} href="/admin/quotes" color="text-green-400" />
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mb-8">
            {[
              { href: "/admin/users",    label: "Manage Users",   desc: "Create accounts & assign roles", color: "text-red-400" },
              { href: "/admin/articles", label: "Articles",       desc: "Edit blog & learn content",      color: "text-amber-400" },
              { href: "/admin/gallery",  label: "Gallery",        desc: "Manage project photos",          color: "text-teal-400" },
            ].map(q => (
              <Link key={q.href} href={q.href} className="bg-ec-card border border-ec-border rounded-2xl p-4 hover:border-ec-teal/30 transition-all">
                <p className={`text-sm font-bold ${q.color} mb-1`}>{q.label}</p>
                <p className="text-xs text-ec-text-muted">{q.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── OWNER view ─────────────────────────────────── */}
      {role === "owner" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="Total Quotes" value={totalQuotes ?? 0} href="/admin/quotes" color="text-ec-teal" />
            <StatCard label="Accepted" value={acceptedQuotes ?? 0} href="/admin/quotes" color="text-green-400" />
            <StatCard label="New Leads" value={newQuotes ?? 0} href="/admin/quotes" color="text-blue-400" />
            <StatCard label="CRM Inbox" value={newMessages ?? 0} href="/admin/email/inbox" color="text-purple-400" />
          </div>
          <div className="bg-ec-card border border-ec-border rounded-2xl p-5 mb-6">
            <p className="text-xs font-bold text-ec-text-muted uppercase tracking-widest mb-3">Pipeline Overview</p>
            <p className="text-sm text-ec-text-muted">Charts and financial reports coming soon. Data will populate as the team logs activity.</p>
          </div>
        </>
      )}

      {/* ── MANAGER view ───────────────────────────────── */}
      {role === "manager" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard label="New Quotes" value={newQuotes ?? 0} href="/admin/quotes" color="text-blue-400" />
            <StatCard label="Accepted" value={acceptedQuotes ?? 0} href="/admin/quotes" color="text-green-400" />
            <StatCard label="CRM Inbox" value={newMessages ?? 0} href="/admin/email/inbox" color="text-purple-400" />
            <StatCard label="Total Quotes" value={totalQuotes ?? 0} href="/admin/quotes" color="text-ec-teal" />
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <Link href="/admin/team" className="bg-ec-card border border-ec-border rounded-2xl p-4 hover:border-ec-teal/30 transition-all">
              <p className="text-sm font-bold text-amber-400 mb-1">Team</p>
              <p className="text-xs text-ec-text-muted">View and manage your team members</p>
            </Link>
            <Link href="/admin/reports" className="bg-ec-card border border-ec-border rounded-2xl p-4 hover:border-ec-teal/30 transition-all">
              <p className="text-sm font-bold text-ec-teal mb-1">Reports</p>
              <p className="text-xs text-ec-text-muted">Sales activity and performance</p>
            </Link>
          </div>
        </>
      )}

      {/* ── SALES view ─────────────────────────────────── */}
      {role === "sales" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <StatCard label="New Quotes" value={newQuotes ?? 0} href="/admin/quotes" color="text-blue-400" />
          <StatCard label="Accepted" value={acceptedQuotes ?? 0} href="/admin/quotes" color="text-green-400" />
          <StatCard label="CRM Inbox" value={newMessages ?? 0} href="/admin/email/inbox" color="text-purple-400" />
        </div>
      )}

      {/* The orientation map: every role sees THEIR portal, so "check the
          dashboard" is the one instruction a new person needs. For technicians
          and staff this IS the main dashboard content. */}
      <PortalGuide role={role} />

      {/* Staff inbox: admin only */}
      {actualRole === "admin" && !isPreviewing && staffMessages && staffMessages.length > 0 && (
        <StaffInbox initial={staffMessages as never} />
      )}

      {/* Recent quotes + messages: admin, sales, manager, owner */}
      {["admin", "sales", "manager", "owner"].includes(role) && (
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ec-text">Recent Quotes</h2>
              <Link href="/admin/quotes" className="text-xs text-ec-teal hover:underline">View all</Link>
            </div>
            <div className="flex flex-col gap-2">
              {(recentQuotes ?? []).map((q) => (
                <div key={q.id} className="bg-ec-card rounded-xl border border-ec-border px-3 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ec-text truncate">{q.name}</p>
                    <p className="text-xs text-ec-text-muted capitalize">{String(q.service_type).replace(/-/g, " ")} · {q.property_type}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 ${
                    q.status === "new" ? "bg-blue-500/15 text-blue-400" :
                    q.status === "accepted" ? "bg-green-500/15 text-green-400" :
                    "bg-gray-500/15 text-gray-400"
                  }`}>{q.status as string}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-ec-text">Recent Conversations</h2>
              <Link href="/admin/email/inbox" className="text-xs text-ec-teal hover:underline">Open CRM</Link>
            </div>
            <div className="flex flex-col gap-2">
              {(recentThreads ?? []).map((t) => {
                // The embedded contact row (FK join); PostgREST types it loosely.
                const contact = t.contacts as unknown as { full_name?: string } | null;
                return (
                  <Link
                    key={t.id}
                    href={`/admin/email/inbox?thread=${t.id}`}
                    className="bg-ec-card rounded-xl border border-ec-border px-3 py-2.5 flex items-center justify-between gap-2 hover:border-ec-teal/30 transition-all"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ec-text truncate">{contact?.full_name ?? "Unknown"}</p>
                      <p className="text-xs text-ec-text-muted truncate">{t.subject}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg shrink-0 capitalize ${
                      t.status === "open" ? "bg-blue-500/15 text-blue-400" :
                      t.status === "pending" ? "bg-amber-500/15 text-amber-400" :
                      "bg-gray-500/15 text-gray-400"
                    }`}>{t.status === "pending" ? "waiting" : (t.status as string)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
