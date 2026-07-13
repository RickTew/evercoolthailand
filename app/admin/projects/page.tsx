import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient, createAdminClient } from "@/lib/supabase/server";
import ProjectsClient from "@/components/projects/ProjectsClient";

export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["admin", "manager", "owner", "sales"];

export default async function ProjectsPage() {
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
      {/* Pipeline structure (stages, quarters) is portal-admin only. */}
      {profile.role === "admin" && (
        <div className="mb-3 flex justify-end">
          <Link
            href="/admin/projects/pipeline"
            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            Pipeline settings
          </Link>
        </div>
      )}
        <ProjectsClient
          initialProjects={projects ?? []}
          stages={stages ?? []}
          isAdmin={isAdmin}
          displayName={displayName}
        />
    </div>
  );
}
