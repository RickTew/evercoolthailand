import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AccountAuth from "@/components/public/AccountAuth";
import CustomerPortal from "@/components/public/CustomerPortal";

export const metadata: Metadata = {
  title: "My Account",
  description: "View your quotes, bookings, and service history.",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="page-enter px-4 md:px-10 pt-6 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ec-text">My Account</h1>
          <p className="text-sm text-ec-text-muted mt-1">Sign in to view your service history</p>
        </div>
        <AccountAuth linkExpired={error === "auth"} />
      </main>
    );
  }

  // Fetch portal data in parallel
  const [customerResult, quotesResult, bookingsResult, loyaltyResult] = await Promise.all([
    supabase.from("customers").select("name, phone, referral_code").eq("id", user.id).maybeSingle(),
    supabase
      .from("quotes")
      .select("id, service_type, status, created_at")
      .eq("email", user.email ?? "")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("bookings")
      .select("id, service_name, booking_date, booking_time, status")
      .eq("email", user.email ?? "")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("loyalty_points")
      .select("points, reason, created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <main className="page-enter px-4 md:px-10 pt-6 pb-8">
      <CustomerPortal
        user={user}
        customer={customerResult.data}
        quotes={quotesResult.data ?? []}
        bookings={bookingsResult.data ?? []}
        loyaltyPoints={loyaltyResult.data ?? []}
      />
    </main>
  );
}
