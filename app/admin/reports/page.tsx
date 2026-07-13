import { redirect } from "next/navigation";
import { createSupabaseServerClient, createAdminClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/eqt-dashboard/DashboardClient";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["admin", "manager", "owner"];

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const [{ data: projects }, { data: stages }, { data: profile }] = await Promise.all([
    admin.from("projects").select("*, current_stage:stages(id,name,color,position)").order("created_at", { ascending: false }),
    admin.from("stages").select("*").order("position"),
    admin.from("profiles").select("role, name").eq("id", user.id).maybeSingle(),
  ]);

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) redirect("/admin/dashboard");

  // Manager runs the business day to day (Rick's access model, 13 Jul), so
  // inside the ported eq-tracker sections the manager gets the same powers the
  // old app gave its admins. Portal-admin-only areas (pipeline settings) still
  // check the real role.
  const isAdmin = profile.role === "admin" || profile.role === "manager";
  const displayName = profile.name ?? null;

  return (
    <div className="eqt">
        <DashboardClient
          initialProjects={projects ?? []}
          stages={stages ?? []}
          isAdmin={isAdmin}
          displayName={displayName}
        />
    </div>
  );
}
