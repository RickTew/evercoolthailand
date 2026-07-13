import { redirect } from "next/navigation";
import { createSupabaseServerClient, createAdminClient } from "@/lib/supabase/server";
import PipelineClient from "@/components/eqt-admin/PipelineClient";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/admin/projects");

  const { data: stages } = await admin.from("stages").select("*").order("position");

  return (
    <div className="eqt">
        <PipelineClient initialStages={stages ?? []} />
    </div>
  );
}
