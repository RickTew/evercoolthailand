import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServerClient, createAdminClient } from "@/lib/supabase/server";
import ServiceClient from "@/components/service/ServiceClient";
import { I18nProvider } from "@/lib/eqt/i18n";

export const metadata: Metadata = { title: "Service & Maintenance | Evercool Portal" };
export const dynamic = "force-dynamic";

const ALLOWED_ROLES = ["admin", "manager", "owner", "technician"];

export default async function ServicePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || !ALLOWED_ROLES.includes(profile.role)) redirect("/admin/dashboard");

  const admin = createAdminClient();
  const [
    { data: records },
    { data: equipment },
    { data: visits },
    { data: links },
    { data: inventory },
  ] = await Promise.all([
    admin
      .from("service_records")
      .select("*")
      .order("record_number", { ascending: true, nullsFirst: false }),
    admin
      .from("equipment_filters")
      .select("*")
      .order("location"),
    admin
      .from("service_visits")
      .select("*")
      .order("completed_date", { ascending: false }),
    admin
      .from("service_record_equipment")
      .select("*"),
    admin
      .from("filter_inventory")
      .select("*")
      .order("filter_type"),
  ]);

  // Manager runs the business day to day (Rick's access model, 13 Jul), so
  // inside the ported eq-tracker sections the manager gets the same powers the
  // old app gave its admins. Portal-admin-only areas (pipeline settings) still
  // check the real role.
  const isAdmin = profile.role === "admin" || profile.role === "manager";
  const displayName = profile.name ?? null;

  return (
    <div className="eqt">
      <I18nProvider>
        <ServiceClient
          initialRecords={records ?? []}
          initialEquipment={equipment ?? []}
          initialVisits={visits ?? []}
          initialLinks={links ?? []}
          initialInventory={inventory ?? []}
          isAdmin={isAdmin}
          displayName={displayName}
        />
      </I18nProvider>
    </div>
  );
}
