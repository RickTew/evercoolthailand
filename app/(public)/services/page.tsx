import type { Metadata } from "next";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import ServicesGrid from "@/components/public/ServicesGrid";
import SolutionsDashboard from "@/components/public/SolutionsDashboard";
import BookingWizard from "@/components/public/BookingWizard";
import { serviceJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "AC installation, repair, maintenance, air purifiers, custom AHU, and IAQ consultation in Thailand. Bangkok, Koh Tao & Surat Thani.",
};

async function fetchServices() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("services")
    .select("id, slug, name_en, name_th, description_en, description_th, icon, category")
    .eq("is_active", true)
    .order("display_order");
  return data;
}

export default async function ServicesPage() {
  // Render the page even if the DB is unreachable (e.g. missing local env keys).
  let allServices: NonNullable<Awaited<ReturnType<typeof fetchServices>>> = [];
  try {
    allServices = (await fetchServices()) ?? [];
  } catch {
    // DB unavailable — show the static page without the dynamic list.
  }

  return (
    <main>

      <SolutionsDashboard />

      <div className="px-4 md:px-10 pt-2 pb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-ec-text leading-tight">All Services</h2>
          <p className="text-sm text-ec-text-muted mt-1">
            Professional HVAC &amp; IAQ solutions for Thailand
          </p>
        </div>
        <ServicesGrid services={allServices} />
      </div>

      {/* Booking wizard */}
      <div className="border-t border-ec-border mt-2">
        <Suspense>
          <BookingWizard />
        </Suspense>
      </div>

      {/* Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", url: "https://evercoolthailand.com" },
              { name: "Services", url: "https://evercoolthailand.com/services" },
            ])
          ),
        }}
      />
      {allServices.slice(0, 3).map((svc) => (
        <script
          key={svc.id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              serviceJsonLd({
                name: svc.name_en,
                description: svc.description_en,
                url: `https://evercoolthailand.com/quote?service=${svc.slug}`,
              })
            ),
          }}
        />
      ))}
    </main>
  );
}
