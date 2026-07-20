import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import GalleryGrid from "@/components/public/GalleryGrid";
import { breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Before and after gallery of AC installation, maintenance, custom AHU, and air purifier projects across Bangkok, Koh Tao, and Surat Thani.",
};

async function fetchGalleryItems() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("gallery_items")
    .select("id, title, title_th, description, description_th, before_image_url, after_image_url, category, location")
    .eq("is_active", true)
    .order("sort_order");
  return data;
}

export default async function GalleryPage() {
  // Render the page even if the DB is unreachable (e.g. missing local env keys).
  let allItems: NonNullable<Awaited<ReturnType<typeof fetchGalleryItems>>> = [];
  try {
    allItems = (await fetchGalleryItems()) ?? [];
  } catch {
    // DB unavailable - show the static page without the dynamic list.
  }

  return (
    <main className="page-enter px-4 md:px-10 pt-6 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ec-text">Our Work</h1>
        <p className="text-sm text-ec-text-muted mt-1">Before &amp; after project gallery</p>
      </div>

      <GalleryGrid items={allItems} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", url: "https://evercoolthailand.com" },
              { name: "Gallery", url: "https://evercoolthailand.com/gallery" },
            ])
          ),
        }}
      />
    </main>
  );
}
