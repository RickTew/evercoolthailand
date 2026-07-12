import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/server";
import ArticleList from "@/components/public/ArticleList";
import ACSizingCalculator from "@/components/public/ACSizingCalculator";
import EnergyCostCalculator from "@/components/public/EnergyCostCalculator";
import { breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learning Hub",
  description:
    "AC guides, indoor air quality tips, AC sizing calculator, and energy cost estimator for Thailand.",
};

async function fetchArticles() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("articles")
    .select("id, slug, title_en, title_th, excerpt_en, excerpt_th, category, read_time_mins, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  return data;
}

export default async function LearnPage() {
  // Render the page even if the DB is unreachable (e.g. missing local env keys).
  let allArticles: NonNullable<Awaited<ReturnType<typeof fetchArticles>>> = [];
  try {
    allArticles = (await fetchArticles()) ?? [];
  } catch {
    // DB unavailable — show the static page without the dynamic list.
  }

  return (
    <main className="page-enter px-4 md:px-10 pt-6 pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ec-text">Learning Hub</h1>
        <p className="text-sm text-ec-text-muted mt-1">AC guides, IAQ tips &amp; calculators</p>
      </div>

      {/* Calculators */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-ec-text mb-3">Calculators</h2>
        <div className="flex flex-col gap-4">
          <ACSizingCalculator />
          <EnergyCostCalculator />
        </div>
      </section>

      {/* Articles */}
      <section>
        <h2 className="text-base font-bold text-ec-text mb-3">Articles & Guides</h2>
        <ArticleList articles={allArticles} />
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", url: "https://evercoolthailand.com" },
              { name: "Learn", url: "https://evercoolthailand.com/learn" },
            ])
          ),
        }}
      />
    </main>
  );
}
