import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Admin-only gate for the Users section, enforced server-side. The nav already
// hides the Users tab from non-admin roles, but the page itself is a client
// component, so without this a staffer typing /admin/users got the page shell
// (the API calls behind it 403, but the screen should not exist for them at all).
export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/admin/dashboard");
  return <>{children}</>;
}
