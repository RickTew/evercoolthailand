import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UsersClient } from "@/app/admin/users/UsersClient";

// Server wrapper: resolves the caller's role so the console can dial itself
// down for managers (no admin option in the role pickers, no editing admin
// accounts). The layout gate already guarantees the caller is admin or
// manager; every rule is ALSO enforced in the API route and server actions.
export default async function UsersPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  return <UsersClient callerRole={profile?.role === "admin" ? "admin" : "manager"} />;
}
