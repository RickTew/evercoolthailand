import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminNav from "@/components/admin/AdminNav";
import HelpButton from "@/components/admin/HelpButton";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/lib/eqt/i18n";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // No user: middleware handles redirect for protected routes;
  // here we just render children (e.g. the login page itself)
  if (!user) {
    return <>{children}</>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    // The TH/EN provider wraps the whole admin area so the nav toggle and the
    // ported eq-tracker sections (Projects/Service/Reports) share ONE locale
    // (staff are Thai; Thai is the default, per the original eq-tracker app).
    <I18nProvider>
    <div className="min-h-screen bg-ec-bg">
      <AdminNav
        userEmail={user.email ?? ""}
        userName={profile.name ?? ""}
        role={profile.role}
      />
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        {children}
      </div>
      {/* Help button: visible to all non-admin roles */}
      {profile.role !== "admin" && <HelpButton />}
      {/* Toasts for the eq-tracker sections (sonner), mounted once for /admin */}
      <Toaster richColors position="top-right" />
    </div>
    </I18nProvider>
  );
}
