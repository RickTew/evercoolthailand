import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Server-side gate for the Users section: admin AND manager (Rick, 15 Jul:
// Wanrawee hires and sets up new people; the API + actions behind the page
// stop a manager at the admin tier). The nav hides the tab from other roles,
// but the page is a client component, so without this a staffer typing
// /admin/users got the page shell (the API calls behind it 403, but the
// screen should not exist for them at all).
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
  if (profile?.role !== "admin" && profile?.role !== "manager") redirect("/admin/dashboard");
  return <>{children}</>;
}
